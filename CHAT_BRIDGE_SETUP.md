# Minecraft-Discord Chat Bridge Setup Guide

## 🎮 Overview
The chat bridge allows real-time communication between your Minecraft server and Discord. Messages sent in Discord will appear in Minecraft, and vice versa (with proper server-side setup).

## 🔧 Prerequisites

### 1. Enable RCON on your Minecraft server

Add these lines to your `server.properties` file:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password_here
```

### 2. Configure bot environment
Add to your `.env` file:
```env
RCON_PASSWORD=your_secure_password_here
```

### 3. Restart your Minecraft server
After editing server.properties, restart your server for changes to take effect.

## 🚀 Commands

### `/mcchat start`
- **Description**: Start the chat bridge in the current Discord channel
- **Requirements**: Administrator permissions
- **Effect**: 
  - Connects to Minecraft server via RCON
  - Discord messages in this channel will be sent to Minecraft
  - Sends notification to both Discord and Minecraft

### `/mcchat stop`
- **Description**: Stop the active chat bridge
- **Effect**:
  - Disconnects from Minecraft server
  - Stops message forwarding
  - Sends goodbye messages to both platforms

### `/mcchat status`
- **Description**: Check if chat bridge is active and its status
- **Shows**:
  - Bridge status (Active/Inactive)
  - Connected Discord channel
  - RCON connection status
  - Server IP

## 📨 How it Works

### Discord → Minecraft
- Messages sent in the bridged Discord channel appear in Minecraft chat
- Format: `[Discord] Username: message content`
- Special handling for:
  - Mentions → `[mention]`
  - Channel references → `[channel]`
  - Custom emojis → `[emoji]`
  - Attachments → Shows attachment count

### Minecraft → Discord (Requires Plugin)
For complete bidirectional chat, you need a server-side plugin like:
- **DiscordSRV** - Most popular option
- **DiscordBot** - Lightweight alternative
- **Custom plugin** - Using webhooks

## 🛡️ Security Features

- **Admin-only commands**: Only administrators can manage the chat bridge
- **Message filtering**: Non-ASCII characters are replaced to prevent issues
- **Length limits**: Messages are truncated to prevent spam
- **RCON security**: Password stored in environment variables

## 🔧 Troubleshooting

### "Failed to connect to Minecraft server RCON"
1. Check if RCON is enabled in `server.properties`
2. Verify RCON password is correct in `.env`
3. Ensure Minecraft server is online
4. Check if port 25575 is accessible

### "Chat bridge is already active"
- Use `/mcchat stop` first, then `/mcchat start`

### Messages not appearing in Minecraft
1. Check RCON connection with `/mcchat status`
2. Verify bot has proper permissions in Discord
3. Check console logs for errors

### No messages from Minecraft to Discord
- This requires a server-side plugin (not included in this bot)
- Install DiscordSRV or similar plugin for full bidirectional chat

## 📋 Server.properties Example

```properties
# Basic server settings
server-port=25565
difficulty=normal
gamemode=survival

# RCON Configuration
enable-rcon=true
rcon.port=25575
rcon.password=MySecurePassword123!

# Other settings...
```

## 🔗 Recommended Plugins

### DiscordSRV (Most Popular)
- **Download**: https://www.spigotmc.org/resources/discordsrv.18494/
- **Features**: Full chat sync, player join/leave messages, death messages
- **Setup**: Configure webhook URL to send MC messages to Discord

### Alternative: Custom Webhook Solution
```javascript
// Simple webhook sender for Minecraft plugins
const webhook = "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL";
fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: `**${playerName}**: ${message}`,
        username: "Minecraft Server"
    })
});
```

## 🎯 Best Practices

1. **Use a dedicated channel** for chat bridge
2. **Set clear rules** about appropriate Discord/MC chat
3. **Monitor for spam** - consider rate limiting
4. **Regular backups** of server configurations
5. **Test thoroughly** before going live

## 🔄 Update Instructions

When updating the bot:
1. Stop any active chat bridges: `/mcchat stop`
2. Update bot code and restart
3. Restart chat bridges: `/mcchat start`
