const { lite } = require("../lite");
const { getRandom } = require('../lib/functions');
const fs = require('fs');

cmd(
{
  on: "body"
},
async (malvin, mek, m, { from, body }) => {
  if (!m.quoted || !mek || !mek.message || !body) return;

  const data = JSON.stringify(mek.message, null, 2);
  const jsonData = JSON.parse(data);
  const isStatus = jsonData?.extendedTextMessage?.contextInfo?.remoteJid;

  if (!isStatus) return;

  let bdy = body.toLowerCase();
  let keywords = ["දියම්", "දෙන්න", "දාන්න", "එවන්න", "ඕන", "ඕනා", "එවපන්", "දාපන්", "එව්පන්", "send", "give", "ewpn", "ewapan", "ewanna", "danna", "dpn", "dapan", "ona", "daham", "diym", "dhm", "save", "status", "ඕනි", "ඕනී", "ewm", "ewnn"];
  let kk = keywords.map(word => word.toLowerCase());

  if (kk.includes(bdy)) {
    const caption = `> NENO XMD WHATSAPP BOT`;

    if (m.quoted.type === 'imageMessage') {
      let buff = await m.quoted.download();
      return await malvin.sendMessage(from, {
        image: buff,
        caption
      });

    } else if (m.quoted.type === 'videoMessage') {
      let buff = await m.quoted.download();
      return await malvin.sendMessage(from, {
        video: buff,
        mimetype: "video/mp4",
        fileName: `${m.id}.mp4`,
        caption
      }, { quoted: mek });

    } else if (m.quoted.type === 'audioMessage') {
      let buff = await m.quoted.download();
      return await malvin.sendMessage(from, {
        audio: buff,
        mimetype: "audio/mp3",
        ptt: true
      }, { quoted: mek });

    } else if (m.quoted.type === 'extendedTextMessage') {
      await malvin.sendMessage(from, { text: m.quoted.msg.text });
    }
  }
})
