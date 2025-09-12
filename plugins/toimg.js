const { lite } = require("../lite");
const { Sticker } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("../lib/msg.js"); // Adjust path if needed

lite({
    pattern: "toimg",
    alias: ["img", "photo"],
    react: "🖼️",
    desc: "Convert a sticker to an image",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
    try {
        // Ensure the message contains a sticker to convert
        if (!quoted || !quoted.stickerMessage) {
            return reply("❌ Please reply to a sticker to convert it to an image.");
        }

        // Download the sticker
        const stickerBuffer = await downloadMediaMessage(quoted, "stickerInput");
        if (!stickerBuffer) return reply("❌ Failed to download the sticker. Try again!");

        // Convert the sticker buffer to an image
        const sticker = new Sticker(stickerBuffer, {
            pack: "neno v3💖😍",
            author: "nimeshka",
            type: "FULL",
            quality: 100,
        });

        const imageBuffer = await sticker.toBuffer({ format: "image/jpeg" });

        // Send the image
        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: "Here is your converted image!\n\n𝗠𝗔𝗗𝗘 𝗕𝗬  𝙉𝙀𝙊𝙉 𝙓𝙈𝘿",
        }, { quoted: mek });
    } catch (e) {
        console.error("Error converting sticker to image:", e);
        reply("❌ Error converting sticker to image. Please try again.");
    }
});
