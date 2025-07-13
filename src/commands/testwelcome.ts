import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Test the welcome message system (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to simulate welcome for (optional)')
            .setRequired(false)
    );

export async function execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });
    
    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    try {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Create the same simple welcome embed that new members would see
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00FF7F) // Spring green color
            .setTitle(`🎉 Welcome to ${guild.name}!`)
            .setDescription(`Hey ${targetUser}, glad to have you here!`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: ' Server Info',
                    value: `**Total Members:** ${guild.memberCount.toLocaleString()}\n**You are member #${guild.memberCount}**`,
                    inline: false
                }
            )
            .setFooter({ 
                text: `Welcome to ${guild.name}`, 
                iconURL: guild.iconURL() || undefined 
            })
            .setTimestamp();

        await interaction.editReply({ 
            content: `✅ **Welcome Message Preview** (This is what new members will see)\n👋 ${targetUser}`, 
            embeds: [welcomeEmbed] 
        });

    } catch (error) {
        console.error('Error in testwelcome command:', error);
        await interaction.editReply({ content: 'Failed to generate welcome message preview.' });
    }
}
