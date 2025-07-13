import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const recipes: { [key: string]: { ingredients: string[], pattern: string[], description: string } } = {
    'diamond_sword': {
        ingredients: ['2 Diamonds', '1 Stick'],
        pattern: ['💎', '💎', '🪵'],
        description: 'A powerful melee weapon'
    },
    'iron_pickaxe': {
        ingredients: ['3 Iron Ingots', '2 Sticks'],
        pattern: ['⚙️⚙️⚙️', ' 🪵 ', ' 🪵 '],
        description: 'Essential tool for mining'
    },
    'crafting_table': {
        ingredients: ['4 Wood Planks'],
        pattern: ['🪵🪵', '🪵🪵'],
        description: 'Essential for advanced crafting'
    },
    'furnace': {
        ingredients: ['8 Cobblestone'],
        pattern: ['🪨🪨🪨', '🪨 🪨', '🪨🪨🪨'],
        description: 'Used for smelting and cooking'
    },
    'bread': {
        ingredients: ['3 Wheat'],
        pattern: ['🌾🌾🌾'],
        description: 'Basic food item'
    },
    'bow': {
        ingredients: ['3 Sticks', '3 String'],
        pattern: [' 🪵🧵', '🪵 🧵', ' 🪵🧵'],
        description: 'Ranged weapon for hunting'
    }
};

export const data = new SlashCommandBuilder()
    .setName('mcrecipe')
    .setDescription('Look up Minecraft crafting recipes')
    .addStringOption(option =>
        option.setName('item')
            .setDescription('The item to look up')
            .setRequired(true)
            .addChoices(
                { name: 'Diamond Sword', value: 'diamond_sword' },
                { name: 'Iron Pickaxe', value: 'iron_pickaxe' },
                { name: 'Crafting Table', value: 'crafting_table' },
                { name: 'Furnace', value: 'furnace' },
                { name: 'Bread', value: 'bread' },
                { name: 'Bow', value: 'bow' }
            )
    );

export async function execute(interaction: any) {
    const itemName = interaction.options.getString('item');
    const recipe = recipes[itemName];

    if (!recipe) {
        return interaction.reply({ 
            content: 'Recipe not found! Available recipes: ' + Object.keys(recipes).join(', '),
            ephemeral: true 
        });
    }

    const embed = new EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle(`🛠️ Recipe: ${itemName.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`)
        .setDescription(recipe.description)
        .addFields(
            {
                name: '📋 Ingredients',
                value: recipe.ingredients.join('\n'),
                inline: true
            },
            {
                name: '🔧 Crafting Pattern',
                value: '```\n' + recipe.pattern.join('\n') + '\n```',
                inline: true
            }
        )
        .setFooter({ text: 'Use a crafting table for 3x3 recipes' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}
