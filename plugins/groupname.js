const { lite } = require('../lite');
const { isUrl, getRandom, sleep } = require('../lib/functions');

lite({
    pattern: "updategname",
    alias: ["upgname", "gname"],
    react: "📝",
    desc: "Change the group name.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, args, q, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to update the group name.");
        if (!q) return reply("❌ Please provide a new group name.");

        await conn.groupUpdateSubject(from, q);

        // Optional: random reaction after changing the name
        const reactions = ["✅", "🎉", "📝", "✨"];
        const react = getRandom(reactions);
        await conn.sendMessage(from, { text: `${react} Group name has been updated to: *${q}*` }, { quoted: mek });

    } catch (e) {
        console.error("Error updating group name:", e);
        reply("❌ Failed to update the group name. Please try again.");
    }
});
