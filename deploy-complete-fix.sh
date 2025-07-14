#!/bin/bash

echo "🚀 GammaCraft Bot - COMPLETE FIX DEPLOYMENT"
echo "==========================================="
echo ""

# Step 1: Install FFmpeg (CRITICAL)
echo "📦 Step 1: Installing FFmpeg..."
echo "------------------------------"

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found! Installing now..."
    
    # Update system
    sudo dnf update -y
    
    # Enable EPEL repository
    sudo dnf install -y epel-release
    
    # Enable RPM Fusion for additional codecs
    sudo dnf install -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
    sudo dnf install -y --nogpgcheck https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-$(rpm -E %rhel).noarch.rpm
    
    # Install FFmpeg
    sudo dnf install -y ffmpeg ffmpeg-devel
    
    # Verify installation
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpeg installed successfully!"
        ffmpeg -version | head -1
    else
        echo "❌ FFmpeg installation FAILED!"
        echo "MANUAL INSTALLATION REQUIRED:"
        echo "sudo dnf install -y epel-release"
        echo "sudo dnf install -y ffmpeg"
        exit 1
    fi
else
    echo "✅ FFmpeg is already installed"
    ffmpeg -version | head -1
fi

echo ""

# Step 2: Install/Update Node.js dependencies
echo "📦 Step 2: Installing Node.js dependencies..."
echo "--------------------------------------------"
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Dependency installation failed!"
    exit 1
fi

echo ""

# Step 3: Build the project
echo "🔨 Step 3: Building the project..."
echo "--------------------------------"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""

# Step 4: Stop existing bot process (if running)
echo "⏹️ Step 4: Stopping existing bot process..."
echo "------------------------------------------"
pkill -f "node.*dist/index.js" || echo "No existing bot process found"
sleep 2

echo ""

# Step 5: Start the bot
echo "🚀 Step 5: Starting the bot..."
echo "----------------------------"
echo "Starting bot in the background..."
nohup npm start > bot.log 2>&1 &

# Wait a moment and check if it started
sleep 5

if pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "✅ Bot started successfully!"
    echo "📋 Process ID: $(pgrep -f 'node.*dist/index.js')"
    echo "📝 Logs: tail -f bot.log"
else
    echo "❌ Bot failed to start!"
    echo "📝 Check logs: cat bot.log"
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "✅ FFmpeg: Installed and working"
echo "✅ Dependencies: Updated"
echo "✅ Project: Built successfully"
echo "✅ Bot: Running in background"
echo ""
echo "🔍 Monitor the bot:"
echo "• Logs: tail -f bot.log"
echo "• Stop: pkill -f 'node.*dist/index.js'"
echo "• Restart: npm start"
echo ""
echo "🎵 Music Bot Features:"
echo "• Fixed interaction timeouts ✅"
echo "• Fixed YouTube 410 errors ✅"
echo "• Improved error handling ✅"
echo "• Hebrew error messages ✅"
echo ""
echo "🎮 Test these commands in Discord:"
echo "• /play שיר - Test music functionality"
echo "• /purge 5 - Test message deletion"
echo "• /ping - Test basic response"
echo ""
