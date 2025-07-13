import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";
import { initializeDatabase, closeDatabase } from "./database";
import { UserLevelDAO, ScheduledMessageDAO, StatsChannelDAO, LevelRoleDAO } from "./dao";
config();

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // Required for member counting
  ],
});

declare module "discord.js" {
  interface Client {
    scheduledIntervals?: {
      [key: string]: NodeJS.Timeout;
    };
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log('📊 Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('🔄 Falling back to JSON file storage...');
    
    // Initialize in-memory/file-based storage as fallback
    initializeFileStorage();
  }
  
  // Initialize scheduled messages from database
  await initializeScheduledMessages(readyClient);
  
  console.log('🎉 Bot is ready and all systems initialized!');
});

function initializeFileStorage() {
  // Create directories if they don't exist
  const fs = require('fs');
  const path = require('path');
  
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  console.log('📁 File storage initialized');
}

// XP and Level System
client.on(Events.MessageCreate, async (message) => {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;
  
  const guild = message.guild;
  const user = message.author;
  
  try {
    // Get user data from database
    let userData = await UserLevelDAO.getUserLevel(guild.id, user.id);
    if (!userData) {
      userData = {
        guildId: guild.id,
        userId: user.id,
        xp: 0,
        level: 1,
        messages: 0,
        lastMessage: 0
      };
    }
    
    // Prevent spam (30 second cooldown for faster progression)
    const now = Date.now();
    if (now - userData.lastMessage < 30000) return;
    
    // Award XP (20-35 XP per message for faster progression)
    const xpGained = Math.floor(Math.random() * 16) + 20;
    userData.xp += xpGained;
    userData.messages += 1;
    userData.lastMessage = now;
    
    console.log(`[XP] ${message.author.username} gained ${xpGained} XP (Total: ${userData.xp})`);
    
    // Check for level up (exponential growth: next level = (level+1)^2 * 100)
    const nextLevel = userData.level + 1;
    const requiredXP = nextLevel * nextLevel * 100;
    if (userData.xp >= requiredXP) {
      userData.level += 1;
      console.log(`[LEVEL UP] ${message.author.username} reached Level ${userData.level}!`);
      
      // Send level up message
      const levelUpMessage = `🎉 Congratulations ${user}! You've reached **Level ${userData.level}**! 🎉`;
      message.channel.send(levelUpMessage);
      
      // Check for level roles
      const levelRole = await LevelRoleDAO.getLevelRole(guild.id, userData.level);
      
      if (levelRole) {
        const role = guild.roles.cache.get(levelRole.roleId);
        const member = guild.members.cache.get(user.id);
        
        if (role && member && !member.roles.cache.has(levelRole.roleId)) {
          try {
            await member.roles.add(role);
            message.channel.send(`🏆 You've been given the **${role.name}** role for reaching Level ${userData.level}!`);
          } catch (error) {
            console.error('Failed to assign level role:', error);
          }
        }
      }
    }
    
    // Save user data to database
    await UserLevelDAO.saveUserLevel(userData);
    
    // Handle chat bridge
    try {
      const mcchatCommand = require('./commands/mcchat');
      if (mcchatCommand.handleDiscordMessage) {
        await mcchatCommand.handleDiscordMessage(message);
      }
    } catch (error) {
      // Chat bridge command may not exist yet
    }
    
  } catch (error) {
    console.error('Error in XP system:', error);
  }
});

