import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { UserLevelDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('fixlevels')
    .setDescription('Recalculate all user levels based on their current XP (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply({ flags: 64 });
    
    // Only allow admins
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: 'Only administrators can use this command.' });
    }

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    try {
        // Get all users for this guild
        const allUsers = await UserLevelDAO.getGuildLeaderboard(guild.id, 1000, 0); // Get all users
        let fixedCount = 0;

        for (const userData of allUsers) {
            // Calculate correct level based on current XP
            let correctLevel = 1;
            while (true) {
                const requiredXPForNextLevel = (correctLevel + 1) * (correctLevel + 1) * 100;
                if (userData.xp < requiredXPForNextLevel) {
                    break;
                }
                correctLevel++;
            }

            // Update if level is incorrect
            if (userData.level !== correctLevel) {
                userData.level = correctLevel;
                await UserLevelDAO.saveUserLevel(userData);
                fixedCount++;
                console.log(`[LEVEL FIX] Fixed ${userData.userId}: ${userData.xp} XP → Level ${correctLevel}`);
            }
        }

        await interaction.editReply({ 
            content: `✅ Level recalculation complete!\n📊 Fixed ${fixedCount} user(s) with incorrect levels.\n🔄 All levels now match the current XP formula.` 
        });
    } catch (error) {
        console.error('Error in fixlevels command:', error);
        await interaction.editReply({ content: 'Failed to recalculate levels. Please try again.' });
    }
}
