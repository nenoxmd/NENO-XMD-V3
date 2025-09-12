const { lite } = require("../lite");
const axios = require("axios");

lite({
    pattern: "fb",
    alias: ["fbdl", "facebook"],
    desc: "Download Facebook videos and reels by providing the video URL.",
    category: "utility",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { args, reply, from }) => {
    try {
        const fbUrl = args.join(" ");
        if (!fbUrl) {
            return reply("*❗ Please provide a Facebook video or reel URL.*");
        }

        // Fetch video download links from API
        const apiKey = 'e276311658d835109c'; // replace if needed
        const apiUrl = `https://api.nexoracle.com/downloader/facebook?apikey=${apiKey}&url=${encodeURIComponent(fbUrl)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.result || !response.data.result.sd) {
            return reply("*❌ Could not fetch the video. Make sure the URL is valid.*");
        }

        const { title, desc, sd } = response.data.result;

        // Forwarded channel style info
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401225837204@newsletter",
                newsletterName: "NENO XMD",
                serverMessageId: 200
            }
        };

        // Send video with caption + forwarded info
        await conn.sendMessage(from, {
            video: { url: sd },
            caption: `*❒ FB VIDEO DL ❒*\n\n🔖 *Title*: ${title}\n📑 *Description*: ${desc}\n🖇️ *URL*: ${fbUrl}`,
            contextInfo
        }, { quoted: mek });

    } catch (error) {
        console.error("Error downloading FB video:", error);
        reply("❌ Unable to download the Facebook video. Please try again later.");
    }
});
