import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(__dirname, '../../data');
const USER_LEVELS_FILE = join(DATA_DIR, 'userLevels.json');
const SCHEDULED_MESSAGES_FILE = join(DATA_DIR, 'scheduledMessages.json');
const STATS_CHANNELS_FILE = join(DATA_DIR, 'statsChannels.json');
const LEVEL_ROLES_FILE = join(DATA_DIR, 'levelRoles.json');

// Ensure data directory exists
async function ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
    }
}

// Save user levels data
export async function saveUserLevels(userLevels: any) {
    try {
        await ensureDataDir();
        await writeFile(USER_LEVELS_FILE, JSON.stringify(userLevels, null, 2));
        console.log('User levels data saved successfully');
    } catch (error) {
        console.error('Failed to save user levels:', error);
    }
}

// Load user levels data
export async function loadUserLevels(): Promise<any> {
    try {
        if (!existsSync(USER_LEVELS_FILE)) {
            return {};
        }
        const data = await readFile(USER_LEVELS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load user levels:', error);
        return {};
    }
}

// Save scheduled messages data
export async function saveScheduledMessages(scheduledMessages: any) {
    try {
        await ensureDataDir();
        // Remove intervalId before saving (can't serialize functions)
        const saveData = JSON.parse(JSON.stringify(scheduledMessages));
        for (const guildId in saveData) {
            for (const name in saveData[guildId]) {
                delete saveData[guildId][name].intervalId;
            }
        }
        await writeFile(SCHEDULED_MESSAGES_FILE, JSON.stringify(saveData, null, 2));
        console.log('Scheduled messages data saved successfully');
    } catch (error) {
        console.error('Failed to save scheduled messages:', error);
    }
}

// Load scheduled messages data
export async function loadScheduledMessages(): Promise<any> {
    try {
        if (!existsSync(SCHEDULED_MESSAGES_FILE)) {
            return {};
        }
        const data = await readFile(SCHEDULED_MESSAGES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load scheduled messages:', error);
        return {};
    }
}

// Save stats channels data
export async function saveStatsChannels(statsChannels: any) {
    try {
        await ensureDataDir();
        await writeFile(STATS_CHANNELS_FILE, JSON.stringify(statsChannels, null, 2));
        console.log('Stats channels data saved successfully');
    } catch (error) {
        console.error('Failed to save stats channels:', error);
    }
}

// Load stats channels data
export async function loadStatsChannels(): Promise<any> {
    try {
        if (!existsSync(STATS_CHANNELS_FILE)) {
            return {};
        }
        const data = await readFile(STATS_CHANNELS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load stats channels:', error);
        return {};
    }
}

// Save level roles data
export async function saveLevelRoles(levelRoles: any) {
    try {
        await ensureDataDir();
        await writeFile(LEVEL_ROLES_FILE, JSON.stringify(levelRoles, null, 2));
        console.log('Level roles data saved successfully');
    } catch (error) {
        console.error('Failed to save level roles:', error);
    }
}

// Load level roles data
export async function loadLevelRoles(): Promise<any> {
    try {
        if (!existsSync(LEVEL_ROLES_FILE)) {
            return {};
        }
        const data = await readFile(LEVEL_ROLES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load level roles:', error);
        return {};
    }
}

// Save all data
export async function saveAllData(client: any) {
    const savePromises = [];
    
    if (client.userLevels) {
        savePromises.push(saveUserLevels(client.userLevels));
    }
    
    if (client.scheduledMessages) {
        savePromises.push(saveScheduledMessages(client.scheduledMessages));
    }
    
    if (client.statsChannels) {
        savePromises.push(saveStatsChannels(client.statsChannels));
    }
    
    if (client.levelRoles) {
        savePromises.push(saveLevelRoles(client.levelRoles));
    }
    
    await Promise.all(savePromises);
}

// Load all data
export async function loadAllData(client: any) {
    try {
        console.log('Loading saved data...');
        
        client.userLevels = await loadUserLevels();
        client.scheduledMessages = await loadScheduledMessages();
        client.statsChannels = await loadStatsChannels();
        client.levelRoles = await loadLevelRoles();
        
        console.log('All data loaded successfully');
        console.log(`Loaded ${Object.keys(client.userLevels).length} user level records`);
        console.log(`Loaded ${Object.keys(client.scheduledMessages).length} guild scheduled messages`);
        console.log(`Loaded ${Object.keys(client.statsChannels).length} guild stats channels`);
        console.log(`Loaded ${Object.keys(client.levelRoles).length} guild level roles`);
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}
