import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
// Note: You'd need to install 'rcon' package: npm install rcon @types/rcon

export const data = new SlashCommandBuilder()
    .setName('mcrcon')
    .setDescription('Execute RCON commands on the Minecraft server (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('command')
            .setDescription('RCON command to execute')
            .setRequired(true)
    );

export async function execute(interaction: any) {
    await interaction.deferReply({ flags: 64 });
    
    // Only allow admins
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: 'Only administrators can use RCON commands.' });
    }

    const command = interaction.options.getString('command');
    
    // Safety checks for dangerous commands
    const dangerousCommands = ['stop', 'restart', 'shutdown', 'ban', 'op'];
    const commandLower = command.toLowerCase();
    
    if (dangerousCommands.some(dangerous => commandLower.includes(dangerous))) {
        return interaction.editReply({ 
            content: '❌ Dangerous commands are not allowed through Discord for security reasons.' 
        });
    }

    try {
        // This is a placeholder - you'd need to implement actual RCON connection
        // const Rcon = require('rcon');
        // const rcon = new Rcon('129.159.148.234', 25575, 'your_rcon_password');
        // await rcon.connect();
        // const response = await rcon.send(command);
        // rcon.disconnect();

        await interaction.editReply({ 
            content: `🔧 RCON feature not yet implemented. Would execute: \`${command}\`` 
        });

    } catch (error) {
        console.error('RCON error:', error);
        await interaction.editReply({ 
            content: '❌ Failed to execute RCON command. Make sure RCON is enabled on the server.' 
        });
    }
}
