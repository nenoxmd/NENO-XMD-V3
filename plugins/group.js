/* super_group_commands_plugin.js
A single lite plugin implementing all requested group and owner commands:
.tagall, .tag, .kick, .kickadmin, .kickall, .add, .promote, .demote
.block (owner inbox), .unblock (owner inbox), .checkadmin

Drop this file into your plugins folder and reload your bot.

CONFIG: Set OWNER_NUMBER in settings or env to your owner number (no '+' and no @domain) e.g. '94760771665'
*/

const { lite } = require("../lite");
const path = require("path");
const fs = require("fs");
const settings = require("../settings");

// ========== CONFIG ==========
const OWNER = settings.OWNER_NUMBER || process.env.OWNER_NUMBER || "94721584279";
const OWNER_DISPLAY = settings.OWNER_DISPLAY || process.env.OWNER_DISPLAY || "+94 76 077 1665";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloaded_status");

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// ========== UTIL HELPERS ==========
function normalizeNumber(num) {
  if (!num) return num;
  let s = String(num);
  s = s.replace(/@.*$/, "");
  s = s.replace(/^\+/, "");
  if (s.startsWith("0") && s.length > 1) s = "94" + s.slice(1);
  return s;
}

function jidFromNumber(num) {
  if (!num) return null;
  const n = normalizeNumber(num);
  if (!n) return null;
  if (n.endsWith("@s.whatsapp.net") || n.endsWith("@c.us")) return n;
  return `${n}@s.whatsapp.net`;
}

function getSenderId(m) {
  return m?.key?.participant || m?.sender || m?.from || m?.participant || null;
}

function isOwner(jid) {
  if (!jid) return false;
  const s = String(jid).split("@")[0];
  return normalizeNumber(s) === normalizeNumber(OWNER);
}

function getBotJid(conn) {
  try {
    if (!conn) return null;
    if (conn.user && (conn.user.jid || conn.user.id)) return conn.user.jid || conn.user.id;
    if (conn.authState?.creds?.me?.id) return conn.authState.creds.me.id;
    if (conn.me) return conn.me;
    if (conn?.user?.id) return conn.user.id;
    if (conn.info?.wid) return conn.info.wid;
  } catch (e) {
    console.error("getBotJid error", e);
  }
  return null;
}

// Fetch group metadata & admins robustly
async function fetchGroupAdmins(conn, gid) {
  try {
    let meta = null;
    if (typeof conn.groupMetadata === "function") meta = await conn.groupMetadata(gid);
    else if (conn.chats?.[gid]?.metadata) meta = conn.chats[gid].metadata;
    else if (conn.store?.chats?.[gid]) meta = conn.store.chats[gid].metadata;

    const participants = meta?.participants || [];
    const admins = participants
      .filter(
        (p) =>
          p?.admin === "admin" ||
          p?.admin === "superadmin" ||
          p?.isAdmin ||
          p?.admin === true
      )
      .map((p) => p?.id || p?.jid || p?.participant)
      .filter(Boolean);

    const inviteCode = meta?.inviteCode || meta?.groupInviteCode || meta?.invite || meta?.code || null;
    const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : null;

    return { admins, meta, inviteLink };
  } catch (e) {
    console.error("fetchGroupAdmins error", e);
    return { admins: [], meta: null, inviteLink: null };
  }
}

// Check whether bot is admin in a group
async function isBotAdminInGroup(conn, gid) {
  try {
    const botJid = getBotJid(conn);
    if (!botJid) return { ok: false, botJid: null, isAdmin: false, admins: [] };

    const { admins, meta, inviteLink } = await fetchGroupAdmins(conn, gid);
    const normalized = admins.map((a) => String(a));
    const isAdmin =
      normalized.includes(botJid) ||
      normalized.includes(botJid.replace("@s.whatsapp.net", "@c.us"));
    return { ok: true, botJid, isAdmin, admins: normalized, inviteLink };
  } catch (e) {
    console.error("isBotAdminInGroup error", e);
    return { ok: false, botJid: null, isAdmin: false, admins: [] };
  }
}

