const { lite } = require("../lite");
const fs = require("fs");
const path = require("path");

const DOWNLOAD_DIR = path.join(__dirname, "..", "downloaded_media");
const META_FILE = path.join(DOWNLOAD_DIR, "media_metadata.json");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Helper: append metadata
function saveMetadata(obj) {
  let arr = [];
  try {
    if (fs.existsSync(META_FILE)) arr = JSON.parse(fs.readFileSync(META_FILE, "utf8") || "[]");
  } catch (e) {}
  arr.push(obj);
  fs.writeFileSync(META_FILE, JSON.stringify(arr, null, 2));
}

// Stream -> buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// Detect extension from mimetype or magic bytes
function detectExtensionFromBuffer(buffer, mimetype) {
  if (mimetype) {
    const parts = mimetype.split("/");
    if (parts[1]) return parts[1].split(";")[0].split("+")[0];
  }
  const head = buffer.slice(0, 12);
  const hex = head.toString("hex");
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex.startsWith("89504e47")) return "png";
  if (buffer.slice(4, 8).toString("ascii") === "ftyp") return "mp4";
  if (hex.startsWith("47494638")) return "gif";
  return "bin";
}

// Download quoted media (simplified for lite)
async function downloadQuotedMedia(client, quoted) {
  try {
    if (quoted && typeof quoted.downloadMedia === "function") {
      const media = await quoted.downloadMedia();
      if (media && media.data) {
        return { buffer: Buffer.from(media.data, "base64"), mimetype: media.mimetype || null };
      }
    }
  } catch (e) {}
  return null;
}

lite({
  pattern: "vv",
  react: "📸",
  desc: "Unlock & save View-Once image/video (reply to view-once)",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted) return reply("❌ Please reply to a *View Once* image or video using .vv");

    const result = await downloadQuotedMedia(conn, quoted);
    if (!result || !result.buffer) return reply("❌ Failed to download media. Message may have expired or not supported.");

    const buffer = result.buffer;
    const mimetype = (result.mimetype || "").toString();
    const ext = detectExtensionFromBuffer(buffer, mimetype);

    const fromJid = mek.key.participant || mek.key.remoteJid || "unknown";
    const safeFrom = String(fromJid).replace(/[^0-9a-zA-Z_.-]/g, "_");
    const timestamp = Date.now();
    const isViewOnce = !!(quoted.viewOnceMessage || (quoted.ephemeralMessage && quoted.ephemeralMessage.message && quoted.ephemeralMessage.message.viewOnceMessage));
    const postfix = isViewOnce ? "_viewonce" : "";
    const filename = `${safeFrom}_${timestamp}${postfix}.${ext}`;
    const filepath = path.join(DOWNLOAD_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    saveMetadata({
      saved_at: new Date().toISOString(),
      chat: from,
      from: fromJid,
      message_id: mek.key.id || null,
      filename,
      path: filepath,
      mimetype: mimetype || null,
      viewOnce: !!isViewOnce,
      quoted_key: (quoted && quoted.key) ? quoted.key : null
    });

    const caption = `🔓 Unlocked & saved${isViewOnce ? " (view-once)" : ""}\nFile: ${filename}`;

    // Forwarding info for newsletter/channel
    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363401225837204@newsletter",
        newsletterName: "NENO XMD",
        serverMessageId: 151
      }
    };

    // Send media according to type
    if (mimetype.startsWith("image/")) {
      await conn.sendMessage(from, { image: buffer, caption, contextInfo }, { quoted: mek });
    } else if (mimetype.startsWith("video/")) {
      await conn.sendMessage(from, { video: buffer, caption, contextInfo }, { quoted: mek });
    } else {
      await conn.sendMessage(from, {
        document: buffer,
        fileName: filename,
        mimetype: mimetype || "application/octet-stream",
        caption,
        contextInfo
      }, { quoted: mek });
    }

  } catch (err) {
    console.error("Error in .vv lite plugin:", err);
    reply("❌ Could not unlock/save this view-once media. See logs.");
  }
});
