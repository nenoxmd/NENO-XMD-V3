// plugins/movie.js
const axios = require("axios");
const { lite } = require("../lite");

lite({
    pattern: "movie",
    desc: "Fetch detailed information about a movie.",
    category: "utility",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender, args }) => {
    try {
        // Extract movie name
        const movieName = args.length > 0 
            ? args.join(" ") 
            : m.text.replace(/^[\.\#\$\!]?movie\s?/i, "").trim();
        
        if (!movieName) {
            return reply("📽️ Please provide the name of the movie.\nExample: .movie Iron Man");
        }

        // API call
        const apiUrl = `https://apis.davidcyriltech.my.id/imdb?query=${encodeURIComponent(movieName)}`;
        const response = await axios.get(apiUrl);

        if (!response.data.status || !response.data.movie) {
            return reply("🚫 Movie not found. Please check the name and try again.");
        }

        const movie = response.data.movie;

        // Caption format
        const dec = `
🎬 *${movie.title}* (${movie.year}) ${movie.rated || ''}

⭐ *IMDb:* ${movie.imdbRating || 'N/A'} 
🍅 *Rotten Tomatoes:* ${movie.ratings.find(r => r.source === 'Rotten Tomatoes')?.value || 'N/A'} 
💰 *Box Office:* ${movie.boxoffice || 'N/A'}

📅 *Released:* ${new Date(movie.released).toLocaleDateString()}
⏳ *Runtime:* ${movie.runtime}
🎭 *Genre:* ${movie.genres}

📝 *Plot:* ${movie.plot}

🎥 *Director:* ${movie.director}
✍️ *Writer:* ${movie.writer}
🌟 *Actors:* ${movie.actors}

🌍 *Country:* ${movie.country}
🗣️ *Language:* ${movie.languages}
🏆 *Awards:* ${movie.awards || 'None'}

🔗 [View on IMDb](${movie.imdbUrl})

> *ᴋᴇᴇᴘ ʀᴏᴄᴋɪɴ' ɴᴇɴᴏ xᴍᴅ*`;

        // Send movie info
        await conn.sendMessage(
            from,
            {
                image: { 
                    url: movie.poster && movie.poster !== "N/A" 
                        ? movie.poster 
                        : "https://files.catbox.moe/kmrq7z.jpg"
                },
                caption: dec,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363301882959206@newsletter",
                        newsletterName: "NENO XMD",
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error("Movie command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
