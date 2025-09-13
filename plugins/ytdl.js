// plugins/video_savenow_ytsearch.js
const { lite } = require('../lite');
const yts = require("yt-search");
const axios = require("axios");
const config = require('../settings');

const apiKey = "edffd0d607404679c3e2f65071049817ddeb7988";
const apiDomain = "https://p.savenow.to";

function extractDownloadUrl(resp) {
    if (!resp) return null;
    return resp?.result?.download?.url || resp?.result?.download_url || resp?.result?.url || resp?.download?.url || resp?.url || null;
}

lite({
    pattern: "video",
    alias: ["vid", "ytv", "song"],
    react: "🎬",
    desc: "Search YouTube and download audio/video",
    category: "download",
    use: ".video <YT URL or Query>",
    filename: __filename,
    fromMe: false
}, async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("❌ Please provide a YouTube URL or search query!");

        let url;
        if (q.startsWith("http")) {
            url = q;
        } else {
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            url = search.videos[0].url;
        }

        // Fetch video info from API
        const infoResp = await axios.get(`${apiDomain}/ajax/info.php`, {
            params: { url, api: apiKey }
        });

        if (!infoResp.data || !infoResp.data.result) return await reply("❌ Failed to fetch video info!");

        const { title, image, timestamp, views, author, url: videoUrl } = infoResp.data.result;

        const caption = [
            `🍄 *VIDEO DOWNLOADER* 🍄`,
            ``,
            `🎬 *Title:* ${title || "Unknown"}`,
            `⏳ *Duration:* ${timestamp || "Unknown"}`,
            `👀 *Views:* ${views || "Unknown"}`,
            `👤 *Author:* ${author?.name || "Unknown"}`,
            `🔗 *Url:* ${videoUrl || "Unknown"}`,
            ``,
            `🔽 *Reply with your choice:*`,
            `> 1 — Audio (mp3) 🎵`,
            `> 2 — Video (mp4) 🎬`,
            ``,
            `${config.FOOTER || "ɴᴇɴᴏ-xᴍᴅ"}`
        ].join("\n");

        const sent = await conn.sendMessage(from, { image: { url: image }, caption }, { quoted: mek });
        const messageID = sent.key.id;
        await conn.sendMessage(from, { react: { text: '🎶', key: sent.key } }).catch(()=>{});

        const originalSender = sender;
        let timeoutHandle;

        const handler = async (update) => {
            try {
                const upMsg = update?.messages?.[0];
                if (!upMsg || !upMsg.message) return;

                const incomingSender = upMsg.key.participant || upMsg.key.remoteJid;
                if (incomingSender !== originalSender) return;

                const context = upMsg.message.extendedTextMessage?.contextInfo;
                const isReply = context && context.stanzaId === messageID;
                if (!isReply) return;

                const text = upMsg.message.conversation || upMsg.message.extendedTextMessage?.text || "";
                const choice = text.trim();

                conn.ev.off('messages.upsert', handler);
                clearTimeout(timeoutHandle);

                if (choice === "1") {
                    const processing = await conn.sendMessage(from, { text: "⏳ Processing audio (mp3)..." }, { quoted: mek });
                    const resp = await axios.get(`${apiDomain}/ajax/ytmp3.php`, {
                        params: { url: videoUrl, api: apiKey }
                    });
                    const downloadUrl = extractDownloadUrl(resp.data);
                    if (!downloadUrl) return await reply("❌ Audio download link not found!");
                    await conn.sendMessage(from, { audio: { url: downloadUrl }, mimetype: "audio/mpeg" }, { quoted: mek });
                    await conn.sendMessage(from, { text: '✅ Audio sent.', edit: processing.key }).catch(()=>{});
                } else if (choice === "2") {
                    const processing = await conn.sendMessage(from, { text: "⏳ Processing video (mp4)..." }, { quoted: mek });
                    const resp = await axios.get(`${apiDomain}/ajax/ytmp4.php`, {
                        params: { url: videoUrl, api: apiKey }
                    });
                    const downloadUrl = extractDownloadUrl(resp.data);
                    if (!downloadUrl) return await reply("❌ Video download link not found!");
                    await conn.sendMessage(from, { video: { url: downloadUrl }, mimetype: "video/mp4", caption: title }, { quoted: mek });
                    await conn.sendMessage(from, { text: '✅ Video sent.', edit: processing.key }).catch(()=>{});
                } else {
                    await reply("❌ Invalid choice. Reply with *1* for mp3 or *2* for mp4.");
                }

            } catch (err) {
                console.error("Listener error:", err);
                try { await reply(`❌ Processing error: ${err.message || err}`); } catch(_) {}
                conn.ev.off('messages.upsert', handler);
                clearTimeout(timeoutHandle);
            }
        };

        conn.ev.on('messages.upsert', handler);

        timeoutHandle = setTimeout(async () => {
            try {
                conn.ev.off('messages.upsert', handler);
                await conn.sendMessage(from, { text: '⏳ Timeout — no reply received. Please run the command again if you still want the file.' }, { quoted: mek });
            } catch (_) {}
        }, 60000);

    } catch (error) {
        console.error("Video command error:", error);
        try { await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }); } catch(_) {}
        await reply(`❌ An error occurred: ${error?.message || error}`);
    }
});
