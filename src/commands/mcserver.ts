import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { status } from 'minecraft-server-util';

const MINECRAFT_SERVER_IP = '129.159.148.234';
const MINECRAFT_SERVER_PORT = 25565; // Default Minecraft port

// Store active monitoring intervals per guild
const monitoringIntervals = new Map<string, NodeJS.Timeout>();
const statusChannels = new Map<string, string>(); // guildId -> channelId

export const data = new SlashCommandBuilder()
    .setName('mcserver')
    .setDescription('צור או נהל ערוץ קולי שמציג מצב שרת המיינקראפט')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('צור ערוץ קולי שמציג מצב שרת המיינקראפט')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('stop')
            .setDescription('הפסק מעקב והסר את ערוץ המצב')
    );

export async function execute(interaction: any) {
    await interaction.deferReply({ flags: 64 });
    
    // Only allow admins
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: 'Only administrators can use this command.' });
    }

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
        await createStatusChannel(interaction, guild);
    } else if (subcommand === 'stop') {
        await stopMonitoring(interaction, guild);
    }
}

async function createStatusChannel(interaction: any, guild: any) {
    try {
        // Check if monitoring is already active for this guild
        if (monitoringIntervals.has(guild.id)) {
            return interaction.editReply({ 
                content: '❌ A Minecraft server status channel is already active. Use `/mcserver stop` to stop monitoring first.' 
            });
        }

        // Create the voice channel
        const channel = await guild.channels.create({
            name: '🔍 Checking Server...',
            type: ChannelType.GuildVoice,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: ['Connect', 'Speak'], // Prevent users from joining
                    allow: ['ViewChannel']
                }
            ]
        });

        statusChannels.set(guild.id, channel.id);

        // Start monitoring
        await startMonitoring(guild.id, channel);

        await interaction.editReply({ 
            content: `✅ Created Minecraft server status channel: <#${channel.id}>\n🔄 Monitoring ${MINECRAFT_SERVER_IP} every 60 seconds.` 
        });

    } catch (error) {
        console.error('Error creating MC server status channel:', error);
        await interaction.editReply({ content: '❌ Failed to create status channel. Please check bot permissions.' });
    }
}

async function stopMonitoring(interaction: any, guild: any) {
    try {
        const interval = monitoringIntervals.get(guild.id);
        const channelId = statusChannels.get(guild.id);

        if (!interval || !channelId) {
            return interaction.editReply({ content: '❌ No active Minecraft server monitoring found for this server.' });
        }

        // Clear the interval
        clearInterval(interval);
        monitoringIntervals.delete(guild.id);
        statusChannels.delete(guild.id);

        // Delete the channel
        try {
            const channel = await guild.channels.fetch(channelId);
            if (channel) {
                await channel.delete();
            }
        } catch (channelError) {
            console.log('Channel may have already been deleted:', channelError);
        }

        await interaction.editReply({ content: '✅ Stopped Minecraft server monitoring and removed status channel.' });

    } catch (error) {
        console.error('Error stopping MC server monitoring:', error);
        await interaction.editReply({ content: '❌ Failed to stop monitoring. Please try again.' });
    }
}

async function startMonitoring(guildId: string, channel: any) {
    // Initial check
    await updateChannelStatus(channel);

    // Set up interval to check every 60 seconds
    const interval = setInterval(async () => {
        try {
            await updateChannelStatus(channel);
        } catch (error) {
            console.error('Error updating MC server status:', error);
        }
    }, 60000); // 60 seconds

    monitoringIntervals.set(guildId, interval);
}

async function updateChannelStatus(channel: any) {
    try {
        // Check server status
        const serverStatus = await status(MINECRAFT_SERVER_IP, MINECRAFT_SERVER_PORT, {
            timeout: 5000 // 5 second timeout
        });

        // Server is online
        const onlinePlayers = serverStatus.players.online;
        const maxPlayers = serverStatus.players.max;
        const serverVersion = serverStatus.version.name;

        let channelName = `🟢 למעלה (${onlinePlayers}/${maxPlayers})`;
        
        // Limit channel name length (Discord has a 100 character limit)
        if (channelName.length > 100) {
            channelName = `🟢 Online (${onlinePlayers}/${maxPlayers})`;
        }

        await channel.setName(channelName);
        
        console.log(`[MC STATUS] ${MINECRAFT_SERVER_IP} - Online: ${onlinePlayers}/${maxPlayers} players (${serverVersion})`);

    } catch (error) {
        // Server is offline or unreachable
        await channel.setName('🔴 למטה');
        console.log(`[MC STATUS] ${MINECRAFT_SERVER_IP} - Offline or unreachable`);
    }
}

// Cleanup function to clear intervals when bot shuts down
export function cleanup() {
    for (const [guildId, interval] of monitoringIntervals) {
        clearInterval(interval);
    }
    monitoringIntervals.clear();
    statusChannels.clear();
}
