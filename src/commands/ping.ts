import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('בדוק זמן תגובה והשהייה של הבוט');

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
        .setTitle('🏓 פונג!')
        .addFields(
            {
                name: '⚡ זמן תגובה',
                value: `${latency}ms`,
                inline: true
            },
            {
                name: '📡 השהיית API',
                value: `${apiLatency}ms`,
                inline: true
            },
            {
                name: '🔧 מצב',
                value: 'כל המערכות פועלות',
                inline: true
            }
        )
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}
