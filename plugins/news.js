// plugins/news.js
const { lite } = require("../lite");
const DYXT_NEWS = require("@dark-yasiya/news-scrap");
const news = new DYXT_NEWS();

lite({
  pattern: "news",
  react: "📰",
  desc: "Get latest Sinhala news from Ada.lk",
  category: "main",
  filename: __filename,
  fromMe: false,
}, 
async (malvin, mek, m, { reply, args, from }) => {
  try {
    // Show typing presence
    try { await malvin.sendPresenceUpdate("composing", from); } catch (_) {}

    // Determine category (default general)
    const category = (args && args.length) ? args[0].toString().trim().toLowerCase() : "general";

    // Fetch news
    let adaNews;
    try { adaNews = await news.ada(category); } 
    catch (err) { console.error("❌ news.ada() threw:", err); }

    let results = [];
    if (adaNews && Array.isArray(adaNews.result)) results = adaNews.result;
    else if (adaNews && Array.isArray(adaNews.data)) results = adaNews.data;
    else if (adaNews && Array.isArray(adaNews.articles)) results = adaNews.articles;

    // Fallback to general news if empty
    if (!results || results.length === 0) {
      try { 
        const fallbackNews = await news.ada("general");
        if (fallbackNews && Array.isArray(fallbackNews.result)) results = fallbackNews.result;
      } catch (_) {}
    }

    if (!results || results.length === 0) {
      return reply("❌ Sorry, no news found at the moment for that category.");
    }

    // Limit top 5
    const topNews = results.slice(0, 5);

    // Build message
    let message = `📰 *Latest Sinhala News* — category: _${category}_\n\n`;
    topNews.forEach((item, i) => {
      const title = item.title || item.heading || "Untitled";
      const desc = item.desc || item.summary || item.description || "";
      const url = item.url || item.link || item.article_url || "";
      message += `*${i + 1}. ${escapeMarkdown(title)}*\n`;
      if (desc) message += `${escapeMarkdown(truncate(desc, 300))}\n`;
      if (url) message += `🔗 Read more: ${url}\n`;
      message += `\n`;
    });

    // Newsletter forwarding
    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363401225837204@newsletter",
        newsletterName: "NENO XMD",
        serverMessageId: 220
      }
    };

    // Send message
    await malvin.sendMessage(from, { text: message, contextInfo }, { quoted: mek });

    // Send image if first article has one
    const first = topNews[0];
    if (first) {
      const imageUrl = first.image || first.image_url || first.thumbnail || first.img || first.photo || null;
      if (imageUrl) {
        try {
          const caption = `📰 ${first.title || first.heading || "Top story"}`;
          await malvin.sendMessage(
            from,
            { image: { url: imageUrl }, caption, contextInfo },
            { quoted: mek }
          );
        } catch (_) { console.warn("⚠️ Could not send article image"); }
      }
    }

  } catch (e) {
    console.error("❌ Error in .news command:", e);
    await reply(`⚠️ Error fetching news: ${e && e.message ? e.message : e}`);
  }
});

// Helpers
function truncate(str, n) {
  if (!str) return "";
  return (str.length > n) ? str.slice(0, n - 1) + "…" : str;
}

function escapeMarkdown(text = "") {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/\|/g, "\\|");
}
