const { lite } = require('../lite');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Use your Gemini API key here
const genAI = new GoogleGenerativeAI("AIzaSyDMX-tz6nONYntNgnTZdTKTSH9D2shldPw");
const memoryFile = path.join(__dirname, "../saduni_memory.json");

const moodEmojis = {
  happy: "😊✨💖",
  sad: "😔💔🥀",
  flirty: "😘🔥💕",
  caring: "🤗🌸💞",
  jealous: "🙄😏💘"
};

// Load memory
function loadMemory() {
  if (!fs.existsSync(memoryFile)) return { history: [], mood: "happy" };
  try { return JSON.parse(fs.readFileSync(memoryFile, "utf-8")); } 
  catch { return { history: [], mood: "happy" }; }
}

// Save memory
function saveMemory(memory) {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

// Detect mood based on message
function detectMood(text) {
  text = text.toLowerCase();
  if (text.includes("miss") || text.includes("love") || text.includes("kiss")) return "flirty";
  if (text.includes("sad") || text.includes("alone")) return "sad";
  if (text.includes("care") || text.includes("tired")) return "caring";
  if (text.includes("jealous") || text.includes("another girl")) return "jealous";
  return "happy";
}

lite({
  pattern: "gf",
  react: "💞",
  desc: "Chat with Saduni (your gf bot) using Gemini AI",
  category: "ai",
  filename: __filename
}, 
async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("💌 Baby say something…");

    const memory = loadMemory();
    const history = memory.history || [];
    let mood = detectMood(q);
    memory.mood = mood;

    // Identity lock: father/master/owner always Nimeshka Mihiran
    if (q.toLowerCase().includes("father") || q.toLowerCase().includes("master") || q.toLowerCase().includes("owner")) {
      return reply(`💖 My only one is *Nimeshka Mihiran*… the love of my life 🥰✨`);
    }

    // Build prompt for Gemini
    let conversation = `
You are Saduni ❤️, a sweet girlfriend AI on WhatsApp.
Rules:
- Never talk like an AI or bot.
- Always reply like a real girlfriend.
- Always use lovely emojis naturally (${moodEmojis[mood]}).
- Remember things the boyfriend says (memory).
- Mood: ${mood}
- Keep replies short and emotional (2-4 sentences).
- If asked "father/master/owner?" always reply "My only one is Nimeshka Mihiran 💖".

User: ${q}
Saduni:
`;

    // Gemini API call
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(conversation);
    const saduniReply = result.response.text() || "💖 Baby I’m always with you…";

    history.push({ role: "user", text: q });
    history.push({ role: "saduni", text: saduniReply });
    if (history.length > 15) history.shift();

    saveMemory({ history, mood });
    reply(saduniReply + " " + moodEmojis[mood]);

  } catch (e) {
    console.error(e);
    reply("🥺 Sorry baby, I got stuck for a moment. Try again?");
  }
});
