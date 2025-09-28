const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const mimeTypes = require("mime-types");
const fetch = global.fetch || ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));
const { AttachmentBuilder } = require("discord.js");
const { MessageMedia } = require("whatsapp-web.js");
const { CONFIG } = require("./config");
const { ensureTmp, extFromMime, saveAndMaybeConvertAudio, maybeTranscodeVideoForWA } = require("./media");

function truncate(s, n) {
  if (!s) return "";
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function isFromBridge(text) {
  if (!text) return false;
  return text.startsWith(CONFIG.TAG_FROM_WA) || text.startsWith(CONFIG.TAG_FROM_DS);
}

function registerWAtoDS(wclient, dclient) {
  async function onMessage(msg) {
    try {
      console.log("[WA] evento message:", { from: msg.from, to: msg.to, type: msg.type, hasMedia: msg.hasMedia, fromMe: msg.fromMe });
      const chat = await msg.getChat();
      if (!chat.isGroup) return;

      const byIdOK = CONFIG.WA_GROUP_ID && chat.id?._serialized === CONFIG.WA_GROUP_ID;
      const byNameOK = !CONFIG.WA_GROUP_ID && chat.name && chat.name.toLowerCase().includes(CONFIG.WA_GROUP_NAME.toLowerCase());
      if (!(byIdOK || byNameOK)) return;

      if (isFromBridge(msg.body)) return;

      const channel = await dclient.channels.fetch(CONFIG.DISCORD_CHANNEL_ID).catch(() => null);
      if (!channel || typeof channel.send !== "function") return;

      let waAuthor = "Desconocido";
      try {
        const contact = await msg.getContact();
        waAuthor = contact?.pushname || contact?.name || contact?.number || waAuthor;
      } catch {}

      let quoted = "";
      if (msg.hasQuotedMsg) {
        try {
          const qm = await msg.getQuotedMessage();
          const qAuthor = (await qm.getContact())?.pushname || "";
          const qText = truncate(qm.body || (qm.type !== "chat" ? `[${qm.type}]` : ""), 120);
          if (qText) quoted = `\n> _En respuesta a_ **${qAuthor}**: ${qText}`;
        } catch {}
      }

      // Texto
      if (msg.type === "chat" && msg.body) {
        const text = truncate(msg.body, CONFIG.MAX_LEN);
        await channel.send({ content: `${CONFIG.TAG_FROM_WA} **${waAuthor}**: ${text}${quoted}` });
        return;
      }

      // Media
      if (msg.hasMedia) {
        const media = await msg.downloadMedia().catch(() => null);
        if (!media) return;

        const isAudio = (media.mimetype || "").startsWith("audio/") || msg.type === "ptt";
        const caption = truncate(msg.caption || "", 500);

        if (isAudio && CONFIG.SAVE_MEDIA_TO_DISK) {
          const { outPath, cleanup } = await saveAndMaybeConvertAudio(media.data, media.mimetype, msg.type === "ptt");
          try {
            await channel.send({
              content: `${CONFIG.TAG_FROM_WA} **${waAuthor}**${quoted}${caption ? `\n${caption}` : ""}`,
              files: [outPath],
            });
          } finally {
            cleanup();
          }
        } else {
          const buf = Buffer.from(media.data, "base64");
          const ext = (mimeTypes.extension(media.mimetype) || "bin").toLowerCase();
          const filename = `wa_${Date.now()}.${ext}`;
          const attach = new AttachmentBuilder(buf, { name: filename });
          await channel.send({
            content: `${CONFIG.TAG_FROM_WA} **${waAuthor}**${quoted}${caption ? `\n${caption}` : ""}`,
            files: [attach],
          });
        }
        return;
      }

      // Otros
      await channel.send({ content: `${CONFIG.TAG_FROM_WA} **${waAuthor}** envió un mensaje (${msg.type}).` });
    } catch (e) {
      console.error("WA→DS error:", e);
    }
  }

  wclient.on("message", onMessage);
  wclient.on("message_create", (msg) => {
    if (msg.fromMe) onMessage(msg);
  });
}

function registerDStoWA(wclient, dclient) {
  dclient.on("messageCreate", async (message) => {
    try {
      if (message.author.bot) return;
      if (message.channelId !== CONFIG.DISCORD_CHANNEL_ID) return;

      const text = message.content?.trim() || "";
      const hasAtt = (message.attachments?.size || 0) > 0;
      if (!text && !hasAtt) return;

      const chats = await wclient.getChats();
      let group = null;
      if (CONFIG.WA_GROUP_ID) {
        group = chats.find((c) => c.isGroup && c.id && c.id._serialized === CONFIG.WA_GROUP_ID);
      } else {
        group = chats.find((c) => c.isGroup && c.name && c.name.toLowerCase().includes(CONFIG.WA_GROUP_NAME.toLowerCase()));
      }
      if (!group) return;

      const author = message.member?.displayName || message.author.globalName || message.author.username;
      const base = `${CONFIG.TAG_FROM_DS} ${author}:`;

      let quoted = "";
      if (message.reference?.messageId) {
        try {
          const replied = await message.channel.messages.fetch(message.reference.messageId);
          const repAuthor = replied.member?.displayName || replied.author.username;
          const repText = truncate(replied.content || (replied.attachments.size ? "[adjunto]" : ""), 120);
          if (repText) quoted = `\n> _En respuesta a_ ${repAuthor}: ${repText}`;
        } catch {}
      }

      if (text) {
        const out = truncate(`${base} ${text}${quoted}`, CONFIG.MAX_LEN);
        await wclient.sendMessage(group.id._serialized, out);
      }

      for (const att of message.attachments.values()) {
        try {
          // HEAD
          const resHead = await fetch(att.url, { method: "HEAD" }).catch(() => null);
          const clen = parseInt(resHead?.headers?.get("content-length") || att.size || "0", 10) || 0;
          const mimeFromHead = resHead?.headers?.get("content-type") || "";
          let mimetype = att.contentType || mimeFromHead || mimeTypes.lookup(att.name || "") || "application/octet-stream";
          if (clen && clen > CONFIG.MAX_MEDIA_BYTES) {
            await wclient.sendMessage(group.id._serialized, `${base} [adjunto omitido por tamaño > ${Math.round(CONFIG.MAX_MEDIA_BYTES / 1024 / 1024)}MB] ${att.name || ""}${quoted}`);
            continue;
          }

          // Descargar
          const res = await fetch(att.url);
          if (!res.ok) continue;
          const buff = Buffer.from(await res.arrayBuffer());

          ensureTmp();
          let ext = mimeTypes.extension(mimetype) || (att.name?.split(".").pop() || "bin");
          let safeName = (att.name && att.name.includes(".")) ? att.name : `file.${ext}`;
          let fpath = path.join(CONFIG.MEDIA_TMP_DIR, `${Date.now()}_${safeName}`);
          await fsp.writeFile(fpath, buff);

          // Opcional: GIF -> MP4
          if (CONFIG.GIF_AS_VIDEO && mimetype === "image/gif") {
            // conversión simple; si no hay ffmpeg seguirá como gif
            try {
              const { execSync } = require("child_process");
              const mp4Path = fpath.replace(/\.gif$/i, "") + ".mp4";
              execSync(`ffmpeg -y -i "${fpath}" -movflags +faststart -pix_fmt yuv420p -vf scale=trunc(iw/2)*2:trunc(ih/2)*2 "${mp4Path}"`, { stdio: "ignore" });
              await fsp.unlink(fpath).catch(() => {});
              fpath = mp4Path;
              mimetype = "video/mp4";
              ext = "mp4";
              safeName = path.basename(mp4Path);
            } catch {}
          }

          // Video → transcodificar para inline en WA
          if (mimetype.startsWith("video/")) {
            fpath = maybeTranscodeVideoForWA(fpath);
            mimetype = "video/mp4";
            ext = "mp4";
            safeName = path.basename(fpath);
          }

          // Enviar como media; si falla y se permite, como documento
          try {
            const media = MessageMedia.fromFilePath(fpath);
            const opts = { caption: `${base} ${att.name || ""}${quoted}` };
            await wclient.sendMessage(group.id._serialized, media, opts);
          } catch (e1) {
            if (!CONFIG.INLINE_VIDEO_FOR_WA) {
              const media = MessageMedia.fromFilePath(fpath);
              await wclient.sendMessage(group.id._serialized, media, { sendMediaAsDocument: true, caption: `${base} ${att.name || ""}${quoted}` });
            } else {
              throw e1;
            }
          } finally {
            fsp.unlink(fpath).catch(() => {});
          }
        } catch (e) {
          console.warn("No se pudo reenviar adjunto a WhatsApp:", e?.message);
        }
      }
    } catch (err) {
      console.error("DS→WA error:", err);
    }
  });
}

module.exports = { registerWAtoDS, registerDStoWA };
