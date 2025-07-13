import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your or another user\'s level and XP')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to check (optional)')
            .setRequired(false)
    );

export async function execute(interaction: any) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;
    
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
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
            .setTitle(`📊 Level Stats for ${targetUser.displayName}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '🏆 Level', value: userData.level.toString(), inline: true },
                { name: '⭐ Total XP', value: userData.xp.toString(), inline: true },
                { name: '💬 Messages', value: userData.messages.toString(), inline: true },
                { name: '📈 Progress', value: `${progressXP}/${levelTotalXP} XP`, inline: true },
                { name: '🎯 Next Level', value: `${neededXP} XP needed`, inline: true }
            )
            .setFooter({ text: `Earn XP by being active in the server!` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in level command:', error);
        await interaction.editReply({ content: 'Failed to retrieve level information.' });
    }
}
