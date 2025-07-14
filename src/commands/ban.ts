import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('אסור משתמש מהשרת')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('משתמש לאיסור')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('סיבה לאיסור')
            .setRequired(false)
    )
    .addIntegerOption(option =>
        option.setName('deletedays')
            .setDescription('מחק הודעות מה-X ימים האחרונים (0-7)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: any) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'פקודה זו יכולה לשמש רק בשרת.' });
    }

    // Check if user has ban permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.editReply({ content: '❌ אין לך הרשאה לאסור משתמשים.' });
    }

    try {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'לא סופקה סיבה';
        const deleteMessageDays = interaction.options.getInteger('deletedays') || 0;

        if (!targetUser) {
            return interaction.editReply({ content: '❌ משתמש לא נמצא.' });
        }

        // Check if target is the command user
        if (targetUser.id === interaction.user.id) {
            return interaction.editReply({ content: '❌ אתה לא יכול לאסור את עצמך.' });
        }

        // Check if target is the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.editReply({ content: '❌ אני לא יכול לאסור את עצמי.' });
        }

        // Try to get member (might not be in server)
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        // Check role hierarchy if member exists
        if (targetMember) {
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply({ content: '❌ You cannot ban someone with equal or higher roles.' });
            }

            if (!targetMember.bannable) {
                return interaction.editReply({ content: '❌ I cannot ban this user. They may have higher permissions than me.' });
            }
        }

        // Perform the ban
        await guild.members.ban(targetUser.id, { 
            reason: `${reason} | Banned by ${interaction.user.tag}`,
            deleteMessageDays: deleteMessageDays
        });

        await interaction.editReply({ 
            content: `✅ **${targetUser.tag}** has been banned.\n**Reason:** ${reason}${deleteMessageDays > 0 ? `\n**Messages deleted:** Last ${deleteMessageDays} day(s)` : ''}` 
        });

        console.log(`🔨 ${targetUser.tag} was banned by ${interaction.user.tag} | Reason: ${reason}`);

    } catch (error) {
        console.error('Error in ban command:', error);
        await interaction.editReply({ content: '❌ Failed to ban the user. Please check my permissions and try again.' });
    }
}
