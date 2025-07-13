import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to kick')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the kick')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: any) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    // Check if user has kick permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.editReply({ content: '❌ You don\'t have permission to kick members.' });
    }

    try {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!targetUser) {
            return interaction.editReply({ content: '❌ User not found.' });
        }

        // Check if target is the command user
        if (targetUser.id === interaction.user.id) {
            return interaction.editReply({ content: '❌ You cannot kick yourself.' });
        }

        // Check if target is the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.editReply({ content: '❌ I cannot kick myself.' });
        }

        // Get member
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: '❌ User is not in this server.' });
        }

        // Check role hierarchy
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ content: '❌ You cannot kick someone with equal or higher roles.' });
        }

        if (!targetMember.kickable) {
            return interaction.editReply({ content: '❌ I cannot kick this user. They may have higher permissions than me.' });
        }

        // Perform the kick
        await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);

        await interaction.editReply({ 
            content: `✅ **${targetUser.tag}** has been kicked.\n**Reason:** ${reason}` 
        });

        console.log(`👢 ${targetUser.tag} was kicked by ${interaction.user.tag} | Reason: ${reason}`);

    } catch (error) {
        console.error('Error in kick command:', error);
        await interaction.editReply({ content: '❌ Failed to kick the user. Please check my permissions and try again.' });
    }
}
