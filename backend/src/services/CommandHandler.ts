import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { BotCommand } from '../index';

export class CommandHandler {
  private bot: any;

  constructor(bot: any) {
    this.bot = bot;
  }

  public async loadCommands(): Promise<void> {
    const commandsPath = join(__dirname, '..', 'commands');
    
    try {
      const commandFiles = readdirSync(commandsPath).filter(file => 
        file.endsWith('.ts') || file.endsWith('.js')
      );

      for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        
        if ('name' in command && 'description' in command && 'execute' in command) {
          this.bot.commands.set(command.name, command);
          console.log(`✅ Loaded command: ${command.name}`);
        } else {
          console.log(`⚠️ Command at ${filePath} is missing required properties`);
        }
      }
    } catch (error) {
      console.log('📁 No commands directory found or no commands to load');
    }
  }

  public async registerCommands(): Promise<void> {
    const commands = [];
    
    // Convert loaded commands to Discord API format
    for (const command of this.bot.commands.values()) {
      const slashCommand = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description);
      
      // Add command-specific options here if needed for remaining commands
      
      commands.push(slashCommand.toJSON());
    }

    // Use ConfigService for Discord credentials
    const discordConfig = this.bot.configService.getDiscordConfig();
    if (!discordConfig.token) {
      console.warn('⚠️ Discord token not configured, skipping command registration');
      return;
    }

    const rest = new REST().setToken(discordConfig.token);

    try {
      console.log('🔄 Started refreshing application (/) commands.');

      if (discordConfig.guildId) {
        // Register commands for a specific guild (faster for development)
        await rest.put(
          Routes.applicationGuildCommands(discordConfig.clientId, discordConfig.guildId),
          { body: commands }
        );
        console.log('✅ Successfully reloaded guild application (/) commands.');
      } else {
        // Register commands globally (takes up to 1 hour to update)
        await rest.put(
          Routes.applicationCommands(discordConfig.clientId),
          { body: commands }
        );
        console.log('✅ Successfully reloaded global application (/) commands.');
      }
    } catch (error) {
      console.error('❌ Error registering commands:', error);
    }
  }

  public async handleInteraction(interaction: any): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.bot.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, this.bot.langchainService);
    } catch (error) {
      console.error('❌ Error executing command:', error);
      const errorMessage = 'There was an error while executing this command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
}