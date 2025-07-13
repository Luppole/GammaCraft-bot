import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { LevelRoleDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('setlevelroles')
    .setDescription('Set roles that users get when reaching certain levels')
    .addIntegerOption(option =>
        option.setName('level')
            .setDescription('The level required')
            .setRequired(true)
            .setMinValue(1)
    )
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('The role to give at this level')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
    // Defer reply immediately
    await interaction.deferReply({ flags: 64 });
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    // Only allow admins
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: 'Only administrators can use this command.' });
    }

    try {
        const level = interaction.options.getInteger('level');
        const role = interaction.options.getRole('role');

        // Save level role to database
        await LevelRoleDAO.saveLevelRole({
            guildId: guild.id,
            level: level,
            roleId: role.id
        });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Level Role Set')
            .setDescription(`Users who reach **Level ${level}** will now receive the **${role.name}** role!`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in setlevelroles command:', error);
        await interaction.editReply({ content: 'Failed to set level role. Please try again.' });
    }
}
