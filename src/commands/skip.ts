import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('דלג על השיר הנוכחי');

export async function execute(interaction: any) {
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לדלג על שירים!',
            ephemeral: true
        });
    }

    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    if (!status.isPlaying || !status.currentSong) {
        return interaction.reply({
            content: '❌ אין שיר שמתנגן כרגע!',
            ephemeral: true
        });
    }

    const skipped = musicManager.skip();
    if (skipped) {
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('⏭️ השיר נדלג')
            .setDescription(`דילגת על: **${status.currentSong.title}**`)
            .addFields(
                { name: '👤 דולג על ידי', value: member.displayName, inline: true },
                { name: '📋 שירים בתור', value: status.queueLength.toString(), inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    } else {
        await interaction.reply({
            content: '❌ לא הצלחתי לדלג על השיר!',
            ephemeral: true
        });
    }
}
