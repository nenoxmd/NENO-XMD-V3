const { lite } = require('../lite');
const { exec } = require('child_process');

lite({
  pattern: "update",
  react: "🔄",
  desc: "Update bot from GitHub and restart",
  category: "owner",
  filename: __filename
},
async (conn, mek, m, { reply }) => {
  try {
    reply("📥 Pulling latest updates from GitHub...");

    // GitHub repo update
    exec("git pull https://github.com/Nimeshkamihiran/NENO-XMD-V3.git", (err, stdout, stderr) => {
      if (err) {
        console.error("Git Pull Error:", err);
        return reply(`❌ Error while pulling updates:\n${stderr}`);
      }

      // Check if there were any updates
      if (stdout.includes("Already up to date.")) {
        return reply("✅ Bot is already up to date.");
      } else {
        reply("✅ Update completed successfully! Restarting bot... 🔄");

        // Restart the bot using PM2
        exec("pm2 restart all", (restartErr, restartOut, restartErrOut) => {
          if (restartErr) {
            console.error("Restart Error:", restartErr);
            return reply(`❌ Error while restarting:\n${restartErrOut}`);
          }
          console.log("Bot restarted successfully.");
        });
      }
    });
  } catch (error) {
    console.error("Update Command Error:", error);
    reply(`❌ Unexpected error:\n${error.message}`);
  }
});
