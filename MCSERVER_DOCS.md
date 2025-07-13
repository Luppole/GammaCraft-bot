# Minecraft Server Status Monitor

## Overview
The `mcserver` command creates a voice channel that displays the real-time status of your Minecraft server. The channel name automatically updates every 60 seconds to show whether the server is online or offline, along with current player count.

## Server Details
- **IP Address**: 129.159.148.234
- **Port**: 25565 (default Minecraft port)
- **Update Frequency**: Every 60 seconds

## Commands

### `/mcserver create`
Creates a voice channel that monitors the Minecraft server status.

**Features:**
- 🟢 Shows "Server Online (X/Y)" when server is running
- 🔴 Shows "Server Offline" when server is down
- 👀 View-only voice channel (users can see but not join)
- 🔄 Auto-updates every 60 seconds

**Requirements:**
- Administrator permissions
- Bot must have permission to create and manage voice channels

### `/mcserver stop`
Stops monitoring and removes the status channel.

**What it does:**
- Stops the automatic status checking
- Deletes the voice channel
- Cleans up monitoring resources

## Channel Status Examples

### When Server is Online:
- `🟢 Server Online (3/20)` - 3 players out of 20 maximum
- `🟢 Server Online (0/20)` - No players but server is running

### When Server is Offline:
- `🔴 Server Offline` - Server is not responding

## Technical Details

- **Timeout**: 5 seconds for each server check
- **Error Handling**: Gracefully handles server timeouts and network issues
- **Resource Management**: Automatically cleans up when bot shuts down
- **Permission System**: Only administrators can create/stop monitoring

## Troubleshooting

### Common Issues:
1. **"Failed to create status channel"** 
   - Check bot permissions for voice channel management

2. **Channel not updating**
   - Server might be experiencing network issues
   - Check if the Minecraft server IP is correct

3. **"No active monitoring found"**
   - The monitoring was not started or was already stopped
   - Use `/mcserver create` to start monitoring

### Bot Permissions Required:
- Manage Channels
- View Channels
- Connect (for voice channels)

## Notes
- Only one monitoring session per Discord server
- The voice channel is automatically deleted when monitoring stops
- Server status checks use a 5-second timeout to prevent hanging
- The command uses the minecraft-server-util library for server pinging
