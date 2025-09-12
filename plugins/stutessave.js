const { lite } = require("../lite");
const fs = require("fs");
const path = require("path");

// Folder to save downloaded status media
const STATUS_DIR = path.join(__dirname, "..", "downloaded_status");
if (!fs.existsSync(STATUS_DIR)) fs.mkdirSync(STATUS_DIR, { recursive: true });

// Helper to download quoted media
async function downloadQuotedMedia(quoted) {
  try {
    if (!quoted) return null;
    if (typeof quoted.downloadMedia === "function") {
      const media = await quoted.downloadMedia();
      if (media && media.data) {
        return { buffer: Buffer.from(media.data, "base64"), mimetype: media.mimetype || null };
      }
    }
  } catch (e) {
    console.error("Failed to download quoted media:", e);
  }
  return null;
}

// Get extension from mimetype
function getExtension(mimetype) {
  if (!mimetype) return "bin";
  return mimetype.split("/")[1].split(";")[0] || "bin";
}

lite({
  pattern: "status",
  react: "🟢",
  desc: "Download the replied media (status/photo/video) and send it",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted) return reply("❌ Please reply to a media message to download and send it.");

    const result = await downloadQuotedMedia(quoted);
    if (!result || !result.buffer) return reply("❌ Failed to download the media.");

    const buffer = result.buffer;
    const mimetype = (result.mimetype || "").toString();
    const ext = getExtension(mimetype);
    const timestamp = Date.now();
    const fileName = `status_${timestamp}.${ext}`;
    const filePath = path.join(STATUS_DIR, fileName);

    // Save locally
    fs.writeFileSync(filePath, buffer);

    // Send the media back to the chat
    if (mimetype.startsWith("image/")) {
      await conn.sendMessage(from, { image: buffer, caption: `✅ Downloaded status saved as ${fileName}` }, { quoted: mek });
    } else if (mimetype.startsWith("video/")) {
      await conn.sendMessage(from, { video: buffer, caption: `✅ Downloaded status saved as ${fileName}` }, { quoted: mek });
    } else {
      await conn.sendMessage(from, { document: buffer, fileName, mimetype: mimetype || "application/octet-stream", caption: `✅ Downloaded status saved as ${fileName}` }, { quoted: mek });
    }

  } catch (err) {
    console.error("Error in .status plugin:", err);
    reply("❌ Failed to download or send the status media.");
  }
});
