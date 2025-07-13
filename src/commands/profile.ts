import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View detailed user profile and statistics')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to view profile for (default: yourself)')
            .setRequired(false)
    );

export async function execute(interaction: any) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    try {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = await guild.members.fetch(targetUser.id).catch(() => null);
        
        if (!member) {
            return interaction.editReply({ content: 'User not found in this server.' });
        }

        // Get user data with timeout protection
        const userData = await Promise.race([
            UserLevelDAO.getUserLevel(guild.id, targetUser.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 1500))
        ]) as any;

        const currentXP = userData ? userData.xp : 0;
        const currentLevel = userData ? userData.level : 1;
        const totalMessages = userData ? userData.messages : 0;

        // Calculate level progression safely
        const currentLevelXP = currentLevel * currentLevel * 100;
        const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100;
        const progressXP = Math.max(0, currentXP - currentLevelXP);
        const neededXP = nextLevelXP - currentLevelXP;
        
        // Safe progress calculation
        let progressPercent = 0;
        if (neededXP > 0 && progressXP >= 0) {
            progressPercent = Math.min(100, Math.max(0, (progressXP / neededXP) * 100));
        }

        // Create progress bar safely
        const progressBarLength = 20;
        const filledBars = Math.floor((progressPercent / 100) * progressBarLength);
        const emptyBars = progressBarLength - filledBars;
        
        const progressBar = '█'.repeat(Math.max(0, filledBars)) + '░'.repeat(Math.max(0, emptyBars));

        // Get server ranking
        const allUsers = await Promise.race([
            UserLevelDAO.getGuildLeaderboard(guild.id, 1000, 0),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 1500))
        ]) as any[];

        const userRank = allUsers.findIndex((user: any) => user.userId === targetUser.id) + 1;
        const totalUsers = allUsers.length;

        // Determine achievements
        const achievements = [];
        if (currentLevel >= 5) achievements.push('🌟 Level 5 Reached');
        if (currentLevel >= 10) achievements.push('⭐ Level 10 Reached');
        if (currentLevel >= 25) achievements.push('💫 Level 25 Reached');
        if (totalMessages >= 100) achievements.push('💬 Chatty (100+ messages)');
        if (totalMessages >= 500) achievements.push('🗣️ Talkative (500+ messages)');
        if (userRank <= 3 && userRank > 0) achievements.push('🏆 Top 3 Member');
        if (userRank <= 10 && userRank > 0) achievements.push('🥇 Top 10 Member');

        const embed = new EmbedBuilder()
            .setColor(0x7289DA)
            .setTitle(`📊 ${member.displayName}'s Profile`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '🏆 Level & XP',
                    value: `**Level:** ${currentLevel}\n**Total XP:** ${currentXP.toLocaleString()}\n**Messages:** ${totalMessages.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📈 Progress to Level ' + (currentLevel + 1),
                    value: `${progressBar}\n**${progressXP.toLocaleString()}** / **${neededXP.toLocaleString()}** XP (${progressPercent.toFixed(1)}%)`,
                    inline: true
                },
                {
                    name: '🎯 Server Ranking',
                    value: userRank > 0 ? `**Rank:** #${userRank} of ${totalUsers} members` : 'Not ranked yet',
                    inline: true
                },
                {
                    name: '🏅 Achievements',
                    value: achievements.length > 0 ? achievements.join('\n') : 'No achievements yet',
                    inline: false
                },
                {
                    name: '📅 Member Information',
                    value: `**Joined Server:** <t:${Math.floor(member.joinedTimestamp! / 1000)}:R>\n**Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
                    inline: false
                }
            )
            .setFooter({ 
                text: `Profile for ${targetUser.tag}`, 
                iconURL: guild.iconURL() || undefined 
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error in profile command:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while fetching the profile. Please try again.', ephemeral: true });
        } else if (interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred while fetching the profile. Please try again.' });
        }
    }
}
