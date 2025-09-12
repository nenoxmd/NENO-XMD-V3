const { lite } = require("../lite");

// Commands categories
const ownerCmd = ["ʀᴄʜ","sᴇᴛᴍᴇɴᴜ","ᴄʀᴇᴀᴛᴇᴡᴇʙ","ʟɪsᴛᴡᴇʙ","ᴅᴇʟᴡᴇʙ","ᴜᴘɢɪᴛʜᴜʙ","ᴀᴜᴛᴏʀᴇᴀᴅ","ʟɪsᴛɢᴄ","ᴍᴜᴛᴇ","ᴄʟᴇᴀʀᴛᴇᴍᴘ","sᴇɴᴅᴄᴀsᴇ","ɢᴇᴛᴄᴀsᴇ","ʙʟᴏᴄᴋ","ᴜɴʙʟᴏᴄᴋ","ʟɪsᴛʙʟᴏᴄᴋ","ᴛᴏᴛᴀʟᴜsᴇʀ","ʀᴇsᴛᴀʀᴛ","sᴇᴛᴘᴘ","ɪᴅɢᴄ","sᴇʟғ","ᴘᴜʙʟɪᴄ"];
const userCmd = ["ʜᴛᴍʟ","ᴛᴏᴛᴀʟᴄᴀsᴇ","ᴛᴏᴛᴀʟᴜsᴇʀ","ᴄʟᴇᴀʀᴛʀᴍᴘ","ᴘɪɴɢ","ᴍᴇɴғᴇs","ᴋᴀʟᴋᴜʟᴀᴛᴏʀ","ᴛᴏɪᴍɢ","ᴛᴏᴜʀʟ","ᴛᴏᴍᴘ3","ɪᴅᴄʜ","ᴏʙғᴜs","ᴄᴏᴜᴘʟᴇ","ɢᴇᴛ","ᴛʀ","ʀᴠᴏ"];
const groupCmd = ["ᴡᴇʟᴄᴏᴍᴇ","ɢᴄ","ʜɪᴅᴇᴛᴀɢ","sᴇᴛᴘᴘ ɢᴄ","ᴀɴᴛɪʟɪɴᴋɢᴄ","ɢᴇᴛᴘᴘ","ᴋɪᴄᴋ","ᴀᴅᴅ"];
const dlCmd = ["ᴛɪᴋᴛᴏᴋ","ɪɢ"];
const aiCmd = ["ᴄᴀɪ","ʀᴇᴍɪɴɪ","ʀᴇᴍᴏᴠᴇʙɢ","ᴀɪ"];
const searchCmd = ["ᴘɪɴᴛᴇʀᴇsᴛ","ʏᴛs","ᴘʟᴀʏ","ᴘʟᴀʏ-ᴀɴɪᴍᴇ","ᴜsɴ","ʟɪʀɪᴋ"];
const stickCmd = ["ᴇᴍᴏᴊɪᴍɪx","ʙʀᴀᴛᴠɪᴅᴇᴏ","sᴛɪᴄᴋᴇʀ","ʙʀᴀᴛ","ǫᴄ"];
const gameCmd = ["ɢᴜᴇss sᴏɴɢ","ɢᴜᴇss ᴡᴏʀᴅ","ɢᴜᴇss ɪᴍᴀɢᴇ"];

const generateMenu = () => `
╭─❏ *🍀 USER MENU*
│ ${userCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *👥 GROUP MENU*
│ ${groupCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *👑 OWNER MENU*
│ ${ownerCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *📥 DOWNLOAD MENU*
│ ${dlCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *🤖 ASSISTANT MENU*
│ ${aiCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *🔎 SEARCH MENU*
│ ${searchCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *🖼️ STICKER MENU*
│ ${stickCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
├────────────────────

╭─❏ *🎮 GAME MENU*
│ ${gameCmd.sort().map(v => `├› ${v}`).join('\n│ ')}
╰────────────────────
`;

lite({
    pattern: "menu2",
    desc: "Show bot menu",
    category: "main",
    react: "🍀",
    filename: __filename
}, async (conn, mek, m, { command }) => {
    try {
        const buttons = [
            { buttonId: "help", buttonText: { displayText: "Help" }, type: 1 },
            { buttonId: "alive", buttonText: { displayText: "Bot Status" }, type: 1 },
            { buttonId: "ginfo", buttonText: { displayText: "Group Info" }, type: 1 }
        ];

        await conn.sendMessage(
            m.chat,
            {
                image: { url: "https://files.catbox.moe/nr64ob.jpg" }, // menu image
                caption: generateMenu(),
                footer: "Boten+ Menu by Nimeshka",
                buttons,
                headerType: 4, // 4 = image + buttons
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363401225837204@newsletter",
                        newsletterName: "NENO XMD",
                        serverMessageId: 151
                    }
                }
            },
            { quoted: mek }
        );
    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { text: "❌ Error showing menu" });
    }
});
