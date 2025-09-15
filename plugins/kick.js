// plugins/remove.js
const { lite } = require('../lite');

lite({
    pattern: "remove",
    alias: ["kick", "k"],
    desc: "Removes a member from the group",
    category: "group",
    react: "🤡",
    filename: __filename
},
async (conn, mek, m, { from, q, isGroup, isBotAdmins, isOwner, reply }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isOwner) return reply("❌ Only the bot owner can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (mek.quoted) {
        number = mek.quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or mention a user to remove.");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "remove");
        await reply(`✅ Successfully removed @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Remove command error:", error);
        reply("❌ Failed to remove the member.");
    }
});
