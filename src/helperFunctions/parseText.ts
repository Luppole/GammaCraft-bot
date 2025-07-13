export function parseText(text: string, interaction: any): string {
    // Replace #channel with actual channel mentions
    text = text.replace(/#(\w+)/g, (match, channelName) => {
        const channel = interaction.guild?.channels.cache.find((ch: any) => ch.name === channelName);
        return channel ? `<#${channel.id}>` : match;
    });

    // Replace <@DISCORD_USER_ID> with actual user mentions
    text = text.replace(/<@DISCORD_USER_ID>/g, `<@${interaction.user.id}>`);
    
    // Replace <@ADMIN_ROLE> with the admin role mention
    text = text.replace(/<@ADMIN_ROLE>/g, '<@&1392586826413379695>');

    // Replace <@roleId> with actual role mentions (if possible)
    text = text.replace(/<@(\d+)>/g, (match, userId) => {
        const member = interaction.guild?.members.cache.get(userId);
        return member ? `<@${userId}>` : match;
    });

    // Discord formatting (code blocks, bold, etc.) is preserved as-is
    return text;
}