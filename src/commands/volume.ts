import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('volume')
    .setDescription('שנה את עוצמת הקול')
    .addIntegerOption(option =>
        option.setName('עוצמה')
            .setDescription('עוצמת הקול (0-100)')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true)
    );

export async function execute(interaction: any) {
    const member = interaction.member;
    const volume = interaction.options.getInteger('עוצמה');

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לשנות את עוצמת הקול!',
            ephemeral: true
        });
    }

    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    if (!status.currentSong && status.queueLength === 0) {
        return interaction.reply({
            content: '❌ אין מוזיקה שמתנגנת כרגע!',
            ephemeral: true
        });
    }

    const oldVolume = Math.round(status.volume * 100);
    musicManager.setVolume(volume / 100);

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔊 עוצמת הקול שונתה')
        .addFields(
            { name: '📊 עוצמה קודמת', value: `${oldVolume}%`, inline: true },
            { name: '📊 עוצמה חדשה', value: `${volume}%`, inline: true },
            { name: '👤 שונה על ידי', value: member.displayName, inline: true }
        );

    // Add volume bar visualization
    const volumeBars = Math.floor(volume / 10);
    const volumeBar = '█'.repeat(volumeBars) + '░'.repeat(10 - volumeBars);
    embed.addFields({
        name: '📊 מחוון עוצמה',
        value: `\`${volumeBar}\` ${volume}%`,
        inline: false
    });

    if (volume === 0) {
        embed.setDescription('🔇 המוזיקה כעת מושתקת');
    } else if (volume <= 25) {
        embed.setDescription('🔈 עוצמה נמוכה');
    } else if (volume <= 75) {
        embed.setDescription('🔉 עוצמה בינונית');
    } else {
        embed.setDescription('🔊 עוצמה גבוהה');
    }

    embed.setFooter({ text: 'שינוי העוצמה יחול על השיר הבא' });

    await interaction.reply({ embeds: [embed] });
}
