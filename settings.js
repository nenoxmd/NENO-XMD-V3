const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID,
    PREFIX: process.env.PREFIX,
    BOT_NAME: process.env.BOT_NAME || "ɴᴇɴᴏ-xᴍᴅ",
    MODE: process.env.MODE,
    LINK_WHITELIST: process.env.LINK_WHITELIST,
    LINK_WARN_LIMIT: Number(process.env.LINK_WARN_LIMIT),
    LINK_ACTION: process.env.LINK_ACTION,
    AUTO_STATUS_SEEN: convertToBool(process.env.AUTO_STATUS_SEEN),
    AUTO_STATUS_REPLY: convertToBool(process.env.AUTO_STATUS_REPLY),
    AUTO_STATUS_REACT: convertToBool(process.env.AUTO_STATUS_REACT),
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY NENO.XMD 💖😍*",
    WELCOME: convertToBool(process.env.WELCOME),
    ADMIN_EVENTS: convertToBool(process.env.ADMIN_EVENTS),
    ANTI_LINK: convertToBool(process.env.ANTI_LINK),
    MENTION_REPLY: convertToBool(process.env.MENTION_REPLY),
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/n8g2o7.jpg",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/pf7ytb.jpg",
    LIVE_MSG: process.env.LIVE_MSG || 
`> ʙᴏᴛ ɪs sᴘᴀʀᴋɪɴɢ ᴀᴄᴛɪᴠᴇ ᴀɴᴅ ᴀʟɪᴠᴇ

ᴋᴇᴇᴘ ᴜsɪɴɢ ✦ɴᴇɴᴏ xᴍᴅ✦ ʙʏ ɴɪᴍᴇꜱʜᴋᴀ⚡

*© ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ -ɴᴇɴᴏ xᴍᴅ*

> ɢɪᴛʜᴜʙ : https://github.com/Nimeshkamihiran`,
    STICKER_NAME: process.env.STICKER_NAME,
    CUSTOM_REACT: convertToBool(process.env.CUSTOM_REACT),
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS ? process.env.CUSTOM_REACT_EMOJIS.split(',') : [],
    DELETE_LINKS: convertToBool(process.env.DELETE_LINKS),
    OWNER_NUMBER: process.env.OWNER_NUMBER || "94721584279",
    OWNER_NAME: process.env.OWNER_NAME || "ɴɪᴍᴇꜱʜᴋᴀ࿐",
    DESCRIPTION: process.env.DESCRIPTION || "*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴍᴇꜱʜᴋᴀ ᴍɪʜɪʀᴀᴍ*",
    READ_MESSAGE: convertToBool(process.env.READ_MESSAGE),
    AUTO_REACT: convertToBool(process.env.AUTO_REACT),
    ANTI_BAD: convertToBool(process.env.ANTI_BAD),
    ANTI_LINK_KICK: convertToBool(process.env.ANTI_LINK_KICK),
    AUTO_STICKER: convertToBool(process.env.AUTO_STICKER),
    AUTO_REPLY: convertToBool(process.env.AUTO_REPLY),
    ALWAYS_ONLINE: convertToBool(process.env.ALWAYS_ONLINE),
    PUBLIC_MODE: convertToBool(process.env.PUBLIC_MODE),
    AUTO_TYPING: convertToBool(process.env.AUTO_TYPING),
    READ_CMD: convertToBool(process.env.READ_CMD),
    DEV: "94721584279", // Fixed number, not from .env
    ANTI_VV: convertToBool(process.env.ANTI_VV),
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH,
    AUTO_RECORDING: convertToBool(process.env.AUTO_RECORDING),
    version: process.env.version || "0.0.5",
    START_MSG: process.env.START_MSG || 
`*Hᴇʟʟᴏ ᴀʟʟ ɪᴀᴍ ɴᴇɴᴏ xᴍᴅ ᴡʜᴀᴛꜱᴘᴘ ʙᴏᴛ ᴄᴏɴɴᴇᴄᴛᴇᴅ! 👋🏻* 

*💖ᴋᴇᴇᴘ ᴏɴ ɴɪᴄᴇ ᴛᴏ ᴍᴇᴇᴛ ʏᴏᴜ💫☺️* 

> sᴜʙsᴄʀɪʙᴇ ʏᴛ ᴄʜᴀɴɴᴇʟ ғᴏʀ ᴛᴜᴛᴏʀɪᴀʟs
https://youtube.com/@MihirangaMihiranga-k1k

- *ʏᴏᴜʀ ʙᴏᴛ ᴘʀᴇғɪx: ➡️[ . ]*
> - ʏᴏᴜ ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴜʀ ᴘʀᴇғɪx ᴜsɪɴɢ ᴛʜᴇ .ᴘʀᴇғɪx ᴄᴏᴍᴍᴀɴᴅ

> ᴅᴏɴᴛ ғᴏʀɢᴇᴛ ᴛᴏ sʜᴀʀᴇ, sᴛᴀʀ & ғᴏʀᴋ ᴛʜᴇ ʀᴇᴘᴏ ⬇️ 
https://github.com/Nimeshkamihiran/neno-xmd-V3

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴍᴇꜱʜᴋᴀ ᴍɪʜɪʀᴀɴ💖😍`
};
