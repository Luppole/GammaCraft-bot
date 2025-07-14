import { SlashCommandBuilder } from 'discord.js';
import { readFile } from 'fs/promises';

export const data = new SlashCommandBuilder()
    .setName('ip')
    .setDescription('קבל את כתובת ה-IP של שרת המיינקראפט');

export async function execute(interaction: any) {
    try {
        let rawText = await readFile(require.resolve('../../resources/ip.txt'), 'utf-8');
        // Replace placeholder with actual user mention
        rawText = rawText.replace('<@DISCORD_USER_ID>', `<@${interaction.user.id}>`);
        await interaction.reply({ 
            content: rawText,
            allowedMentions: { users: [interaction.user.id] }
        });        } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'נכשל בטעינת מידע השרת.' });
        }
    }
}
