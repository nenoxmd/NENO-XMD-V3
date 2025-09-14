// plugins/sticker.js
const { lite } = require('../lite');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const sharp = require('sharp');

// optional: if you have a helper to convert short videos -> webp (for animated stickers)
let videoToWebp;
try {
  videoToWebp = require('../spectrazed/video-utils').videoToWebp;
} catch (e) {
  videoToWebp = null;
  // it's optional — if absent, video->sticker will be rejected politely
}

lite({
  pattern: 'sticker',
  alias: ['s'],
  react: '🔖',
  desc: 'Reply to an image/video to convert to sticker',
  category: 'other',
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted) return reply('❌ Please reply to an image or short video/GIF to convert it to a sticker.');

    // normalize quoted message object
    const msg = quoted.message || quoted;
    const mimetype = quoted.mimetype || msg?.mimetype || '';

    const isImage = !!msg.imageMessage || mimetype.startsWith?.('image');
    const isVideo = !!msg.videoMessage || mimetype.startsWith?.('video');

    if (!isImage && !isVideo) return reply('❌ Reply must be an image or a short video/GIF.');

    // 1) download the full media (not thumbnail). Many frameworks provide quoted.download()
    let mediaBuffer = null;
    try {
      if (typeof quoted.download === 'function') {
        mediaBuffer = await quoted.download(); // preferred: returns full file buffer
      } else if (typeof msg.download === 'function') {
        mediaBuffer = await msg.download();
      } else {
        // Try other possible fields (rare)
        mediaBuffer = msg.imageMessage?.jpegThumbnail
          ? Buffer.from(msg.imageMessage.jpegThumbnail)
          : null;
      }
    } catch (err) {
      console.warn('Primary media download failed, err:', err);
      // fallback to thumbnail (low quality) only as last resort
      try {
        mediaBuffer = msg.imageMessage?.jpegThumbnail
          ? Buffer.from(msg.imageMessage.jpegThumbnail)
          : null;
      } catch (_) {
        mediaBuffer = null;
      }
    }

    if (!mediaBuffer) return reply('❌ Failed to download media (full file). Make sure you replied to the actual image/video.');

    // If video -> convert to webp first (animated sticker) using helper if available
    let inputForSticker = mediaBuffer;
    if (isVideo) {
      if (!videoToWebp) {
        return reply('❌ Video->sticker conversion requires server-side ffmpeg helper (video-utils). Not available.');
      }
      try {
        inputForSticker = await videoToWebp(mediaBuffer); // should return webp or image buffer
        if (!inputForSticker) throw new Error('videoToWebp returned empty');
      } catch (err) {
        console.error('videoToWebp error:', err);
        return reply('❌ Failed to convert video to sticker. (videoToWebp error)');
      }
    }

    // Build sticker
    const sticker = new Sticker(inputForSticker, {
      pack: 'NENO XMD',
      author: 'Nimeshka',
      type: StickerTypes.FULL, // FULL supports regular & animated
      quality: 80,
      background: 'transparent'
    });

    const stickerBuffer = await sticker.toBuffer(); // webp buffer that WhatsApp accepts
    await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

    // best-effort reaction
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
  category: 'other',
  filename: __filename
}, async (conn, mek, m, { reply, quoted, from }) => {
  try {
    if (!quoted) return reply('❌ Please reply to a sticker to convert it to an image.');

    const msg = quoted.message || quoted;
    const mimetype = quoted.mimetype || msg?.mimetype || '';
    const isSticker = !!msg.stickerMessage || mimetype === 'image/webp' || mimetype === 'image/webp; charset=binary';

    if (!isSticker) return reply('❌ Reply must be a sticker.');

    // Download sticker buffer (webp)
    let stickerBuffer = null;
    try {
      if (typeof quoted.download === 'function') stickerBuffer = await quoted.download();
      else if (typeof msg.download === 'function') stickerBuffer = await msg.download();
      else stickerBuffer = msg.stickerMessage?.fileSha256 ? null : null;
    } catch (err) {
      console.error('Sticker download failed:', err);
      return reply('❌ Failed to download sticker. Try again.');
    }

    if (!stickerBuffer) return reply('❌ Failed to download sticker buffer.');

    // Try converting webp -> jpeg/png using sharp (best)
    let imageBuffer = null;
    try {
      // sharp can convert webp to jpeg even for many webp variants
      imageBuffer = await sharp(stickerBuffer, { animated: false }).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
    } catch (err) {
      console.warn('sharp conversion failed, trying wa-sticker-formatter fallback:', err);
      // fallback: try using wa-sticker-formatter to request jpeg (some envs support it)
      try {
        const tmp = new Sticker(stickerBuffer, { pack: 'tmp', author: 'tmp', type: StickerTypes.FULL, quality: 100 });
        imageBuffer = await tmp.toBuffer({ format: 'image/jpeg' }); // library-specific
      } catch (err2) {
        console.error('Fallback conversion failed:', err2);
        imageBuffer = null;
      }
    }

    if (!imageBuffer) return reply('❌ Could not convert sticker to image on this server. (Try installing "sharp")');

    // Send the image
    await conn.sendMessage(from, { image: imageBuffer, caption: '✅ Converted from sticker' }, { quoted: mek });

    // react
    try { await conn.sendMessage(from, { react: { text: '🖼️', key: mek.key } }); } catch (_) {}

  } catch (e) {
    console.error('img command error:', e);
    reply(`❌ Error: ${e.message || e}`);
  }
});
