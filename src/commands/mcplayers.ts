import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { status } from 'minecraft-server-util';
import { safeDeferReply, safeReply, handleInteractionError } from '../helperFunctions/interactionHelpers';

const MINECRAFT_SERVER_IP = '129.159.148.234';
const MINECRAFT_SERVER_PORT = 25565;

export const data = new SlashCommandBuilder()
    .setName('mcplayers')
    .setDescription('הצג מי מחובר כרגע לשרת המיינקראפט');

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
            .setColor(0x00FF00)
            .setTitle('🎮 שחקני שרת מיינקראפט')
            .setThumbnail('https://via.placeholder.com/64x64/00FF00/FFFFFF?text=MC')
            .addFields(
                {
                    name: '📊 מידע שרת',
                    value: `**IP:** ${MINECRAFT_SERVER_IP}\n**גרסה:** ${serverStatus.version.name}\n**שחקנים:** ${serverStatus.players.online}/${serverStatus.players.max}`,
                    inline: false
                }
            )
            .setTimestamp();

        // Add player list if available
        if (serverStatus.players.sample && serverStatus.players.sample.length > 0) {
            const playerList = serverStatus.players.sample
                .map((player: any) => `• ${player.name}`)
                .join('\n');
            
            embed.addFields({
                name: '👥 שחקנים מחוברים',
                value: playerList || 'אין שחקנים נראים',
                inline: false
            });
        } else if (serverStatus.players.online > 0) {
            embed.addFields({
                name: '👥 שחקנים מחוברים',
                value: `${serverStatus.players.online} שחקנים מחוברים (שמות מוסתרים על ידי השרת)`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '👥 Online Players',
                value: 'No players currently online',
                inline: false
            });
        }

        await safeReply(interaction, { embeds: [embed] });

    } catch (error) {
        await handleInteractionError(interaction, error, 'mcplayers', 
            'לא ניתן לקבל רשימת שחקנים. השרת עלול להיות לא מחובר או שהשירות זמנית לא זמין.');
    }
}
