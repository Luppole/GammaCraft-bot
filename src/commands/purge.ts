import { SlashCommandBuilder, PermissionFlagsBits, Message, Collection } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a specified number of messages')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('Number of messages to delete (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
    )
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Only delete messages from this user')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    // Check if user has manage messages permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.editReply({ content: '❌ You don\'t have permission to manage messages.' });
    }

    try {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const channel = interaction.channel;

        if (!channel || !channel.isTextBased()) {
            return interaction.editReply({ content: '❌ This command can only be used in text channels.' });
        }

        // Fetch messages
        const messages = await channel.messages.fetch({ limit: amount + 1 }); // +1 to account for the command

        // Filter messages if user specified
        let messagesToDelete: Message[] = Array.from(messages.values());
        
        if (targetUser) {
            messagesToDelete = messagesToDelete.filter((msg: Message) => msg.author.id === targetUser.id);
        }

        // Remove the command message from deletion list
        messagesToDelete = messagesToDelete.filter((msg: Message) => msg.id !== interaction.id);

        if (messagesToDelete.length === 0) {
            return interaction.editReply({ content: '❌ No messages found to delete.' });
        }

        // Discord only allows bulk delete for messages less than 14 days old
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const recentMessages = messagesToDelete.filter((msg: Message) => msg.createdTimestamp > fourteenDaysAgo);
        const oldMessages = messagesToDelete.filter((msg: Message) => msg.createdTimestamp <= fourteenDaysAgo);

        let deletedCount = 0;

        // Bulk delete recent messages
        if (recentMessages.length > 0) {
            if (recentMessages.length === 1) {
                await recentMessages[0].delete();
                deletedCount += 1;
            } else {
                const deleted: Collection<string, Message> = await channel.bulkDelete(recentMessages, true);
                deletedCount += deleted.size;
            }
        }

        // Individual delete for old messages (up to 5 to avoid rate limits)
        if (oldMessages.length > 0) {
            const toDelete = oldMessages.slice(0, 5);
            for (const message of toDelete) {
                try {
                    await message.delete();
                    deletedCount += 1;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit protection
                } catch (error) {
                    console.error('Error deleting old message:', error);
                }
            }
        }

        const responseText = targetUser 
            ? `✅ Deleted **${deletedCount}** message(s) from **${targetUser.tag}**.`
            : `✅ Deleted **${deletedCount}** message(s).`;

        await interaction.editReply({ content: responseText });

        console.log(`🧹 ${interaction.user.tag} purged ${deletedCount} messages in ${channel.name}${targetUser ? ` from ${targetUser.tag}` : ''}`);

    } catch (error) {
        console.error('Error in purge command:', error);
        await interaction.editReply({ content: '❌ Failed to delete messages. Please check my permissions and try again.' });
    }
}
