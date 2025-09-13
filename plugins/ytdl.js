// plugins/video_song_choice.js
const { lite } = require('../lite');
const config = require('../settings');
const { exec } = require('child_process');
const { PassThrough } = require('stream');

function convertShortsToWatch(url) {
  if (url.includes("youtube.com/shorts/")) {
    const id = url.split("/shorts/")[1].split("?")[0];
    return `https://youtube.com/watch?v=${id}`;
  }
  return url;
}

lite({
  pattern: "video",
  alias: ["vid", "ytv", "song"],
  react: "🎬",
  desc: "Show YT info then let user choose 1=mp3 or 2=mp4",
  category: "download",
  use: ".video <YT URL>",
  filename: __filename,
  fromMe: false
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return await reply("❌ Please provide a YouTube URL!");
    const videoUrl = convertShortsToWatch(q);

    // fetch info JSON from yt-dlp
    const info = await new Promise((resolve, reject) => {
      exec(`yt-dlp -j "${videoUrl}"`, (err, stdout, stderr) => {
        if (err) return reject(err);
        try { resolve(JSON.parse(stdout)); }
        catch(e){ reject(e); }
      });
    });

    const title = info.title || "Unknown";
    const thumbnail = info.thumbnail || "";
    const duration = new Date((info.duration || 0)*1000).toISOString().substr(11,8);
    const views = info.view_count || "Unknown";
    const uploader = info.uploader || "Unknown";
    const uploadDate = info.upload_date || "Unknown";

    const infoMsg = [
      `🍄 *VIDEO DOWNLOADER* 🍄`,
      ``,
      `🎬 *Title:* ${title}`,
      `⏳ *Duration:* ${duration}`,
      `👀 *Views:* ${views}`,
      `👤 *Uploader:* ${uploader}`,
      `🌏 *Upload Date:* ${uploadDate}`,
      `🔗 *Url:* ${videoUrl}`,
      ``,
      `🔽 *Reply with your choice:*`,
      `> 1 — Audio (mp3) 🎵`,
      `> 2 — Video (mp4) 🎬`,
      ``,
      `${config.FOOTER || "ɴᴇɴᴏ-xᴍᴅ"}`
    ].join("\n");

    const sent = await conn.sendMessage(from, { image: { url: thumbnail }, caption: infoMsg }, { quoted: mek });
    const messageID = sent.key.id;
    const originalSender = m.sender;

    let timeoutHandle;

    const handler = async (update) => {
      try {
        const upMsg = update?.messages?.[0];
        if (!upMsg || !upMsg.message) return;
        const incomingSender = upMsg.key.participant || upMsg.key.remoteJid;
        if (!incomingSender || incomingSender !== originalSender) return;
        const context = upMsg.message.extendedTextMessage?.contextInfo;
        const isReply = context && context.stanzaId === messageID;
        if (!isReply) return;

        const text = upMsg.message.conversation || upMsg.message.extendedTextMessage?.text || "";
        const choice = text.trim();
        conn.ev.off('messages.upsert', handler);
        clearTimeout(timeoutHandle);

        if(choice === "1"){
          await conn.sendMessage(from, { text: "⏳ Processing audio (mp3)..." }, { quoted: mek });
          const stream = new PassThrough();
          exec(`yt-dlp -f bestaudio -o - "${videoUrl}"`, { encoding: 'buffer', maxBuffer: 1024*1024*500 }, (err, stdout, stderr) => {
            if(err) return reply("❌ Failed to download audio.");
            stream.end(stdout);
            conn.sendMessage(from, { audio: stream, mimetype: "audio/mpeg", fileName: `${title}.mp3` }, { quoted: mek });
          });
        } else if(choice === "2"){
          await conn.sendMessage(from, { text: "⏳ Processing video (mp4)..." }, { quoted: mek });
          const stream = new PassThrough();
          exec(`yt-dlp -f best -o - "${videoUrl}"`, { encoding: 'buffer', maxBuffer: 1024*1024*500 }, (err, stdout, stderr) => {
            if(err) return reply("❌ Failed to download video.");
            stream.end(stdout);
            conn.sendMessage(from, { video: stream, mimetype: "video/mp4", caption: title, fileName: `${title}.mp4` }, { quoted: mek });
          });
        } else {
          await reply("❌ Invalid choice. Reply with *1* for mp3 or *2* for mp4.");
        }

      } catch(e){
        console.error("Listener error:", e);
        conn.ev.off('messages.upsert', handler);
        clearTimeout(timeoutHandle);
        try{ await reply(`❌ Processing error: ${e.message||e}`); } catch(_){}
      }
    };

    conn.ev.on('messages.upsert', handler);

    timeoutHandle = setTimeout(async()=>{
      conn.ev.off('messages.upsert', handler);
      await conn.sendMessage(from, { text: '⏳ Timeout — no reply received. Run the command again if needed.' }, { quoted: mek });
    },60000);

  }catch(err){
    console.error("Video command error:", err);
    await reply(`❌ An error occurred: ${err?.message||err}`);
  }
});
