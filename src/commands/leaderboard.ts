import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('הצג את לוח התוצאות של השרת')
    .addIntegerOption(option =>
        option.setName('page')
            .setDescription('מספר עמוד (ברירת מחדל: 1)')
            .setRequired(false)
            .setMinValue(1)
    );

export async function execute(interaction: any) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'פקודה זו יכולה לשמש רק בשרת.' });
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
            return interaction.editReply({ content: 'לא נמצא מידע משתמשים. התחל לכתוב כדי לצבור נסיון!' });
        }

        const totalPages = Math.ceil(totalUsers / itemsPerPage);

        if (page > totalPages) {
            return interaction.editReply({ content: `עמוד ${page} לא קיים. יש רק ${totalPages} עמודים.` });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏆 לוח התוצאות של השרת - עמוד ${page}/${totalPages}`)
            .setFooter({ text: `מציג ${guildUsers.length} מתוך ${totalUsers} משתמשים` })
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
            const userName = user ? user.displayName : 'משתמש לא ידוע';
            
            const medals = ['🥇', '🥈', '🥉'];
            const medal = rank <= 3 ? medals[rank - 1] : `${rank}.`;
            
            description += `${medal} **${userName}** - רמה ${userData.level} (${userData.xp} נסיון)\n`;
        }

        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in leaderboard command:', error);
        await interaction.editReply({ content: 'נכשל באחזור נתוני לוח התוצאות.' });
    }
}
