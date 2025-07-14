#!/bin/bash

echo "🔧 FFmpeg Installation - Alternative Methods"
echo "==========================================="

# Method 1: Try with --nobest to use alternative packages
echo "Method 1: Installing with --nobest flag..."
sudo dnf install -y --nobest ffmpeg

if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully with --nobest!"
    ffmpeg -version | head -1
    exit 0
fi

# Method 2: Try installing minimal ffmpeg
echo "Method 2: Installing ffmpeg-free (minimal version)..."
sudo dnf install -y ffmpeg-free

if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg-free installed successfully!"
    ffmpeg -version | head -1
    exit 0
fi

# Method 3: Install from flatpak
echo "Method 3: Installing via Flatpak..."
sudo dnf install -y flatpak
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install -y flathub org.ffmpeg.FFmpeg

if flatpak list | grep -q ffmpeg; then
    echo "✅ FFmpeg installed via Flatpak!"
    echo "Creating wrapper script..."
    sudo tee /usr/local/bin/ffmpeg > /dev/null << 'EOF'
#!/bin/bash
flatpak run org.ffmpeg.FFmpeg "$@"
EOF
    sudo chmod +x /usr/local/bin/ffmpeg
    exit 0
fi

# Method 4: Build from source (last resort)
echo "Method 4: Installing dependencies for Node.js workaround..."
sudo dnf install -y nodejs npm python3 make gcc gcc-c++

echo "All methods attempted. Checking if any version works..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ Some version of FFmpeg is available!"
    ffmpeg -version | head -1
else
    echo "❌ FFmpeg installation failed with all methods."
    echo "Will try Node.js fallback approach..."
fi