// Build and send the "please promote bot" message tagging admins
async function requestAdminPromotion(conn, gid, mek) {
  try {
    const { ok, botJid, isAdmin, admins, inviteLink } = await isBotAdminInGroup(conn, gid);
    if (!ok) {
      try {
        await conn.sendMessage(
          gid,
          { text: "⚠️ Unable to determine bot identity. Please ensure bot is added correctly." },
          { quoted: mek }
        );
      } catch (e) {}
      return false;
    }
    if (isAdmin) return true;

    let text = `⚠️ I need *Group Admin* permission to perform that action.\n\n`;
    text += `👉 Please promote me to admin: @${(botJid || "unknown").split("@")[0]}\n`;
    text += `Bot owner: ${OWNER_DISPLAY}\n\n`;
    text += `Steps for group admins:\n1. Open Group Info → Group Settings → Edit group admins.\n`;
    text += `2. Promote @${(botJid || "unknown").split("@")[0]} (the bot).\n\n`;
    if (inviteLink) text += `If preferred, re-add the bot using this link: ${inviteLink}\n\n`;
    text += `*Why?* The bot needs admin rights for actions like kicking, promoting, creating invite links, etc.`;

    const mentions = [];
    if (botJid) mentions.push(botJid);
    if (admins && admins.length) {
      for (const a of admins) if (a && a !== botJid) mentions.push(a);
    }
    const allowedMentions = mentions.slice(0, 25);

    try {
      await conn.sendMessage(gid, { text, mentions: allowedMentions }, { quoted: mek });
    } catch (e) {
      console.error("send with mentions failed:", e);
      await conn.sendMessage(gid, { text }, { quoted: mek });
    }
    return false;
  } catch (e) {
    console.error("requestAdminPromotion error", e);
    try {
      await conn.sendMessage(gid, { text: "⚠️ Error: couldn't build admin request message." }, { quoted: mek });
    } catch (e) {}
    return false;
  }
}

// Ensure bot is admin before performing admin-only actions
async function ensureBotIsAdmin(conn, m, mek) {
  if (!m.isGroup) return true;
  const gid = m.from;
  const res = await isBotAdminInGroup(conn, gid);
  if (!res.ok) {
    try {
      await conn.sendMessage(gid, { text: "⚠️ Could not determine bot identity; check bot logs." }, { quoted: mek });
    } catch (e) {}
    return false;
  }
  if (res.isAdmin) return true;
  await requestAdminPromotion(conn, gid, mek);
  return false;
}

// Generic group update wrapper (add/promote/demote/remove)
async function groupUpdate(conn, gid, participants, action) {
  try {
    if (typeof conn.groupParticipantsUpdate === "function")
      return await conn.groupParticipantsUpdate(gid, participants, action);

    if (typeof conn.groupUpdate === "function") {
      if (action === "add") return await conn.groupUpdate(gid, { add: participants });
      if (action === "remove") return await conn.groupUpdate(gid, { remove: participants });
      if (action === "promote") return await conn.groupUpdate(gid, { promote: participants });
      if (action === "demote") return await conn.groupUpdate(gid, { demote: participants });
    }

    if (typeof conn.groupMembersUpdate === "function")
      return await conn.groupMembersUpdate(gid, participants, action);

    throw new Error("No supported group update method on conn");
  } catch (e) {
    throw e;
  }
}

// Block/unblock wrapper
async function setBlockStatus(conn, jid, block = true) {
  try {
    if (typeof conn.updateBlockStatus === "function") {
      try {
        return await conn.updateBlockStatus(jid, block ? "block" : "unblock");
      } catch (e) {}
      try {
        return await conn.updateBlockStatus([jid], block ? "block" : "unblock");
      } catch (e) {}
    }
    if (typeof conn.updateBlock === "function") return await conn.updateBlock(jid, block);
    if (typeof conn.blockUser === "function") return await conn.blockUser(jid);
    if (typeof conn.systemBlock === "function") return await conn.systemBlock(jid, block);
    throw new Error("No block API on conn");
  } catch (err) {
    throw err;
  }
}

