const fs = require('fs');
const config = require('../settings');
const { lite, commands } = require('../lite');

// Menu Categories
const NUM_CATEGORIES = [
  { num: '1', key: 'group', title: 'Admin Commands' },
  { num: '2', key: 'download', title: 'Downloader Commands' },
  { num: '3', key: 'owner', title: 'Owner Commands' },
  { num: '4', key: 'ai', title: 'AI Commands' },
  { num: '5', key: 'anime', title: 'Logo / Anime Commands' },
  { num: '6', key: 'convert', title: 'Convert Commands' },
  { num: '7', key: 'reaction', title: 'Reaction Commands' },
  { num: '8', key: 'fun', title: 'Fun Commands' },
  { num: '9', key: 'other', title: 'Other / Main Commands' },
  { num: '0', key: 'all', title: 'Full Menu (All Commands)' }
];

const MENU_MARKER = '#MENU_ID:lite_menu_v3';

// Build category command list
function buildCategoryList(catKey) {
  if (catKey === 'all') {
    const grouped = {};
    for (const cmd of commands) {
      if (!cmd.pattern || cmd.dontAddCommandList) continue;
      const ckey = cmd.category || 'other';
      if (!grouped[ckey]) grouped[ckey] = [];
      grouped[ckey].push(cmd);
    }
    let out = '';
    for (const g in grouped) {
      out += `\n┌─── 『 ${g.toUpperCase()} 』\n`;
      grouped[g].forEach((c, i) => {
        out += `│ ${i + 1}. ${c.pattern}${c.desc ? ' — ' + c.desc : ''}\n`;
      });
      out += `└────────\n`;
    }
    return out || 'No commands found.';
  }

  const list = commands.filter(c => c.pattern && !c.dontAddCommandList && c.category === catKey);
  if (!list.length) return 'No commands found in this category.';
  let out = '';
  list.forEach((c, i) => {
    out += `│ ${i + 1}. ${c.pattern}${c.desc ? ' — ' + c.desc : ''}\n`;
  });
  return out;
}

// Main menu command
lite({
  pattern: "menu",
  react: "💫",
  alias: ["allmenu"],
  desc: "Lite numbered menu: reply with a number to view category",
  category: "main",
  filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
  try {
    let numberedMenu = `╭─❍ *${config.BOT_NAME} MENU*\n`;
    numberedMenu += `│ 👤 User: ${pushname}\n`;
    numberedMenu += `│ 🌐 Mode: [${config.MODE}]\n`;
    numberedMenu += `│ ✨ Prefix: [${config.PREFIX}]\n`;
    numberedMenu += `│ 📦 Total Commands: ${commands.length}\n`;
    numberedMenu += `│ 📌 Version: ${config.version} v3\n`;
    numberedMenu += `╰─────────────✦\n\n`;
    numberedMenu += `🔽 *Reply with your choice:*\n`;

    NUM_CATEGORIES.forEach(item => {
      numberedMenu += `> ${item.num}. ${item.title}\n`;
    });

    numberedMenu += `\nExample: Reply "1" to see Admin Commands.\n\n${MENU_MARKER}`;

    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL },
      caption: numberedMenu
    }, { quoted: mek });

    // optional audio
    if (fs.existsSync('./all/menu.m4a')) {
      await conn.sendMessage(from, {
        audio: fs.readFileSync('./all/menu.m4a'),
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: mek });
    }

  } catch (e) {
    console.error(e);
    reply(`${e}`);
  }
});

// Number reply handler (same logic as song plugin)
lite({
  pattern: '^[0-9]{1,2}$',
  react: "🔢",
  desc: "Handle menu category replies",
  dontAddCommandList: true,
  filename: __filename
},
async (conn, mek, m, { from, quoted, reply }) => {
  try {
    if (!quoted) return;

    let qText = '';
    try {
      if (quoted.message?.imageMessage?.caption) qText = quoted.message.imageMessage.caption;
      else if (quoted.message?.extendedTextMessage?.text) qText = quoted.message.extendedTextMessage.text;
      else if (quoted.message?.conversation) qText = quoted.message.conversation;
    } catch (err) {
      qText = '';
    }

    if (!qText || !qText.includes(MENU_MARKER)) return; // not our menu

    const choice = (m.text || '').trim();
    const selected = NUM_CATEGORIES.find(x => x.num === choice);
    if (!selected) return await reply("❌ Invalid choice! Reply with a valid number.");

    const header = `╭─❍ *${selected.title}*\n\n`;
    const body = buildCategoryList(selected.key);
    const footer = `\n\nReply to the original menu and type another number to switch category.\n\n${MENU_MARKER}`;

    await conn.sendMessage(from, { text: header + body + footer }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`${e}`);
  }
});
