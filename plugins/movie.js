const axios = require('axios');
const { lite } = require('../lite');

// OMDB API Key
const OMDB_API_KEY = "76cb7f39"; // Replace with your own if needed

lite({
    pattern: "movie",
    desc: "Fetch detailed information about a movie.",
    category: "utility",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { args, reply, from }) => {
    try {
        const movieName = args.join(' ');
        if (!movieName) {
            return reply("📽️ Please provide the name of the movie.\nExample: .movie Inception");
        }

        const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.Response === "False") {
            return reply("❌ Movie not found.");
        }

        const movieInfo = `
*🎬 𝗡𝗘𝗡𝗢 𝗫𝗠𝗗 🎬*

*ᴛɪᴛʟᴇ:* ${data.Title}
*ʏᴇᴀʀ:* ${data.Year}
*ʀᴀᴛᴇᴅ:* ${data.Rated}
*ʀᴇʟᴇᴀꜱᴇᴅ:* ${data.Released}
*ʀᴜɴᴛɪᴍᴇ:* ${data.Runtime}
*ɢᴇɴʀᴇ:* ${data.Genre}
*ᴅɪʀᴇᴄᴛᴏʀ:* ${data.Director}
*ᴡʀɪᴛᴇʀ:* ${data.Writer}
*ᴀᴄᴛᴏʀꜱ:* ${data.Actors}
*ʟᴀɴɢᴜᴀɢᴇ:* ${data.Language}
*ᴄᴏᴜɴᴛʀʏ:* ${data.Country}
*ᴀᴡᴀʀᴅꜱ:* ${data.Awards}
*ɪᴍᴅʙ ʀᴀᴛɪɴɢ:* ${data.imdbRating}

> POWERED BY NIMESHKA MIHIRAN
`;

        // Safe check for poster
        const imageUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : null;

        if (imageUrl) {
            await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: movieInfo
            });
        } else {
            await reply(movieInfo);
        }

    } catch (e) {
        console.error('Movie command error:', e);
        reply(`❌ Error: ${e.message || e}`);
    }
});
