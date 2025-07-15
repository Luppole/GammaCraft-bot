import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { status } from 'minecraft-server-util';
import { safeDeferReply, safeReply, handleInteractionError } from '../helperFunctions/interactionHelpers';

const MINECRAFT_SERVER_IP = '129.159.148.234';
const MINECRAFT_SERVER_PORT = 25565;

export const data = new SlashCommandBuilder()
    .setName('mcinfo')
    .setDescription('קבל מידע מפורט על שרת המיינקראפט');

export async function execute(interaction: any) {
    try {
        // Use helper function to safely defer reply
        await safeDeferReply(interaction);

        // Faster timeout to prevent Discord interaction timeout
        const serverStatus = await Promise.race([
            status(MINECRAFT_SERVER_IP, MINECRAFT_SERVER_PORT, { timeout: 3000 }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Server check timeout')), 3000)
            )
        ]) as any;

        const embed = new EmbedBuilder()
            .setColor(0x55AA55)
            .setTitle('🏰 מידע שרת מיינקראפט')
            .setThumbnail('https://via.placeholder.com/64x64/55AA55/FFFFFF?text=MC')
            .addFields(
                {
                    name: '🌐 חיבור',
                    value: `**IP:** \`${MINECRAFT_SERVER_IP}:${MINECRAFT_SERVER_PORT}\`\n**מצב:** 🟢 מחובר`,
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

        await safeReply(interaction, { embeds: [embed] });

    } catch (error) {
        await handleInteractionError(interaction, error, 'mcinfo', 
            'לא ניתן לקבל מידע על השרת. השרת עלול להיות לא מחובר או שהשירות זמנית לא זמין.');
    }
}