// ========== COMMANDS ==========

// TAGALL
lite(
  {
    pattern: "tagall",
    react: "📢",
    desc: "Mention everyone in the group",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      const { admins } = await fetchGroupAdmins(conn, m.from);
      if (!admins.includes(sender) && !isOwner(sender))
        return reply("❌ Only group admins or owner can use this.");

      let mentions = [];
      try {
        const meta = await conn.groupMetadata(m.from);
        const parts = meta?.participants || [];
        mentions = parts.map((p) => p.id || p.jid || p.participant).filter(Boolean);
      } catch (e) {
        mentions = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      }

      if (!mentions.length) return reply("⚠️ Could not fetch group participants to mention.");
      const text = `📣 Mentioning everyone (${mentions.length})`;
      await conn.sendMessage(m.from, { text, mentions }, { quoted: mek });
    } catch (err) {
      console.error(".tagall error", err);
      try {
        reply("❌ Failed to run tagall.");
      } catch (e) {}
    }
  }
);

// TAG
lite(
  {
    pattern: "tag",
    react: "🔖",
    desc: "Tag specific members (reply or @mentions or numbers)",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      const { admins } = await fetchGroupAdmins(conn, m.from);
      if (!admins.includes(sender) && !isOwner(sender))
        return reply("❌ Only group admins or owner can use this.");

      if (m.quoted) {
        const target = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        if (!target) return reply("⚠️ Unable to find the replied user.");
        return await conn.sendMessage(
          m.from,
          { text: `@${target.split("@")[0]}`, mentions: [target] },
          { quoted: mek }
        );
      }

      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length)
        return await conn.sendMessage(
          m.from,
          { text: `Tagging ${mentioned.length} user(s).`, mentions: mentioned },
          { quoted: mek }
        );

      const parts = (m.text || m.message?.conversation || "").trim().split(/\s+/).slice(1);
      if (!parts.length) return reply("Usage: .tag <numbers or reply to user>");
      const jids = parts.map((p) => jidFromNumber(p)).filter(Boolean);
      if (!jids.length) return reply("⚠️ No valid numbers detected.");
      await conn.sendMessage(m.from, { text: `Tagging ${jids.length} user(s).`, mentions: jids }, { quoted: mek });
    } catch (err) {
      console.error(".tag error", err);
      try {
        reply("❌ Failed to run tag.");
      } catch (e) {}
    }
  }
);

// KICK
lite(
  {
    pattern: "kick",
    react: "✂️",
    desc: "Kick mentioned users or replied user",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      const { admins } = await fetchGroupAdmins(conn, m.from);
      if (!admins.includes(sender) && !isOwner(sender))
        return reply("❌ Only group admins or owner can use this.");

      const ok = await ensureBotIsAdmin(conn, m, mek);
      if (!ok) return; // ensureBotIsAdmin will have requested promotion

      let targets = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.quoted && !targets.length) {
        const t = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        if (t) targets.push(t);
      }
      if (!targets.length) {
        const args = (m.text || m.message?.conversation || "").split(/\s+/).slice(1);
        targets = args.map((a) => jidFromNumber(a)).filter(Boolean);
      }
      if (!targets.length) return reply("Usage: reply to user with .kick or .kick @tag or .kick 9477xxxxxxx");

      try {
        await groupUpdate(conn, m.from, targets, "remove");
        await reply(`✅ Removed ${targets.length} user(s).`);
      } catch (e) {
        console.error(".kick groupUpdate failed", e);
        await reply("❌ Failed to remove; make sure bot is group admin and has permission.");
      }
    } catch (err) {
      console.error(".kick error", err);
      try {
        reply("❌ Failed to run kick.");
      } catch (e) {}
    }
  }
);

