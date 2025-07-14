import { SlashCommandBuilder, PermissionFlagsBits, Message, Collection } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('purge')
    .setDescription('מחק מספר מסוים של הודעות')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('מספר הודעות למחיקה (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
    )
    .addUserOption(option =>
        option.setName('user')
            .setDescription('מחק רק הודעות של משתמש זה')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: any) {
    try {
        // Immediately defer the reply to prevent timeout
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        if (!guild) {
            return interaction.editReply({ content: 'פקודה זו יכולה לשמש רק בשרת.' });
        }

        // Check if user has manage messages permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({ content: '❌ אין לך הרשאה לנהל הודעות.' });
        }

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const channel = interaction.channel;

        if (!channel || !channel.isTextBased()) {
            return interaction.editReply({ content: '❌ פקודה זו יכולה לשמש רק בערוצי טקסט.' });
        }

        // Fetch messages with timeout protection
        const messages = await Promise.race([
            channel.messages.fetch({ limit: amount + 1 }), // +1 to account for the command
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fetch timeout')), 5000)
            )
        ]) as Collection<string, Message>;

        // Filter messages if user specified
        let messagesToDelete: Message[] = Array.from(messages.values());
        
        if (targetUser) {
            messagesToDelete = messagesToDelete.filter((msg: Message) => msg.author.id === targetUser.id);
        }

        // Remove the command message from deletion list
        messagesToDelete = messagesToDelete.filter((msg: Message) => msg.id !== interaction.id);

        if (messagesToDelete.length === 0) {
            return interaction.editReply({ content: '❌ לא נמצאו הודעות למחיקה.' });
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
                    console.error('שגיאה במחיקת הודעה ישנה:', error);
                }
            }
        }

        const responseText = targetUser 
            ? `✅ נמחקו **${deletedCount}** הודעות של **${targetUser.tag}**.`
            : `✅ נמחקו **${deletedCount}** הודעות.`;

        await interaction.editReply({ content: responseText });

        console.log(`🧹 ${interaction.user.tag} מחק ${deletedCount} הודעות ב ${channel.name}${targetUser ? ` של ${targetUser.tag}` : ''}`);

    } catch (error) {
        console.error('שגיאה בפקודת purge:', error);
        
        // Better error handling for already replied interactions
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ כשל במחיקת הודעות. בדוק את ההרשאות ונסה שוב.', 
                    ephemeral: true 
                });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: '❌ כשל במחיקת הודעות. בדוק את ההרשאות ונסה שוב.' });
            }
        } catch (replyError) {
            console.error('שגיאה בשליחת תגובת שגיאה:', replyError);
        }
    }
}
