import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
    getVoiceConnection,
    AudioResource,
} from '@discordjs/voice';
import { GuildMember, TextChannel, EmbedBuilder, VoiceChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import { search, video_basic_info } from 'play-dl';

export interface Song {
    title: string;
    url: string;
    duration: string;
    thumbnail: string;
    requestedBy: GuildMember;
    channel: string;
}

export class MusicManager {
    private static instances = new Map<string, MusicManager>();
    
    private queue: Song[] = [];
    private isPlaying = false;
    private currentSong: Song | null = null;
    private player: AudioPlayer;
    private connection: VoiceConnection | null = null;
    private textChannel: TextChannel | null = null;
    private volume = 0.5;
    private loopMode: 'off' | 'song' | 'queue' = 'off';

    private constructor(private guildId: string) {
        this.player = createAudioPlayer();
        this.setupPlayerEvents();
    }

    public static getInstance(guildId: string): MusicManager {
        if (!this.instances.has(guildId)) {
            this.instances.set(guildId, new MusicManager(guildId));
        }
        return this.instances.get(guildId)!;
    }

    private setupPlayerEvents() {
        this.player.on(AudioPlayerStatus.Playing, () => {
            if (this.currentSong && this.textChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🎵 מתחיל לנגן')
                    .setDescription(`**${this.currentSong.title}**`)
                    .setThumbnail(this.currentSong.thumbnail)
                    .addFields(
                        { name: '⏱️ משך', value: this.currentSong.duration, inline: true },
                        { name: '👤 הוקשב על ידי', value: this.currentSong.requestedBy.displayName, inline: true },
                        { name: '📋 בתור', value: `${this.queue.length} שירים`, inline: true }
                    );
                
                this.textChannel.send({ embeds: [embed] });
            }
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.playNext();
        });

        this.player.on('error', (error) => {
            console.error('שגיאה בנגן המוזיקה:', error);
            if (this.textChannel) {
                this.textChannel.send('❌ שגיאה בניגון השיר. עובר לשיר הבא...');
            }
            this.playNext();
        });
    }

    public async join(voiceChannel: VoiceChannel, textChannel: TextChannel): Promise<boolean> {
        try {
            this.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            this.connection.subscribe(this.player);
            this.textChannel = textChannel;

            this.connection.on(VoiceConnectionStatus.Disconnected, () => {
                this.cleanup();
            });

            return true;
        } catch (error) {
            console.error('שגיאה בהתחברות לערוץ קולי:', error);
            return false;
        }
    }

    public async addSong(query: string, member: GuildMember): Promise<Song | null> {
        try {
            if (ytdl.validateURL(query)) {
                // Direct YouTube URL with timeout
                const infoPromise = ytdl.getInfo(query);
                const songInfo = await Promise.race([
                    infoPromise,
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error('YouTube info timeout')), 8000)
                    )
                ]);
                
                const song: Song = {
                    title: songInfo.videoDetails.title,
                    url: query,
                    duration: this.formatDuration(parseInt(songInfo.videoDetails.lengthSeconds)),
                    thumbnail: songInfo.videoDetails.thumbnails[0]?.url || '',
                    requestedBy: member,
                    channel: songInfo.videoDetails.author.name
                };
                this.queue.push(song);
                return song;
            } else {
                // Search query with timeout
                const searchPromise = search(query, { limit: 1, source: { youtube: 'video' } });
                const searchResults = await Promise.race([
                    searchPromise,
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error('Search timeout')), 8000)
                    )
                ]);
                
                if (searchResults.length === 0) return null;
                
                const video = searchResults[0];
                
                // Get additional video info with timeout
                try {
                    const videoInfoPromise = video_basic_info(video.url);
                    await Promise.race([
                        videoInfoPromise,
                        new Promise<never>((_, reject) => 
                            setTimeout(() => reject(new Error('Video info timeout')), 5000)
                        )
                    ]);
                } catch (infoError) {
                    console.log('Warning: Could not get detailed video info, using basic info');
                }
                
                const song: Song = {
                    title: video.title || 'שיר לא ידוע',
                    url: video.url,
                    duration: this.formatDuration(video.durationInSec || 0),
                    thumbnail: video.thumbnails?.[0]?.url || '',
                    requestedBy: member,
                    channel: video.channel?.name || 'ערוץ לא ידוע'
                };
                this.queue.push(song);
                return song;
            }
        } catch (error) {
            console.error('שגיאה בהוספת שיר:', error);
            return null;
        }
    }

    public async play(): Promise<void> {
        if (this.isPlaying || this.queue.length === 0) return;

        this.isPlaying = true;
        this.currentSong = this.queue.shift()!;

        try {
            const stream = ytdl(this.currentSong.url, {
                filter: 'audioonly',
                highWaterMark: 1 << 25,
                quality: 'highestaudio'
            });

            const resource = createAudioResource(stream, { inlineVolume: true });
            resource.volume?.setVolume(this.volume);
            
            this.player.play(resource);
        } catch (error) {
            console.error('שגיאה בניגון:', error);
            this.isPlaying = false;
            this.playNext();
        }
    }

    private async playNext(): Promise<void> {
        this.isPlaying = false;

        if (this.loopMode === 'song' && this.currentSong) {
            this.queue.unshift(this.currentSong);
        } else if (this.loopMode === 'queue' && this.currentSong) {
            this.queue.push(this.currentSong);
        }

        if (this.queue.length > 0) {
            await this.play();
        } else {
            this.currentSong = null;
            if (this.textChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0xff9900)
                    .setTitle('🎵 התור הסתיים')
                    .setDescription('כל השירים הושמעו! השתמש ב `/play` כדי להוסיף עוד שירים.');
                
                this.textChannel.send({ embeds: [embed] });
            }
        }
    }

    public skip(): boolean {
        if (!this.isPlaying) return false;
        this.player.stop();
        return true;
    }

    public pause(): boolean {
        if (!this.isPlaying) return false;
        return this.player.pause();
    }

    public resume(): boolean {
        return this.player.unpause();
    }

    public stop(): void {
        this.queue = [];
        this.player.stop();
        this.isPlaying = false;
        this.currentSong = null;
    }

    public setVolume(newVolume: number): void {
        this.volume = Math.max(0, Math.min(1, newVolume));
        // Volume will be applied to next song
    }

    public setLoopMode(mode: 'off' | 'song' | 'queue'): void {
        this.loopMode = mode;
    }

    public shuffle(): void {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
    }

    public clearQueue(): void {
        this.queue = [];
    }

    public removeFromQueue(index: number): Song | null {
        if (index < 0 || index >= this.queue.length) return null;
        return this.queue.splice(index, 1)[0];
    }

    public getQueue(): Song[] {
        return [...this.queue];
    }

    public getCurrentSong(): Song | null {
        return this.currentSong;
    }

    public getStatus(): {
        isPlaying: boolean;
        currentSong: Song | null;
        queueLength: number;
        volume: number;
        loopMode: string;
    } {
        return {
            isPlaying: this.isPlaying,
            currentSong: this.currentSong,
            queueLength: this.queue.length,
            volume: this.volume,
            loopMode: this.loopMode
        };
    }

    public disconnect(): void {
        this.cleanup();
    }

    private cleanup(): void {
        this.stop();
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
        }
        this.textChannel = null;
        MusicManager.instances.delete(this.guildId);
    }

    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
