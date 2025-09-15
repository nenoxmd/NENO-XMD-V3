// plugins/update.js
const { lite } = require('../lite');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { exec } = require('child_process');

let fetchFn;
try {
  fetchFn = require('node-fetch'); // prefer node-fetch if installed
} catch (e) {
  if (typeof fetch !== 'undefined') fetchFn = fetch; // Node 18+ global fetch
  else throw new Error('Please install node-fetch or use Node >= 18 (global fetch available).');
}

const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// parse github url to owner/repo
function parseGithubUrl(url) {
  if (!url) return null;
  url = url.trim();
  try {
    if (url.startsWith('git@')) {
      const parts = url.split(':')[1].replace(/\.git$/, '');
      const [owner, repo] = parts.split('/');
      return { owner, repo };
    } else {
      const u = new URL(url);
      const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/');
      if (parts.length < 2) return null;
      return { owner: parts[0], repo: parts[1] };
    }
  } catch (e) {
    return null;
  }
}

async function downloadToFile(url, dest, headers = {}) {
  const res = await fetchFn(url, { headers });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${res.statusText} for ${url}`);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await streamPipeline(res.body, fs.createWriteStream(dest));
}

async function fetchJson(url, headers = {}) {
  const res = await fetchFn(url, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(()=>null);
    throw new Error(`GitHub API ${res.status} ${res.statusText} ${txt?'- '+txt.slice(0,200):''}`);
  }
  return res.json();
}

// download repoPath (plugins) recursively to localDest using GitHub Contents API
async function downloadRepoPath({ owner, repo, repoPath = 'plugins', branch = 'main', localDest = './plugins', token }) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`;
  const headers = { 'User-Agent': 'node' };
  if (token) headers.Authorization = `token ${token}`;

  async function walker(apiUrl, destBase) {
    const res = await fetchFn(apiUrl, { headers });
    if (!res.ok) {
      const txt = await res.text().catch(()=>null);
      throw new Error(`GitHub API error ${res.status} ${res.statusText} ${txt?'- '+txt.slice(0,200):''}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Path not found or not a directory in repo: ' + apiUrl);
    for (const item of data) {
      if (item.type === 'dir') {
        await walker(item.url, path.join(destBase, item.name));
      } else if (item.type === 'file') {
        const destPath = path.join(destBase, item.name);
        await fsp.mkdir(path.dirname(destPath), { recursive: true });
        if (!item.download_url) throw new Error('Missing download_url for ' + item.path);
        await downloadToFile(item.download_url, destPath, headers);
      } // ignore symlink/submodule
    }
  }

  await walker(apiBase, localDest);
}

// remove folder recursively
async function removeFolder(p) {
  await fsp.rm(p, { recursive: true, force: true }).catch(()=>{});
}

lite({
  pattern: "update",
  react: "🔄",
  desc: "Update only plugins/ folder from GitHub (no backup). Usage: .update [repo_url] [branch]",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { q, reply, from }) => {
  try {
    await reply("📥 Starting plugins update... This will replace your local plugins/ folder (no backup).");

    // parse args: .update [repoUrl] [branch]
    let repoUrl = null;
    let branch = 'main';
    if (q) {
      const parts = q.split(/\s+/).filter(Boolean);
      repoUrl = parts[0];
      if (parts[1]) branch = parts[1];
    }

    // default repo
    if (!repoUrl) repoUrl = "https://github.com/Nimeshkamihiran/NENO-XMD-V3.git";

    const parsed = parseGithubUrl(repoUrl);
    if (!parsed) return reply("❌ Invalid GitHub repository URL. Example: https://github.com/owner/repo.git");

    const { owner, repo } = parsed;
    const tmpDir = path.join(process.cwd(), `.tmp_plugins_${Date.now()}`);
    const tmpPlugins = path.join(tmpDir, 'plugins');
    const localPlugins = path.join(process.cwd(), 'plugins');

    // create temp
    await fsp.mkdir(tmpPlugins, { recursive: true });

    // GitHub token optional (set env GITHUB_TOKEN to increase rate limits)
    const token = process.env.GITHUB_TOKEN || null;

    // Download plugins folder to tmp
    await conn.sendMessage(from, { text: `📡 Downloading plugins/ from ${owner}/${repo}@${branch} ...` }, { quoted: mek });
    try {
      await downloadRepoPath({ owner, repo, repoPath: 'plugins', branch, localDest: tmpPlugins, token });
    } catch (e) {
      // cleanup tmp
      await removeFolder(tmpDir).catch(()=>{});
      return reply(`❌ Failed to download plugins/: ${e.message}`);
    }

    // remove existing local plugins folder (NO BACKUP as requested)
    await removeFolder(localPlugins);

    // move tmp/plugins -> local plugins
    await fsp.mkdir(path.dirname(localPlugins), { recursive: true });
    // rename (move)
    await fsp.rename(tmpPlugins, localPlugins);

    // remove tmpDir if any left
    await removeFolder(tmpDir).catch(()=>{});

    await conn.sendMessage(from, { text: `✅ plugins/ replaced from ${owner}/${repo}@${branch} successfully.` }, { quoted: mek });

    // attempt restart via pm2 (best effort)
    exec("pm2 restart all", (err) => {
      if (err) {
        conn.sendMessage(from, { text: `⚠️ Updated but failed to restart with pm2: ${err.message}` }, { quoted: mek });
      } else {
        conn.sendMessage(from, { text: "🔁 Bot restarted (pm2 restart all)." }, { quoted: mek });
      }
    });

  } catch (err) {
    console.error("Update (plugins only) error:", err);
    reply(`❌ Unexpected error: ${err.message || err}`);
  }
});
