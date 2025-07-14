import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('level')
    .setDescription('בדוק את הרמה והנסיון שלך או של משתמש אחר')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('המשתמש לבדיקה (אופציונלי)')
            .setRequired(false)
    );

export async function execute(interaction: any) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;
    
    if (!guild) {
        return interaction.editReply({ content: 'פקודה זו יכולה לשמש רק בשרת.' });
    }

    try {
        // Get user data from database
        let userData = await UserLevelDAO.getUserLevel(guild.id, targetUser.id);
        if (!userData) {
            userData = {
                guildId: guild.id,
                userId: targetUser.id,
                xp: 0,
                level: 1,
                messages: 0,
                lastMessage: 0
            };
        }

        // Calculate XP needed for next level (exponential: (level+1)^2 * 100)
        const currentLevelStartXP = userData.level * userData.level * 100;
        const nextLevelXP = (userData.level + 1) * (userData.level + 1) * 100;
        const progressXP = userData.xp - currentLevelStartXP;
        const levelTotalXP = nextLevelXP - currentLevelStartXP;
        const neededXP = nextLevelXP - userData.xp;

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle(`📊 סטטיסטיקות רמה עבור ${targetUser.displayName}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '🏆 רמה', value: userData.level.toString(), inline: true },
                { name: '⭐ נסיון כולל', value: userData.xp.toString(), inline: true },
                { name: '💬 הודעות', value: userData.messages.toString(), inline: true },
                { name: '📈 התקדמות', value: `${progressXP}/${levelTotalXP} נסיון`, inline: true },
                { name: '🎯 רמה הבאה', value: `נדרש ${neededXP} נסיון`, inline: true }
            )
            .setFooter({ text: `צבור נסיון על ידי פעילות בשרת!` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in level command:', error);
        await interaction.editReply({ content: 'נכשל באחזור מידע הרמה.' });
    }
}