// KICKADMIN (owner-only)
lite(
  {
    pattern: "kickadmin",
    react: "👑✂️",
    desc: "Owner-only: kick admins (dangerous!)",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      if (!isOwner(sender)) return reply("❌ Only the bot owner can use kickadmin.");

      const ok = await ensureBotIsAdmin(conn, m, mek);
      if (!ok) return;

      let targets = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.quoted && !targets.length) {
        const t = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        if (t) targets.push(t);
      }
      if (!targets.length) return reply("Usage: .kickadmin @admin or reply to admin with .kickadmin");

      try {
        await groupUpdate(conn, m.from, targets, "remove");
        await reply(`✅ Owner removed ${targets.length} admin(s).`);
      } catch (e) {
        console.error(".kickadmin failed", e);
        await reply("❌ Failed to remove admin(s). Ensure bot has superadmin privileges.");
      }
    } catch (err) {
      console.error(".kickadmin error", err);
    }
  }
);

// KICKALL (owner-only)
lite(
  {
    pattern: "kickall",
    react: "🧹",
    desc: "Owner-only: kick all non-admin members",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      if (!isOwner(sender)) return reply("❌ Only the bot owner can use kickall.");

      const ok = await ensureBotIsAdmin(conn, m, mek);
      if (!ok) return;

      const meta = await conn.groupMetadata(m.from);
      const parts = meta?.participants || [];
      const admins = parts
        .filter((p) => p.admin === "admin" || p.admin === "superadmin" || p.isAdmin)
        .map((p) => p.id || p.jid || p.participant);
      const toKick = parts
        .map((p) => p.id || p.jid || p.participant)
        .filter((j) => !admins.includes(j) && !isOwner(j));

      if (!toKick.length) return reply("⚠️ No members to kick (everyone is admin or owner).");
      const batchSize = 5;
      for (let i = 0; i < toKick.length; i += batchSize) {
        const batch = toKick.slice(i, i + batchSize);
        try {
          await groupUpdate(conn, m.from, batch, "remove");
        } catch (e) {
          console.error("kickall batch failed", e);
        }
      }
      await reply(`✅ Attempted to remove ${toKick.length} member(s).`);
    } catch (err) {
      console.error(".kickall error", err);
      try {
        reply("❌ Failed to run kickall.");
      } catch (e) {}
    }
  }
);

// ADD (add numbers to group)
lite(
  {
    pattern: "add",
    react: "➕",
    desc: "Add number(s) to the group. Usage: .add 9477xxxx 9476yyyy",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      const { admins } = await fetchGroupAdmins(conn, m.from);
      if (!admins.includes(sender) && !isOwner(sender))
        return reply("❌ Only group admins or owner can use this.");

      const args = (m.text || m.message?.conversation || "").split(/\s+/).slice(1);
      if (!args.length) return reply("Usage: .add 9477xxxxxxx 9476yyyyyyy");
      const jids = args.map((a) => jidFromNumber(a)).filter(Boolean);
      if (!jids.length) return reply("⚠️ No valid numbers found.");

      const ok = await ensureBotIsAdmin(conn, m, mek);
      if (!ok) return;

      try {
        await groupUpdate(conn, m.from, jids, "add");
        await reply(`✅ Attempted to add ${jids.length} user(s).`);
      } catch (e) {
        console.error(".add failed", e);
        await reply("❌ Failed to add users. Make sure bot is group admin with invite permission.");
      }
    } catch (err) {
      console.error(".add error", err);
    }
  }
);

// PROMOTE
lite(
  {
    pattern: "promote",
    react: "🟢",
    desc: "Promote mentioned users to admin",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      const { admins } = await fetchGroupAdmins(conn, m.from);
      if (!admins.includes(sender) && !isOwner(sender))
        return reply("❌ Only group admins or owner can use this.");

      const ok = await ensureBotIsAdmin(conn, m, mek);
      if (!ok) return;

      const targets = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.quoted && !targets.length) {
        const t = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        if (t) targets.push(t);
      }
      if (!targets.length) return reply("Usage: .promote @user or reply to user with .promote");

      try {
        await groupUpdate(conn, m.from, targets, "promote");
        await reply(`✅ Promoted ${targets.length} user(s).`);
      } catch (e) {
        console.error(".promote failed", e);
        await reply("❌ Failed to promote. Make sure bot is group admin and can promote.");
      }
    } catch (err) {
      console.error(".promote error", err);
    }
  }
);

