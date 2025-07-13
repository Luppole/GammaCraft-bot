import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const USER_LEVELS_FILE = path.join(DATA_DIR, 'userLevels.json');
const SCHEDULED_MESSAGES_FILE = path.join(DATA_DIR, 'scheduledMessages.json');
const STATS_CHANNELS_FILE = path.join(DATA_DIR, 'statsChannels.json');
const LEVEL_ROLES_FILE = path.join(DATA_DIR, 'levelRoles.json');

export interface UserLevel {
    guildId: string;
    userId: string;
    xp: number;
    level: number;
    messages: number;
    lastMessage: number;
}

export interface ScheduledMessage {
    guildId: string;
    name: string;
    message: string;
    channelId: string;
    intervalHours: number;
    lastSent: number;
    active: boolean;
}

export interface StatsChannel {
    guildId: string;
    memberChannelName: string;
    roleChannelName: string;
    roleId: string;
    categoryId: string;
}

export interface LevelRole {
    guildId: string;
    level: number;
    roleId: string;
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readJSONFile<T>(filePath: string, defaultValue: T): T {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
}

function writeJSONFile<T>(filePath: string, data: T): void {
    try {
        ensureDataDir();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}

export class FileUserLevelDAO {
    static async getUserLevel(guildId: string, userId: string): Promise<UserLevel | null> {
        const data = readJSONFile<{[key: string]: UserLevel}>(USER_LEVELS_FILE, {});
        const key = `${guildId}-${userId}`;
        return data[key] || null;
    }
    
    static async saveUserLevel(userLevel: UserLevel): Promise<void> {
        const data = readJSONFile<{[key: string]: UserLevel}>(USER_LEVELS_FILE, {});
        const key = `${userLevel.guildId}-${userLevel.userId}`;
        data[key] = userLevel;
        writeJSONFile(USER_LEVELS_FILE, data);
    }
    
    static async getGuildLeaderboard(guildId: string, limit: number = 10, offset: number = 0): Promise<UserLevel[]> {
        const data = readJSONFile<{[key: string]: UserLevel}>(USER_LEVELS_FILE, {});
        const guildUsers = Object.values(data)
            .filter(user => user.guildId === guildId)
            .sort((a, b) => b.xp - a.xp)
            .slice(offset, offset + limit);
        return guildUsers;
    }

    static async getGuildUserCount(guildId: string): Promise<number> {
        const data = readJSONFile<{[key: string]: UserLevel}>(USER_LEVELS_FILE, {});
        return Object.values(data).filter(user => user.guildId === guildId).length;
    }
}

export class FileScheduledMessageDAO {
    static async getGuildScheduledMessages(guildId: string): Promise<ScheduledMessage[]> {
        const data = readJSONFile<{[key: string]: ScheduledMessage}>(SCHEDULED_MESSAGES_FILE, {});
        return Object.values(data).filter(msg => msg.guildId === guildId);
    }
    
    static async saveScheduledMessage(scheduledMessage: ScheduledMessage): Promise<void> {
        const data = readJSONFile<{[key: string]: ScheduledMessage}>(SCHEDULED_MESSAGES_FILE, {});
        const key = `${scheduledMessage.guildId}-${scheduledMessage.name}`;
        data[key] = scheduledMessage;
        writeJSONFile(SCHEDULED_MESSAGES_FILE, data);
    }
    
    static async updateLastSent(guildId: string, name: string, lastSent: number): Promise<void> {
        const data = readJSONFile<{[key: string]: ScheduledMessage}>(SCHEDULED_MESSAGES_FILE, {});
        const key = `${guildId}-${name}`;
        if (data[key]) {
            data[key].lastSent = lastSent;
            writeJSONFile(SCHEDULED_MESSAGES_FILE, data);
        }
    }
    
    static async deleteScheduledMessage(guildId: string, name: string): Promise<void> {
        const data = readJSONFile<{[key: string]: ScheduledMessage}>(SCHEDULED_MESSAGES_FILE, {});
        const key = `${guildId}-${name}`;
        delete data[key];
        writeJSONFile(SCHEDULED_MESSAGES_FILE, data);
    }
}

export class FileStatsChannelDAO {
    static async getStatsChannel(guildId: string): Promise<StatsChannel | null> {
        const data = readJSONFile<{[key: string]: StatsChannel}>(STATS_CHANNELS_FILE, {});
        return data[guildId] || null;
    }
    
    static async saveStatsChannel(statsChannel: StatsChannel): Promise<void> {
        const data = readJSONFile<{[key: string]: StatsChannel}>(STATS_CHANNELS_FILE, {});
        data[statsChannel.guildId] = statsChannel;
        writeJSONFile(STATS_CHANNELS_FILE, data);
    }
    
    static async getGuildStatsChannels(guildId: string): Promise<StatsChannel[]> {
        const data = readJSONFile<{[key: string]: StatsChannel}>(STATS_CHANNELS_FILE, {});
        const channel = data[guildId];
        return channel ? [channel] : [];
    }
}

export class FileLevelRoleDAO {
    static async getLevelRole(guildId: string, level: number): Promise<LevelRole | null> {
        const data = readJSONFile<{[key: string]: LevelRole}>(LEVEL_ROLES_FILE, {});
        const key = `${guildId}-${level}`;
        return data[key] || null;
    }
    
    static async saveLevelRole(levelRole: LevelRole): Promise<void> {
        const data = readJSONFile<{[key: string]: LevelRole}>(LEVEL_ROLES_FILE, {});
        const key = `${levelRole.guildId}-${levelRole.level}`;
        data[key] = levelRole;
        writeJSONFile(LEVEL_ROLES_FILE, data);
    }
    
    static async getGuildLevelRoles(guildId: string): Promise<LevelRole[]> {
        const data = readJSONFile<{[key: string]: LevelRole}>(LEVEL_ROLES_FILE, {});
        return Object.values(data)
            .filter(role => role.guildId === guildId)
            .sort((a, b) => a.level - b.level);
    }
    
    static async deleteLevelRole(guildId: string, level: number): Promise<void> {
        const data = readJSONFile<{[key: string]: LevelRole}>(LEVEL_ROLES_FILE, {});
        const key = `${guildId}-${level}`;
        delete data[key];
        writeJSONFile(LEVEL_ROLES_FILE, data);
    }
}

// Export aliases for easy switching
export {
    FileUserLevelDAO as UserLevelDAO,
    FileScheduledMessageDAO as ScheduledMessageDAO,
    FileStatsChannelDAO as StatsChannelDAO,
    FileLevelRoleDAO as LevelRoleDAO
};
