const { lite } = require("../lite");
const axios = require("axios");
const fetch = require("node-fetch");
const { sleep } = require('../lib/functions');

// joke
lite({
    pattern: "joke",
    desc: "😂 Get a random joke",
    react: "🤣",
    category: "fun",
    filename: __filename
}, async (conn, m, { reply, from }) => {
    try {
        const res = await axios.get("https://official-joke-api.appspot.com/random_joke");
        const joke = res.data;
        if (!joke?.setup || !joke?.punchline) return reply("❌ Failed to fetch a joke.");

        const jokeMessage = `🤣 *Here's a random joke!* 🤣\n\n*${joke.setup}*\n\n${joke.punchline} 😆\n\n> *Created by 𝐍𝐈𝐌𝐄𝐒𝐇𝐊𝐀 𝐌𝐈𝐇𝐈𝐑𝐀𝐍 🎐*`;

        await conn.sendMessage(from, { 
            text: jokeMessage, 
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("⚠️ Error fetching joke.");
    }
});

// flirt
lite({
    pattern: "flirt",
    alias: ["masom","line"],
    desc: "Get a random flirt line",
    react: "💘",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, reply }) => {
    try {
        const apiUrl = `https://shizoapi.onrender.com/api/texts/flirt?apikey=shizo`;
        const res = await fetch(apiUrl);
        const json = await res.json();
        if (!json.result) return reply("❌ Failed to fetch flirt line.");

        await conn.sendMessage(from, { 
            text: json.result,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error fetching flirt line.");
    }
});

// truth
lite({
    pattern: "truth",
    alias: ["truthquestion"],
    desc: "Get a random truth question",
    react: "❓",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, reply }) => {
    try {
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=shizo`);
        const json = await res.json();
        if (!json.result) return reply("❌ Failed to fetch truth question.");

        await conn.sendMessage(from, { 
            text: json.result,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error fetching truth question.");
    }
});

// dare
lite({
    pattern: "dare",
    alias: ["truthordare"],
    desc: "Get a random dare",
    react: "🎯",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, reply }) => {
    try {
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=shizo`);
        const json = await res.json();
        if (!json.result) return reply("❌ Failed to fetch dare.");

        await conn.sendMessage(from, { 
            text: json.result,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error fetching dare.");
    }
});

// fact
lite({
    pattern: "fact",
    desc: "🧠 Get a random fun fact",
    react: "🧠",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, reply }) => {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        const fact = res.data.text;
        if (!fact) return reply("❌ Failed to fetch fun fact.");

        await conn.sendMessage(from, { 
            text: `🧠 *Fun Fact* 🧠\n\n${fact}\n\n> *Powered by Nimeshka Mihiran*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error fetching fun fact.");
    }
});

// pickupline
lite({
    pattern: "pickupline",
    alias: ["pickup"],
    desc: "Get a random pickup line",
    react: "💬",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, reply }) => {
    try {
        const res = await fetch("https://api.popcat.xyz/pickuplines");
        const json = await res.json();
        if (!json.pickupline) return reply("❌ Failed to fetch pickup line.");

        await conn.sendMessage(from, { 
            text: `*Pickup line:*\n\n"${json.pickupline}"\n\n> *Powered by Nimeshka Mihiran*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error fetching pickup line.");
    }
});

// character
lite({
    pattern: "character",
    alias: ["char"],
    desc: "Check character of a mentioned user",
    react: "🔥",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("This command works only in groups.");
        const mentionedUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) return reply("Mention a user to check character.");

        const userChar = ["Sigma","Generous","Grumpy","Overconfident","Obedient","Good","Simp","Kind","Patient","Pervert","Cool","Helpful","Brilliant","Sexy","Hot","Gorgeous","Cute"];
        const userCharacter = userChar[Math.floor(Math.random() * userChar.length)];

        await conn.sendMessage(from, { 
            text: `Character of @${mentionedUser.split("@")[0]} is *${userCharacter}* 🔥`,
            mentions: [mentionedUser],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error checking character.");
    }
});

// repeat
lite({
    pattern: "repeat",
    alias: ["rp","rpm"],
    desc: "Repeat a message multiple times",
    react: "🔄",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("✳️ Usage: .repeat 10,Hello");

        const [countStr, ...msgParts] = args.join(" ").split(",");
        const count = parseInt(countStr.trim());
        const message = msgParts.join(",").trim();
        if (!count || !message) return reply("❌ Invalid input.");
        if (count > 300) return reply("❌ Max 300 times.");

        await conn.sendMessage(from, { 
            text: `🔄 Repeating ${count} times:\n\n${Array(count).fill(message).join("\n")}`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error repeating message.");
    }
});

// spam
lite({
    pattern: "spam",
    desc: "Send a message multiple times (owner only)",
    react: "⚡",
    category: "fun",
    filename: __filename
}, async (conn, m, { from, args, reply, senderNumber }) => {
    try {
        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) return reply("❌ Only owner can use this.");

        const [countStr, ...msgParts] = args.join(" ").split(",");
        const count = parseInt(countStr.trim());
        const message = msgParts.join(",").trim();
        if (!count || !message) return reply("❌ Invalid input.");
        if (count > 100) return reply("❌ Max 100 times.");

        reply(`⏳ Sending "${message}" ${count} times...`);
        for (let i=0;i<count;i++){
            await conn.sendMessage(m.from, { text: message }, { quoted: m });
            await sleep(1000);
        }
        reply(`✅ Successfully sent ${count} messages.`);
    } catch (e) {
        console.error(e);
        reply("❌ Error sending spam messages.");
    }
});

// readmore
lite({
    pattern: "readmore",
    alias: ["rm","rmore","readm"],
    desc: "Generate a Read More message",
    react: "📝",
    category: "convert",
    filename: __filename
}, async (conn, m, { from, args, reply }) => {
    try {
        const inputText = args.join(" ") || "No text provided.";
        const readMore = String.fromCharCode(8206).repeat(4000);
        const message = `${inputText}${readMore} Continue Reading...`;

        await conn.sendMessage(from, { 
            text: message,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        });
    } catch (e) {
        console.error(e);
        reply("❌ Error generating readmore.");
    }
});
