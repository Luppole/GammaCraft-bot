#!/bin/bash

echo "🎵 Installing FFmpeg on Oracle Linux 9..."
echo "========================================"

# Update system packages
echo "📦 Updating system packages..."
sudo dnf update -y

# Enable EPEL repository (Extra Packages for Enterprise Linux)
echo "📦 Enabling EPEL repository..."
sudo dnf install -y epel-release

# Enable RPM Fusion repositories for additional codecs
echo "📦 Enabling RPM Fusion repositories..."
sudo dnf install -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
sudo dnf install -y --nogpgcheck https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-$(rpm -E %rhel).noarch.rpm

# Install FFmpeg
echo "🎵 Installing FFmpeg..."
sudo dnf install -y ffmpeg ffmpeg-devel

# Verify installation
echo "✅ Verifying FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully!"
    ffmpeg -version | head -1
    echo ""
    echo "🎵 FFmpeg is ready for Discord music bot!"
else
    echo "❌ FFmpeg installation failed!"
    echo "Try installing manually with:"
    echo "sudo dnf install -y ffmpeg"
    exit 1
fi

echo ""
echo "🎵 FFmpeg Setup Complete!"
echo "========================"
echo "✅ FFmpeg: $(ffmpeg -version | head -1)"
echo "✅ Your Discord music bot can now process audio!"
echo ""
