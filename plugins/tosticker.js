const { lite } = require("../lite");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { downloadMediaMessage } = require("../lib/msg.js"); // adjust path

lite({
    pattern: "sticker",
    alias: ["s", "stick"],
    react: "🔖",
    desc: "Convert an image or video to a sticker",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { from, quoted, reply, sender }) => {
    try {
        if (!quoted || !(quoted.imageMessage || quoted.videoMessage)) {
            return reply("❌ Please reply to an image or video to convert it to a sticker.");
        }

        // Download the media
        const media = await downloadMediaMessage(quoted, "stickerInput");
        if (!media) return reply("❌ Failed to download the media. Try again!");

        // Create sticker
        const sticker = new Sticker(media, {
            pack: "𝐍𝐄𝐎𝐍 𝐗𝐌𝐃",
            author: "ɴᴇɴᴏ xᴍᴅ🪀",
            type: StickerTypes.FULL,
            quality: 50
        });

        const buffer = await sticker.toBuffer();

        // Send with channel forwarding
        await conn.sendMessage(from, {
            sticker: buffer,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363401225837204@newsletter",
                    newsletterName: "NENO XMD",
                    serverMessageId: 101
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message || e}`);
    }
});
