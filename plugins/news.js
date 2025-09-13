const { lite } = require("../lite"); const DYXT_NEWS = require("@dark-yasiya/news-scrap"); const news = new DYXT_NEWS();

lite({ pattern: "news", react: "📰", desc: "Get latest Sinhala news from Ada.lk", category: "main", filename: __filename, fromMe: false, }, async (malvin, mek, m, { reply, args, from }) => { try { await malvin.sendPresenceUpdate("composing", from);

// Optional category argument
const category = args[0] || "general";

// Fetch news
const adaNews = await news.ada(category);

if (!adaNews || !adaNews.result || adaNews.result.length === 0) {
  return reply("❌ Sorry, no news found at the moment.");
}

// Limit to top 5 news items
const topNews = adaNews.result.slice(0, 5);
let message = `📰 *Latest Sinhala News* 📰\n\n`;

topNews.forEach((item, i) => {
  message += `*${i + 1}. ${item.title}*\n`;
  message += `${item.desc}\n`;
  message += `🔗 Read More: ${item.url}\n\n`;
});

// Newsletter forwarding context
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363401225837204@newsletter",
    newsletterName: "NENO XMD",
    serverMessageId: 220
  }
};

// Send message with top news
await malvin.sendMessage(from, { text: message, contextInfo }, { quoted: mek });

// Optional: send image of first news if available
if (topNews[0].image) {
  await malvin.sendMessage(from, {
    image: { url: topNews[0].image },
    caption: `📰 ${topNews[0].title}`,
    contextInfo,
    quoted: mek
  });
}

} catch (e) { console.error("❌ Error in .news command:", e); reply("⚠️ Error fetching news!"); } });

