import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription('שנה מצב חזרה של המוזיקה')
    .addStringOption(option =>
        option.setName('מצב')
            .setDescription('בחר מצב חזרה')
            .setRequired(true)
            .addChoices(
                { name: 'כבוי - אל תחזור על שום דבר', value: 'off' },
                { name: 'שיר - חזור על השיר הנוכחי', value: 'song' },
                { name: 'תור - חזור על כל התור', value: 'queue' }
            )
    );

export async function execute(interaction: any) {
    const member = interaction.member;
    const mode = interaction.options.getString('מצב') as 'off' | 'song' | 'queue';

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לשנות מצב חזרה!',
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

    const oldMode = status.loopMode;
    musicManager.setLoopMode(mode);

    const modeText = getModeText(mode);
    const oldModeText = getModeText(oldMode);
    const modeEmoji = getModeEmoji(mode);

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${modeEmoji} מצב החזרה שונה`)
        .setDescription(`מצב החזרה שונה ל: **${modeText}**`)
        .addFields(
            { name: '🔄 מצב קודם', value: oldModeText, inline: true },
            { name: '🔄 מצב חדש', value: modeText, inline: true },
            { name: '👤 שונה על ידי', value: member.displayName, inline: true }
        );

    // Add explanation for each mode
    let explanation = '';
    switch (mode) {
        case 'off':
            explanation = 'השירים יתנגנו פעם אחת ויעברו לשיר הבא';
            break;
        case 'song':
            explanation = 'השיר הנוכחי יחזור על עצמו עד שתדלג או תשנה מצב';
            break;
        case 'queue':
            explanation = 'כל התור יחזור על עצמו כשהוא מסתיים';
            break;
    }

    embed.addFields({
        name: '📝 הסבר',
        value: explanation,
        inline: false
    });

    await interaction.reply({ embeds: [embed] });
}

function getModeText(mode: string): string {
    switch (mode) {
        case 'song': return 'חזרה על שיר';
        case 'queue': return 'חזרה על תור';
        default: return 'ללא חזרה';
    }
}

function getModeEmoji(mode: string): string {
    switch (mode) {
        case 'song': return '🔂';
        case 'queue': return '🔁';
        default: return '🔄';
    }
}
