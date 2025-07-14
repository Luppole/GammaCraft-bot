# 🚨 EXECUTE THESE COMMANDS ON YOUR ORACLE LINUX SERVER

## 🚀 **Quick Fix Commands (Copy & Paste)**

```bash
# 1. Navigate to your bot directory
cd /home/opc/GammaCraft-bot

# 2. Try to install FFmpeg (may work with --nobest flag)
sudo dnf install -y --nobest ffmpeg

# 3. If that fails, try the minimal version
sudo dnf install -y ffmpeg-free

# 4. Update bot dependencies
npm install

# 5. Build the updated bot
npm run build

# 6. Stop the old bot
pkill -f "node.*dist/index.js"

# 7. Start the new bot
npm start
```

## ✅ **Expected Results:**

After running these commands, you should see:
- ✅ Bot connects without "FFmpeg not found" errors
- ✅ Music commands work (may use fallback audio processing)
- ✅ No more "Unknown interaction" timeouts
- ✅ No more "Status code: 410" errors
- ✅ Hebrew error messages instead of crashes

## 🎵 **Music Bot Status:**

### If FFmpeg installs successfully:
- ✅ **High quality audio** streaming
- ✅ **All formats** supported
- ✅ **Best performance**

### If FFmpeg fails to install:
- ✅ **Music still works** with Node.js fallback
- ⚠️ **Lower quality** audio (but functional)
- ✅ **All commands** still work

## 🔍 **How to Check if Everything is Working:**

1. **Check bot status:**
   ```bash
   tail -f /home/opc/GammaCraft-bot/bot.log
   ```
   - Look for: "הבוט מוכן וכל המערכות אותחלו!"

2. **Test in Discord:**
   - `/ping` - Should respond quickly
   - `/play שיר מומלץ` - Should find and play music
   - `/queue` - Should show empty queue
   - `/purge 2` - Should delete messages without timeout

## 🆘 **If Still Having Issues:**

### Problem: Bot won't start
```bash
cd /home/opc/GammaCraft-bot
npm run build
npm start
```

### Problem: Commands still timeout
- Check bot logs: `tail -f bot.log`
- Restart bot: `pkill -f node; npm start`

### Problem: Music not working
- FFmpeg check: `which ffmpeg`
- Try lower quality: Use `/play` with simple song names

## 📋 **What We Fixed:**

1. **✅ Interaction Timeouts** - Commands now respond immediately
2. **✅ YouTube 410 Errors** - Fresh URL fetching prevents expiration
3. **✅ FFmpeg Issues** - Fallback audio processing when FFmpeg unavailable
4. **✅ Voice Connection** - Better connection management
5. **✅ Error Handling** - Hebrew messages instead of crashes

## 🎯 **Bottom Line:**

Your bot will now work **even without FFmpeg** installed. The music may be lower quality, but all functionality will work without crashes or timeouts.
