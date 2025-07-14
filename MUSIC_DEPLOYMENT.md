# 🎵 GammaCraft Music Bot - Oracle Linux 9 Deployment Guide

## 🚀 Quick Setup (Run these commands on your Oracle Linux server)

### 1. Install FFmpeg (CRITICAL for music functionality)
```bash
# Enable repositories
sudo dnf install -y epel-release
sudo dnf install -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm

# Install FFmpeg
sudo dnf install -y ffmpeg

# Verify installation
ffmpeg -version
```

### 2. Update your bot files
```bash
# Navigate to your bot directory
cd /home/opc/GammaCraft-bot

# Pull latest changes (if using git)
git pull

# Install/update dependencies
npm install

# Build the project
npm run build

# Start the bot
npm start
```

## ❌ Current Issues & Solutions

### Issue 1: FFmpeg Not Found
**Error:** `Error: FFmpeg/avconv not found!`
**Solution:** Install FFmpeg using the commands above

### Issue 2: YouTube URL Expiration
**Error:** `Status code: 410` (Gone)
**Solution:** ✅ Fixed in latest code - better URL handling and error recovery

### Issue 3: Bot Deafened
**Solution:** ✅ Fixed - bot no longer deafens itself in voice channels

## 🎵 Music Commands (Hebrew Interface)

### User Commands:
- `/play [שיר]` - נגן מוזיקה מיוטיוב
- `/queue [עמוד]` - הצג תור השירים
- `/skip` - דלג על השיר הנוכחי
- `/pause` - השהה/המשך מוזיקה
- `/nowplaying` - הצג השיר הנוכחי
- `/volume [0-100]` - שנה עוצמת קול
- `/shuffle` - ערבב התור
- `/loop [מצב]` - הגדר מצב חזרה

### Admin Commands:
- `/stop` - עצור מוזיקה ונקה התור
- `/disconnect` - נתק מערוץ קולי
- `/clearqueue` - נקה התור

## 🔧 Troubleshooting

### If music still doesn't work after installing FFmpeg:
1. Restart the bot: `npm start`
2. Check FFmpeg installation: `which ffmpeg`
3. Check bot permissions in Discord voice channel
4. Make sure you're in a voice channel before using `/play`

### If getting 410 errors:
- ✅ Fixed in latest code
- Bot now handles expired URLs automatically
- Will show Hebrew error messages and skip to next song

## 📋 System Requirements
- ✅ Oracle Linux 9
- ✅ Node.js 18+
- ✅ FFmpeg (install with commands above)
- ✅ Discord Bot Token
- ✅ Voice channel permissions

## 🎯 Success Indicators
When everything works correctly, you should see:
- ✅ Bot connects to voice channel
- ✅ "מתחיל לנגן" message appears
- ✅ Audio plays in voice channel
- ✅ Queue system works properly

## 🆘 Still Having Issues?
1. Check server logs for specific errors
2. Verify FFmpeg: `ffmpeg -version`
3. Restart bot after installing FFmpeg
4. Make sure bot has voice permissions in Discord
