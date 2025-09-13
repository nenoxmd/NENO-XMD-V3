// plugins/video_song_choice.js
const { lite } = require('../lite');
const config = require('../settings');
const ytdl = require('ytdl-core');
const { PassThrough } = require('stream');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Convert shorts URL to normal watch URL
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

    if (!ytdl.validateURL(videoUrl)) return await reply("❌ Invalid YouTube URL!");

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title || "Unknown";
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
      `👤 *Author:* ${author}`,
      `🌏 *Uploaded:* ${uploaded}`,
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

        if (choice === "1") {
          await conn.sendMessage(from, { text: "⏳ Processing audio (mp3)..." }, { quoted: mek });
          const stream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
          const pass = new PassThrough();
          stream.pipe(pass);

          await conn.sendMessage(from, {
            audio: pass,
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          }, { quoted: mek });

          await conn.sendMessage(from, { text: "✅ Audio sent." }, { quoted: mek });
        } else if (choice === "2") {
          await conn.sendMessage(from, { text: "⏳ Processing video (mp4)..." }, { quoted: mek });
          const stream = ytdl(videoUrl, { quality: 'highestvideo' });
          const pass = new PassThrough();
          stream.pipe(pass);

          await conn.sendMessage(from, {
            video: pass,
            mimetype: 'video/mp4',
            caption: title,
            fileName: `${title}.mp4`
          }, { quoted: mek });

          await conn.sendMessage(from, { text: "✅ Video sent." }, { quoted: mek });
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
