const { lite } = require("../lite");
const axios = require("axios");

async function generateImage(apiUrl, q, malvin, mek, from, reply) {
    try {
        if (!q) return reply("⚠️ Please provide a prompt for the image.");

        await reply("> *CREATING IMAGE ...🔥*");

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        if (!response || !response.data) {
            return reply("❌ API did not return a valid image. Try again later.");
        }

        const imageBuffer = Buffer.from(response.data, "binary");

        // Newsletter forwarding context
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363401225837204@newsletter",
                newsletterName: "NENO XMD",
                serverMessageId: 230
            }
        };

        await malvin.sendMessage(from, {
            image: imageBuffer,
            caption: `> *ᴋᴇᴇᴘ ʀᴏᴄᴋɪɴ' ɴᴇɴᴏ xᴍᴅ* 🚀\n✨ Prompt: *${q}*`,
            contextInfo
        }, { quoted: mek });

    } catch (error) {
        console.error("AI Image Error:", error);
        reply(`⚠️ An error occurred: ${error.response?.data?.message || error.message || "Unknown error"}`);
    }
}

// FluxAI
lite({
    pattern: "fluxai",
    alias: ["flux", "imagine"],
    react: "🚀",
    desc: "Generate an image using Flux AI.",
    category: "main",
    filename: __filename,
    fromMe: false
}, async (malvin, mek, m, { from, q, reply }) => {
    const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`;
    await generateImage(apiUrl, q, malvin, mek, from, reply);
});

// Stable Diffusion
lite({
    pattern: "stablediffusion",
    alias: ["sdiffusion", "imagine2"],
    react: "🚀",
    desc: "Generate an image using Stable Diffusion.",
    category: "main",
    filename: __filename,
    fromMe: false
}, async (malvin, mek, m, { from, q, reply }) => {
    const apiUrl = `https://api.siputzx.my.id/api/ai/stable-diffusion?prompt=${encodeURIComponent(q)}`;
    await generateImage(apiUrl, q, malvin, mek, from, reply);
});

// StabilityAI
lite({
    pattern: "stabilityai",
    alias: ["stability", "imagine3"],
    react: "🚀",
    desc: "Generate an image using StabilityAI.",
    category: "main",
    filename: __filename,
    fromMe: false
}, async (malvin, mek, m, { from, q, reply }) => {
    const apiUrl = `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(q)}`;
    await generateImage(apiUrl, q, malvin, mek, from, reply);
});
