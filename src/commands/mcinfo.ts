import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { status } from 'minecraft-server-util';

const MINECRAFT_SERVER_IP = '129.159.148.234';
const MINECRAFT_SERVER_PORT = 25565;

export const data = new SlashCommandBuilder()
    .setName('mcinfo')
    .setDescription('Get detailed information about the Minecraft server');

export async function execute(interaction: any) {
    await interaction.deferReply();

    try {
        const serverStatus = await status(MINECRAFT_SERVER_IP, MINECRAFT_SERVER_PORT, {
            timeout: 5000
        });

        const embed = new EmbedBuilder()
            .setColor(0x55AA55)
            .setTitle('🏰 Minecraft Server Information')
            .setThumbnail('https://via.placeholder.com/64x64/55AA55/FFFFFF?text=MC')
            .addFields(
                {
                    name: '🌐 Connection',
                    value: `**IP:** \`${MINECRAFT_SERVER_IP}:${MINECRAFT_SERVER_PORT}\`\n**Status:** 🟢 Online`,
                    inline: true
                },
                {
                    name: '📊 Players',
                    value: `**Online:** ${serverStatus.players.online}\n**Max:** ${serverStatus.players.max}`,
                    inline: true
                },
                {
                    name: '⚡ Performance',
                    value: `**Ping:** ${serverStatus.roundTripLatency}ms\n**Version:** ${serverStatus.version.name}`,
                    inline: true
                }
            )
            .setTimestamp();

        // Add MOTD if available
        if (serverStatus.motd && serverStatus.motd.clean) {
            embed.addFields({
                name: '📝 Message of the Day',
                value: serverStatus.motd.clean,
                inline: false
            });
        }

        // Add favicon if available
        if (serverStatus.favicon) {
            embed.setThumbnail(`data:image/png;base64,${serverStatus.favicon}`);
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔴 Server Offline')
            .setDescription('Cannot retrieve server information')
            .addFields(
                {
                    name: '🌐 Connection',
                    value: `**IP:** \`${MINECRAFT_SERVER_IP}:${MINECRAFT_SERVER_PORT}\`\n**Status:** 🔴 Offline`,
                    inline: false
                },
                {
                    name: 'Error',
                    value: 'Server is unreachable or offline',
                    inline: false
                }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
