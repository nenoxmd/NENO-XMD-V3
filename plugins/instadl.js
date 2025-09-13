const { lite } = require("../lite");
const axios = require("axios");

lite({
  pattern: "insta",
  alias: ["igdl", "instagram", "instadl"],
  desc: "Download Instagram video with extra info",
  category: "downloader",
  react: "📥",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) return reply("❗ Please provide an Instagram video link.");
    if (!q.includes("instagram.com") && !q.includes("instagr.am")) 
      return reply("❌ Invalid Instagram link.");

    await conn.sendMessage(from, { react: { text: "⌛", key: m.key } });

    // Use a public Instagram download API
    const apiUrl = `https://delirius-apiofc.vercel.app/download/instagram?url=${q}`;
    let { data } = await axios.get(apiUrl);

    if (!data.status || !data.data) {
      return reply("❌ Failed to fetch Instagram video.");
    }

    const { title, author, meta } = data.data;
    const videoUrl = meta.media.find(v => v.type === "video").org;
    const thumbnail = meta.cover;

    const caption = `*❒ NENO XMD INSTAGRAM DOWNLOADER ❒*\n\n` +
                    `👤 *User:* ${author.nickname}\n` +
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

    // Send thumbnail + caption
    await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption: caption,
      contextInfo
    }, { quoted: mek });

    // Send video
    await conn.sendMessage(from, {
      video: { url: videoUrl },
      caption: `🎬 *Instagram Video*\nFrom: ${author.nickname}`,
      contextInfo
    }, { quoted: mek });

  } catch (e) {
    console.error("Error in Instagram downloader command:", e);
    reply(`❌ An error occurred: ${e.message}`);
  }
});
