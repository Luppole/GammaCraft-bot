#!/bin/bash

echo "🎵 GammaCraft Music Bot - Oracle Linux 9 Setup"
echo "=============================================="

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found! Installing..."
    
    # Enable EPEL repository for FFmpeg
    sudo dnf install -y epel-release
    
    # Install FFmpeg
    sudo dnf install -y ffmpeg
    
    # Verify installation
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpeg installed successfully!"
        ffmpeg -version | head -1
    else
        echo "❌ FFmpeg installation failed!"
        exit 1
    fi
else
    echo "✅ FFmpeg is already installed"
    ffmpeg -version | head -1
fi

# Install Node.js dependencies if needed
echo "📦 Checking Node.js dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🎵 Music Bot Setup Complete!"
echo "=============================="
echo "✅ FFmpeg: Installed and ready"
echo "✅ Dependencies: Installed"
echo "✅ Project: Built successfully"
echo ""
echo "🚀 You can now start the bot with: npm start"
echo ""
echo "🎵 Available Music Commands:"
echo "• /play [שיר] - Play music from YouTube"
echo "• /queue - View current queue"
echo "• /skip - Skip current song"
echo "• /pause - Pause/resume music"
echo "• /stop - Stop music and clear queue"
echo "• /volume [0-100] - Set volume"
echo "• /shuffle - Shuffle queue"
echo "• /loop [mode] - Set repeat mode"
echo "• /disconnect - Disconnect from voice channel"
echo ""
