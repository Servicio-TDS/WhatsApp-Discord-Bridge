const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { CONFIG } = require("./config");

function createDiscordClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  if (CONFIG.DISCORD_DEBUG) {
    client.on("debug", (m) => console.log("[Discord debug]", m));
    client.on("rateLimit", (info) => console.warn("[Discord rateLimit]", info));
  }
  client.on("error", (e) => console.error("[Discord error]", e));
  client.on("shardError", (e) => console.error("[Discord shardError]", e));
  client.on("invalidated", () => console.error("[Discord invalidated]"));

  client.once("ready", async () => {
    console.log(`✅ Discord listo como ${client.user.tag}`);
    try {
      const ch = await client.channels.fetch(CONFIG.DISCORD_CHANNEL_ID);
      await ch.send("🤖 Bridge online");
      console.log("OK: el bot PUEDE enviar en el canal.");
    } catch (e) {
      console.error("❌ No puedo enviar en el canal:", e?.message);
    }
  });

  return client;
}

module.exports = { createDiscordClient };
