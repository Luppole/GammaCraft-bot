import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('השהה או המשך את המוזיקה');

export async function execute(interaction: any) {
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לשלוט במוזיקה!',
            ephemeral: true
        });
    }

    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    if (!status.currentSong) {
        return interaction.reply({
            content: '❌ אין שיר שמתנגן כרגע!',
            ephemeral: true
        });
    }

    let result: boolean;
    let action: string;
    let emoji: string;

    if (status.isPlaying) {
        result = musicManager.pause();
        action = 'הושהה';
        emoji = '⏸️';
    } else {
        result = musicManager.resume();
        action = 'הומשך';
        emoji = '▶️';
    }

    if (result) {
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle(`${emoji} המוזיקה ${action}`)
            .setDescription(`**${status.currentSong.title}**`)
            .addFields(
                { name: '👤 בוצע על ידי', value: member.displayName, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    } else {
        await interaction.reply({
            content: `❌ לא הצלחתי ל${action === 'הושהה' ? 'השהות' : 'להמשיך'} את המוזיקה!`,
            ephemeral: true
        });
    }
}
