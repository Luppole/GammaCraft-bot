import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mcskin')
    .setDescription('View a Minecraft player\'s skin')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('Minecraft username')
            .setRequired(true)
    );

export async function execute(interaction: any) {
    await interaction.deferReply();
    
    const username = interaction.options.getString('username');
    
    // Validate username
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
        return interaction.editReply({ 
            content: 'Invalid username! Minecraft usernames must be 3-16 characters long and contain only letters, numbers, and underscores.' 
        });
    }

    try {
        // Using public APIs for Minecraft skins
        const skinUrl = `https://mc-heads.net/avatar/${username}/100`;
        const bodyUrl = `https://mc-heads.net/body/${username}/100`;
        const headUrl = `https://mc-heads.net/head/${username}/100`;
        
        const embed = new EmbedBuilder()
            .setColor(0x00AA00)
            .setTitle(`👤 ${username}'s Minecraft Skin`)
            .setDescription(`Showing skin for player: **${username}**`)
            .setThumbnail(headUrl)
            .setImage(bodyUrl)
            .addFields(
                {
                    name: '🔗 Skin Links',
                    value: `[Avatar](${skinUrl}) | [Body](${bodyUrl}) | [Head](${headUrl})`,
                    inline: false
                },
                {
                    name: '🎨 Skin Viewer',
                    value: `[View in 3D](https://namemc.com/profile/${username})`,
                    inline: false
                }
            )
            .setFooter({ text: 'Skin data provided by mc-heads.net' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error fetching skin:', error);
        await interaction.editReply({ 
            content: `❌ Could not fetch skin for player "${username}". Make sure the username is correct and the player exists.` 
        });
    }
}
