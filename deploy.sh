#!/bin/bash

# Deploy script for Oracle Linux 9
echo "🚀 Deploying GammaCraft Bot to Oracle Linux 9..."

# Update system packages
echo "📦 Updating system packages..."
sudo dnf update -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "⚠️  Please log out and back in for Docker permissions to take effect"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p resources
chmod 755 data

# Build and start the bot
echo "🏗️  Building and starting the bot..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Deployment complete!"
echo "📋 Use 'docker-compose logs -f' to view bot logs"
echo "🔄 Use 'docker-compose restart' to restart the bot"
echo "⏹️  Use 'docker-compose down' to stop the bot"
