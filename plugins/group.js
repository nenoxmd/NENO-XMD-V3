// plugins/group_commands.js
const { lite } = require("../lite");

// 🔑 Check if sender can use command (bot number or admin)
function canUseCommand(m, malvin, isAdmins) {
    const botNumber = malvin.user?.id?.split(":")[0] || "";
    const sender = m.sender || "";
    return sender.includes(botNumber) || isAdmins;
}

// 🛑 BLOCK
lite({
    pattern: "block",
    react: "🚫",
    alias: ["banuser"],
    desc: "Block a user instantly.",
    category: "main",
    filename: __filename
}, async (malvin, mek, m, { reply }) => {
    try {
        if (!canUseCommand(m, malvin, false)) return reply("⚠️ Only bot or admins can use this command!");
        if (!m.quoted) return reply("⚠️ Reply to the user you want to block!");

        const target = m.quoted.sender;
        await malvin.updateBlockStatus(target, "block");
        return reply(`✅ Blocked: @${target.split('@')[0]}`);
    } catch (e) {
        console.error("Block Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
