const path = require("path");
const qrcode = require("qrcode-terminal");
const { Client: WClient, LocalAuth } = require("whatsapp-web.js");

function createWhatsAppClient() {
  const wclient = new WClient({
    authStrategy: new LocalAuth({ dataPath: path.join(process.cwd(), ".wa_auth") }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
  });

  wclient.on("qr", (qr) => {
    console.log("Escanea este QR con WhatsApp:");
    qrcode.generate(qr, { small: true });
  });

  wclient.on("ready", async () => {
    console.log("✅ WhatsApp listo");
    try {
      const chats = await wclient.getChats();
      const groups = chats.filter((c) => c.isGroup);
      console.log("📝 Grupos WA (nombre :: id):");
      for (const g of groups) console.log(`- ${g.name} :: ${g.id._serialized}`);
    } catch (e) {
      console.warn("[WA] No pude listar grupos:", e?.message);
    }
  });

  return wclient;
}

module.exports = { createWhatsAppClient };