// Function to initialize scheduled messages from database
    async function initializeScheduledMessages(client: any) {
      try {
        console.log('🔄 Loading scheduled messages from database...');
        
        for (const guild of client.guilds.cache.values()) {
          const scheduledMessages = await ScheduledMessageDAO.getGuildScheduledMessages(guild.id);
          
          for (const schedule of scheduledMessages) {
            if (!schedule.active) continue;
            
            const channel = guild.channels.cache.get(schedule.channelId);
            if (!channel || !channel.isTextBased()) continue;
            
            console.log(`⏰ Starting scheduled message "${schedule.name}" for guild ${guild.name}`);
            
            const intervalMs = schedule.intervalHours * 60 * 60 * 1000;
            
            const intervalId = setInterval(async () => {
              try {
                await channel.send(schedule.message);
                await ScheduledMessageDAO.updateLastSent(schedule.guildId, schedule.name, Date.now());
                console.log(`📤 Sent scheduled message "${schedule.name}" to #${channel.name}`);
              } catch (error) {
                console.error(`Failed to send scheduled message "${schedule.name}":`, error);
              }
            }, intervalMs);
            
            // Store the interval ID for cleanup (in memory)
            client.scheduledIntervals = client.scheduledIntervals || {};
            client.scheduledIntervals[`${schedule.guildId}-${schedule.name}`] = intervalId;
          }
        }
        
        console.log('✅ Scheduled messages initialized');
      } catch (error) {
        console.error('❌ Failed to initialize scheduled messages:', error);
      }
    }
    
    // Auto-update stat channels and handle welcome messages on member add/remove or role update
    client.on(Events.GuildMemberAdd, async (member) => {
      // Handle welcome message and role assignment
      await handleMemberJoin(member);
      // Update stats channels
      await updateStatsChannels(member);
    });
    client.on(Events.GuildMemberRemove, updateStatsChannels);
    client.on(Events.GuildMemberUpdate, updateStatsChannels);
    
    async function updateStatsChannels(memberOrOld: any) {
      const guild = memberOrOld.guild || memberOrOld;
      if (!guild) return;
    
      try {
        // Get stats channel config from database
        const statsConfig = await StatsChannelDAO.getStatsChannel(guild.id);
        if (!statsConfig) return;
    
        const { memberChannelName, roleChannelName, roleId, categoryId } = statsConfig;
    
        // Fetch all guild members to ensure accurate counting
        await guild.members.fetch();
        
        const memberCount = guild.memberCount;
        
        // Debug logging
        console.log(`Auto-update: Role ID: ${roleId}`);
        console.log(`Auto-update: Total members in cache: ${guild.members.cache.size}`);
        
        const membersWithRole = guild.members.cache.filter((m: any) =>
          m.roles.cache.has(roleId)
        );
        console.log(`Auto-update: Members with role: ${membersWithRole.size}`);
        
        const roleCount = membersWithRole.size;
    
        // Find channels
        const category = guild.channels.cache.get(categoryId);
        if (!category) return;
    
        const memberChannel = guild.channels.cache.find(
          (ch: any) =>
            ch.parentId === categoryId && ch.name.startsWith(memberChannelName)
        );
        if (memberChannel)
          await memberChannel.setName(`${memberChannelName}: ${memberCount}`);
    
        const roleChannel = guild.channels.cache.find(
          (ch: any) =>
            ch.parentId === categoryId && ch.name.startsWith(roleChannelName)
        );
        if (roleChannel)
          await roleChannel.setName(`${roleChannelName}: ${roleCount}`);
          
      } catch (error) {
        console.error('Error updating stats channels:', error);
      }
    }
    
    // Welcome message handler for new members
    async function handleMemberJoin(member: any) {
      try {
        const guild = member.guild;
        const MEMBER_ROLE_ID = '1392928339924357183';
        
        // Assign member role
        try {
          const memberRole = guild.roles.cache.get(MEMBER_ROLE_ID);
          if (memberRole) {
            await member.roles.add(memberRole);
            console.log(`✅ Assigned member role to ${member.user.tag}`);
          } else {
            console.log(`⚠️ Member role not found: ${MEMBER_ROLE_ID}`);
          }
        } catch (roleError) {
          console.error('Error assigning member role:', roleError);
        }
    
        // Find a suitable channel for welcome message (general, welcome, or first text channel)
        const welcomeChannel = guild.channels.cache.find((channel: any) => 
          channel.type === 0 && ( // Text channel
            channel.name.includes('general') ||
            channel.name.includes('welcome') ||
            channel.name.includes('chat')
          )
        ) || guild.channels.cache.find((channel: any) => channel.type === 0); // First text channel as fallback
    
        if (!welcomeChannel) {
          console.log('⚠️ No suitable channel found for welcome message');
          return;
        }
    
        // Create simple welcome embed
        const { EmbedBuilder } = require('discord.js');
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x00FF7F) // Spring green color
          .setTitle(`🎉 Welcome to ${guild.name}!`)
          .setDescription(`Hey ${member.user}, glad to have you here!`)
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .addFields(
            {
              name: ' Server Info',
              value: `**Total Members:** ${guild.memberCount.toLocaleString()}\n**You are member #${guild.memberCount}**`,
              inline: false
            }
          )
          .setFooter({ 
            text: `Welcome to ${guild.name}`, 
            iconURL: guild.iconURL() || undefined 
          })
          .setTimestamp();
    
        // Send welcome message
        await welcomeChannel.send({ 
          content: `👋 ${member.user}`, 
          embeds: [welcomeEmbed] 
        });
    
        console.log(`🎉 Sent welcome message for ${member.user.tag} in #${welcomeChannel.name}`);
    
      } catch (error) {
        console.error('Error handling member join:', error);
      }
    }

