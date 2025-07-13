import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to ban')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the ban')
            .setRequired(false)
    )
    .addIntegerOption(option =>
        option.setName('deletedays')
            .setDescription('Delete messages from the last X days (0-7)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: any) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    // Check if user has ban permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.editReply({ content: '❌ You don\'t have permission to ban members.' });
    }

    try {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('deletedays') || 0;

        if (!targetUser) {
            return interaction.editReply({ content: '❌ User not found.' });
        }

        // Check if target is the command user
        if (targetUser.id === interaction.user.id) {
            return interaction.editReply({ content: '❌ You cannot ban yourself.' });
        }

        // Check if target is the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.editReply({ content: '❌ I cannot ban myself.' });
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
