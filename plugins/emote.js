// plugins/reaction.js
const { lite } = require("../lite");

// Happy Reaction
lite({
    pattern: "happy",
    desc: "Dynamic happy emojis",
    category: "reaction",
    react: "😂",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '😂' });
        const emojiMessages = ["😃","😄","😁","😊","😎","🥳","😸","😹","🌞","🌈"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Heart Reaction
lite({
    pattern: "heart",
    desc: "Dynamic heart emojis",
    category: "reaction",
    react: "❤️",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '🖤' });
        const emojiMessages = ["💖","💗","💕","🩷","💛","💚","🩵","💙","💜","🖤","🤍","❤️"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Angry Reaction
lite({
    pattern: "angry",
    desc: "Dynamic angry emojis",
    category: "reaction",
    react: "😡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '😡' });
        const emojiMessages = ["😡","😠","🤬","😤","😾"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Sad Reaction
lite({
    pattern: "sad",
    desc: "Dynamic sad emojis",
    category: "reaction",
    react: "😔",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '😔' });
        const emojiMessages = ["🥺","😟","😕","😖","😫","🙁","😭","💔"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Shy Reaction
lite({
    pattern: "shy",
    desc: "Dynamic shy emojis",
    category: "reaction",
    react: "😳",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '😳' });
        const emojiMessages = ["😳","😊","😶","🙈","🙊"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Moon Reaction
lite({
    pattern: "moon",
    desc: "Dynamic moon emojis",
    category: "reaction",
    react: "🌚",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '🌝' });
        const emojiMessages = ["🌗","🌘","🌑","🌒","🌓","🌔","🌕","🌖"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Confused Reaction
lite({
    pattern: "confused",
    desc: "Dynamic confused emojis",
    category: "reaction",
    react: "🤔",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '🤔' });
        const emojiMessages = ["😕","😵","🤔","😖","😲","🤷"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// Hot Reaction
lite({
    pattern: "hot",
    desc: "Dynamic hot emojis",
    category: "reaction",
    react: "🥵",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const loadingMessage = await conn.sendMessage(from, { text: '🥵' });
        const emojiMessages = ["🥵","❤️","💋","🤤","😋","🙊","😻","👅","👄"];

        for (const emoji of emojiMessages) {
            await new Promise(r => setTimeout(r, 1000));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: loadingMessage.key,
                    type: 14,
                    editedMessage: { conversation: emoji }
                }
            }, {});
        }
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});
