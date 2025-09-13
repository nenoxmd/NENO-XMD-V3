// plugins/ringtone.js
const axios = require("axios");
const { lite } = require("../lite");

lite({
    pattern: "ringtone",
    alias: ["ringtones", "ring"],
    desc: "Get a random ringtone from the API.",
    react: "🎵",
    category: "download",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("Please provide a search query! Example: .ringtone Suna");
        }

        const { data } = await axios.get(
            `https://www.dark-yasiya-api.site/download/ringtone?text=${encodeURIComponent(query)}`
        );

        if (!data.status || !data.result || data.result.length === 0) {
            return reply("❌ No ringtones found for your query. Try a different keyword.");
        }

        const randomRingtone = data.result[Math.floor(Math.random() * data.result.length)];

        await conn.sendMessage(
            from,
            {
                audio: { url: randomRingtone.dl_link },
                mimetype: "audio/mpeg",
                fileName: `${randomRingtone.title}.mp3`,
            },
            { quoted: mek }
        );

        reply(`🎵 *Here is your ringtone:* ${randomRingtone.title}`);
    } catch (error) {
        console.error("Error in ringtone command:", error);
        reply("❌ Sorry, something went wrong while fetching the ringtone. Please try again later.");
    }
});
