import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';
const Rcon = require('rcon');

// Configuration
const MINECRAFT_SERVER_IP = '129.159.148.234';
const RCON_PORT = 25575; // Default RCON port
const RCON_PASSWORD = process.env.RCON_PASSWORD || 'your_rcon_password_here';

// Store active chat bridges per guild
const activeBridges = new Map<string, {
    channelId: string;
    rcon: any | null;
    interval: NodeJS.Timeout;
}>();

export const data = new SlashCommandBuilder()
    .setName('mcchat')
    .setDescription('Manage Minecraft-Discord chat bridge')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Start the chat bridge in current channel')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('stop')
            .setDescription('Stop the chat bridge')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('status')
            .setDescription('Check chat bridge status')
    );

export async function execute(interaction: any) {
    await interaction.deferReply({ flags: 64 });
    
    // Only allow admins
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: 'Only administrators can manage the chat bridge.' });
    }

    const guild = interaction.guild;
    if (!guild) {
        return interaction.editReply({ content: 'This command can only be used in a server.' });
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'start':
            await startChatBridge(interaction, guild);
            break;
        case 'stop':
            await stopChatBridge(interaction, guild);
            break;
        case 'status':
            await checkBridgeStatus(interaction, guild);
            break;
    }
}

async function startChatBridge(interaction: any, guild: any) {
    try {
        // Check if bridge is already active
        if (activeBridges.has(guild.id)) {
            return interaction.editReply({ 
                content: '❌ Chat bridge is already active. Use `/mcchat stop` to stop it first.' 
            });
        }

        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.editReply({ 
                content: '❌ Chat bridge can only be started in a text channel.' 
            });
        }

        // Test RCON connection with timeout
        let rcon: any | null = null;
        try {
            rcon = new Rcon(MINECRAFT_SERVER_IP, RCON_PORT, RCON_PASSWORD);
            
            // Add timeout to RCON connection
            await Promise.race([
                rcon.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('RCON connection timeout')), 3000)
                )
            ]);
            
            // Test command with timeout
            await Promise.race([
                rcon.send('list'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('RCON command timeout')), 2000)
                )
            ]);
            
            console.log('[CHAT BRIDGE] RCON connection successful');
            
        } catch (rconError) {
            console.error('[CHAT BRIDGE] RCON connection failed:', rconError);
            if (rcon) rcon.disconnect();
            return interaction.editReply({ 
                content: '❌ Failed to connect to Minecraft server RCON. Please check:\n• RCON is enabled in server.properties\n• RCON password is correct\n• Server is online' 
            });
        }

        // Set up the bridge
        const bridgeData = {
            channelId: channel.id,
            rcon: rcon,
            interval: setInterval(() => {
                // This would need server-side plugin to work properly
                // For now, we'll just maintain the connection
            }, 30000) // Keep alive every 30 seconds
        };

        activeBridges.set(guild.id, bridgeData);

        // Send welcome message to Minecraft
        try {
            await rcon.send(`say §aDDiscord chat bridge connected! Messages from #${channel.name} will appear here.`);
        } catch (error) {
            console.error('Failed to send welcome message to MC:', error);
        }

        await interaction.editReply({ 
            content: `✅ Chat bridge started!\n🔗 **Minecraft** ↔️ **#${channel.name}**\n\n⚠️ **Note:** For full functionality, you need a server-side plugin like DiscordSRV or similar to relay Minecraft chat to Discord.` 
        });

        // Send notification to channel
        await channel.send({
            embeds: [{
                color: 0x00FF00,
                title: '🔗 Minecraft Chat Bridge Active',
                description: `Messages in this channel will be sent to the Minecraft server.\n**Server:** ${MINECRAFT_SERVER_IP}`,
                timestamp: new Date().toISOString(),
                footer: { text: 'Use /mcchat stop to disable' }
            }]
        });

    } catch (error) {
        console.error('Error starting chat bridge:', error);
        await interaction.editReply({ content: '❌ Failed to start chat bridge. Please try again.' });
    }
}

