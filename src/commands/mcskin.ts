import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mcskin')
    .setDescription('צפה בסקין של שחקן מיינקראפט')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('שם משתמש במיינקראפט')
            .setRequired(true)
    );

export async function execute(interaction: any) {
    try {
        // Check if interaction is already acknowledged to prevent double acknowledgment
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }
        
        const username = interaction.options.getString('username');
    
        // Validate username
        if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
            return interaction.editReply({ 
                content: 'שם משתמש לא תקין! שמות משתמש במיינקראפט חייבים להיות באורך 3-16 תווים ולכלול רק אותיות, מספרים וקו תחתון.' 
            });
        }

        // First, verify the player exists using Mojang API
        const playerResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        
        if (!playerResponse.ok) {
            return interaction.editReply({ 
                content: `❌ שחקן "${username}" לא נמצא! אנא בדוק את שם המשתמש ונסה שוב.` 
            });
        }

        const playerData = await playerResponse.json();
        const actualUsername = playerData.name; // Get the actual capitalization
        const uuid = playerData.id;

        // Using multiple APIs for better reliability
        const skinUrl = `https://mc-heads.net/avatar/${actualUsername}/100`;
        const bodyUrl = `https://mc-heads.net/body/${actualUsername}/100`;
        const headUrl = `https://mc-heads.net/head/${actualUsername}/100`;
        const fullBodyUrl = `https://crafatar.com/renders/body/${uuid}?overlay`;
        
        const embed = new EmbedBuilder()
            .setColor(0x00AA00)
            .setTitle(`👤 הסקין של ${actualUsername}`)
            .setDescription(`מציג סקין עבור שחקן: **${actualUsername}**\nUUID: \`${uuid}\``)
            .setThumbnail(headUrl)
            .setImage(fullBodyUrl)
            .addFields(
                {
                    name: '🔗 קישורי סקין',
                    value: `[אווטאר](${skinUrl}) | [גוף](${bodyUrl}) | [ראש](${headUrl})`,
                    inline: false
                },
                {
                    name: '🎨 מציג סקין',
                    value: `[צפייה תלת מימד](https://namemc.com/profile/${actualUsername}) | [Crafatar](https://crafatar.com/renders/body/${uuid})`,
                    inline: false
                },
                {
                    name: '📋 פרטי שחקן',
                    value: `שם משתמש: \`${actualUsername}\`\nUUID: \`${uuid}\``,
                    inline: false
                }
            )
            .setFooter({ text: 'נתוני סקין מסופקים על ידי mc-heads.net ו-crafatar.com' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('שגיאה בטעינת נתוני סקין:', error);
        
        // Better error handling for already acknowledged interactions
        try {
            const username = interaction.options.getString('username') || 'לא ידוע';
            const errorMessage = `❌ לא ניתן לטעון נתוני סקין עבור שחקן "${username}". השחקן עלול לא להתקיים או שהשירות זמנית לא זמין.`;
            
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            } else if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (replyError) {
            console.error('שגיאה בשליחת תגובת שגיאה:', replyError);
        }
    }
}
