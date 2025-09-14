// plugins/sticker.js
const { lite } = require('../lite');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

lite({
  pattern: 'sticker',
  alias: ['s'],
  react: '🔖',
  desc: 'Reply to an image/video to convert to sticker',
  category: 'utility',
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted) return reply('❌ Please reply to an image or short video/GIF to convert it to a sticker.');

    // detect quoted message type robustly
    const msg = quoted.message || quoted;
    const isImage = !!msg.imageMessage || (quoted.mimetype && quoted.mimetype.startsWith('image'));
    const isVideo = !!msg.videoMessage || (quoted.mimetype && quoted.mimetype.startsWith('video'));

    if (!isImage && !isVideo) return reply('❌ Reply must be an image or a short video/GIF.');

    // download media buffer (works with most lite frameworks)
    let mediaBuffer;
    try {
      mediaBuffer = await quoted.download?.() || await quoted.download();
    } catch (err) {
      // fallback for frameworks that provide message.content directly
      try {
        mediaBuffer = Buffer.from(msg.imageMessage?.jpegThumbnail || msg.videoMessage?.jpegThumbnail || '');
      } catch (_) {
        mediaBuffer = null;
      }
    }

    if (!mediaBuffer) return reply('❌ Failed to download media. Try again.');

    // build sticker
    const sticker = new Sticker(mediaBuffer, {
      pack: 'NENO XMD',
      author: 'Nimeshka',
      type: StickerTypes.FULL,
      quality: 80,
      background: 'transparent'
    });

    const stickerBuffer = await sticker.toBuffer();

    // send sticker
    await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

    // react (best-effort)
    try { await conn.sendMessage(from, { react: { text: '✅', key: mek.key } }); } catch (_) {}

  } catch (e) {
    console.error('sticker command error:', e);
    reply(`❌ Error: ${e.message || e}`);
  }
});

lite({
  pattern: 'img',
  alias: ['toimg'],
  react: '🖼️',
  desc: 'Reply to a sticker to convert to image',
  category: 'utility',
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted) return reply('❌ Please reply to a sticker to convert it to an image.');

    const msg = quoted.message || quoted;
    const isSticker = !!msg.stickerMessage || (quoted.mimetype && quoted.mimetype === 'image/webp');

    if (!isSticker) return reply('❌ Reply must be a sticker.');

    // download sticker buffer
    let stickerBuffer;
    try {
      stickerBuffer = await quoted.download?.() || await quoted.download();
    } catch (err) {
      return reply('❌ Failed to download sticker. Try again.');
    }

    if (!stickerBuffer) return reply('❌ Failed to download sticker buffer.');

    // Use wa-sticker-formatter to convert webp sticker -> jpeg image (best-effort)
    const tmpSticker = new Sticker(stickerBuffer, {
      pack: 'temp',
      author: 'tmp',
      type: StickerTypes.FULL,
      quality: 100
    });

    let imageBuffer;
    try {
      // request JPEG output (works in many setups)
      imageBuffer = await tmpSticker.toBuffer({ format: 'image/jpeg' });
    } catch (err) {
      // fallback: try generic toBuffer()
      try { imageBuffer = await tmpSticker.toBuffer(); } catch (_) { imageBuffer = null; }
    }

    if (!imageBuffer) return reply('❌ Could not convert sticker to image.');

    // send the image
    await conn.sendMessage(from, { image: imageBuffer, caption: '✅ Converted from sticker' }, { quoted: mek });

    // react (best-effort)
    try { await conn.sendMessage(from, { react: { text: '🖼️', key: mek.key } }); } catch (_) {}

  } catch (e) {
    console.error('img command error:', e);
    reply(`❌ Error: ${e.message || e}`);
  }
});
