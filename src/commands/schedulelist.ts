import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { ScheduledMessageDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('schedulelist')
    .setDescription('List all scheduled messages')
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
        const scheduledMessages = await ScheduledMessageDAO.getGuildScheduledMessages(guild.id);

        if (scheduledMessages.length === 0) {
            return interaction.editReply({ content: 'No scheduled messages found.' });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('⏰ Scheduled Messages')
            .setTimestamp();

        let description = '';
        for (const schedule of scheduledMessages) {
            const channel = guild.channels.cache.get(schedule.channelId);
            const channelName = channel ? `#${channel.name}` : 'Unknown Channel';
            const status = schedule.active ? '✅ Active' : '❌ Inactive';
            
            description += `**${schedule.name}**\n`;
            description += `📍 ${channelName} | ⏱️ Every ${schedule.intervalHours}h | ${status}\n`;
            description += `💬 ${schedule.message.substring(0, 50)}${schedule.message.length > 50 ? '...' : ''}\n\n`;
        }

        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in schedulelist command:', error);
        await interaction.editReply({ content: 'Failed to retrieve scheduled messages.' });
    }
}
