import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { ScheduledMessageDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('schedulestop')
    .setDescription('Stop a scheduled message')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the scheduled message to stop')
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
        const name = interaction.options.getString('name');
        const client = interaction.client;
        
        // Check if scheduled message exists in database
        const existingMessages = await ScheduledMessageDAO.getGuildScheduledMessages(guild.id);
        const messageToStop = existingMessages.find((msg: any) => msg.name === name);
        
        if (!messageToStop) {
            return interaction.editReply({ content: `No scheduled message found with the name "${name}".` });
        }

        // Stop the scheduled message
        await ScheduledMessageDAO.deleteScheduledMessage(guild.id, name);
        
        // Clear the interval if it exists
        client.scheduledIntervals = client.scheduledIntervals || {};
        const intervalKey = `${guild.id}-${name}`;
        if (client.scheduledIntervals[intervalKey]) {
            clearInterval(client.scheduledIntervals[intervalKey]);
            delete client.scheduledIntervals[intervalKey];
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🛑 Scheduled Message Stopped')
            .setDescription(`The scheduled message "${name}" has been stopped and removed.`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in schedulestop command:', error);
        await interaction.editReply({ content: 'Failed to stop scheduled message.' });
    }
}
