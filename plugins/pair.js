// plugins/pair.js
const fetch = require("node-fetch");
const { lite } = require("../lite");

lite({
    pattern: "pair",
    alias: ["getpair", "code"],
    react: "✅",
    desc: "Get WhatsApp pairing code",
    category: "download",
    use: ".pair <number>",
    filename: __filename
}, 
async (conn, mek, m, { q, reply }) => {
    try {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Validate input number
        if (!q || !/^\d{8,15}$/.test(q)) {
            return await reply("❌ Invalid phone number. Example: `.pair 989136730390`");
        }

        // Fetch pairing code from API
        const response = await fetch(`https://neno-pair-k47s.onrender.com//code?number=${q}`);
        const pair = await response.json();

        if (!pair || !pair.code) {
            return await reply("❌ Failed to retrieve pairing code. Make sure the number is correct.");
        }

        const pairingCode = pair.code;

        // Send pairing code to user
        await reply(`✅ *PAIRING CODE for ${q}*\n\n🔐 Code: *${pairingCode}*\n\nPlease wait while syncing...`);
        await sleep(2000);
        await reply(`${pairingCode}`);

    } catch (error) {
        console.error("PAIR ERROR:", error.message);
        await reply("❌ An error occurred during the pairing process.");
    }
});