import { registerCommands } from "./registerCommands";
registerCommands(client)
  .then(() => console.log("Commands registered successfully"))
  .catch((error: unknown) =>
    console.error("Failed to register commands:", error)
  );

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const command = require(`./commands/${interaction.commandName}`);
    await command.execute(interaction);
    
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    
    // Only try to respond if the interaction hasn't been handled yet
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "There was an error executing this command!",
          ephemeral: true
        });
      } else if (interaction.deferred) {
        await interaction.editReply({
          content: "There was an error executing this command!"
        });
      }
    } catch (responseError) {
      // Silently fail if we can't send error response
      console.error('Failed to send error response:', responseError);
    }
  }
});

client
  .login(process.env.DISCORD_TOKEN)
  .catch((error: unknown) => console.error("Failed to login:", error));

// Graceful shutdown - close database connection
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  
  // Clear all scheduled message intervals
  if (client.scheduledIntervals) {
    for (const intervalId of Object.values(client.scheduledIntervals)) {
      clearInterval(intervalId as NodeJS.Timeout);
    }
  }
  
  // Cleanup Minecraft server monitoring
  try {
    const mcserverCommand = require('./commands/mcserver');
    if (mcserverCommand.cleanup) {
      mcserverCommand.cleanup();
    }
  } catch (error) {
    // Command may not exist yet
  }
  
  // Cleanup Minecraft chat bridge
  try {
    const mcchatCommand = require('./commands/mcchat');
    if (mcchatCommand.cleanup) {
      mcchatCommand.cleanup();
    }
  } catch (error) {
    // Command may not exist yet
  }
  
  await closeDatabase();
  console.log('Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  
  // Clear all scheduled message intervals
  if (client.scheduledIntervals) {
    for (const intervalId of Object.values(client.scheduledIntervals)) {
      clearInterval(intervalId as NodeJS.Timeout);
    }
  }
  
  // Cleanup Minecraft server monitoring
  try {
    const mcserverCommand = require('./commands/mcserver');
    if (mcserverCommand.cleanup) {
      mcserverCommand.cleanup();
    }
  } catch (error) {
    // Command may not exist yet
  }
  
  // Cleanup Minecraft chat bridge
  try {
    const mcchatCommand = require('./commands/mcchat');
    if (mcchatCommand.cleanup) {
      mcchatCommand.cleanup();
    }
  } catch (error) {
    // Command may not exist yet
  }
  
  await closeDatabase();
  console.log('Goodbye!');
  process.exit(0);
});
