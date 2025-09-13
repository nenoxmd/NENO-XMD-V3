const { lite } = require("../lite");
const fs = require("fs");
const path = require("path");

// Folder to save downloaded status media
const STATUS_DIR = path.join(__dirname, "..", "downloaded_status");
if (!fs.existsSync(STATUS_DIR)) fs.mkdirSync(STATUS_DIR, { recursive: true });

// Get extension from mimetype or fallback by type
function getExtension(mimetype, fallbackType) {
  if (mimetype) {
    try {
      const parts = mimetype.split("/");
      if (parts[1]) return parts[1].split(";")[0];
    } catch (e) { /* ignore */ }
  }
  // fallback guesses
  if (fallbackType === "image") return "jpg";
  if (fallbackType === "video") return "mp4";
  return "bin";
}

/**
 * Try multiple strategies to obtain a Buffer + mimetype from a quoted message.
 * - Works with wrappers that expose quoted.downloadMedia()
 * - Works with connections that have downloadMediaMessage (Baileys wrappers)
 * - Attempts to use common fields like jpegThumbnail or base64 content if present
 */
async function downloadQuotedMedia({ conn, quoted, mek, m }) {
  try {
    const quotedMsg = quoted || m?.quoted || mek?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    if (!quotedMsg) return null;

    // 1) If quoted itself exposes a download function (many wrappers)
    try {
      if (typeof quotedMsg.downloadMedia === "function") {
        const media = await quotedMsg.downloadMedia();
        if (media && (media.data || media.body)) {
          const base64 = media.data || media.body;
          const buffer = Buffer.from(base64, "base64");
          const mimetype = media.mimetype || media.mtype || quotedMsg.mimetype || null;
          return { buffer, mimetype };
        }
      }
    } catch (e) {
      // continue to other strategies
      console.error("strategy 1 failed:", e?.message || e);
    }

    // 2) If bot connection provides a helper to download quoted messages (Baileys style)
    try {
      if (conn && typeof conn.downloadMediaMessage === "function") {
        // Many wrappers expect the exact quoted message object. Try both quotedMsg and m.quoted
        const target = quotedMsg;
        const downloaded = await conn.downloadMediaMessage(target, "buffer", {});
        if (downloaded) {
          // downloaded may be Buffer or object with data
          if (Buffer.isBuffer(downloaded)) {
            // try to get mimetype from quoted
            const mimetype = quotedMsg.mimetype || quotedMsg.message?.imageMessage?.mimetype || quotedMsg.message?.videoMessage?.mimetype || null;
            return { buffer: downloaded, mimetype };
          } else if (downloaded.data) {
            const buffer = Buffer.from(downloaded.data, "base64");
            const mimetype = downloaded.mimetype || quotedMsg.mimetype || null;
            return { buffer, mimetype };
          }
        }
      }
    } catch (e) {
      console.error("strategy 2 failed:", e?.message || e);
    }

    // 3) Some frameworks include base64 payloads directly inside message fields (jpegThumbnail, etc.)
    try {
      const msg = quotedMsg.message || quotedMsg;
      // image thumbnail
      const jpeg = msg?.imageMessage?.jpegThumbnail || msg?.videoMessage?.jpegThumbnail;
      if (jpeg) {
        const buffer = Buffer.isBuffer(jpeg) ? jpeg : Buffer.from(jpeg, "base64");
        const mimetype = msg?.imageMessage?.mimetype || msg?.videoMessage?.mimetype || "image/jpeg";
        return { buffer, mimetype };
      }

      // document with data
      const docBase64 = msg?.documentMessage?.fileEnc || msg?.documentMessage?.fileBase64 || null;
      if (docBase64) {
        const buffer = Buffer.from(docBase64, "base64");
        const mimetype = msg?.documentMessage?.mimetype || "application/octet-stream";
        return { buffer, mimetype };
      }
    } catch (e) {
      console.error("strategy 3 failed:", e?.message || e);
    }

    // 4) Last attempt: if quoted has .buffer or .data fields
    try {
      const maybe = quotedMsg;
      if (maybe && maybe.data) {
        const buffer = Buffer.from(maybe.data, "base64");
        const mimetype = maybe.mimetype || null;
        return { buffer, mimetype };
      }
      if (maybe && maybe.buffer && Buffer.isBuffer(maybe.buffer)) {
        return { buffer: maybe.buffer, mimetype: maybe.mimetype || null };
      }
    } catch (e) {
      console.error("strategy 4 failed:", e?.message || e);
    }

  } catch (err) {
    console.error("downloadQuotedMedia overall error:", err);
  }
  return null;
}

lite({
  pattern: "status",
  react: "🟢",
  desc: "Download the replied media (status/photo/video) and send it",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    // find quoted in multiple places
    const hasQuoted = quoted || m?.quoted || mek?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!hasQuoted) return reply("❌ Please reply to a media message to download and send it.");

    // try several strategies to get the media
    const result = await downloadQuotedMedia({ conn, quoted: hasQuoted, mek, m });
    if (!result || !result.buffer) return reply("❌ Failed to download the media. (unsupported message shape)");

    const buffer = result.buffer;
    const mimetype = (result.mimetype || "").toString();
    // Guess type to pick extension
    const fallbackType = mimetype.startsWith("image/") ? "image" : mimetype.startsWith("video/") ? "video" : null;
    const ext = getExtension(mimetype, fallbackType);
    const timestamp = Date.now();
    const fileName = `status_${timestamp}.${ext}`;
    const filePath = path.join(STATUS_DIR, fileName);

    // Save locally
    fs.writeFileSync(filePath, buffer);

    // Send the media back to the chat according to its type
    const caption = `✅ Downloaded status saved as ${fileName}`;
    if (mimetype.startsWith("image/") || ext === "jpg" || ext === "jpeg" || ext === "png") {
      await conn.sendMessage(from, { image: buffer, caption }, { quoted: mek });
    } else if (mimetype.startsWith("video/") || ext === "mp4" || ext === "3gp'") {
      await conn.sendMessage(from, { video: buffer, caption }, { quoted: mek });
    } else {
      // fallback as document
      await conn.sendMessage(from, {
        document: buffer,
        fileName,
        mimetype: mimetype || "application/octet-stream",
        caption
      }, { quoted: mek });
    }

  } catch (err) {
    console.error("Error in .status plugin:", err);
    try { reply("❌ Failed to download or send the status media."); } catch (e) { /* ignore */ }
  }
});
