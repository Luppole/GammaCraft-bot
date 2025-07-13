import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed information about this server');

export async function execute(interaction: any) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    try {
        // Get server creation date
        const createdAt = guild.createdAt;
        const createdTimestamp = Math.floor(createdAt.getTime() / 1000);
        
        // Get server features
        const features = guild.features.length > 0 ? guild.features.map((feature: any) => 
            feature.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: any) => l.toUpperCase())
        ).join(', ') : 'None';

        // Get verification level
        const verificationLevels = {
            0: 'None',
            1: 'Low - Must have verified email',
            2: 'Medium - Must be registered for 5+ minutes',
            3: 'High - Must be a member for 10+ minutes',
            4: 'Very High - Must have verified phone'
        };

        // Get boost info
        const boostTier = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;
        
        const tierNames = {
            0: 'No Tier',
            1: 'Tier 1',
            2: 'Tier 2',
            3: 'Tier 3'
        };

        // Get channel counts with timeout protection
        const channels = await Promise.race([
            guild.channels.fetch(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Channel fetch timeout')), 1500))
        ]) as any;
        
        const textChannels = channels.filter((channel: any) => channel?.type === 0).size;
        const voiceChannels = channels.filter((channel: any) => channel?.type === 2).size;
        const categories = channels.filter((channel: any) => channel?.type === 4).size;
        const totalChannels = textChannels + voiceChannels + categories;

        // Get role count with timeout protection
        const roles = await Promise.race([
            guild.roles.fetch(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Roles fetch timeout')), 1500))
        ]) as any;
        const roleCount = roles.size - 1; // Exclude @everyone

        // Get member info with timeout protection
        const owner = await Promise.race([
            guild.fetchOwner(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Owner fetch timeout')), 1500))
        ]).catch(() => null);
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🏰 ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Server Overview',
                    value: `**Name:** ${guild.name}\n**ID:** ${guild.id}\n**Owner:** ${owner ? `${owner.user.tag}` : 'Unknown'}\n**Created:** <t:${createdTimestamp}:F>\n**Age:** <t:${createdTimestamp}:R>`,
                    inline: true
                },
                {
                    name: '👥 Members',
                    value: `**Total:** ${guild.memberCount.toLocaleString()}\n**Online:** Calculating...\n**Bots:** Calculating...\n**Humans:** Calculating...`,
                    inline: true
                },
                {
                    name: '🎭 Roles & Channels',
                    value: `**Roles:** ${roleCount.toLocaleString()}\n**Text Channels:** ${textChannels}\n**Voice Channels:** ${voiceChannels}\n**Categories:** ${categories}\n**Total Channels:** ${totalChannels}`,
                    inline: true
                },
                {
                    name: '🚀 Server Boost',
                    value: `**Boost Tier:** ${tierNames[boostTier as keyof typeof tierNames] || 'Unknown'}\n**Boost Count:** ${boostCount.toLocaleString()}\n**Boosters:** ${boostCount > 0 ? `${boostCount} member${boostCount !== 1 ? 's' : ''}` : 'None'}`,
                    inline: true
                },
                {
                    name: '🛡️ Security',
                    value: `**Verification:** ${verificationLevels[guild.verificationLevel as keyof typeof verificationLevels] || 'Unknown'}\n**2FA Required:** ${guild.mfaLevel === 1 ? 'Yes' : 'No'}\n**Content Filter:** ${getContentFilterLevel(guild.explicitContentFilter)}`,
                    inline: true
                },
                {
                    name: '⭐ Features',
                    value: features.length > 50 ? features.substring(0, 50) + '...' : features,
                    inline: true
                }
            )
            .setFooter({ text: `Server Information • Shard: ${guild.shardId || 0}` })
            .setTimestamp();

        // Add server banner if available
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ size: 1024 }));
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in serverinfo command:', error);
        await interaction.editReply({ content: 'Failed to retrieve server information.' });
    }
}

function getContentFilterLevel(level: number): string {
    switch (level) {
        case 0: return 'Disabled';
        case 1: return 'Members without roles';
        case 2: return 'All members';
        default: return 'Unknown';
    }
}
