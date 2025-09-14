const { lite } = require("../lite");

lite({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    react: "⬇️",
    desc: "Demotes a group admin to a normal member",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, q, quoted, reply, isGroup, isAdmins, isBotAdmins, botNumber, sender }) => {

    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or provide a number to demote.");
    }

    if (number === botNumber) return reply("❌ The bot cannot demote itself.");

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "demote");

        const text = `✅ Successfully demoted @${number} from admin.`;
        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [jid],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363401225837204@newsletter",
                    newsletterName: "NENO XMD",
                    serverMessageId: 110
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Demote command error:", e);
        reply("❌ Failed to demote the member.");
    }

});
