import { SlashCommandBuilder } from 'discord.js';
import { readFile } from 'fs/promises';
import { parseText } from '../helperFunctions/parseText';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help.');

export async function execute(interaction: any) {
    try {
        const rawText = await readFile(require.resolve('../../resources/help.txt'), 'utf-8');
        const parsedText = parseText(rawText, interaction);
        const helpText = `${parsedText}\n\n💡 **Tip:** Use \`/commands\` for a complete guide to all bot features and commands!`;
        
        await interaction.reply({ 
            content: helpText, 
            flags: 64,
            allowedMentions: { roles: ['1392586826413379695'] }
        });
    } catch (error) {
        await interaction.reply({ content: 'Failed to load help information.\n\n💡 **Tip:** Use `/commands` for a complete guide to all bot features!', flags: 64 });
    }
}
