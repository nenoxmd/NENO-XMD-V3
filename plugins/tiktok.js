const { lite } = require("../lite"); const axios = require("axios");

lite({ pattern: "tiktok", alias: ["ttdl", "tt", "tiktokdl"], desc: "Download TikTok video with extra info and audio option", category: "downloader", react: "⌛", filename: __filename }, async (conn, mek, m, { from, args, q, reply }) => { try { // If user typed just ".sg" accidentally, guide them if (q && q.trim() === '.sg') { return reply("❗ You sent '.sg' alone — please provide the full TikTok URL. Example: https://vt.tiktok.com/ZSDFKVQxU/ or https://www.tiktok.com/@user/video/123"); }

if (!q) return reply("❗ Please provide a TikTok video link. Example: https://vt.tiktok.com/ZSDFKVQxU/ or https://www.tiktok.com/@user/video/123");
    // Accept main tiktok domains, short vt links, and any link that contains .sg (user requested .sg support)
    if (!q.includes("tiktok.com") && !q.includes("vt.tiktok.com") && !q.includes(".sg")) return reply("❌ Invalid TikTok link. Make sure it contains tiktok.com, vt.tiktok.com, or .sg.");

    // small helper to safely get nested props
    const safeGet = (obj, path, fallback = undefined) => {
        try {
            return path.split('.').reduce((s, p) => (s && s[p] !== undefined) ? s[p] : undefined, obj) ?? fallback;
        } catch { return fallback; }
    };

    await conn.sendMessage(from, { react: { text: "⌛", key: m.key } });

    // try primary API
    const primaryApi = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`;
    const fallbackApi = `https://api.tikapi.io/video/info?url=${encodeURIComponent(q)}`;

    let response;
    let data;

    try {
        response = await axios.get(primaryApi, { timeout: 15000 });
        data = response.data;
    } catch (errPrimary) {
        // try fallback
        try {
            response = await axios.get(fallbackApi, { timeout: 15000 });
            data = response.data;
        } catch (errFallback) {
            console.error('Both primary and fallback API failed:', errPrimary?.message, errFallback?.message);
            return reply('❌ Failed to fetch TikTok video from both APIs.');
        }
    }

    // Normalize payload
    const payload = data?.data ?? data ?? {};

    // Extract common fields defensively
    const title = payload.title || payload.desc || payload.description || 'No title';

    const authorObj = payload.author || payload.authorMeta || payload.creator || payload.user || {};
    const authorName = authorObj.nickname || authorObj.name || authorObj.nickName || authorObj.username || 'Unknown';

    // Try to locate media array or individual video/audio fields in multiple possible shapes
    let media = [];

    if (Array.isArray(safeGet(payload, 'meta.media'))) {
        media = payload.meta.media;
    } else if (Array.isArray(payload.media)) {
        media = payload.media;
    } else if (payload.video && typeof payload.video === 'object') {
        // Some APIs return video object
        const v = payload.video;
        media.push({ type: 'video', org: v.playAddr || v.dlUrl || v.downloadAddr || v.url || v.src });
        if (payload.music || v.music) {
            const music = payload.music || v.music;
            media.push({ type: 'audio', org: music.playUrl || music.url || music.src });
        }
    } else if (payload.videoUrl || payload.video_url || payload.playAddr) {
        media.push({ type: 'video', org: payload.videoUrl || payload.video_url || payload.playAddr });
    }

    // Fallback: if payload has "downloadUrl" or similar
    if (media.length === 0 && (payload.downloadUrl || payload.download_url)) {
        media.push({ type: 'video', org: payload.downloadUrl || payload.download_url });
    }

    // At this point, try to sanitize each media entry ensuring a usable URL property exists
    media = media.map(m => {
        if (!m) return null;
        return {
            type: (m.type || '').toString(),
            org: m.org || m.url || m.src || m.playAddr || m.downloadAddr || m.playUrl || m.download_url || m.downloadUrl || null
        };
    }).filter(Boolean);

    // Find video and audio objects
    const videoObj = media.find(x => /video/i.test(x.type) && x.org) || media.find(x => x.org);
    const audioObj = media.find(x => /audio/i.test(x.type) && x.org) || null;

    if (!videoObj || !videoObj.org) {
        console.error('No video found in API payload:', JSON.stringify(payload).slice(0, 1000));
        return reply('❌ Could not find downloadable video in the API response.');
    }

    const videoUrl = videoObj.org;
    const audioUrl = audioObj?.org || null;

    // Thumbnail extraction
    const thumbnail = payload?.meta?.cover || payload?.cover || payload?.thumbnail || payload?.thumb || payload?.image || payload?.poster || null;

    const like = payload.like || payload.likes || payload.statistic?.like || payload.stats?.diggCount || 'N/A';
    const comment = payload.comment || payload.comments || payload.statistic?.comment || payload.stats?.commentCount || 'N/A';
    const share = payload.share || payload.shares || payload.statistic?.share || payload.stats?.shareCount || 'N/A';
    const musicTitle = safeGet(payload, 'music.title') || safeGet(payload, 'music.name') || safeGet(payload, 'music') || 'Original';

    const caption = `*❒ NENO XMD TIKTOK DOWNLOADER ❒*\n\n` +
                    `👤 *User:* ${authorName}\n` +
                    `🎵 *Music:* ${musicTitle}\n` +
                    `♥️ *Likes:* ${like}\n💬 *Comments:* ${comment}\n♻️ *Shares:* ${share}\n\n` +
                    `📌 *Title:* ${title}`;

    const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363401225837204@newsletter",
            newsletterName: "NENO XMD",
            serverMessageId: 220
        }
    };

    // send thumbnail + caption first (if thumbnail exists)
    if (thumbnail) {
        try {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: caption,
                contextInfo
            }, { quoted: mek });
        } catch (err) {
            // If sending thumbnail fails, continue and just send video
            console.warn('Failed to send thumbnail:', err?.message);
        }
    }

    // send video (use document fallback if direct video fails in some clients)
    try {
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *TikTok Video*\nFrom: ${authorName}`,
            contextInfo
        }, { quoted: mek });
    } catch (errVideo) {
        // Try sending as document if video sending fails
        try {
            await conn.sendMessage(from, {
                document: { url: videoUrl },
                mimetype: 'video/mp4',
                fileName: `${authorName || 'tiktok'}_video.mp4`,
                caption: `🎬 *TikTok Video (document)*\nFrom: ${authorName}`,
                contextInfo
            }, { quoted: mek });
        } catch (errDoc) {
            console.error('Failed to send video as video and as document:', errVideo?.message, errDoc?.message);
            return reply('❌ Failed to send the video to the chat.');
        }
    }

    // send audio if available
    if (audioUrl) {
        try {
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                ptt: false,
                contextInfo
            }, { quoted: mek });
        } catch (errAudio) {
            console.warn('Failed to send audio:', errAudio?.message);
        }
    }

} catch (e) {
    console.error("Error in TikTok downloader command:", e);
    // Provide a user-friendly message but include enough info for debugging
    reply(`❌ An error occurred: ${e.message || 'Unknown error'}`);
}

});

