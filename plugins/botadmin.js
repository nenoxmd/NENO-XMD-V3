// plugins/owner.js
const { lite } = require('../lite');

lite({
    pattern: 'adminhelp',
    react: '✅',
    desc: 'Get owner number',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const ownerNumber = '94721584279';
        const ownerName = 'NENO XMD OWNER';

        // vCard for contact
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${ownerName}\n` +  
                      `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` + 
                      'END:VCARD';

        // send vCard
        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        });

        // stylized message with image + newsletter style
        await conn.sendMessage(from, {
            image: { url: 'https://ik.imagekit.io/apexcloud/Designer%20(18).jpeg' },
            caption: `
╭━━ *ɴᴇɴᴏ xᴍᴅ ᴠ3* ━━━
┃  *Name* : ${ownerName}
┃  *Number* : ${ownerNumber}
┃  *Bot* : ɴᴇɴᴏ xᴍᴅ
┃  *Version* : ᴠ3
╰━━━━━━━━━━━━━━━━━━━━━━━╯
*⚡️ Keep rockin' Andromeda*
            `.trim(),
            contextInfo: {
                mentionedJid: [`${ownerNumber}@s.whatsapp.net`],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401225837204@newsletter',
                    newsletterName: 'ɴᴇɴᴏ xᴍᴅ',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error('Owner Command Error:', error);
        reply(`❌ An error occurred: ${error.message}`);
    }
});
