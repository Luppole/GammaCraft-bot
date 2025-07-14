import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('נקה את תור השירים (מנהלים בלבד)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לנקות את התור!',
            ephemeral: true
        });
    }

    const musicManager = MusicManager.getInstance(interaction.guild.id);
    const status = musicManager.getStatus();

    if (status.queueLength === 0) {
        return interaction.reply({
            content: '❌ התור כבר ריק!',
            ephemeral: true
        });
    }

    const clearedSongs = status.queueLength;
    musicManager.clearQueue();

    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🗑️ התור נוקה')
        .setDescription(`כל השירים הוסרו מהתור`)
        .addFields(
            { name: '👤 נוקה על ידי', value: member.displayName, inline: true },
            { name: '📋 שירים שנמחקו', value: clearedSongs.toString(), inline: true }
        );

    if (status.currentSong) {
        embed.addFields({
            name: '🎵 שיר נוכחי',
            value: `${status.currentSong.title} ממשיך לנגן`,
            inline: false
        });
    }

    await interaction.reply({ embeds: [embed] });
}