// DEMOTE
lite(
  {
    pattern: "demote",
    react: "🔴",
    desc: "Demote mentioned admins",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only in groups.");
      const sender = getSenderId(m);
      const { admins } = await fetchGroupAdmins(conn, m.from);
      if (!admins.includes(sender) && !isOwner(sender))
        return reply("❌ Only group admins or owner can use this.");

      const ok = await ensureBotIsAdmin(conn, m, mek);
      if (!ok) return;

      const targets = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.quoted && !targets.length) {
        const t = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        if (t) targets.push(t);
      }
      if (!targets.length) return reply("Usage: .demote @user or reply to admin with .demote");

      try {
        await groupUpdate(conn, m.from, targets, "demote");
        await reply(`✅ Demoted ${targets.length} user(s).`);
      } catch (e) {
        console.error(".demote failed", e);
        await reply("❌ Failed to demote. Make sure bot is group admin and can demote.");
      }
    } catch (err) {
      console.error(".demote error", err);
    }
  }
);

// BLOCK (owner-only, works in owner inbox)
lite(
  {
    pattern: "block",
    react: "⛔",
    desc: "Owner-only: block a user",
    category: "owner",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      const sender = getSenderId(m);
      if (!isOwner(sender)) return reply("❌ Only bot owner can use this command.");

      let target = null;
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length) target = mentioned[0];
      else if (m.quoted) target = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
      else {
        const args = (m.text || m.message?.conversation || "").split(/\s+/).slice(1);
        if (args.length) target = jidFromNumber(args[0]);
      }
      if (!target) return reply("Usage: .block 9477xxxx OR reply to user with .block or mention user.");

      try {
        await setBlockStatus(conn, target, true);
        await reply(`✅ Blocked ${target}`);
      } catch (e) {
        console.error(".block failed", e);
        await reply("❌ Failed to block the user. Your lib may not support block API or wrong jid format.");
      }
    } catch (err) {
      console.error(".block error", err);
    }
  }
);

// UNBLOCK (owner-only, works in owner inbox)
lite(
  {
    pattern: "unblock",
    react: "✅",
    desc: "Owner-only: unblock a user",
    category: "owner",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      const sender = getSenderId(m);
      if (!isOwner(sender)) return reply("❌ Only bot owner can use this command.");

      let target = null;
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length) target = mentioned[0];
      else if (m.quoted) target = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
      else {
        const args = (m.text || m.message?.conversation || "").split(/\s+/).slice(1);
        if (args.length) target = jidFromNumber(args[0]);
      }
      if (!target) return reply("Usage: .unblock 9477xxxx OR reply to user with .unblock or mention user.");

      try {
        await setBlockStatus(conn, target, false);
        await reply(`✅ Unblocked ${target}`);
      } catch (e) {
        console.error(".unblock failed", e);
        await reply("❌ Failed to unblock the user. Your lib may not support unblock API or wrong jid format.");
      }
    } catch (err) {
      console.error(".unblock error", err);
    }
  }
);

// CHECKADMIN
lite(
  {
    pattern: "checkadmin",
    react: "🔎",
    desc: "Check whether bot is admin in this group and, if not, request promotion",
    category: "utils",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    try {
      if (!m.isGroup) return reply("❌ This command works only inside groups.");
      const gid = m.from;
      const result = await isBotAdminInGroup(conn, gid);
      if (!result.ok) return reply("⚠️ Couldn't determine bot identity. Check logs.");
      if (result.isAdmin) return reply("✅ I am an admin in this group.");
      await requestAdminPromotion(conn, gid, mek);
    } catch (e) {
      console.error(".checkadmin error", e);
      try {
        reply("❌ Error while checking admin status.");
      } catch (err) {}
    }
  }
);

// Export helper globally so other plugins can use it (optional)
try {
  if (typeof global !== "undefined") global.ensureBotIsAdmin = ensureBotIsAdmin;
} catch (e) {}

// Export module
module.exports = { ensureBotIsAdmin };
