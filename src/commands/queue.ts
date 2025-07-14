import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('הצג את תור השירים הנוכחי')
    .addIntegerOption(option =>
        option.setName('עמוד')
            .setDescription('מספר העמוד להציג (כל עמוד מכיל 10 שירים)')
            .setMinValue(1)
    );

export async function execute(interaction: any) {
    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();
    const queue = musicManager.getQueue();
    const page = interaction.options.getInteger('עמוד') || 1;

    if (!status.currentSong && queue.length === 0) {
        return interaction.reply({
            content: '❌ התור ריק! השתמש ב `/play` כדי להוסיף שירים.',
            ephemeral: true
        });
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(queue.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageQueue = queue.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎵 תור השירים')
        .setTimestamp();

    // Current song
    if (status.currentSong) {
        embed.addFields({
            name: '🎵 מנגן עכשיו',
            value: `**${status.currentSong.title}**\n` +
                   `📺 ${status.currentSong.channel}\n` +
                   `👤 הוקשב על ידי ${status.currentSong.requestedBy.displayName}\n` +
                   `⏱️ ${status.currentSong.duration}`,
            inline: false
        });
    }

    // Queue
    if (queue.length > 0) {
        const queueText = pageQueue.map((song, index) => {
            const position = startIndex + index + 1;
            return `\`${position}.\` **${song.title}**\n` +
                   `📺 ${song.channel} | ⏱️ ${song.duration}\n` +
                   `👤 ${song.requestedBy.displayName}\n`;
        }).join('\n');

        embed.addFields({
            name: `📋 בתור (${queue.length} שירים)`,
            value: queueText || 'התור ריק',
            inline: false
        });

        if (totalPages > 1) {
            embed.setFooter({ text: `עמוד ${page} מתוך ${totalPages} | השתמש בפרמטר "עמוד" לעבור בין עמודים` });
        }
    }

    // Status info
    const statusText = [
        `🔊 עוצמה: ${Math.round(status.volume * 100)}%`,
        `🔄 מצב חזרה: ${getLoopModeText(status.loopMode)}`,
        `📊 סטטוס: ${status.isPlaying ? 'מנגן' : 'מושהה'}`
    ].join(' | ');

    embed.addFields({
        name: '📊 מידע נוסף',
        value: statusText,
        inline: false
    });

    await interaction.reply({ embeds: [embed] });
}

function getLoopModeText(mode: string): string {
    switch (mode) {
        case 'song': return 'שיר';
        case 'queue': return 'תור';
        default: return 'כבוי';
    }
}
