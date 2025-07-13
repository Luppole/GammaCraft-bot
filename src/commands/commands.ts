import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Display all available bot commands with detailed information');

export async function execute(interaction: any) {
    // Check if user is admin
    const isAdmin = interaction.member.permissions.has('Administrator');

    const userEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎮 User Commands')
        .setDescription('Commands available to all server members')
        .addFields(
            {
                name: '📊 `/level`',
                value: `**Purpose:** Check your current level and XP progress
**Usage:** \`/level\`
**Details:** Shows your current level, total XP, XP needed for next level, and progress bar
**Example:** Level 5 with 1,250 XP`,
                inline: false
            },
            {
                name: '🏆 `/leaderboard [page]`',
                value: `**Purpose:** View the server's XP leaderboard
**Usage:** \`/leaderboard\` or \`/leaderboard page:2\`
**Details:** Shows top 10 users per page, ranked by XP. Displays medals for top 3
**Features:** Pagination support, shows user levels and total XP`,
                inline: false
            },
            {
                name: '👤 `/profile [user]`',
                value: `**Purpose:** View detailed user profile and statistics
**Usage:** \`/profile\` or \`/profile user:@Someone\`
**Details:** Shows comprehensive stats including level progress, server ranking, achievements, and activity metrics
**Features:** Progress bars, achievement system, member information`,
                inline: false
            },
            {
                name: '📊 `/serverstats`',
                value: `**Purpose:** View detailed server statistics and insights
**Usage:** \`/serverstats\`
**Details:** Shows server activity metrics, level distribution, top performers, and community health indicators
**Features:** Engagement analysis, activity trends, member statistics`,
                inline: false
            },
            {
                name: '🏓 `/ping`',
                value: `**Purpose:** Test bot responsiveness and latency
**Usage:** \`/ping\`
**Details:** Shows response time, API latency, and bot status
**Features:** Quick health check for the bot`,
                inline: false
            },
            {
                name: '❓ `/help`',
                value: `**Purpose:** Get general help and bot information
**Usage:** \`/help\`
**Details:** Shows basic bot information and pings admin role for support
**Note:** Loads help text from resources/help.txt file`,
                inline: false
            }
        )
        .setFooter({ text: 'XP System: Earn 20-35 XP per message (30 second cooldown)' });

    // Admin Commands Embed
    const adminEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🛡️ Administrator Commands')
        .setDescription('Commands available only to server administrators')
        .addFields(
            {
                name: '🎉 `/testwelcome [user]`',
                value: `**Purpose:** Test the welcome message system
**Usage:** \`/testwelcome\` or \`/testwelcome user:@Someone\`
**Details:** Shows a simple welcome message with server member count
**Note:** Admin-only command for testing purposes`,
                inline: false
            },
            {
                name: '🔨 `/ban <user> [reason] [deletedays]`',
                value: `**Purpose:** Ban a user from the server
**Usage:** \`/ban user:@BadUser reason:"Spam" deletedays:1\`
**Details:** Permanently removes user from server with optional message deletion
**Permissions:** Requires Ban Members permission`,
                inline: false
            },
            {
                name: '👢 `/kick <user> [reason]`',
                value: `**Purpose:** Kick a user from the server
**Usage:** \`/kick user:@BadUser reason:"Breaking rules"\`
**Details:** Removes user from server (they can rejoin)
**Permissions:** Requires Kick Members permission`,
                inline: false
            },
            {
                name: '🔇 `/mute <user> [duration] [reason]`',
                value: `**Purpose:** Mute a user by giving them the Muted role
**Usage:** \`/mute user:@BadUser duration:5m reason:"Spam"\`
**Details:** Prevents user from sending messages. Duration: 5m, 1h, 2d (max 30d)
**Permissions:** Requires Moderate Members permission`,
                inline: false
            },
            {
                name: '🔊 `/unmute <user> [reason]`',
                value: `**Purpose:** Unmute a user by removing the Muted role
**Usage:** \`/unmute user:@User reason:"Appeal accepted"\`
**Details:** Allows user to send messages again and cancels auto-unmute
**Permissions:** Requires Moderate Members permission`,
                inline: false
            },
            {
                name: '🧹 `/purge <amount> [user]`',
                value: `**Purpose:** Delete a specified number of messages
**Usage:** \`/purge amount:50\` or \`/purge amount:20 user:@Spammer\`
**Details:** Bulk delete up to 100 messages, optionally from specific user
**Permissions:** Requires Manage Messages permission`,
                inline: false
            }
        );

    const embeds = [userEmbed, adminEmbed];
    
    if (!isAdmin) {
        // Remove admin embed for non-admins
        embeds.splice(1, 1);
        userEmbed.setFooter({ text: 'XP System: Earn 20-35 XP per message (30 second cooldown) • Admin commands hidden' });
    }

    await interaction.reply({ embeds: embeds });
}
