const fs = require('fs');
const path = require('path');
const { lite } = require('../lite');
const config = require('../settings');

lite({
    pattern: "getdp",
    desc: "Fetch and send another person's WhatsApp profile picture.",
    react: "👀",
    category: "main",
    filename: __filename,
    fromMe: false
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendPresenceUpdate("recording", from);

        // Determine target JID
        let targetJid;
        if (m.quoted) {
            targetJid = m.quoted.sender;
        } else if (from.endsWith("@g.us")) {
            const participants = m.message?.key?.participant ? [m.message.key.participant] : [];
            targetJid = participants.find(jid => jid !== conn.user.id) || from;
        } else {
            targetJid = from;
        }

        // Fetch DP URL
        let dpUrl;
        try {
            dpUrl = await conn.profilePictureUrl(targetJid, "image");
            if (!dpUrl) throw new Error("No DP found");
        } catch {
            return reply("❌ This user has no profile picture!");
        }

        // Context info (optional, similar to repo command)
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363401225837204@newsletter',
                newsletterName: 'neno xmd',
                serverMessageId: 143
            }
        };

        // Send DP image
        await conn.sendMessage(from, {
            image: { url: dpUrl },
            caption: `👀 Here’s their DP! 🌸✨\nStay cute and sparkling 🩵💖`,
            contextInfo
        }, { quoted: mek });

    } catch (error) {
        console.error("GetDP Command Error:", error);
        reply("❌ Could not fetch the DP!");
    }
});
