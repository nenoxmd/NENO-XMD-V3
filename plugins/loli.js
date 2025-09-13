const { lite } = require("../lite");
const axios = require("axios");

lite({
    pattern: "loli",
    alias: ["lolii"],
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🐱",
    filename: __filename,
    fromMe: false
},
async (malvin, mek, m, { from, reply }) => {
    try {
        const apiUrl = "https://api.waifu.pics/sfw/waifu";
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Newsletter forwarding context
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401225837204@newsletter",
                newsletterName: "NENO XMD",
                serverMessageId: 221
            }
        };

        await malvin.sendMessage(from, {
            image: { url: data.url },
            caption: `👸 *NENO XMD RANDOM ANIME GIRL IMAGE* 👸\n\n🧬 © BY NIMESHKA`,
            contextInfo
        }, { quoted: mek });

    } catch (e) {
        console.error("❌ Error in .loli command:", e);
        reply(`⚠️ Error fetching anime girl image: ${e.message}`);
    }
});