async function stopChatBridge(interaction: any, guild: any) {
    try {
        const bridge = activeBridges.get(guild.id);
        if (!bridge) {
            return interaction.editReply({ content: '❌ No active chat bridge found.' });
        }

        // Send goodbye message to Minecraft
        if (bridge.rcon) {
            try {
                await bridge.rcon.send('say §cDiscord chat bridge disconnected.');
                bridge.rcon.disconnect();
            } catch (error) {
                console.error('Error sending goodbye message:', error);
            }
        }

        // Clear interval
        clearInterval(bridge.interval);
        activeBridges.delete(guild.id);

        // Send notification to Discord channel
        try {
            const channel = await guild.channels.fetch(bridge.channelId) as TextChannel;
            if (channel) {
                await channel.send({
                    embeds: [{
                        color: 0xFF0000,
                        title: '🔗 Minecraft Chat Bridge Disconnected',
                        description: 'Chat bridge has been stopped.',
                        timestamp: new Date().toISOString()
                    }]
                });
            }
        } catch (error) {
            console.error('Error sending disconnect message to Discord:', error);
        }

        await interaction.editReply({ content: '✅ Chat bridge stopped successfully.' });

    } catch (error) {
        console.error('Error stopping chat bridge:', error);
        await interaction.editReply({ content: '❌ Failed to stop chat bridge.' });
    }
}

async function checkBridgeStatus(interaction: any, guild: any) {
    const bridge = activeBridges.get(guild.id);
    
    if (!bridge) {
        return interaction.editReply({ 
            content: '🔴 **Chat Bridge Status:** Inactive\nUse `/mcchat start` to begin bridging chat.' 
        });
    }

    try {
        const channel = await guild.channels.fetch(bridge.channelId);
        const isRconConnected = bridge.rcon && bridge.rcon.hasAuthed;
        
        await interaction.editReply({ 
            content: `🟢 **Chat Bridge Status:** Active\n📍 **Channel:** <#${bridge.channelId}>\n🔗 **RCON:** ${isRconConnected ? 'Connected' : 'Disconnected'}\n🖥️ **Server:** ${MINECRAFT_SERVER_IP}` 
        });
    } catch (error) {
        await interaction.editReply({ 
            content: '⚠️ **Chat Bridge Status:** Error\nBridge data exists but channel may be deleted.' 
        });
    }
}

// Handle Discord messages to send to Minecraft
export async function handleDiscordMessage(message: any) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const bridge = activeBridges.get(message.guild.id);
    if (!bridge || bridge.channelId !== message.channel.id) return;

    if (!bridge.rcon) return;

    try {
        // Clean message content (remove mentions, emojis, etc.)
        let cleanContent = message.content
            .replace(/<@!?\d+>/g, '[mention]') // Replace mentions
            .replace(/<#\d+>/g, '[channel]') // Replace channel mentions
            .replace(/<:\w+:\d+>/g, '[emoji]') // Replace custom emojis
            .replace(/[^\u0000-\u007F\u0590-\u05FF]/g, '?') // Keep ASCII + Hebrew characters
            .substring(0, 256); // Limit length

        if (cleanContent.trim()) {
            // Use say command instead of tellraw for better compatibility
            const mcMessage = `say [Discord] ${message.author.displayName}: ${cleanContent}`;
            await bridge.rcon.send(mcMessage);
            console.log(`[CHAT BRIDGE] Discord -> MC: ${message.author.displayName}: ${cleanContent}`);
        }

        // Handle attachments
        if (message.attachments.size > 0) {
            const attachmentMsg = `say [Discord] ${message.author.displayName} sent ${message.attachments.size} file(s)`;
            await bridge.rcon.send(attachmentMsg);
        }

    } catch (error) {
        console.error('[CHAT BRIDGE] Error sending message to MC:', error);
    }
}

// Cleanup function
export function cleanup() {
    for (const [guildId, bridge] of activeBridges) {
        if (bridge.rcon) {
            bridge.rcon.disconnect();
        }
        clearInterval(bridge.interval);
    }
    activeBridges.clear();
}
