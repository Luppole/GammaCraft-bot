import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { tempMutes } from './mute';

const MUTED_ROLE_ID = '1393957700827611247';

export const data = new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user by removing the Muted role')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to unmute')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the unmute')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: any) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    // Check if user has moderate members permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.editReply({ content: '❌ You don\'t have permission to unmute members.' });
    }

    try {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!targetUser) {
            return interaction.editReply({ content: '❌ User not found.' });
        }

        // Get member
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: '❌ User is not in this server.' });
        }

        // Get muted role
        const mutedRole = guild.roles.cache.get(MUTED_ROLE_ID);
        if (!mutedRole) {
            return interaction.editReply({ content: '❌ Muted role not found. Please contact an administrator.' });
        }

        // Check if user is muted
        if (!targetMember.roles.cache.has(MUTED_ROLE_ID)) {
            return interaction.editReply({ content: '❌ User is not muted.' });
        }

        // Clear any automatic unmute timeout
        const muteKey = `${guild.id}-${targetUser.id}`;
        if (tempMutes.has(muteKey)) {
            clearTimeout(tempMutes.get(muteKey)!);
            tempMutes.delete(muteKey);
        }

        // Remove muted role
        await targetMember.roles.remove(mutedRole, `${reason} | Unmuted by ${interaction.user.tag}`);

        await interaction.editReply({ 
            content: `✅ **${targetUser.tag}** has been unmuted.\n**Reason:** ${reason}` 
        });

        console.log(`🔊 ${targetUser.tag} was unmuted by ${interaction.user.tag} | Reason: ${reason}`);

    } catch (error) {
        console.error('Error in unmute command:', error);
        await interaction.editReply({ content: '❌ Failed to unmute the user. Please check my permissions and try again.' });
    }
}
