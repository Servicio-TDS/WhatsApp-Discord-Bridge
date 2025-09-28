const fs = require("fs");
const path = require("path");
require("dotenv").config();

function readJsonIfExists(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {}
  return {};
}

const fileCfg = readJsonIfExists(path.join(process.cwd(), "config.json"));

function bool(v, def = false) {
  if (v === undefined || v === null) return def;
  return String(v).toLowerCase() === "true";
}
function num(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

const CONFIG = {
  // Discord
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || fileCfg.DISCORD_TOKEN,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID || fileCfg.DISCORD_CHANNEL_ID,

  // WhatsApp
  WA_GROUP_ID: process.env.WA_GROUP_ID || fileCfg.WA_GROUP_ID,
  WA_GROUP_NAME: process.env.WA_GROUP_NAME || fileCfg.WA_GROUP_NAME || "Los tulentos",

  // Prefijos
  TAG_FROM_WA: process.env.TAG_FROM_WA || fileCfg.TAG_FROM_WA || "📲 [WA]",
  TAG_FROM_DS: process.env.TAG_FROM_DS || fileCfg.TAG_FROM_DS || "💻 [Discord]",

  // Texto/medios
  MAX_LEN: num(process.env.MAX_LEN || fileCfg.MAX_LEN, 1800),
  MAX_MEDIA_BYTES: num(process.env.MAX_MEDIA_BYTES || fileCfg.MAX_MEDIA_BYTES, 15 * 1024 * 1024),
  MEDIA_TMP_DIR: process.env.MEDIA_TMP_DIR || fileCfg.MEDIA_TMP_DIR || path.join(process.cwd(), "tmp"),

  SAVE_MEDIA_TO_DISK: bool(process.env.SAVE_MEDIA_TO_DISK ?? fileCfg.SAVE_MEDIA_TO_DISK, true),
  SAVE_DS_MEDIA_TO_DISK: bool(process.env.SAVE_DS_MEDIA_TO_DISK ?? fileCfg.SAVE_DS_MEDIA_TO_DISK, true),

  // GIF DS->WA
  GIF_AS_DOCUMENT: bool(process.env.GIF_AS_DOCUMENT ?? fileCfg.GIF_AS_DOCUMENT, true),
  GIF_AS_VIDEO: bool(process.env.GIF_AS_VIDEO ?? fileCfg.GIF_AS_VIDEO, false),

  // Audio WA->DS
  CONVERT_AUDIO_FOR_DISCORD: bool(process.env.CONVERT_AUDIO_FOR_DISCORD ?? fileCfg.CONVERT_AUDIO_FOR_DISCORD, true),
  AUDIO_TARGET_FORMAT: (process.env.AUDIO_TARGET_FORMAT || fileCfg.AUDIO_TARGET_FORMAT || "mp3").toLowerCase(),

  // Video DS->WA
  TRANSCODE_VIDEO_FOR_WA: bool(process.env.TRANSCODE_VIDEO_FOR_WA ?? fileCfg.TRANSCODE_VIDEO_FOR_WA, true),
  VIDEO_MAX_WIDTH: num(process.env.VIDEO_MAX_WIDTH || fileCfg.VIDEO_MAX_WIDTH, 720),
  INLINE_VIDEO_FOR_WA: bool(process.env.INLINE_VIDEO_FOR_WA ?? fileCfg.INLINE_VIDEO_FOR_WA, true),
  VIDEO_CRF: num(process.env.VIDEO_CRF || fileCfg.VIDEO_CRF, 23),
  VIDEO_CRF_FALLBACK: num(process.env.VIDEO_CRF_FALLBACK || fileCfg.VIDEO_CRF_FALLBACK, 28),
  VIDEO_MAX_WIDTH_FALLBACK: num(process.env.VIDEO_MAX_WIDTH_FALLBACK || fileCfg.VIDEO_MAX_WIDTH_FALLBACK, 480),
  VIDEO_PRESET: process.env.VIDEO_PRESET || fileCfg.VIDEO_PRESET || "veryfast",

  // Verbose Discord
  DISCORD_DEBUG: bool(process.env.DISCORD_DEBUG ?? fileCfg.DISCORD_DEBUG, false),
};

function validate() {
  const errs = [];
  if (!CONFIG.DISCORD_TOKEN) errs.push("Falta DISCORD_TOKEN.");
  if (!CONFIG.DISCORD_CHANNEL_ID) errs.push("Falta DISCORD_CHANNEL_ID.");
  if (!CONFIG.WA_GROUP_ID && !CONFIG.WA_GROUP_NAME) errs.push("Define WA_GROUP_ID o WA_GROUP_NAME.");
  if (errs.length) {
    console.error("❌ Config inválida:\n- " + errs.join("\n- "));
    process.exit(1);
  }
}

module.exports = { CONFIG, validate };
