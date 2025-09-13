const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { lite } = require("../lite");

lite({
  pattern: "tourl",
  alias: ["imgtourl", "imgurl", "url", "geturl", "upload"],
  react: "🖇",
  desc: "Convert media to Catbox URL",
  category: "utility",
  use: ".tourl [reply to media]",
  filename: __filename,
}, async (conn, mek, m, { reply }) => {
  try {
    const quoted = mek.quoted ? mek.quoted : mek;
    const mime = (quoted.msg || quoted).mimetype || "";

    if (!mime) {
      return reply("❌ Please reply to an image, video, or audio file.");
    }

    // Download media
    const buffer = await quoted.download();
    const tempPath = path.join(os.tmpdir(), `catbox_${Date.now()}`);
    fs.writeFileSync(tempPath, buffer);

    // Detect extension
    let ext = "";
    if (mime.includes("image/jpeg")) ext = ".jpg";
    else if (mime.includes("image/png")) ext = ".png";
    else if (mime.includes("image/webp")) ext = ".webp";
    else if (mime.includes("video/mp4")) ext = ".mp4";
    else if (mime.includes("video/webm")) ext = ".webm";
    else if (mime.includes("audio/mpeg")) ext = ".mp3";
    else if (mime.includes("audio/ogg")) ext = ".ogg";
    else ext = ".bin";

    const fileName = `file${ext}`;

    // Prepare form
    const form = new FormData();
    form.append("fileToUpload", fs.createReadStream(tempPath), fileName);
    form.append("reqtype", "fileupload");

    // Upload
    const res = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    fs.unlinkSync(tempPath);

    if (!res.data || !res.data.includes("https://")) {
      return reply("❌ Catbox API failed to return a valid URL.");
    }

    const url = res.data;

    let type = "File";
    if (mime.includes("image")) type = "Image";
    else if (mime.includes("video")) type = "Video";
    else if (mime.includes("audio")) type = "Audio";

    await reply(
      `✅ *${type} Uploaded Successfully!*\n\n` +
      `*Size:* ${formatBytes(buffer.length)}\n` +
      `*URL:* ${url}\n\n` +
      `> *NENO-XMD*`
    );

  } catch (e) {
    console.error(e);
    reply(`⚠️ Error: ${e.message || e}`);
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
