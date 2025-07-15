/**
 * Helper functions for handling Discord interactions safely
 */

/**
 * Safely defer a reply to prevent "already acknowledged" errors
 * @param interaction - Discord interaction object
 * @param options - Optional deferReply options
 * @returns Promise<boolean> - true if successfully deferred, false if already acknowledged
 */
export async function safeDeferReply(interaction: any, options?: any): Promise<boolean> {
    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply(options);
            return true;
        }
        return false;
    } catch (error) {
        console.error('שגיאה ב-deferReply:', error);
        return false;
    }
}

/**
 * Safely reply to an interaction, handling various interaction states
 * @param interaction - Discord interaction object
 * @param content - Reply content (string or object with embeds/content)
 * @param fallbackToEphemeral - Whether to use ephemeral reply as fallback
 * @returns Promise<boolean> - true if successfully replied, false otherwise
 */
export async function safeReply(interaction: any, content: any, fallbackToEphemeral: boolean = true): Promise<boolean> {
    try {
        if (interaction.deferred && !interaction.replied) {
            // Use editReply if deferred but not replied
            await interaction.editReply(content);
            return true;
        } else if (!interaction.replied && !interaction.deferred) {
            // Use reply if not deferred and not replied
            const replyOptions = fallbackToEphemeral && typeof content === 'string' 
                ? { content, ephemeral: true }
                : content;
            await interaction.reply(replyOptions);
            return true;
        } else {
            // Interaction already replied or in invalid state
            console.warn('לא ניתן להשיב לאינטראקציה - כבר נענתה או במצב לא תקין');
            return false;
        }
    } catch (error) {
        console.error('שגיאה בהשבה לאינטראקציה:', error);
        return false;
    }
}

/**
 * Enhanced error handler for commands that use interactions
 * @param interaction - Discord interaction object  
 * @param error - The error that occurred
 * @param commandName - Name of the command for logging
 * @param customErrorMessage - Custom error message to show user
 */
export async function handleInteractionError(
    interaction: any, 
    error: any, 
    commandName: string,
    customErrorMessage?: string
): Promise<void> {
    console.error(`שגיאה בפקודת ${commandName}:`, error);
    
    const errorMessage = customErrorMessage || 
        `❌ אירעה שגיאה בביצוע הפקודה ${commandName}. אנא נסה שוב.`;
    
    await safeReply(interaction, errorMessage, true);
}

/**
 * Check if an interaction is in a valid state for operations
 * @param interaction - Discord interaction object
 * @returns Object with state information
 */
export function getInteractionState(interaction: any) {
    return {
        deferred: interaction.deferred,
        replied: interaction.replied,
        canDefer: !interaction.deferred && !interaction.replied,
        canReply: !interaction.replied,
        canEdit: interaction.deferred && !interaction.replied
    };
}
