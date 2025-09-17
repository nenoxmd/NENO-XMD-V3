// plugins/autovoice-lite-no-presence.js
const fs = require('fs');
const path = require('path');
const { lite } = require('../lite');

let fetchFn;
try {
  fetchFn = require('node-fetch'); // prefer node-fetch if installed
} catch (e) {
  if (typeof fetch !== 'undefined') fetchFn = fetch; // Node 18+ global fetch
  else throw new Error('Please install node-fetch or use Node >= 18 (global fetch).');
}

function guessMimeFromUrl(url) {
  const u = url.split('?')[0].toLowerCase();
  if (u.endsWith('.opus')) return 'audio/ogg; codecs=opus';
  if (u.endsWith('.ogg')) return 'audio/ogg';
  if (u.endsWith('.wav')) return 'audio/wav';
  if (u.endsWith('.mp3')) return 'audio/mpeg';
  if (u.endsWith('.m4a')) return 'audio/mp4';
  if (u.endsWith('.webm')) return 'audio/webm';
  return null;
}

lite({
  on: "body"
},
async (conn, mek, m, { from, body }) => {
  try {
    const filePath = path.join(__dirname, '../my_data/autovoice.json');
    if (!fs.existsSync(filePath)) return; // no autovoice file

    let data;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
    } catch (e) {
      console.error("AutoVoice: invalid JSON in autovoice.json", e);
      return;
    }

    const textIn = (body || '').toString().trim().toLowerCase();
    if (!textIn) return;

    const key = Object.keys(data).find(k => (k || '').toLowerCase() === textIn);
    if (!key) return;

    const url = data[key];
    if (!url || typeof url !== 'string') return;

    // --- NO presence update here (user requested) ---

    // Get content-type via HEAD or small GET
    let contentType = null;
    try {
      const headRes = await fetchFn(url, { method: 'HEAD' });
      if (headRes && headRes.ok) contentType = headRes.headers.get('content-type') || null;
    } catch (e) {
      contentType = null;
    }

    if (!contentType) {
      try {
        const getRes = await fetchFn(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
        if (getRes && getRes.ok) contentType = getRes.headers.get('content-type') || null;
      } catch (e) {
        contentType = null;
      }
    }

    if (!contentType) {
      const guessed = guessMimeFromUrl(url);
      if (guessed) contentType = guessed;
    }

    if (!contentType || !contentType.includes('audio')) {
      return await conn.sendMessage(from, {
        text:
`❌ The target URL for "${key}" doesn't look like a direct audio file.
Detected content-type: ${contentType || 'unknown'}.

➡️ Use a direct audio file URL (raw). Recommended: .opus / .ogg (OPUS) for best voice-note (PTT) support.
If your file is hosted on Drive/preview pages, provide a direct download link.`
      }, { quoted: mek });
    }

    let sendMime = contentType.split(';')[0].trim();
    let sendAsPtt = false;

    if (sendMime === 'audio/ogg' || sendMime === 'audio/webm') {
      if ((contentType.toLowerCase().includes('opus')) || url.toLowerCase().endsWith('.opus')) {
        sendMime = 'audio/ogg; codecs=opus';
        sendAsPtt = true;
      }
    }
    if (contentType.toLowerCase().includes('audio/opus') || contentType.toLowerCase().includes('codecs=opus')) {
      sendMime = 'audio/ogg; codecs=opus';
      sendAsPtt = true;
    }
    if (sendMime === 'audio/mpeg') sendAsPtt = false;

    try {
      await conn.sendMessage(from, {
        audio: { url },
        mimetype: sendMime,
        ptt: sendAsPtt
      }, { quoted: mek });
    } catch (sendErr) {
      console.error("AutoVoice: sendMessage error:", sendErr);
      await conn.sendMessage(from, {
        text:
`❌ Failed to send audio for "${key}".
This often means the remote host blocks direct download or it's not a supported stream.
Recommendations:
• Host the file as a direct .opus/.ogg file (raw URL), e.g., catbox.moe.
• Avoid preview links (Google Drive preview); use raw/download links.
• If you only have .mp3, it may still send but not as a voice-note (PTT).`
      }, { quoted: mek });
    }

  } catch (e) {
    console.error("AutoVoice unexpected error:", e);
  }
});
