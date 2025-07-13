# GammaCraft Discord Bot

A feature-rich Discord bot with XP/leveling system, scheduled messages, and advanced statistics tracking.

## Features

- **Level System**: XP tracking with role rewards
- **Scheduled Messages**: Automated recurring messages
- **Statistics Tracking**: Monitor whitelisted members and other server stats
- **Admin Commands**: Comprehensive administration tools
- **MySQL Database**: Persistent data storage

## Database Setup

This bot requires a MySQL database. You have several options:

### Option 1: Docker (Recommended)
The easiest way is to use Docker with the provided `docker-compose.yaml`:

```bash
# Start MySQL and the bot together
docker-compose up -d

# Or start just MySQL first
docker-compose up -d mysql
```

Your `.env` file should have:
```env
DISCORD_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=your-discord-guild-id
DISCORD_CLIENT_ID=your-discord-client-id

# Database Configuration (for Docker)
DB_HOST=localhost
DB_USER=botuser
DB_PASSWORD=botpassword
DB_NAME=gammacraft_bot
DB_PORT=3306
```

### Option 2: Local MySQL Installation
If you prefer to install MySQL directly:

1. Download and install MySQL from [mysql.com](https://dev.mysql.com/downloads/mysql/)
2. Create a database called `gammacraft_bot`
3. Update your `.env` file with your MySQL credentials

### Option 3: Online Database (e.g., PlanetScale, Railway)
Use a cloud MySQL provider and update the connection details in `.env`

The bot will automatically create the required tables on first startup.

## Installation

### Option 1: Docker (Recommended)
1. Install Docker and Docker Compose
2. Clone the repository
3. Configure your `.env` file with Discord tokens
4. Start everything: `docker-compose up -d`

### Option 2: Local Development
1. Install MySQL and Node.js
2. Clone the repository
3. Install dependencies: `npm install`
4. Configure your `.env` file
5. Build the project: `npm run build`
6. Start the bot: `npm start`

### Quick Start with Docker
```bash
# Clone and enter directory
git clone <repository>
cd GammaCraft-Bot-main

# Edit .env file with your Discord bot token
# Then start everything
docker-compose up -d

# Check logs
docker-compose logs -f bot
```

## Commands

### User Commands
- `/level [user]` - Check your current level and XP (or another user's)
- `/leaderboard [page]` - View the server leaderboard with pagination
- `/help` - Get help information
- `/commands` - **Complete guide to all bot features and commands**

### Administrator Commands
- `/setupstats <role>` - Set up automatic member counting channels
- `/setlevelroles <level> <role>` - Configure level role rewards
- `/schedule <name> <message> <channel> <interval>` - Create scheduled messages
- `/schedulelist` - List all scheduled messages
- `/schedulestop <name>` - Stop a scheduled message

### XP System
- **Earn XP:** 15-25 XP per message (1 minute cooldown)
- **Level Formula:** Next level requires Level² × 100 XP
- **Features:** Automatic role rewards, leaderboards, level announcements

---

# Project Setup & Docker Compose Guide

This guide explains how to build and run the project using Docker Compose on a Linux machine, how to set up the required environment variables, and which text files under the `resources/` folder need editing.

---

## 1. Create and Configure the `.env` File

Create a `.env` file in the project root (same directory as `docker-compose.yml`) with the following variables:

```env
DISCORD_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=your-discord-guild-id
DISCORD_CLIENT_ID=your-discord-client-id
```

- Replace `your-discord-bot-token` with your Discord bot token.
- Replace `your-discord-guild-id` with your Discord server (guild) ID.
- Replace `your-discord-client-id` with your Discord application client ID.

---

## 2. Edit Text Files Under `resources/`

The text files located in the `resources/` directory are used by the application for various configurations or data inputs. Edit these files as needed to customize your setup.

For example:

- `resources/example.txt` – Contains example data/settings you might want to change.
- `resources/another-file.txt` – Edit this file to adjust specific content relevant to your use case.

*Make sure to save any changes before building or running the application.*

---

## 3. Build and Start the Docker Containers

Run these commands in your project root where the `docker-compose.yml` file is located:

```bash
docker-compose build
docker-compose up -d
```

- `docker-compose build` builds the Docker images.
- `docker-compose up -d` starts the containers in detached mode (in the background).

---

## 4. Check Container Logs and Status

To view logs of the running container, run:

```bash
docker-compose logs -f
```

To check container status:

```bash
docker-compose ps
```

---

## 5. Stopping and Removing Containers

To stop the running containers:

```bash
docker-compose down
```

This will stop and remove the containers, but **not** the built images.

---

## Notes

- Docker Compose automatically reads the `.env` file in the same directory and injects environment variables into the containers.
- Make sure your `docker-compose.yml` properly references the environment variables and mounts the `resources/` directory if needed.
- If your application exposes ports, verify that the ports are correctly mapped in `docker-compose.yml`.
- This guide assumes Docker and Docker Compose are installed on your Linux machine.

---

## Summary

- Create `.env` file with:
  - `DISCORD_TOKEN`
  - `DISCORD_GUILD_ID`
  - `DISCORD_CLIENT_ID`
- Edit any necessary text files in the `resources/` folder.
- Build and run containers:
  ```bash
  docker-compose build
  docker-compose up -d
  ```
- Use logs and status commands to monitor:
  ```bash
  docker-compose logs -f
  docker-compose ps
  ```
- Stop containers when done:
  ```bash
  docker-compose down
  ```
