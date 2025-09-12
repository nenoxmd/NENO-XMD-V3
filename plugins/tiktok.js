const { lite } = require("../lite");
const axios = require("axios");

lite({
    pattern: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    desc: "Download TikTok video with extra info and audio option",
    category: "downloader",
    react: "⌛",
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("❗ Please provide a TikTok video link.");
        if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok link.");

        await conn.sendMessage(from, { react: { text: "⌛", key: m.key } });

        const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${q}`;
        let { data } = await axios.get(apiUrl);

        // fallback to another API if first fails
        if (!data.status || !data.data) {
            const fallbackUrl = `https://api.tikapi.io/video/info?url=${q}`;
            ({ data } = await axios.get(fallbackUrl));
            if (!data) return reply("❌ Failed to fetch TikTok video.");
        }

        const { title, like, comment, share, author, meta, music } = data.data;
        const videoUrl = meta.media.find(v => v.type === "video").org;
        const audioUrl = meta.media.find(v => v.type === "audio")?.org || null;
        const thumbnail = meta.cover;

        const caption = `*❒ NENO XMD TIKTOK DOWNLOADER ❒*\n\n` +
                        `👤 *User:* ${author.nickname}\n` +
                        `🎵 *Music:* ${music?.title || "Original"}\n` +
                        `♥️ *Likes:* ${like}\n💬 *Comments:* ${comment}\n♻️ *Shares:* ${share}\n\n` +
                        `📌 *Title:* ${title}`;

        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401225837204@newsletter",
                newsletterName: "Malvin Tech",
                serverMessageId: 220
            }
        };

        // send thumbnail + caption first
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: caption,
            contextInfo
        }, { quoted: mek });

        // send video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *TikTok Video*\nFrom: ${author.nickname}`,
            contextInfo
        }, { quoted: mek });

        // send audio if available
        if (audioUrl) {
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                ptt: false,
                contextInfo
            }, { quoted: mek });
        }

    } catch (e) {
        console.error("Error in TikTok downloader command:", e);
        reply(`❌ An error occurred: ${e.message}`);
    }
});
