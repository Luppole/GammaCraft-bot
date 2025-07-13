import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { ScheduledMessageDAO } from '../dao';

export const data = new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Create a scheduled recurring message')
    .addStringOption(option =>
        option.setName('message')
            .setDescription('The message to send')
            .setRequired(true)
    )
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to send the message to')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
    )
    .addIntegerOption(option =>
        option.setName('interval')
            .setDescription('Interval in hours (1-168)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(168)
    )
    .addStringOption(option =>
        option.setName('name')
            .setDescription('A name for this scheduled message')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
    const guild = interaction.guild;
    if (!guild) {
        return interaction.reply({ content: 'This command can only be used in a server.', flags: 64 });
    }

    // Only allow admins
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Only administrators can use this command.', flags: 64 });
    }

    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel');
    const interval = interaction.options.getInteger('interval');
    const name = interaction.options.getString('name');

    const client = interaction.client;
    
    // Check if name already exists in database
    const existingMessages = await ScheduledMessageDAO.getGuildScheduledMessages(guild.id);
    if (existingMessages.some((msg: any) => msg.name === name)) {
        return interaction.reply({ content: `A scheduled message with the name "${name}" already exists!`, flags: 64 });
    }

    // Acknowledge the interaction immediately
    await interaction.deferReply({ flags: 64 });

    try {
        // Create the scheduled message
        const scheduledMsg = {
            guildId: guild.id,
            name,
            message,
            channelId: channel.id,
            intervalHours: interval,
            lastSent: Date.now(),
            active: true
        };

        // Save to database
        await ScheduledMessageDAO.saveScheduledMessage(scheduledMsg);

        // Start the interval
        const intervalMs = interval * 60 * 60 * 1000;
        const intervalId = setInterval(async () => {
            const targetChannel = guild.channels.cache.get(channel.id);
            if (targetChannel && targetChannel.isTextBased()) {
                try {
                    await targetChannel.send(message);
                    await ScheduledMessageDAO.updateLastSent(guild.id, name, Date.now());
                } catch (error) {
                    console.error('Failed to send scheduled message:', error);
                }
            }
        }, intervalMs);

        // Store interval ID for cleanup
        client.scheduledIntervals = client.scheduledIntervals || {};
        client.scheduledIntervals[`${guild.id}-${name}`] = intervalId;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⏰ Scheduled Message Created')
            .addFields(
                { name: '📝 Name', value: name, inline: true },
                { name: '📍 Channel', value: channel.toString(), inline: true },
                { name: '⏱️ Interval', value: `${interval} hours`, inline: true },
                { name: '💬 Message', value: message.length > 100 ? message.substring(0, 100) + '...' : message }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error creating scheduled message:', error);
        await interaction.editReply({ content: 'Failed to create scheduled message. Please try again.' });
    }
}
