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
    // Show typing presence (ignore errors from presence update)
    try { await malvin.sendPresenceUpdate("composing", from); } catch (_) {}

    // Category argument (default to general)
    const category = (args && args.length) ? args[0].toString().trim().toLowerCase() : "general";

    // Fetch news and guard for errors from provider
    let adaNews;
    try {
      adaNews = await news.ada(category);
    } catch (err) {
      console.error("❌ news.ada() threw:", err);
      return reply("⚠️ Failed to fetch news from ada.lk. Please try again later.");
    }

    // Normalize result shape (the library might return different shapes)
    const results =
      (adaNews && Array.isArray(adaNews.result) && adaNews.result) ||
      (adaNews && Array.isArray(adaNews.data) && adaNews.data) ||
      (adaNews && Array.isArray(adaNews.articles) && adaNews.articles) ||
      [];

    if (!results || results.length === 0) {
      console.log("ℹ️ Ada returned no articles for category:", category, "raw:", adaNews);
      return reply("❌ Sorry, no news found at the moment for that category.");
    }

    // Limit to top 5
    const topNews = results.slice(0, 5);

    // Build message text safely
    let message = `📰 *Latest Sinhala News* — category: _${category}_\n\n`;
    topNews.forEach((item, i) => {
      // adapt to multiple property names which the library might use
      const title = item.title || item.heading || "Untitled";
      const desc = item.desc || item.summary || item.description || "";
      const url = item.url || item.link || item.article_url || "";
      message += `*${i + 1}. ${escapeMarkdown(title)}*\n`;
      if (desc) message += `${escapeMarkdown(truncate(desc, 300))}\n`;
      if (url) message += `🔗 Read more: ${url}\n`;
      message += `\n`;
    });

    // contextInfo for newsletter-like forwarding (keeps forward header)
    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363401225837204@newsletter",
        newsletterName: "NENO XMD",
        serverMessageId: 220
      }
    };

    // Send the text message (quoted to the command message)
    await malvin.sendMessage(from, { text: message, contextInfo }, { quoted: mek });

    // Try to send an image for the first article if available
    const first = topNews[0];
    if (first) {
      // common image field names
      const imageUrl = first.image || first.image_url || first.thumbnail || first.img || first.photo || null;
      if (imageUrl) {
        try {
          const caption = `📰 ${first.title || first.heading || "Top story"}`;
          await malvin.sendMessage(
            from,
            {
              image: { url: imageUrl },
              caption,
              contextInfo
            },
            { quoted: mek }
          );
        } catch (imgErr) {
          // image sending failed (remote restricted, etc.) — just log and continue
          console.warn("⚠️ Could not send article image:", imgErr);
        }
      }
    }

  } catch (e) {
    // Final fallback catch — log full stack and send user-friendly reply
    console.error("❌ Error in .news command:", e);
    // Include minimal error message to user so they can debug if needed
    await reply(`⚠️ Error fetching news: ${e && e.message ? e.message : e}`);
  }
});

/**
 * Helpers
 */
function truncate(str, n) {
  if (!str) return "";
  return (str.length > n) ? str.slice(0, n - 1) + "…" : str;
}

// escape markdown special chars to avoid malformed messages
function escapeMarkdown(text = "") {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/\|/g, "\\|");
}
