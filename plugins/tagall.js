const { lite } = require("../lite");

lite({
    pattern: "tagall",
    alias: ["gc_tagall"],
    react: "🔊",
    desc: "Tag all members in the group",
    category: "group",
    use: ".tagall [message]",
    filename: __filename
},
async (conn, mek, m, { from, participants, isGroup, senderNumber, groupAdmins, command, body, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const botOwner = conn.user.id.split(":")[0];
        const senderJid = senderNumber + "@s.whatsapp.net";

        if (!groupAdmins.includes(senderJid) && senderNumber !== botOwner) {
            return reply("❌ Only group admins or the bot owner can use this command.");
        }

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ Failed to fetch group information.");

        const groupName = groupInfo.subject || "Unknown Group";
        const totalMembers = participants.length || 0;

        const emojis = ['📢','🔊','🌐','🔰','❤‍🩹','🤍','🖤','🩵','📝','💗','🔖','🪩','📦','🎉','🛡️','💸','⏳','🗿','🚀','❄️','👨‍💻','⚠️','🔥'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let teks = `▢ Group : *${groupName}*\n▢ Members : *${totalMembers}*\n▢ Message: *${message}*\n\n┌───⊷ *ATTENTION*\n`;
        for (let mem of participants) {
            if (!mem.id) continue;
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }
        teks += "ɴᴇɴᴏ xᴍᴅ";

        await conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ Error occurred: ${e.message || e}`);
    }
});
