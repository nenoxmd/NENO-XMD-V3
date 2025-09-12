// plugins/developer.js
const { cmd } = require("../command");

cmd(
  {
    pattern: "developer",
    alias: ["dev", "creator"],
    desc: "Show developer info with image and intro text",
    category: "info",
    react: "❤️‍🔥",
    filename: __filename,
    fromMe: false,
  },
  async (malvin, mek, m, { reply }) => {
    const developerInfo = {
      name: "Nimeshka Mihiran",
      desainer: "shadow fx",
      helper: "Tharusha Adeeshana",
      number: "wa.me/94721584279",
      github: "https://github.com/nimeshkamihiran",
      note: "❤️බොට් එක ගැන support එකක් ඕන නම් msg එකක් දාන්න!❤️",
      image:
        "https://files.catbox.moe/dbrsww.jpg",
    };

    // STEP 1: Intro reaction (optional)
    await malvin.sendMessage(mek.key.remoteJid, {
      react: { text: "👨‍💻", key: mek.key },
    });

    // STEP 2: Intro Message
    await malvin.sendMessage(
      mek.key.remoteJid,
      { text: "👋 *𝐇𝐄𝐘 𝐓𝐇𝐈𝐒 𝐈𝐒 𝐌𝐘 𝐎𝐖𝐍𝐄𝐑𝐒 & 𝐝𝐞𝐯𝐥𝐨𝐩𝐞𝐫𝐬 𝐑𝐄𝐒𝐏𝐄𝐂𝐓❤️💪!*" },
      { quoted: mek }
    );

    // STEP 3: Developer Info with Image
    const caption = `
*👨‍💻 Developer Info*

👤 *Name:* ${developerInfo.name} 

❤️ *desainer:* ${developerInfo.desainer} 

🤍 *Helper:* ${developerInfo.helper} 

📞 *Contact:* ${developerInfo.number}

💻 *GitHub:* ${developerInfo.github}

📝 *Note:* ${developerInfo.note}
    `.trim();

    await malvin.sendMessage(
      mek.key.remoteJid,
      { image: { url: developerInfo.image }, caption },
      { quoted: mek }
    );
  }
);
