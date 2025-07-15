#!/bin/bash

echo "🚀 Deploying interaction fixes..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

echo "✅ Build successful!"

# Stop the current bot process
echo "🛑 Stopping current bot..."
pkill -f "node.*dist/index.js" || echo "No running bot process found"

# Wait a moment for the process to fully stop
sleep 2

# Start the bot
echo "🚀 Starting bot with fixes..."
npm start

echo "✅ Bot deployed with interaction fixes!"
echo ""
echo "🎯 Fixed commands:"
echo "   - /mcinfo (can be run multiple times)"
echo "   - /mcplayers (no more timeouts)"
echo "   - /mcserver create (fixed Unknown interaction error)"
echo "   - /mcskin (improved error handling)"
echo ""
echo "🧪 Test these commands to verify the fixes work!"
