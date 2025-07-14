import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { StatsChannelDAO } from '../dao';

export const data = new SlashCommandBuilder()
  .setName('setupstats')
  .setDescription('צור ערוצי קול נעולים המציגים סטטיסטיקות חברים')
  .addRoleOption(option =>
    option.setName('role')
      .setDescription('התפקיד לספירת חברים')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
  // Defer reply immediately to prevent timeout
  await interaction.deferReply({ flags: 64 });
  
  const guild = interaction.guild;
  if (!guild) return interaction.editReply({ content: 'פקודה זו יכולה לשמש רק בשרת.' });

  // Only allow admins
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.editReply({ content: 'רק מנהלים יכולים להשתמש בפקודה זו.' });
  }

  const role = interaction.options.getRole('role');
  if (!role) return interaction.editReply({ content: 'תפקיד לא נמצא.' });

  try {

  // Create or update the "Stats" category
  let category = guild.channels.cache.find(
    (ch: any) => ch.type === ChannelType.GuildCategory && ch.name === 'Stats'
  );
  if (!category) {
    category = await guild.channels.create({
      name: 'Stats',
      type: ChannelType.GuildCategory,
    });
  }

  // Helper to create or update a channel
  async function createOrUpdateChannel(name: string, count: number) {
    let channel = guild.channels.cache.find(
      (ch: any) => ch.parentId === category.id && ch.name.startsWith(name)
    );
    if (!channel) {
      channel = await guild.channels.create({
        name: `${name}: ${count}`,
        type: ChannelType.GuildVoice,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['Connect'],
          },
        ],
      });
    } else {
      await channel.setName(`${name}: ${count}`);
    }
  }

  // Save channel IDs for auto-update
  const memberChannelName = 'Members';
  const roleChannelName = role.name;

  // Save stats channel config to database
  await StatsChannelDAO.saveStatsChannel({
    guildId: guild.id,
    memberChannelName,
    roleChannelName,
    roleId: role.id,
    categoryId: category.id,
  });

  // Initial creation/update
  const memberCount = guild.memberCount;
  
  // Fetch all guild members to ensure accurate role counting
  await guild.members.fetch();
  
  // Debug logging
  console.log(`Role ID: ${role.id}`);
  console.log(`Role name: ${role.name}`);
  console.log(`Total members in cache: ${guild.members.cache.size}`);
  
  const membersWithRole = guild.members.cache.filter((m: any) => m.roles.cache.has(role.id));
  console.log(`Members with role: ${membersWithRole.size}`);
  membersWithRole.forEach((member: any) => {
    console.log(`- ${member.user.tag} (${member.id})`);
  });
  
  const roleCount = membersWithRole.size;

  await createOrUpdateChannel(memberChannelName, memberCount);
  await createOrUpdateChannel(roleChannelName, roleCount);

  await interaction.editReply({ content: 'Stat channels created/updated! They will auto-update.' });
  } catch (error) {
    console.error('Error in setupstats command:', error);
    await interaction.editReply({ content: 'Failed to setup stats channels. Please try again.' });
  }
}
