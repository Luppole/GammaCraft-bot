import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('הצג את השיר שמתנגן כרגע');

export async function execute(interaction: any) {
    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    if (!status.currentSong) {
        return interaction.reply({
            content: '❌ אין שיר שמתנגן כרגע!',
            ephemeral: true
        });
    }

    const song = status.currentSong;
    const progressBar = createProgressBar(0.3); // Placeholder progress

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎵 מתנגן עכשיו')
        .setDescription(`**${song.title}**`)
        .setThumbnail(song.thumbnail)
        .addFields(
            { name: '📺 ערוץ', value: song.channel, inline: true },
            { name: '⏱️ משך', value: song.duration, inline: true },
            { name: '👤 הוקשב על ידי', value: song.requestedBy.displayName, inline: true },
            { name: '📊 סטטוס', value: status.isPlaying ? '▶️ מתנגן' : '⏸️ מושהה', inline: true },
            { name: '🔊 עוצמה', value: `${Math.round(status.volume * 100)}%`, inline: true },
            { name: '🔄 מצב חזרה', value: getLoopModeText(status.loopMode), inline: true }
        );

    // Add queue info
    if (status.queueLength > 0) {
        embed.addFields({
            name: '📋 בתור',
            value: `${status.queueLength} שירים נוספים`,
            inline: true
        });
    }

    // Add progress bar (placeholder since we don't track time)
    embed.addFields({
        name: '⏱️ התקדמות',
        value: progressBar,
        inline: false
    });

    // Add song URL as button-like field
    embed.addFields({
        name: '🔗 קישור לשיר',
        value: `[פתח ביוטיוב](${song.url})`,
        inline: false
    });

    await interaction.reply({ embeds: [embed] });
}

function getLoopModeText(mode: string): string {
    switch (mode) {
        case 'song': return '🔂 שיר';
        case 'queue': return '🔁 תור';
        default: return '🔄 כבוי';
    }
}

function createProgressBar(progress: number): string {
    const totalBars = 20;
    const filledBars = Math.round(progress * totalBars);
    const emptyBars = totalBars - filledBars;
    
    return `${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)} ${Math.round(progress * 100)}%`;
}
