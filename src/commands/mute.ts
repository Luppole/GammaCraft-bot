import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const MUTED_ROLE_ID = '1393957700827611247';

// Store temporary mutes in memory (for production, use database)
const tempMutes = new Map<string, NodeJS.Timeout>();

export const data = new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user by giving them the Muted role')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to mute')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('duration')
            .setDescription('Duration (e.g., 5m, 1h, 2d) - leave empty for permanent')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the mute')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

function parseDuration(duration: string): number {
    const regex = /^(\d+)([smhd])$/i;
    const match = duration.match(regex);
    
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
        case 's': return value * 1000; // seconds
        case 'm': return value * 60 * 1000; // minutes
        case 'h': return value * 60 * 60 * 1000; // hours
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        default: return 0;
    }
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} second(s)`;
}

export async function execute(interaction: any) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    // Check if user has moderate members permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.editReply({ content: '❌ You don\'t have permission to mute members.' });
    }

    try {
        const targetUser = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!targetUser) {
            return interaction.editReply({ content: '❌ User not found.' });
        }

        // Check if target is the command user
        if (targetUser.id === interaction.user.id) {
            return interaction.editReply({ content: '❌ You cannot mute yourself.' });
        }

        // Check if target is the bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.editReply({ content: '❌ I cannot mute myself.' });
        }

        // Get member
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: '❌ User is not in this server.' });
        }

        // Check role hierarchy
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ content: '❌ You cannot mute someone with equal or higher roles.' });
        }

        // Get muted role
        const mutedRole = guild.roles.cache.get(MUTED_ROLE_ID);
        if (!mutedRole) {
            return interaction.editReply({ content: '❌ Muted role not found. Please contact an administrator.' });
        }

        // Check if user is already muted
        if (targetMember.roles.cache.has(MUTED_ROLE_ID)) {
            return interaction.editReply({ content: '❌ User is already muted.' });
        }

        // Parse duration
        let durationMs = 0;
        let durationText = 'permanent';
        
        if (durationStr) {
            durationMs = parseDuration(durationStr);
            if (durationMs === 0) {
                return interaction.editReply({ content: '❌ Invalid duration format. Use: 5m, 1h, 2d, etc.' });
            }
            if (durationMs > 30 * 24 * 60 * 60 * 1000) { // 30 days max
                return interaction.editReply({ content: '❌ Maximum mute duration is 30 days.' });
            }
            durationText = formatDuration(durationMs);
        }

        // Add muted role
        await targetMember.roles.add(mutedRole, `${reason} | Muted by ${interaction.user.tag}${durationMs ? ` for ${durationText}` : ''}`);

        // Set up automatic unmute if duration specified
        if (durationMs > 0) {
            const muteKey = `${guild.id}-${targetUser.id}`;
            
            // Clear existing timeout if any
            if (tempMutes.has(muteKey)) {
                clearTimeout(tempMutes.get(muteKey)!);
            }
            
            // Set new timeout
            const timeout = setTimeout(async () => {
                try {
                    const member = await guild.members.fetch(targetUser.id).catch(() => null);
                    if (member && member.roles.cache.has(MUTED_ROLE_ID)) {
                        await member.roles.remove(mutedRole, 'Automatic unmute - duration expired');
                        console.log(`🔊 ${targetUser.tag} was automatically unmuted after ${durationText}`);
                    }
                    tempMutes.delete(muteKey);
                } catch (error) {
                    console.error('Error in automatic unmute:', error);
                    tempMutes.delete(muteKey);
                }
            }, durationMs);
            
            tempMutes.set(muteKey, timeout);
        }

        await interaction.editReply({ 
            content: `✅ **${targetUser.tag}** has been muted${durationMs ? ` for ${durationText}` : ' permanently'}.\n**Reason:** ${reason}` 
        });

        console.log(`🔇 ${targetUser.tag} was muted by ${interaction.user.tag}${durationMs ? ` for ${durationText}` : ' permanently'} | Reason: ${reason}`);

    } catch (error) {
        console.error('Error in mute command:', error);
        await interaction.editReply({ content: '❌ Failed to mute the user. Please check my permissions and try again.' });
    }
}

// Export tempMutes for use in unmute command
export { tempMutes };
