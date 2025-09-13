const axios = require("axios");
const { lite } = require("../lite");

// 📨 Generate Temp Mail
lite({
  pattern: "tempmail",
  alias: ["genmail"],
  react: "📧",
  desc: "Generate a new temporary email address",
  category: "other",
  filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const res = await axios.get("https://apis.davidcyriltech.my.id/temp-mail");
    const { email, session_id, expires_at } = res.data;

    const expiresDate = new Date(expires_at);
    const timeString = expiresDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dateString = expiresDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const msg = `
📧 *TEMPORARY EMAIL GENERATED*

✉️ *Email Address:*  
${email}

⏳ *Expires:*  
${timeString} • ${dateString}

🔑 *Session ID:*  
\`\`\`${session_id}\`\`\`

📥 *Check Inbox:*  
.inbox ${session_id}

_Email will expire after 24 hours_
`;

    await conn.sendMessage(
      from,
      {
        text: msg,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363301882959206@newsletter",
            newsletterName: "NENO XMD",
            serverMessageId: 101,
          },
        },
      },
      { quoted: mek }
    );
  } catch (e) {
    console.error("TempMail error:", e);
    reply(`❌ Error: ${e.message}`);
  }
});

// 📬 Check Inbox
lite({
  pattern: "checkmail",
  alias: ["inbox", "tmail", "mailinbox"],
  react: "📬",
  desc: "Check your temporary email inbox",
  category: "utility",
  filename: __filename,
}, async (conn, mek, m, { reply, args }) => {
  try {
    const sessionId = args[0];
    if (!sessionId) {
      return reply("🔑 Please provide your session ID\nExample: .checkmail YOUR_SESSION_ID");
    }

    const url = `https://apis.davidcyriltech.my.id/temp-mail/inbox?id=${encodeURIComponent(sessionId)}`;
    const res = await axios.get(url);

    if (!res.data.success) {
      return reply("❌ Invalid session ID or expired email");
    }

    const { inbox_count, messages } = res.data;

    if (inbox_count === 0) {
      return reply("📭 Your inbox is empty");
    }

    let out = `📬 *You have ${inbox_count} message(s)*\n\n`;
    messages.forEach((msg, i) => {
      out += `━━━━━━━━━━━━━━━━━━\n` +
             `📌 *Message ${i + 1}*\n` +
             `👤 *From:* ${msg.from}\n` +
             `📝 *Subject:* ${msg.subject}\n` +
             `⏰ *Date:* ${new Date(msg.date).toLocaleString()}\n\n` +
             `📄 *Content:*\n${msg.body}\n\n`;
    });

    await reply(out);
  } catch (e) {
    console.error("CheckMail error:", e);
    reply(`❌ Error checking inbox: ${e.response?.data?.message || e.message}`);
  }
});
