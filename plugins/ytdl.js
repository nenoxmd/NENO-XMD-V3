// plugins/video_song_choice.js
const config = require('../settings');
const { lite } = require('../lite');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

function replaceYouTubeID(url) {
  const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function extractDownloadUrl(resp) {
  // try common shapes used by scrapers
  if (!resp) return null;
  return resp?.result?.download?.url ||
         resp?.result?.download_url ||
         resp?.result?.url ||
         resp?.download?.url ||
         resp?.url ||
         null;
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
    if (!q) return await reply("❌ Please provide a YouTube URL or search query!");

    // find video id
    let id = q.startsWith("http") ? replaceYouTubeID(q) : null;
    if (!id) {
      const search = await dy_scrap.ytsearch(q);
      if (!search?.results?.length) return await reply("❌ No results found!");
      id = search.results[0].videoId;
    }

    // fetch video info
    const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
    if (!data?.results?.length) return await reply("❌ Failed to fetch video info!");

    const { url, title, image, timestamp, ago, views, author } = data.results[0];

    const info = [
      `🍄 *VIDEO DOWNLOADER* 🍄`,
      ``,
      `🎬 *Title:* ${title || "Unknown"}`,
      `⏳ *Duration:* ${timestamp || "Unknown"}`,
      `👀 *Views:* ${views || "Unknown"}`,
      `🌏 *Uploaded:* ${ago || "Unknown"}`,
      `👤 *Author:* ${author?.name || "Unknown"}`,
      `🔗 *Url:* ${url || "Unknown"}`,
      ``,
      `🔽 *Reply with your choice:*`,
      `> 1 — Audio (mp3) 🎵`,
      `> 2 — Video (mp4) 🎬`,
      ``,
      `${config.FOOTER || "ɴᴇɴᴏ-xᴍᴅ"}`
    ].join("\n");

    const sent = await conn.sendMessage(from, { image: { url: image }, caption: info }, { quoted: mek });
    const messageID = sent.key.id;
    await conn.sendMessage(from, { react: { text: '🎶', key: sent.key } }).catch(()=>{});

    // prepare limited, single-use listener
    const originalSender = m.sender; // the user who requested
    let timeoutHandle;

    const handler = async (update) => {
      try {
        const upMsg = update?.messages?.[0];
        if (!upMsg || !upMsg.message) return;

        // identify who sent the incoming message
        const incomingSender = upMsg.key.participant || upMsg.key.remoteJid;
        if (!incomingSender) return;
        if (incomingSender !== originalSender) return; // only accept same user

        // ensure it's a reply to our info message
        const context = upMsg.message.extendedTextMessage?.contextInfo;
        const isReply = context && context.stanzaId === messageID;
        if (!isReply) return;

        // get text content (conversation or extended text)
        const text = upMsg.message.conversation || upMsg.message.extendedTextMessage?.text || "";
        const choice = text.trim();

        // remove listener & timeout immediately (one-time)
        conn.ev.off('messages.upsert', handler);
        clearTimeout(timeoutHandle);

        // handle choices
        if (choice === "1") {
          const processing = await conn.sendMessage(from, { text: "⏳ Processing audio (mp3)..." }, { quoted: mek });
          const resp = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
          const downloadUrl = extractDownloadUrl(resp);
          if (!downloadUrl) return await reply("❌ Audio download link not found!");
          await conn.sendMessage(from, { audio: { url: downloadUrl }, mimetype: "audio/mpeg" }, { quoted: mek });
          await conn.sendMessage(from, { text: '✅ Audio sent.', edit: processing.key }).catch(()=>{});
        } else if (choice === "2") {
          const processing = await conn.sendMessage(from, { text: "⏳ Processing video (mp4)..." }, { quoted: mek });
          const resp = await dy_scrap.ytmp4(`https://youtube.com/watch?v=${id}`);
          const downloadUrl = extractDownloadUrl(resp);
          if (!downloadUrl) return await reply("❌ Video download link not found!");
          await conn.sendMessage(from, { video: { url: downloadUrl }, mimetype: "video/mp4", caption: title }, { quoted: mek });
          await conn.sendMessage(from, { text: '✅ Video sent.', edit: processing.key }).catch(()=>{});
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

    // register listener
    conn.ev.on('messages.upsert', handler);

    // auto-remove listener after 60s
    timeoutHandle = setTimeout(async () => {
      try {
        conn.ev.off('messages.upsert', handler);
        await conn.sendMessage(from, { text: '⏳ Timeout — no reply received. Please run the command again if you still want the file.' }, { quoted: mek });
      } catch (_) {}
    }, 60000);

  } catch (error) {
    console.error("Video command error:", error);
    try { await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }); } catch(_) {}
    await reply(`❌ An error occurred: ${error?.message || error}`);
  }
});
