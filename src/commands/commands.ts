import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('commands')
    .setDescription('הצג את כל הפקודות הזמינות של הבוט והסברים מפורטים');

export async function execute(interaction: any) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply({ flags: 64 });
    
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    
    // User Commands Embed
    const userEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎮 פקודות משתמש')
        .setDescription('פקודות הזמינות לכל חברי השרת')
        .addFields(
            {
                name: '📊 `/level`',
                value: 'בדוק את הרמה וההתקדמות בנסיון הנוכחיים שלך\nמציג את הרמה הנוכחית שלך, נסיון כולל ונסיון נדרש לרמה הבאה',
                inline: false
            },
            {
                name: '🏆 `/leaderboard [page]`',
                value: 'צפה בלוח התוצאות של נסיון השרת\nמציג את השחקנים המובילים עם הניקוד הגבוה ביותר',
                inline: false
            },
            {
                name: '🌐 `/ip`',
                value: 'קבל את כתובת ה-IP של שרת המיינקראפט\nמציג את כתובת השרת הרשמית להתחברות',
                inline: false
            },
            {
                name: '👤 `/mcskin [username]`',
                value: 'צפה בסקין של שחקן מיינקראפט\nמציג סקין, אווטאר וקישורים לכלים חיצוניים',
                inline: false
            },
            {
                name: '🏓 `/ping`',
                value: 'בדוק זמן תגובה והשהייה של הבוט\nמציג זמן תגובה API ומצב המערכת',
                inline: false
            },
            {
                name: '❓ `/help`',
                value: 'קבל מידע עזרה בסיסי\nמציג מדריך קצר ואת הפקודות העיקריות',
                inline: false
            },
            {
                name: '🎵 `/play [שיר]`',
                value: 'נגן מוזיקה מיוטיוב\nחפש שיר לפי שם או הכנס קישור יוטיוב ישירות',
                inline: false
            },
            {
                name: '📋 `/queue [עמוד]`',
                value: 'הצג את תור השירים הנוכחי\nראה איזה שירים ממתינים בתור',
                inline: false
            },
            {
                name: '⏭️ `/skip`',
                value: 'דלג על השיר הנוכחי\nעבור לשיר הבא בתור',
                inline: false
            },
            {
                name: '⏸️ `/pause`',
                value: 'השהה או המשך את המוזיקה\nעצור זמנית או המשך ניגון',
                inline: false
            },
            {
                name: '🎵 `/nowplaying`',
                value: 'הצג את השיר שמתנגן כרגע\nראה פרטים על השיר הנוכחי',
                inline: false
            },
            {
                name: '🔊 `/volume [עוצמה]`',
                value: 'שנה את עוצמת הקול (0-100)\nקבע את עוצמת המוזיקה',
                inline: false
            },
            {
                name: '🔀 `/shuffle`',
                value: 'ערבב את תור השירים באופן אקראי\nשנה את סדר השירים בתור',
                inline: false
            },
            {
                name: '🔁 `/loop [מצב]`',
                value: 'שנה מצב חזרה של המוזיקה\nחזור על שיר, תור או בטל חזרה',
                inline: false
            }
        )
        .setFooter({ text: 'פקודות משתמש - זמינות לכולם' });

    // Minecraft Commands Embed
    const minecraftEmbed = new EmbedBuilder()
        .setColor(0x00AA00)
        .setTitle('⛏️ פקודות מיינקראפט')
        .setDescription('פקודות הקשורות לשרת המיינקראפט')
        .addFields(
            {
                name: '🎮 `/mcplayers`',
                value: 'הצג מי מחובר כרגע לשרת המיינקראפט\nמציג רשימת שחקנים מחוברים ומצב השרת',
                inline: false
            },
            {
                name: '📊 `/mcstats [player]`',
                value: 'הצג סטטיסטיקות מיינקראפט של שחקן\nמציג נתונים מפורטים על פעילות השחקן',
                inline: false
            },
            {
                name: '🔍 `/mcinfo [player]`',
                value: 'קבל מידע כללי על שחקן מיינקראפט\nמציג UUID, היסטוריית שמות וסטטוס',
                inline: false
            },
            {
                name: '🖥️ `/mcserver`',
                value: 'צור או נהל ערוץ קולי שמציג מצב שרת המיינקראפט\n(פקודת מנהל בלבד)',
                inline: false
            }
        )
        .setFooter({ text: 'פקודות מיינקראפט - מידע על השרת והשחקנים' });

    // Admin Commands Embed (only show to admins)
    let adminEmbed = null;
    if (isAdmin) {
        adminEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔨 פקודות מנהל')
            .setDescription('פקודות זמינות למנהלים בלבד')
            .addFields(
                {
                    name: '⚒️ `/ban [user] [reason]`',
                    value: 'אסור משתמש מהשרת\nכולל אפשרות למחוק הודעות מהימים האחרונים',
                    inline: false
                },
                {
                    name: '👢 `/kick [user] [reason]`',
                    value: 'בעט משתמש מהשרת\nהסרה זמנית ללא איסור קבוע',
                    inline: false
                },
                {
                    name: '🔇 `/mute [user] [duration]`',
                    value: 'השתק משתמש לזמן מוגדר\nמונע מהמשתמש לשלוח הודעות',
                    inline: false
                },
                {
                    name: '🗑️ `/purge [amount]`',
                    value: 'מחק מספר הודעות מהערוץ\nניקוי מהיר של צ\'אט',
                    inline: false
                },
                {
                    name: '📅 `/schedule`',
                    value: 'צור הודעות מתוזמנות\nשלח הודעות אוטומטיות במרווחי זמן',
                    inline: false
                },
                {
                    name: '📊 `/setupstats`',
                    value: 'הגדר ערוצי סטטיסטיקות אוטומטיים\nמעקב אוטומטי אחר מספר חברים',
                    inline: false
                },
                {
                    name: '⏹️ `/stop`',
                    value: 'עצור את המוזיקה ונקה את התור\nעצירה מלאה של המוזיקה',
                    inline: false
                },
                {
                    name: '👋 `/disconnect`',
                    value: 'נתק את הבוט מהערוץ הקולי\nהסרה מוחלטת מהערוץ',
                    inline: false
                }
            )
            .setFooter({ text: 'פקודות מנהל - זמינות למנהלים בלבד' });
    }

    // XP System Embed
    const xpEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('⭐ מערכת הנסיון (XP)')
        .setDescription('כיצד עובדת מערכת הרמות והנסיון')
        .addFields(
            {
                name: '💰 צבירת נסיון',
                value: '• 15-25 נסיון לכל הודעה\n• זמן המתנה: דקה אחת בין הודעות\n• פעילות קבועה מתוגמלת',
                inline: false
            },
            {
                name: '📈 חישוב רמות',
                value: '• רמה 1: 100 נסיון\n• רמה 2: 400 נסיון\n• רמה 3: 900 נסיון\n• נוסחה: (רמה)² × 100',
                inline: false
            },
            {
                name: '🎁 תגמולים',
                value: '• תפקידים מיוחדים ברמות מסוימות\n• גישה לערוצים בלעדיים\n• הכרה בקהילה',
                inline: false
            }
        )
        .setFooter({ text: 'מערכת XP - התקדם ברמות על ידי פעילות!' });

    // Send embeds based on permissions
    const embeds = [userEmbed, minecraftEmbed, xpEmbed];
    if (adminEmbed) {
        embeds.push(adminEmbed);
    }

    await interaction.editReply({ embeds: embeds });
}
