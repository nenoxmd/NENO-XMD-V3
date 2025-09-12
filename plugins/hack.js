const { lite } = require('../lite');

lite({
    pattern: "hack",
    desc: "The ultimate playful hacking simulation! 😎",
    category: "fun",
    react: "🧨",
    filename: __filename
}, async (conn, mek, m, { from, reply, participants }) => {
    try {
        const users = participants.map(u => u.id.split('@')[0]);
        const targets = ['Instagram', 'Facebook', 'WhatsApp', 'Bank Servers', 'Email', 'Secret Vault'];
        const files = ['Passwords', 'DMs', 'Photos', 'Bank Info', 'Private Notes', 'Cookies', 'NFTs', 'Crypto Keys'];

        const victim = users[Math.floor(Math.random() * users.length)] || 'Anonymous';

        const steps = [
            `💻 *ULTRA HACK INITIATED* 💻`,
            `🎯 Targeting: ${victim} on ${targets[Math.floor(Math.random() * targets.length)]}`,
            '*Injecting malware...* 💉',
            '*Bypassing firewalls...* 🛡️',
            '*Downloading secret files...* 📂',
            `🔑 Stolen Data: ${files[Math.floor(Math.random() * files.length)]}`,
            '```[███░░░░░░░░░░░] 25%``` ⏳',
            '```[████████░░░░░░] 50%``` ⏳',
            '```[█████████████] 75%``` ⏳',
            '```[████████████████] 100%``` ✅',
            '*Encrypting traces...* 🔒',
            '*Uploading to dark web...* 🌑',
            `💥 *HACK COMPLETE!* ${victim}'s secrets are now yours... (just for fun!)`,
            '⚠️ *Disclaimer:* All actions are playful and for demonstration only. Ethical hacking rules! ⚠️'
        ];

        for (const line of steps) {
            // Typing presence for hype
            await conn.sendPresenceUpdate('composing', from);
            await conn.sendMessage(from, { text: line }, { quoted: mek });
            await new Promise(r => setTimeout(r, 1200 + Math.random() * 800)); // random delay 1.2-2s
        }

    } catch (e) {
        reply(`❌ *Error!* ${e.message}`);
    }
});
