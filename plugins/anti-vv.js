const { lite } = require("../lite");

lite({
  pattern: "vv",
  alias: ["viewonce", 'retrive'],
  react: '🌏',
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;

    // Standard hacker-style caption
    const hackerCaption = "🛠 NENO V3 | HACKER TOOL";
    const finalCaption = match.quoted.text ? `${hackerCaption}\n\n${match.quoted.text}` : hackerCaption;

    // Add newsletter forwarding context
    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363401225837204@newsletter",
        newsletterName: "NENO XMD",
        serverMessageId: 220
      }
    };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: finalCaption,
          mimetype: match.quoted.mimetype || "image/jpeg",
          contextInfo
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: finalCaption,
          mimetype: match.quoted.mimetype || "video/mp4",
          contextInfo
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: match.quoted.ptt || false,
          contextInfo
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, { quoted: message });

  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});
