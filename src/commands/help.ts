import { SlashCommandBuilder } from 'discord.js';
import { readFile } from 'fs/promises';
import { parseText } from '../helperFunctions/parseText';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('קבל עזרה');

export async function execute(interaction: any) {
    try {
        const rawText = await readFile(require.resolve('../../resources/help.txt'), 'utf-8');
        const parsedText = parseText(rawText, interaction);
        const helpText = `${parsedText}\n\n💡 **עצה:** השתמש ב \`/commands\` למדריך מלא על כל הפקודות והתכונות של הבוט!`;
        
        await interaction.reply({ 
            content: helpText, 
            flags: 64,
            allowedMentions: { roles: ['1392586826413379695'] }
        });
    } catch (error) {
        await interaction.reply({ content: 'נכשל בטעינת מידע העזרה.\n\n💡 **עצה:** השתמש ב `/commands` למדריך מלא על הפקודות!', flags: 64 });
    }
}
