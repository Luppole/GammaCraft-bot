import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the server leaderboard')
    .addIntegerOption(option =>
        option.setName('page')
            .setDescription('Page number (default: 1)')
            .setRequired(false)
            .setMinValue(1)
    );

export async function execute(interaction: any) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    try {
        // Get leaderboard data from database with timeout protection
        const page = interaction.options.getInteger('page') || 1;
        const itemsPerPage = 10;
        const offset = (page - 1) * itemsPerPage;
        
        const [guildUsers, totalUsers] = await Promise.race([
            Promise.all([
                UserLevelDAO.getGuildLeaderboard(guild.id, itemsPerPage, offset),
                UserLevelDAO.getGuildUserCount(guild.id)
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
        ]) as any[];
        
        if (totalUsers === 0) {
            return interaction.editReply({ content: 'No user data found. Start chatting to earn XP!' });
        }

        const totalPages = Math.ceil(totalUsers / itemsPerPage);

        if (page > totalPages) {
            return interaction.editReply({ content: `Page ${page} doesn't exist. There are only ${totalPages} pages.` });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏆 Server Leaderboard - Page ${page}/${totalPages}`)
            .setFooter({ text: `Showing ${guildUsers.length} of ${totalUsers} users` })
            .setTimestamp();

        let description = '';
        
        // Fetch all members at once to avoid timeout issues
        const memberPromises = guildUsers.map((userData: any) => 
            guild.members.fetch(userData.userId).catch(() => null)
        );
        const members = await Promise.all(memberPromises);
        
        for (let i = 0; i < guildUsers.length; i++) {
            const userData = guildUsers[i];
            const rank = offset + i + 1;
            const user = members[i];
            const userName = user ? user.displayName : 'Unknown User';
            
            const medals = ['🥇', '🥈', '🥉'];
            const medal = rank <= 3 ? medals[rank - 1] : `${rank}.`;
            
            description += `${medal} **${userName}** - Level ${userData.level} (${userData.xp} XP)\n`;
        }

        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in leaderboard command:', error);
        await interaction.editReply({ content: 'Failed to retrieve leaderboard data.' });
    }
}
