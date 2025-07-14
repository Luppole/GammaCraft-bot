import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('עצור את המוזיקה ונקה את התור');

export async function execute(interaction: any) {
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לעצור את המוזיקה!',
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

    const currentSong = status.currentSong;
    const queueLength = status.queueLength;
    
    musicManager.stop();

    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('⏹️ המוזיקה נעצרה')
        .setDescription('המוזיקה נעצרה והתור נוקה.')
        .addFields(
            { name: '👤 נעצר על ידי', value: member.displayName, inline: true },
            { name: '📋 שירים שנמחקו', value: (queueLength + (currentSong ? 1 : 0)).toString(), inline: true }
        );

    if (currentSong) {
        embed.addFields({
            name: '🎵 השיר שנעצר',
            value: currentSong.title,
            inline: false
        });
    }

    await interaction.reply({ embeds: [embed] });
}
