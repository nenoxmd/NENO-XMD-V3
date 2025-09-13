// plugins/video_song_choice.js
const { lite } = require('../lite');
const config = require('../settings');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

lite({
  pattern: "video",
  alias: ["vid", "ytv", "song"],
  react: "🎬",
  desc: "Show YT info then let user choose 1=mp3 or 2=mp4",
  category: "download",
  use: ".video <YT URL or Query>",
  filename: __filename,
  fromMe: false
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return await reply("❌ Please provide a YouTube URL!");

    if (!ytdl.validateURL(q)) return await reply("❌ Invalid YouTube URL!");

    const info = await ytdl.getInfo(q);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
    const duration = new Date(info.videoDetails.lengthSeconds * 1000).toISOString().substr(11, 8);
    const views = info.videoDetails.viewCount;
    const author = info.videoDetails.author.name;
    const uploaded = info.videoDetails.uploadDate;

    const infoMsg = [
      `🍄 *VIDEO DOWNLOADER* 🍄`,
      ``,
      `🎬 *Title:* ${title}`,
      `⏳ *Duration:* ${duration}`,
      `👀 *Views:* ${views}`,
      `🌏 *Uploaded:* ${uploaded}`,
      `👤 *Author:* ${author}`,
      `🔗 *Url:* ${q}`,
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

        // Temp file paths
        const tmpDir = os.tmpdir();
        const baseName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const audioPath = path.join(tmpDir, `${baseName}.mp3`);
        const videoPath = path.join(tmpDir, `${baseName}.mp4`);

        if (choice === "1") {
          await conn.sendMessage(from, { text: "⏳ Processing audio (mp3)..." }, { quoted: mek });
          const stream = ytdl(q, { filter: 'audioonly', quality: 'highestaudio' });
          const writeStream = fs.createWriteStream(audioPath);
          stream.pipe(writeStream);

          writeStream.on('finish', async () => {
            const stats = fs.statSync(audioPath);
            await conn.sendMessage(from, { audio: { url: audioPath }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: mek });
            await conn.sendMessage(from, { text: `✅ Audio sent (${formatBytes(stats.size)})` }, { quoted: mek });
            fs.unlinkSync(audioPath);
          });
        } else if (choice === "2") {
          await conn.sendMessage(from, { text: "⏳ Processing video (mp4)..." }, { quoted: mek });
          const stream = ytdl(q, { quality: 'highestvideo' });
          const writeStream = fs.createWriteStream(videoPath);
          stream.pipe(writeStream);

          writeStream.on('finish', async () => {
            const stats = fs.statSync(videoPath);
            await conn.sendMessage(from, { video: { url: videoPath }, mimetype: 'video/mp4', caption: title, fileName: `${title}.mp4` }, { quoted: mek });
            await conn.sendMessage(from, { text: `✅ Video sent (${formatBytes(stats.size)})` }, { quoted: mek });
            fs.unlinkSync(videoPath);
          });
        } else {
          await reply("❌ Invalid choice. Reply with *1* for mp3 or *2* for mp4.");
        }

      } catch (err) {
        console.error("Listener error:", err);
        try { await reply(`❌ Processing error: ${err.message || err}`); } catch(_) {}
        conn.ev.off('messages.upsert', handler);
        clearTimeout(timeoutHandle);
      }
    };

    conn.ev.on('messages.upsert', handler);

    timeoutHandle = setTimeout(async () => {
      try {
        conn.ev.off('messages.upsert', handler);
        await conn.sendMessage(from, { text: '⏳ Timeout — no reply received. Please run the command again if you still want the file.' }, { quoted: mek });
      } catch (_) {}
    }, 60000);

  } catch (error) {
    console.error("Video command error:", error);
    await reply(`❌ An error occurred: ${error?.message || error}`);
  }
});
