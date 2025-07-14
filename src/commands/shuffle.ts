import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('ערבב את תור השירים באופן אקראי');

export async function execute(interaction: any) {
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לערבב את התור!',
            ephemeral: true
        });
    }

    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    if (status.queueLength < 2) {
        return interaction.reply({
            content: '❌ צריכים לפחות 2 שירים בתור כדי לערבב!',
            ephemeral: true
        });
    }

    const beforeShuffle = musicManager.getQueue().slice(0, 3).map(song => song.title);
    musicManager.shuffle();
    const afterShuffle = musicManager.getQueue().slice(0, 3).map(song => song.title);

    const embed = new EmbedBuilder()
        .setColor(0x9932cc)
        .setTitle('🔀 התור עורבב!')
        .setDescription(`${status.queueLength} שירים עורבבו באופן אקראי`)
        .addFields(
            { name: '👤 עורבב על ידי', value: member.displayName, inline: true },
            { name: '📋 שירים בתור', value: status.queueLength.toString(), inline: true }
        );

    // Show preview of shuffle (first 3 songs)
    if (beforeShuffle.length > 0 && afterShuffle.length > 0) {
        embed.addFields(
            { 
                name: '🔄 לפני העירבוב (3 ראשונים)', 
                value: beforeShuffle.map((title, i) => `${i + 1}. ${title}`).join('\n'), 
                inline: true 
            },
            { 
                name: '🔀 אחרי העירבוב (3 ראשונים)', 
                value: afterShuffle.map((title, i) => `${i + 1}. ${title}`).join('\n'), 
                inline: true 
            }
        );
    }

    await interaction.reply({ embeds: [embed] });
}
