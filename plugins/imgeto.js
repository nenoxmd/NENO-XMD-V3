const { lite } = require('../lite');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const Settings = require('../settings'); // config.js nathnam settings.js import

// Take Sticker (rename pack)
lite(
  {
    pattern: 'take',
    alias: ['rename', 'stake'],
    desc: 'Create a sticker with a custom pack name.',
    category: 'other',
    use: '<reply media or URL>',
    filename: __filename,
  },
  async (conn, mek, m, { q, reply }) => {
    try {
      if (!mek.quoted) return reply("*Reply to any sticker or image.*");
      if (!q) return reply("*Please provide a pack name using .take <packname>*");

      let mime = mek.quoted.mtype;
      if (mime !== "imageMessage" && mime !== "stickerMessage")
        return reply("*Please reply to an image or sticker.*");

      let media = await mek.quoted.download();
      let sticker = new Sticker(media, {
        pack: q, // user given pack name
        author: Settings.BOT_NAME || "neno v3",
        type: StickerTypes.FULL,
        categories: ["🤩", "🎉"],
        quality: 75,
        background: 'transparent',
      });
      const buffer = await sticker.toBuffer();
      await conn.sendMessage(mek.chat, { sticker: buffer }, { quoted: mek });
    } catch (e) {
      reply("❌ Error while creating sticker");
      console.error(e);
    }
  }
);

// Sticker create
lite(
  {
    pattern: 'sticker',
    alias: ['s', 'stickergif'],
    desc: 'Create a sticker from an image or sticker.',
    category: 'other',
    use: '<reply media>',
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!mek.quoted) return reply("*Reply to any Image or Video, Sir.*");
      let mime = mek.quoted.mtype;
      if (mime !== "imageMessage" && mime !== "stickerMessage")
        return reply("*Please reply to an image.*");

      let media = await mek.quoted.download();
      let sticker = new Sticker(media, {
        pack: Settings.STICKER_NAME || "😍😒",
        author: Settings.BOT_NAME || "Bot",
        type: StickerTypes.FULL,
        categories: ["🤩", "🎉"],
        quality: 75,
        background: 'transparent',
      });
      const buffer = await sticker.toBuffer();
      await conn.sendMessage(mek.chat, { sticker: buffer }, { quoted: mek });
    } catch (e) {
      reply("❌ Error while creating sticker");
      console.error(e);
    }
  }
);
