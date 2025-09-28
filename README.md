# WhatsApp-Discord-Bridge

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?logo=discord)
![WhatsApp-Web.js](https://img.shields.io/badge/whatsapp--web.js-1.23.0-brightgreen)

Puente **bidireccional** entre un **grupo de WhatsApp** y un **canal de Discord**, desarrollado en **Node.js**.  
Sincroniza mensajes de texto, imágenes, audios y videos en tiempo real entre ambas plataformas.  

Incluye soporte para:
- ✅ Reenvío de mensajes de texto con citas
- ✅ Imágenes y documentos
- ✅ Audios convertidos automáticamente a **MP3** para reproducirse en Discord
- ✅ Videos de Discord transcodificados a **MP4 (H.264 + AAC)** para visualizarse inline en WhatsApp
- ✅ Evita bucles de mensajes (detector de etiquetas)
- ✅ Configuración flexible mediante `.env` o `config.json`

---

## 🚀 Requisitos

- [Node.js](https://nodejs.org/) **v18+**
- [FFmpeg](https://ffmpeg.org/) en el `PATH` (para audio y video)
- Un **bot de Discord** creado con su token
- Un **número de WhatsApp** vinculado al grupo que quieras sincronizar

---

## ⚙️ Instalación

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/whatsapp-discord-bridge.git
cd whatsapp-discord-bridge

# Instalar dependencias
npm install
