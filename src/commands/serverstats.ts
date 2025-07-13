import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('View detailed server statistics and insights');

export async function execute(interaction: any) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    try {
        // Get all user data for statistics with timeout protection
        const allUsers = await Promise.race([
            UserLevelDAO.getGuildLeaderboard(guild.id, 1000, 0),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
        ]) as any[];
        
        const totalUsers = allUsers.length;
        
        if (totalUsers === 0) {
            return interaction.editReply({ content: 'No user data found. Members need to start chatting to generate statistics!' });
        }

        // Calculate statistics
        const totalXP = allUsers.reduce((sum, user) => sum + user.xp, 0);
        const totalMessages = allUsers.reduce((sum, user) => sum + user.messages, 0);
        const avgLevel = totalUsers > 0 ? (allUsers.reduce((sum, user) => sum + user.level, 0) / totalUsers).toFixed(1) : 0;
        const avgXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;
        
        // Find top performer
        const topUser = allUsers[0];
        const topMember = topUser ? await guild.members.fetch(topUser.userId).catch(() => null) : null;
        
        // Level distribution
        const levelDistribution = new Map();
        allUsers.forEach(user => {
            const levelRange = Math.floor(user.level / 5) * 5; // Group by 5s
            levelDistribution.set(levelRange, (levelDistribution.get(levelRange) || 0) + 1);
        });

        // Activity metrics
        const activeUsers = allUsers.filter(user => user.messages >= 10).length;
        const veryActiveUsers = allUsers.filter(user => user.messages >= 100).length;
        const highLevelUsers = allUsers.filter(user => user.level >= 10).length;

        // Create main stats embed
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📊 ${guild.name} Server Statistics`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                {
                    name: '👥 Member Activity',
                    value: `**Total Members:** ${guild.memberCount.toLocaleString()}\n**Active Members:** ${totalUsers.toLocaleString()}\n**Regular Users:** ${activeUsers.toLocaleString()} (10+ messages)\n**Very Active:** ${veryActiveUsers.toLocaleString()} (100+ messages)`,
                    inline: true
                },
                {
                    name: '📈 XP & Levels',
                    value: `**Total XP:** ${totalXP.toLocaleString()}\n**Average Level:** ${avgLevel}\n**Average XP:** ${avgXP.toLocaleString()}\n**Level 10+:** ${highLevelUsers.toLocaleString()} users`,
                    inline: true
                },
                {
                    name: '💬 Message Stats',
                    value: `**Total Messages:** ${totalMessages.toLocaleString()}\n**Avg per User:** ${totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0}\n**Messages Today:** Calculating...\n**Most Active Hour:** Calculating...`,
                    inline: true
                },
                {
                    name: '🏆 Top Performer',
                    value: topMember ? 
                        `**${topMember.displayName}**\nLevel ${topUser.level} • ${topUser.xp.toLocaleString()} XP\n${topUser.messages.toLocaleString()} messages sent` :
                        'No data available',
                    inline: true
                },
                {
                    name: '📊 Level Distribution',
                    value: Array.from(levelDistribution.entries())
                        .sort(([a], [b]) => a - b)
                        .slice(0, 5)
                        .map(([range, count]) => `Level ${range}-${range + 4}: ${count} users`)
                        .join('\n') || 'Calculating...',
                    inline: true
                },
                {
                    name: '🎯 Server Health',
                    value: `**Engagement:** ${getEngagementLevel(activeUsers, guild.memberCount)}\n**Activity Trend:** ${getActivityTrend(totalMessages, totalUsers)}\n**Community Size:** ${getCommunitySize(guild.memberCount)}`,
                    inline: true
                }
            )
            .setFooter({ text: `Statistics generated from ${totalUsers} active members • Last updated` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in serverstats command:', error);
        await interaction.editReply({ content: 'Failed to generate server statistics.' });
    }
}

function getEngagementLevel(activeUsers: number, totalMembers: number): string {
    const ratio = activeUsers / totalMembers;
    if (ratio > 0.3) return '🔥 Excellent';
    if (ratio > 0.15) return '✅ Good';
    if (ratio > 0.05) return '📈 Growing';
    return '🌱 Developing';
}

function getActivityTrend(totalMessages: number, totalUsers: number): string {
    const avgMessages = totalMessages / totalUsers;
    if (avgMessages > 100) return '📈 Very High';
    if (avgMessages > 50) return '📊 High';
    if (avgMessages > 20) return '📉 Moderate';
    return '🌱 Building';
}

function getCommunitySize(memberCount: number): string {
    if (memberCount > 1000) return '🏰 Large Community';
    if (memberCount > 100) return '🏘️ Medium Community';
    if (memberCount > 20) return '🏠 Small Community';
    return '👥 Intimate Group';
}
