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
            // Check if already connected to this channel
            if (this.connection && this.connection.state.status === VoiceConnectionStatus.Ready) {
                this.textChannel = textChannel;
                return true;
            }

            // Destroy existing connection if any
            if (this.connection) {
                this.connection.destroy();
            }

            this.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false, // Don't deafen the bot
                selfMute: false
            });

            this.connection.subscribe(this.player);
            this.textChannel = textChannel;

            // Wait for connection to be ready
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);

                this.connection?.on(VoiceConnectionStatus.Ready, () => {
                    clearTimeout(timeout);
                    resolve();
                });

                this.connection?.on(VoiceConnectionStatus.Disconnected, () => {
                    clearTimeout(timeout);
                    this.cleanup();
                    reject(new Error('Connection failed'));
                });

                this.connection?.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('שגיאת חיבור:', error);
                    reject(error);
                });
            });

            return true;
        } catch (error) {
            console.error('שגיאה בהתחברות לערוץ קולי:', error);
            if (this.connection) {
                this.connection.destroy();
                this.connection = null;
            }
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
                const searchPromise = search(query, { 
                    limit: 1, 
                    source: { youtube: 'video' },
                    unblurNSFWThumbnails: false
                });
                const searchResults = await Promise.race([
                    searchPromise,
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error('Search timeout')), 10000)
                    )
                ]);
                
                if (searchResults.length === 0) return null;
                
                const video = searchResults[0];
                
                // Get basic info without detailed video info to avoid delays
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
            // Get fresh video info to avoid 410 errors
            let freshInfo;
            try {
                freshInfo = await Promise.race([
                    ytdl.getInfo(this.currentSong.url),
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error('Info timeout')), 5000)
                    )
                ]);
            } catch (infoError) {
                console.error('שגיאה בקבלת מידע עדכני:', infoError);
                this.isPlaying = false;
                if (this.textChannel) {
                    this.textChannel.send(`❌ לא ניתן לנגן את "${this.currentSong.title}" - הקישור לא תקין. עובר לשיר הבא...`);
                }
                this.playNext();
                return;
            }

            // Create stream with multiple fallback options
            let stream;
            let resource;
            
            try {
                // Try method 1: Use downloadFromInfo (preferred)
                stream = ytdl.downloadFromInfo(freshInfo, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25,
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    }
                });

                // Handle stream errors immediately
                stream.on('error', (error) => {
                    console.error('שגיאה בזרם השמע:', error);
                    this.isPlaying = false;
                    
                    if (this.textChannel) {
                        this.textChannel.send(`❌ שגיאה בניגון "${this.currentSong?.title}". עובר לשיר הבא...`);
                    }
                    
                    this.playNext();
                    return;
                });

                // Create audio resource with fallback options
                try {
                    // Try with opus if available
                    resource = createAudioResource(stream, { 
                        inlineVolume: true,
                        metadata: {
                            title: this.currentSong.title
                        }
                    });
                } catch (resourceError) {
                    console.log('Trying alternative resource creation...');
                    // Fallback: Create without opus
                    resource = createAudioResource(stream, { 
                        inlineVolume: true
                    });
                }
                
            } catch (streamError) {
                console.error('שגיאה ביצירת זרם:', streamError);
                
                // Fallback method 2: Try direct URL streaming
                try {
                    stream = ytdl(this.currentSong.url, {
                        filter: 'audioonly',
                        quality: 'lowestaudio', // Use lower quality as fallback
                        highWaterMark: 1 << 23, // Smaller buffer
                    });
                    
                    resource = createAudioResource(stream, { 
                        inlineVolume: true
                    });
                } catch (fallbackError) {
                    const errorMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                    throw new Error(`Both streaming methods failed: ${errorMsg}`);
                }
            }
            
            if (resource.volume) {
                resource.volume.setVolume(this.volume);
            }
            
            this.player.play(resource);
            
        } catch (error) {
            console.error('שגיאה בניגון:', error);
            this.isPlaying = false;
            
            if (this.textChannel) {
                // Provide more specific error messages
                let errorMessage = '❌ שגיאה בניגון השיר.';
                
                if (error instanceof Error) {
                    if (error.message.includes('410')) {
                        errorMessage = '❌ הקישור לשיר פג תוקף.';
                    } else if (error.message.includes('FFmpeg') || error.message.includes('avconv')) {
                        errorMessage = '⚠️ שרת השמע אינו זמין. מנסה שיר אחר...';
                    } else if (error.message.includes('timeout')) {
                        errorMessage = '❌ זמן קצוב לטעינת השיר.';
                    }
                }
                
                this.textChannel.send(`${errorMessage} עובר לשיר הבא...`);
            }
            
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
