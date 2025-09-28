const fs = require("fs");
const path = require("path");
const { CONFIG, validate } = require("./config");
const { createDiscordClient } = require("./discord");
const { createWhatsAppClient } = require("./whatsapp");
const { registerWAtoDS, registerDStoWA } = require("./bridge");

// Validar config
validate();

// Asegurar tmp
try {
  if (!fs.existsSync(CONFIG.MEDIA_TMP_DIR)) fs.mkdirSync(CONFIG.MEDIA_TMP_DIR, { recursive: true });
  console.log(`🗂️  Carpeta temporal de medios: ${path.resolve(CONFIG.MEDIA_TMP_DIR)}`);
} catch (e) {
  console.warn("No se pudo preparar MEDIA_TMP_DIR:", e?.message);
}

const dclient = createDiscordClient();
const wclient = createWhatsAppClient();

// Registrar bridges
registerWAtoDS(wclient, dclient);
registerDStoWA(wclient, dclient);

// Arranque
(async () => {
  await dclient.login(CONFIG.DISCORD_TOKEN);
  wclient.initialize();
})();

// Salida limpia
function shutdown(code = 0) {
  console.log("Apagando…");
  try { dclient.destroy(); } catch {}
  try { wclient.destroy(); } catch {}
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
