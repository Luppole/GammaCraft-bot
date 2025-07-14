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
    try {
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

        // Defer reply with longer timeout handling
        await interaction.deferReply();

        const musicManager = MusicManager.getInstance(interaction.guild.id);
        
        // Join voice channel if not already connected (with timeout)
        const connectPromise = musicManager.join(voiceChannel, interaction.channel);
        const connected = await Promise.race([
            connectPromise,
            new Promise<boolean>((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]);

        if (!connected) {
            return interaction.editReply('❌ לא הצלחתי להתחבר לערוץ הקולי!');
        }

        // Add song to queue with timeout protection
        const songPromise = musicManager.addSong(query, member);
        const song = await Promise.race([
            songPromise,
            new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Search timeout')), 10000)
            )
        ]);

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

        // Start playing if not already playing (don't wait for this)
        if (!status.isPlaying) {
            musicManager.play().catch(console.error);
        }

    } catch (error) {
        console.error('שגיאה בפקודת play:', error);
        
        // Check if interaction is still valid before responding
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply('❌ אירעה שגיאה בניסיון לנגן את השיר.');
        } else if (interaction.deferred) {
            await interaction.editReply('❌ אירעה שגיאה בניסיון לנגן את השיר.');
        }
    }
}
