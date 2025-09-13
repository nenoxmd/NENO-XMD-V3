const axios = require('axios');
const { lite } = require('../lite');

lite({
    pattern: "movie",
    react: "🎬",
    desc: "Fetch detailed information about a movie.",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { args, reply, sender }) => {
    try {
        const movieName = args.join(' ');
        if (!movieName) return reply("❌ Please provide the name of the movie. Example: .movie Inception");

        // API Key added directly here
        const OMDB_API_KEY = "76cb7f39"; 
        const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.Response === "False") return reply("❌ Movie not found.");

        const movieInfo = `
🎞️ *Movie Details* 🎞️

📌 *Title:* ${data.Title}
📅 *Year:* ${data.Year}
⭐ *Rated:* ${data.Rated}
📆 *Released:* ${data.Released}
⏱️ *Runtime:* ${data.Runtime}
🎭 *Genre:* ${data.Genre}
🎬 *Director:* ${data.Director}
✍️ *Writer:* ${data.Writer}
👨‍🎤 *Actors:* ${data.Actors}
🗣️ *Language:* ${data.Language}
🌍 *Country:* ${data.Country}
🏆 *Awards:* ${data.Awards}
🎖️ *IMDb Rating:* ${data.imdbRating}

> POWERED BY NIMESHKA MIHIRAN
`;

        const imageUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : "https://i.ibb.co/album-placeholder.png";

        await conn.sendMessage(
            m.from,
            {
                image: { url: imageUrl },
                caption: movieInfo,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363402507750390@newsletter",
                        newsletterName: "ᴍᴀʟᴠɪɴ ᴋɪɴɢ ᴛᴇᴄʜ",
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
