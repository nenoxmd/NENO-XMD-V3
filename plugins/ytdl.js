// plugins/ytvideo.js
const { lite } = require("../lite");
const yts = require("yt-search");
const axios = require("axios");

lite({
    pattern: "video",
    react: "🎥",
    desc: "Download YouTube Video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const q = args.join(" ");
        if (!q) return reply("*Provide a name or a YouTube link.* 🎥❤️");

        // 1) Find the URL
        let url = q;
        try {
            url = new URL(q).toString();
        } catch {
            const s = await yts(q);
            if (!s.videos.length) return reply("❌ No videos found!");
            url = s.videos[0].url;
        }

        // 2) Send metadata + thumbnail
        const info = (await yts(url)).videos[0];
        const desc = `
🧩 *𝗡𝗘𝗡𝗢 𝗫𝗠𝗗 DOWNLOADER* 🧩
📌 *Title:* ${info.title}

📝 *Description:* ${info.description}

⏱️ *Uploaded:* ${info.timestamp} (${info.ago} ago)

👀 *Views:* ${info.views}

🔗 *Download URL:*
${info.url}

━━━━━━━━━━━━━━━━━━
*ᴺᴵᴹᴱˢᴴᴷᴬ ᴹᴵᴴᴵᴿᴬᴺ🪀*
        `.trim();

        await conn.sendMessage(
            from,
            { image: { url: info.thumbnail }, caption: desc },
            { quoted: mek }
        );

        // 3) Video download helper
        const downloadVideo = async (videoUrl, quality = "720") => {
            const apiUrl = `https://p.savenow.to/ajax/download.php?format=${quality}&url=${encodeURIComponent(
                videoUrl
            )}&api=edffd0d607404679c3e2f65071049817ddeb7988`; // << API Key here

            const res = await axios.get(apiUrl);
            if (!res.data.success) throw new Error("Failed to fetch video details.");

            const { id, title } = res.data;
            const progressUrl = `https://p.savenow.to/ajax/progress.php?id=${id}`;

            // poll until ready
            while (true) {
                const prog = (await axios.get(progressUrl)).data;
                if (prog.success && prog.progress === 1000) {
                    const vid = await axios.get(prog.download_url, { responseType: "arraybuffer" });
                    return { buffer: vid.data, title };
                }
                await new Promise((r) => setTimeout(r, 5000));
            }
        };

        // 4) Download + send
        const { buffer, title } = await downloadVideo(url, "720");
        await conn.sendMessage(
            from,
            {
                video: buffer,
                mimetype: "video/mp4",
                caption: `🎥 *${title}*\n\nⒸ ALL RIGHTS RESERVED 𝗡𝗘𝗡𝗢 𝗫𝗠𝗗❤️`,
            },
            { quoted: mek }
        );

        reply("*Thanks for using my bot!* 🎥");
    } catch (e) {
        console.error("Video Plugin Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
