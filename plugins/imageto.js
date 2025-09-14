const { lite } = require("../lite");
const { Sticker } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("../lib/msg.js"); // adjust path if needed

lite({
  pattern: "toimg",
  alias: ["img", "photo"],
  react: "🖼️",
  desc: "Convert a sticker to an image",
  category: "other",
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted || !quoted.stickerMessage) {
      return reply("❌ Please reply to a sticker to convert it to an image.");
    }

    const stickerBuffer = await downloadMediaMessage(quoted, "stickerInput");
    if (!stickerBuffer) return reply("❌ Failed to download the sticker. Try again!");

    const sticker = new Sticker(stickerBuffer, {
      pack: "neno v3💖😍",
      author: "nimeshka",
      type: "FULL",
      quality: 100
    });

    const imageBuffer = await sticker.toBuffer({ format: "image/jpeg" });

    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: "✅ Here is your converted image!\n\n 𝗠𝗔𝗗𝗘 𝗕𝗬 𝙉𝙀𝙊𝙉 𝙓𝙈𝘿"
    }, { quoted: mek });

  } catch (e) {
    console.error("❌ Error in .toimg command:", e);
    reply(`❌ Error: ${e.message || e}`);
  }
});
