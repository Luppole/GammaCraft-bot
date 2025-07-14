import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { promises as fs } from 'fs';
import { status } from 'minecraft-server-util';
import { join } from 'path';

const MINECRAFT_SERVER_IP = '129.159.148.234';
const MINECRAFT_SERVER_PORT = 25565;
const HISTORY_FILE = join(__dirname, '../../data/mchistory.json');

interface ServerCheck {
    timestamp: number;
    online: boolean;
    players?: number;
    maxPlayers?: number;
}

export const data = new SlashCommandBuilder()
    .setName('mcstats')
    .setDescription('הצג סטטיסטיקות שרת מיינקראפט והיסטוריית זמינות');

export async function execute(interaction: any) {
    await interaction.deferReply();

    try {
        // Load history
        const history = await loadHistory();
        
        // Current status check
        let currentStatus: ServerCheck;
        try {
            // Faster timeout to prevent Discord interaction timeout
            const serverStatus = await Promise.race([
                status(MINECRAFT_SERVER_IP, MINECRAFT_SERVER_PORT, { timeout: 2000 }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Server check timeout')), 2000)
                )
            ]) as any;
            currentStatus = {
                timestamp: Date.now(),
                online: true,
                players: serverStatus.players.online,
                maxPlayers: serverStatus.players.max
            };
        } catch (error) {
            currentStatus = {
                timestamp: Date.now(),
                online: false
            };
        }

        // Save current check
        history.push(currentStatus);
        await saveHistory(history);

        // Calculate statistics
        const last24h = history.filter(check => check.timestamp > Date.now() - 24 * 60 * 60 * 1000);
        const last7d = history.filter(check => check.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const uptime24h = last24h.length > 0 ? (last24h.filter(c => c.online).length / last24h.length) * 100 : 0;
        const uptime7d = last7d.length > 0 ? (last7d.filter(c => c.online).length / last7d.length) * 100 : 0;
        
        const avgPlayers24h = last24h.filter(c => c.online && c.players !== undefined)
            .reduce((sum, c) => sum + (c.players || 0), 0) / Math.max(1, last24h.filter(c => c.online).length);
        
        const maxPlayers24h = Math.max(...last24h.filter(c => c.online && c.players !== undefined).map(c => c.players || 0), 0);

        const embed = new EmbedBuilder()
            .setColor(currentStatus.online ? 0x00FF00 : 0xFF0000)
            .setTitle('📈 Minecraft Server Statistics')
            .addFields(
                {
                    name: '🔴🟢 Current Status',
                    value: currentStatus.online 
                        ? `🟢 Online (${currentStatus.players}/${currentStatus.maxPlayers} players)`
                        : '🔴 Offline',
                    inline: false
                },
                {
                    name: '⏱️ Uptime (24h)',
                    value: `${uptime24h.toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '⏱️ Uptime (7d)',
                    value: `${uptime7d.toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '👥 Avg Players (24h)',
                    value: avgPlayers24h.toFixed(1),
                    inline: true
                },
                {
                    name: '🏆 Peak Players (24h)',
                    value: maxPlayers24h.toString(),
                    inline: true
                },
                {
                    name: '📊 Data Points',
                    value: `24h: ${last24h.length} | 7d: ${last7d.length}`,
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error in mcstats command:', error);
        await interaction.editReply({ content: 'Failed to retrieve server statistics.' });
    }
}

async function loadHistory(): Promise<ServerCheck[]> {
    try {
        const data = await fs.readFile(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveHistory(history: ServerCheck[]): Promise<void> {
    try {
        // Keep only last 7 days of data
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = history.filter(check => check.timestamp > cutoff);
        
        // Ensure data directory exists
        await fs.mkdir(join(__dirname, '../../data'), { recursive: true });
        await fs.writeFile(HISTORY_FILE, JSON.stringify(filtered, null, 2));
    } catch (error) {
        console.error('Error saving MC history:', error);
    }
}
