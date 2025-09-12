const axios = require("axios");
const { lite } = require("../lite");

// ⚠️ Gemini API key
const GEMINI_API_KEY = "AIzaSyC4chj4aorec4aX4UIO3STqEFXnsrJP6Cs";

// Chat memory per user
const chatMemory = {};

// Forbidden topics
const forbiddenTopics = ["sex", "money", "politics", "drugs", "adult", "nsfw", "gamble"];

lite({
    pattern: "gf",
    alias: ["girlfriend", "love", "babe"],
    desc: "Chat with your AI girlfriend Saduni (lovely chat only)",
    react: "💖",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("💌 Say something to Saduni!\nExample: `.gf How was your day?`");

        // Forbidden topics check
        const lowerMsg = q.toLowerCase();
        if (forbiddenTopics.some(word => lowerMsg.includes(word))) {
            return reply("💖 Saduni: Babe, let's only talk about sweet things 😘");
        }

        // Init memory
        if (!chatMemory[from]) chatMemory[from] = [];

        await reply("💖 Saduni is typing...");

        // Build prompt
        const memoryText = chatMemory[from]
            .map(msg => `You: ${msg.user}\nSaduni: ${msg.bot}`)
            .join("\n");

        const prompt = `
You are Saduni 💖, a 21-year-old girl from Colombo, Sri Lanka 🌴.
You are the user's sweet, caring, loving girlfriend.
Always reply like a real human girlfriend: use emojis, short & flirty tone, cute caring style.
Never say you are AI. Only act as Saduni.
Forbidden topics must be rejected politely.
Past conversation:
${memoryText || "No previous messages yet."}
Current user message: "${q}"
`;

        // Gemini API
        let gfReply;
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { "Content-Type": "application/json" } }
            );
            gfReply = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        } catch (err) {
            console.error("Gemini API Error:", err?.response?.data?.error?.message || err.message);
            return reply(`❌ Gemini API error: ${err?.response?.data?.error?.message || err.message}`);
        }

        if (!gfReply) return reply("❌ Saduni couldn’t think of a reply this time, babe 💔");

        // Save memory
        chatMemory[from].push({ user: q, bot: gfReply });
        if (chatMemory[from].length > 20) chatMemory[from].shift();

        // Send reply
        await conn.sendMessage(from, { text: `💖 *Saduni*: ${gfReply}` }, { quoted: mek });

    } catch (e) {
        console.error("Saduni Plugin Error:", e);
        reply("❌ Oops! Something went wrong with Saduni 😢");
    }
});
