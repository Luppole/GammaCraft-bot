import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test bot responsiveness and latency');

export async function execute(interaction: any) {
    // Test the new deferReply pattern
    await interaction.deferReply();
    
    const start = Date.now();
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const latency = Date.now() - start;
    const apiLatency = Math.round(interaction.client.ws.ping);
    
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🏓 Pong!')
        .addFields(
            {
                name: '⚡ Response Time',
                value: `${latency}ms`,
                inline: true
            },
            {
                name: '📡 API Latency',
                value: `${apiLatency}ms`,
                inline: true
            },
            {
                name: '🔧 Status',
                value: 'All systems operational',
                inline: true
            }
        )
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}
