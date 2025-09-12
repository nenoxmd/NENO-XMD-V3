const { cmd } = require("../command");

cmd(
  {
    pattern: "id",
    alias: ["jid", "chatid"],
    react: "🆔",
    desc: "Get the WhatsApp ID (jid) of a group or channel",
    category: "utils",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      // If user gave a link (channel / group)
      if (q && q.includes("whatsapp.com")) {
        // Example links:
        // https://whatsapp.com/channel/0029VaWwQeLLoQf5t7z...
        // https://chat.whatsapp.com/xxxx
        let id;

        if (q.includes("/channel/")) {
          // Extract channel ID
          const match = q.match(/channel\/([0-9A-Za-z]+)/);
          if (match) {
            id = `${parseInt(match[1], 36)}@newsletter`;
          }
        } else if (q.includes("/chat.whatsapp.com/")) {
          // Group links need WA API resolve — here just return the invite code
          const match = q.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/);
          if (match) {
            id = `InviteCode: ${match[1]}`;
          }
        }

        if (!id) return reply("❌ Could not extract ID from link.");

        return reply(`🆔 Extracted ID:\n\n\`\`\`${id}\`\`\``);
      }

      // If no link given → just return current chat id
      return reply(`🆔 This chat ID:\n\n\`\`\`${from}\`\`\``);

    } catch (e) {
      console.error("ID Plugin Error:", e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
