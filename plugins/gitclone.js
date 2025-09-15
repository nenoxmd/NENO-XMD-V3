// plugins/gitclone.js
const { lite } = require('../lite');
const fetch = require('node-fetch');

lite({
    pattern: 'gitclone',
    alias: ['git'],
    react: '📦',
    desc: 'Download GitHub repository as a zip file',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { q, reply, from, sender }) => {
    try {
        if (!q) return reply("❌ Where is the GitHub link?\n\nExample:\n.gitclone https://github.com/username/repository");

        if (!/^(https:\/\/)?github\.com\/.+/.test(q)) {
            return reply("⚠️ Invalid GitHub link. Please provide a valid GitHub repository URL.");
        }

        const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/i;
        const match = q.match(regex);

        if (!match) return reply("❌ Invalid GitHub URL.");

        const [, username, repo] = match;
        const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

        // Check repository existence
        const response = await fetch(zipUrl, { method: 'HEAD' });
        if (!response.ok) return reply("❌ Repository not found.");

        const contentDisposition = response.headers.get('content-disposition');
        const fileName = contentDisposition ? contentDisposition.match(/filename=(.*)/)[1] : `${repo}.zip`;

        // Notify user
        await conn.sendMessage(from, { text: `📥 Downloading repository...\n\n*Repository:* ${username}/${repo}\n*Filename:* ${fileName}\n\n> *made by inconnu boy*` }, { quoted: mek });

        // Send zip file with newsletter forwarding
        await conn.sendMessage(from, {
            document: { url: zipUrl },
            fileName: fileName,
            mimetype: 'application/zip',
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401225837204@newsletter',
                    newsletterName: 'NENO XMD',
                    serverMessageId: Math.floor(Math.random() * 99999)
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error('GitClone Error:', err);
        reply(`❌ Failed to download the repository. ${err.message || ''}`);
    }
});
