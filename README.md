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

### 🔹 Windows

1. Instalar [Node.js](https://nodejs.org/) (mínimo v18).  
   Durante la instalación, marca la opción **“Add to PATH”**.  

2. Instalar FFmpeg con **winget**:
   ```powershell
   winget install Gyan.FFmpeg
Clonar el repositorio y entrar al directorio:

powershell
Copiar código
git clone https://github.com/tuusuario/whatsapp-discord-bridge.git
cd whatsapp-discord-bridge
Instalar dependencias:

powershell
Copiar código
npm install
🔹 Linux (Ubuntu/Debian)
Instalar Node.js y npm:

bash
Copiar código
sudo apt update
sudo apt install -y nodejs npm
Verifica la versión:

bash
Copiar código
node -v
Instalar FFmpeg:

bash
Copiar código
sudo apt install -y ffmpeg
Clonar el repositorio:

bash
Copiar código
git clone https://github.com/tuusuario/whatsapp-discord-bridge.git
cd whatsapp-discord-bridge
Instalar dependencias:

bash
Copiar código
npm install
🔑 Configuración
Copia y edita uno de los archivos de ejemplo:

bash
Copiar código
# Opción 1: variables de entorno
cp .env.example .env

# Opción 2: archivo JSON
cp config.template.json config.json
Variables importantes
DISCORD_TOKEN: Token del bot de Discord

DISCORD_CHANNEL_ID: ID del canal donde se enviarán los mensajes

WA_GROUP_ID o WA_GROUP_NAME: Grupo de WhatsApp a sincronizar

MAX_MEDIA_BYTES: Límite de adjuntos (WA soporta hasta ~16 MB)

Ejemplo de config.json:

json
Copiar código
{
  "DISCORD_TOKEN": "TU_TOKEN_DISCORD",
  "DISCORD_CHANNEL_ID": "123456789012345678",
  "WA_GROUP_NAME": "Los tulentos",
  "WA_GROUP_ID": "120363039030493956@g.us",
  "TAG_FROM_WA": "📲 [WA]",
  "TAG_FROM_DS": "💻 [Discord]",
  "MAX_MEDIA_BYTES": 15728640
}
▶️ Uso
Ejecuta el puente:

bash
Copiar código
npm start
Escanea el QR que aparece en la consola con WhatsApp → Dispositivos vinculados.

El bot confirmará:

WhatsApp listo ✅

Discord listo ✅

📂 Estructura del proyecto
bash
Copiar código
src/
 ├─ index.js         # Punto de entrada
 ├─ config.js        # Configuración central
 ├─ discord.js       # Cliente Discord
 ├─ whatsapp.js      # Cliente WhatsApp
 ├─ bridge.js        # Lógica de reenvío WA ↔ DS
 └─ media.js         # Conversión/transcodificación de medios
⚠️ Notas
WhatsApp Web limita los adjuntos a ~16 MB

Los audios se convierten a MP3/M4A para reproducirse inline en Discord

Los videos se reescalan a un máximo de 720px (configurable en config.json)

Para producción se recomienda usar pm2 para mantenerlo activo

Para escanear un nuevo QR elimina la carpeta .wa_auth

📜 Licencia
Este proyecto está bajo la licencia MIT.
¡Si lo mejoras, considera hacer un PR al repo! 🚀
