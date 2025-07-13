import { Client, REST, Routes, SlashCommandBuilder, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import { readdirSync } from 'fs';
import { join, extname } from 'path';
import { config } from 'dotenv';
config(); // Load environment variables from .env file

// Automatically load all command files from the commands folder
function loadCommands(commandsPath: string): RESTPostAPIApplicationCommandsJSONBody[] {
    const commandFiles = readdirSync(commandsPath).filter(file => extname(file) === '.ts' || extname(file) === '.js');
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];

    for (const file of commandFiles) {
        const commandModule = require(join(commandsPath, file));
        // Each command file should export a 'data' property (SlashCommandBuilder)
        if (commandModule.data && typeof commandModule.data.toJSON === 'function') {
            commands.push(commandModule.data.toJSON());
        }
    }
    return commands;
}

const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const TOKEN = process.env.DISCORD_TOKEN!;

export async function registerCommands(client: Client) {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    // Adjust the path to your commands folder as needed
    const commandsPath = join(__dirname, 'commands');
    const commands = loadCommands(commandsPath);

    try {
        await rest.put(
            GUILD_ID
                ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
                : Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
    } catch (error) {
        throw error;
    }
}

/*
Example command file: src/commands/ping.ts


export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

export async function execute(interaction) {
    await interaction.reply('Pong!');
}
*/