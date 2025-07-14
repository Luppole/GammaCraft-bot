import { SlashCommandBuilder, EmbedBuilder, GuildMember, VoiceChannel } from 'discord.js';
import { MusicManager } from '../musicManager';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('נגן מוזיקה מיוטיוב')
    .addStringOption(option =>
        option.setName('שיר')
            .setDescription('שם השיר או קישור יוטיוב')
            .setRequired(true)
    );

export async function execute(interaction: any) {
    const member = interaction.member as GuildMember;
    const query = interaction.options.getString('שיר');

    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ אתה צריך להיות בערוץ קולי כדי לנגן מוזיקה!',
            ephemeral: true
        });
    }

    const voiceChannel = member.voice.channel as VoiceChannel;
    const permissions = voiceChannel.permissionsFor(interaction.client.user);

    if (!permissions?.has(['Connect', 'Speak'])) {
        return interaction.reply({
            content: '❌ אין לי הרשאות להתחבר או לדבר בערוץ הקולי הזה!',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        const musicManager = MusicManager.getInstance(interaction.guild.id);
        
        // Join voice channel if not already connected
        const connected = await musicManager.join(voiceChannel, interaction.channel);
        if (!connected) {
            return interaction.editReply('❌ לא הצלחתי להתחבר לערוץ הקולי!');
        }

        // Add song to queue
        const song = await musicManager.addSong(query, member);
        if (!song) {
            return interaction.editReply('❌ לא הצלחתי למצוא את השיר הזה!');
        }

        const status = musicManager.getStatus();
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ השיר נוסף לתור!')
            .setDescription(`**${song.title}**`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ משך', value: song.duration, inline: true },
                { name: '📺 ערוץ', value: song.channel, inline: true },
                { name: '👤 הוקשב על ידי', value: song.requestedBy.displayName, inline: true },
                { name: '📋 מיקום בתור', value: status.queueLength.toString(), inline: true }
            );

        await interaction.editReply({ embeds: [embed] });

        // Start playing if not already playing
        if (!status.isPlaying) {
            await musicManager.play();
        }

    } catch (error) {
        console.error('שגיאה בפקודת play:', error);
        await interaction.editReply('❌ אירעה שגיאה בניסיון לנגן את השיר.');
    }
}
