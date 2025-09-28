const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { execSync } = require("child_process");
const mimeTypes = require("mime-types");
const { CONFIG } = require("./config");

function ensureTmp() {
  if (!fs.existsSync(CONFIG.MEDIA_TMP_DIR)) {
    fs.mkdirSync(CONFIG.MEDIA_TMP_DIR, { recursive: true });
  }
}

function extFromMime(mimetype, fallback = "bin") {
  const ext = mimeTypes.extension(mimetype);
  return (ext || fallback).toLowerCase();
}

// Audio: guarda y convierte a mp3/m4a si aplica. Devuelve { outPath, cleanup }
async function saveAndMaybeConvertAudio(base64Data, mimetype, isPTT = false) {
  ensureTmp();
  const initExt = isPTT || (mimetype || "").includes("ogg") ? "ogg" : extFromMime(mimetype);
  const inName = `wa_audio_${Date.now()}.${initExt}`;
  const inPath = path.join(CONFIG.MEDIA_TMP_DIR, inName);
  await fsp.writeFile(inPath, Buffer.from(base64Data, "base64"));

  let outPath = inPath;
  if (CONFIG.CONVERT_AUDIO_FOR_DISCORD && initExt !== CONFIG.AUDIO_TARGET_FORMAT) {
    try {
      const target = CONFIG.AUDIO_TARGET_FORMAT; // mp3 / m4a
      outPath = inPath.replace(/\.[^.]+$/, `.${target}`);
      if (target === "mp3") {
        execSync(`ffmpeg -y -i "${inPath}" -vn -acodec libmp3lame -b:a 160k "${outPath}"`, { stdio: "ignore" });
      } else {
        execSync(`ffmpeg -y -i "${inPath}" -vn -c:a aac -b:a 160k "${outPath}"`, { stdio: "ignore" });
      }
      await fsp.unlink(inPath).catch(() => {});
    } catch {
      outPath = inPath; // fallback original
    }
  }
  const cleanup = () => fsp.unlink(outPath).catch(() => {});
  return { outPath, cleanup };
}

// Video: opcionalmente convierte a mp4 H.264 + AAC para WA inline
function maybeTranscodeVideoForWA(inPath) {
  if (!CONFIG.TRANSCODE_VIDEO_FOR_WA) return inPath;

  try {
    const mp4Path = inPath.replace(/\.[^.]+$/, "") + ".mp4";
    const maxW = Math.max(240, Math.min(CONFIG.VIDEO_MAX_WIDTH || 720, 1280));
    execSync(
      `ffmpeg -y -i "${inPath}" -movflags +faststart -vf "scale='min(${maxW},iw)':'min(${maxW},ih)':force_original_aspect_ratio=decrease,format=yuv420p" -c:v libx264 -preset ${CONFIG.VIDEO_PRESET} -crf ${CONFIG.VIDEO_CRF} -c:a aac -b:a 128k -r 30 "${mp4Path}"`,
      { stdio: "ignore" }
    );
    fs.unlinkSync(inPath);
    return mp4Path;
  } catch {
    // fallback
    try {
      const mp4Path2 = inPath.replace(/\.[^.]+$/, "") + ".mp4";
      const fw = Math.max(240, Math.min(CONFIG.VIDEO_MAX_WIDTH_FALLBACK || 480, 1280));
      execSync(
        `ffmpeg -y -i "${inPath}" -movflags +faststart -vf "scale='min(${fw},iw)':'min(${fw},ih)':force_original_aspect_ratio=decrease,format=yuv420p" -c:v libx264 -preset ${CONFIG.VIDEO_PRESET} -crf ${CONFIG.VIDEO_CRF_FALLBACK} -c:a aac -b:a 96k -r 30 "${mp4Path2}"`,
        { stdio: "ignore" }
      );
      fs.unlinkSync(inPath);
      return mp4Path2;
    } catch {
      return inPath; // envía original
    }
  }
}

module.exports = {
  ensureTmp,
  extFromMime,
  saveAndMaybeConvertAudio,
  maybeTranscodeVideoForWA,
};
