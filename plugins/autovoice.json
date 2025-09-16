const fs = require('fs');
const path = require('path');
const { lite } = require('../lite');

// Auto Voice (always active, no config check)
lite({
  on: "body"
},
async (conn, mek, m, { from, body }) => {
  try {
    const filePath = path.join(__dirname, '../my_data/autovoice.json');
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
      if (body.toLowerCase() === text.toLowerCase()) {
        await conn.sendPresenceUpdate('recording', from);
        await conn.sendMessage(
          from,
          { audio: { url: data[text] }, mimetype: 'audio/mpeg', ptt: true },
          { quoted: mek }
        );
        break; // first match only
      }
    }
  } catch (e) {
    console.error("Auto Voice Error:", e);
  }
});
