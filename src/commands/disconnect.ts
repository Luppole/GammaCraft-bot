import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('נתק את הבוט מהערוץ הקולי');

export async function execute(interaction: any) {
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לנתק את הבוט!',
            ephemeral: true
        });
    }

    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('👋 הבוט התנתק')
        .setDescription('הבוט התנתק מהערוץ הקולי')
        .addFields(
            { name: '👤 נותק על ידי', value: member.displayName, inline: true }
        );

    if (status.currentSong) {
        embed.addFields({
            name: '🎵 השיר שנעצר',
            value: status.currentSong.title,
            inline: true
        });
    }

    if (status.queueLength > 0) {
        embed.addFields({
            name: '📋 שירים שנמחקו',
            value: status.queueLength.toString(),
            inline: true
        });
    }

    musicManager.disconnect();

    await interaction.reply({ embeds: [embed] });
}
