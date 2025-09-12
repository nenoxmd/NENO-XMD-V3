const fs = require('fs');
const { lite } = require('../lite');

lite({
    pattern: "status",
    desc: "Download quoted image, video, audio, or text from WhatsApp status/message.",
    react: "📥",
    category: "main",
    filename: __filename,
    fromMe: false
}, async (conn, mek, m, { from, body, reply }) => {
    try {
        if (!m.quoted || !mek || !mek.message || !body) return;

        const data = JSON.stringify(mek.message, null, 2);
        const jsonData = JSON.parse(data);
        const isStatus = jsonData?.extendedTextMessage?.contextInfo?.remoteJid;

        if (!isStatus) return;

        let bdy = body.toLowerCase();
        const keywords = ["දියම්","දෙන්න","දාන්න","එවන්න","ඕන","ඕනා","එවපන්","දාපන්","එව්පන්","send","give","ewpn","ewapan","ewanna","danna","dpn","dapan","ona","daham","diym","dhm","save","status","ඕනි","ඕනී","ewm","ewnn"];
        const kk = keywords.map(word => word.toLowerCase());

        if (!kk.includes(bdy)) return;

        const caption = `> ɴᴇɴᴏ xᴍᴅ ᴘᴏᴡᴇʀꜰᴜʟʟ ᴡʜᴀᴛꜱᴘᴘ ʙᴏᴛ`;

        if (m.quoted.type === 'imageMessage') {
            const buff = await m.quoted.download();
            await conn.sendMessage(from, {
                image: buff,
                caption
            }, { quoted: mek });

        } else if (m.quoted.type === 'videoMessage') {
            const buff = await m.quoted.download();
            await conn.sendMessage(from, {
                video: buff,
                mimetype: "video/mp4",
                fileName: `${m.id}.mp4`,
                caption
            }, { quoted: mek });

        } else if (m.quoted.type === 'audioMessage') {
            const buff = await m.quoted.download();
            await conn.sendMessage(from, {
                audio: buff,
                mimetype: "audio/mp3",
                ptt: true
            }, { quoted: mek });

        } else if (m.quoted.type === 'extendedTextMessage') {
            await conn.sendMessage(from, { text: m.quoted.msg.text }, { quoted: mek });
        }

    } catch (error) {
        console.error("Status Downloader Error:", error);
        reply("❌ Failed to download the quoted status. Please try again.");
    }
});
