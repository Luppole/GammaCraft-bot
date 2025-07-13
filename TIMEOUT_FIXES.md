# 🚀 Timeout Fixes for Minecraft Commands

## Issue
Commands were timing out and causing "Unknown interaction" errors because:
- Minecraft server status checks were taking too long (5+ seconds)
- RCON connections were slow
- Discord has a strict 15-second interaction timeout

## ⚡ Speed Optimizations Applied

### 1. **Server Status Checks** - Reduced from 5s to 2-3s
- **mcinfo**: 3-second timeout with Promise.race
- **mcplayers**: 3-second timeout with Promise.race  
- **mcstats**: 2-second timeout with Promise.race

### 2. **RCON Connection** - Added 3s connection + 2s command timeouts
- **mcchat**: RCON connect timeout (3s) + command timeout (2s)
- Prevents hanging on unreachable RCON servers

### 3. **Image Loading** - Immediate response
- **mcskin**: No longer waits for image validation
- Uses Discord's built-in image loading

### 4. **Global Timeout** - Reduced from 14s to 10s
- All commands must respond within 10 seconds
- Better error handling for timeouts

## 🔧 Technical Changes

```typescript
// Before: Slow status check
const serverStatus = await status(IP, PORT, { timeout: 5000 });

// After: Fast with timeout race
const serverStatus = await Promise.race([
    status(IP, PORT, { timeout: 3000 }),
    new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Server check timeout')), 3000)
    )
]);
```

## 📊 Expected Results

| Command | Old Response Time | New Response Time |
|---------|-------------------|-------------------|
| `/mcinfo` | 5-15 seconds | 1-4 seconds |
| `/mcplayers` | 5-15 seconds | 1-4 seconds |
| `/mcstats` | 5-15 seconds | 1-3 seconds |
| `/mcskin` | 3-10 seconds | 1-2 seconds |
| `/mcchat start` | 10+ seconds | 2-6 seconds |

## 🎯 Benefits

✅ **No more "Unknown interaction" errors**  
✅ **Faster command responses**  
✅ **Better user experience**  
✅ **Graceful timeout handling**  
✅ **Commands fail fast instead of hanging**  

## 🔄 To Deploy

```bash
# On your VM:
cd ~/GammaCraft-bot
git pull origin main
npm run build
# Restart bot
```

The commands should now respond much faster and eliminate the timeout errors! 🚀
