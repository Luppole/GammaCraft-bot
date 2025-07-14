#!/bin/bash

echo "🚀 FINAL DEPLOYMENT - GammaCraft Bot with FFmpeg Workaround"
echo "=========================================================="
echo ""

# Navigate to bot directory
cd /home/opc/GammaCraft-bot || { echo "❌ Bot directory not found!"; exit 1; }

echo "📦 Step 1: Trying FFmpeg installation methods..."
echo "----------------------------------------------"

# Method 1: Try standard installation with --nobest
echo "Attempting FFmpeg installation with --nobest..."
sudo dnf install -y --nobest ffmpeg 2>/dev/null

if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully!"
    ffmpeg -version | head -1
else
    echo "⚠️ FFmpeg installation failed - continuing with workaround..."
    
    # Method 2: Try ffmpeg-free (minimal version)
    echo "Trying ffmpeg-free..."
    sudo dnf install -y ffmpeg-free 2>/dev/null
    
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpeg-free installed!"
        ffmpeg -version | head -1
    else
        echo "⚠️ Using Node.js audio processing fallback..."
    fi
fi

echo ""
echo "📦 Step 2: Installing/updating Node.js dependencies..."
echo "----------------------------------------------------"
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo ""
echo "🔨 Step 3: Building the project..."
echo "--------------------------------"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "⏹️ Step 4: Stopping existing bot..."
echo "----------------------------------"
pkill -f "node.*dist/index.js" 2>/dev/null || echo "No existing bot process found"
sleep 3

echo ""
echo "🚀 Step 5: Starting the bot..."
echo "----------------------------"

# Create a startup log
echo "$(date): Starting GammaCraft bot..." >> startup.log

# Start the bot in background
nohup npm start > bot.log 2>&1 &
BOT_PID=$!

echo "Bot started with PID: $BOT_PID"
sleep 5

# Check if bot is running
if ps -p $BOT_PID > /dev/null 2>&1; then
    echo "✅ Bot is running successfully!"
    echo "📋 Process ID: $BOT_PID"
    
    # Show recent logs
    echo ""
    echo "📝 Recent bot logs:"
    echo "=================="
    tail -10 bot.log
    
else
    echo "❌ Bot failed to start!"
    echo ""
    echo "📝 Error logs:"
    echo "============="
    cat bot.log
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"

# Check what audio processing is available
if command -v ffmpeg &> /dev/null; then
    echo "✅ Audio Processing: FFmpeg available"
    ffmpeg -version | head -1
else
    echo "⚠️ Audio Processing: Node.js fallback mode"
    echo "   Music will work with reduced quality"
fi

echo "✅ Bot Status: Running (PID: $BOT_PID)"
echo "✅ Dependencies: Installed"
echo "✅ Build: Successful"
echo ""
echo "🔍 Monitor the bot:"
echo "• View logs: tail -f /home/opc/GammaCraft-bot/bot.log"
echo "• Stop bot: pkill -f 'node.*dist/index.js'"
echo "• Restart: cd /home/opc/GammaCraft-bot && npm start"
echo ""
echo "🎮 Test these commands in Discord:"
echo "• /ping - Test basic connectivity"
echo "• /play שיר בדיקה - Test music functionality"
echo "• /purge 2 - Test moderation commands"
echo ""
echo "📊 Bot Features:"
echo "✅ Interaction timeout fixes"
echo "✅ YouTube 410 error handling"
echo "✅ Audio processing fallbacks"
echo "✅ Hebrew error messages"
echo "✅ Automatic error recovery"
echo ""
