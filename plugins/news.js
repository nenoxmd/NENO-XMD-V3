const { lite } = require("../lite");
const DYXT_NEWS = require("@dark-yasiya/news-scrap");
const news = new DYXT_NEWS();

lite({
  pattern: "news",
  react: "📰",
  desc: "Get latest Sinhala news from Ada.lk",
  category: "main",
  filename: __filename,
  fromMe: false
},
async (conn, mek, m, { reply, args, from, sender }) => {
  try {
    // Category argument (default to general)
    const category = (args && args.length) ? args[0].toString().trim().toLowerCase() : "general";

    // Fetch news
    let adaNews;
    try {
      adaNews = await news.ada(category);
    } catch (err) {
      console.error("❌ news.ada() threw:", err);
      return reply("⚠️ Failed to fetch news from ada.lk. Please try again later.");
    }

    const results =
      (adaNews && Array.isArray(adaNews.result) && adaNews.result) ||
      (adaNews && Array.isArray(adaNews.data) && adaNews.data) ||
      (adaNews && Array.isArray(adaNews.articles) && adaNews.articles) ||
      [];

    if (!results || results.length === 0) {
      return reply("❌ Sorry, no news found at the moment for that category.");
    }

    const topNews = results.slice(0, 5);

    let message = `📰 *Latest Sinhala News* — category: _${category}_\n\n`;
    topNews.forEach((item, i) => {
      const title = item.title || item.heading || "Untitled";
      const desc = item.desc || item.summary || item.description || "";
      const url = item.url || item.link || item.article_url || "";
      message += `*${i + 1}. ${escapeMarkdown(title)}*\n`;
      if (desc) message += `${escapeMarkdown(truncate(desc, 300))}\n`;
      if (url) message += `🔗 Read more: ${url}\n\n`;
    });

    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363401225837204@newsletter",
        newsletterName: "NENO XMD",
        serverMessageId: 220
      },
      mentionedJid: [sender]
    };

    await conn.sendMessage(from, { text: message, contextInfo }, { quoted: mek });

    // Send first article image if exists
    const first = topNews[0];
    if (first) {
      const imageUrl = first.image || first.image_url || first.thumbnail || first.img || first.photo || null;
      if (imageUrl) {
        try {
          const caption = `📰 ${first.title || first.heading || "Top story"}`;
          await conn.sendMessage(from, { image: { url: imageUrl }, caption, contextInfo }, { quoted: mek });
        } catch (imgErr) {
          console.warn("⚠️ Could not send article image:", imgErr);
        }
      }
    }

  } catch (e) {
    console.error("❌ Error in .news command:", e);
    await reply(`⚠️ Error fetching news: ${e && e.message ? e.message : e}`);
  }
});

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
