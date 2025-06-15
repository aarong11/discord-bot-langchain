import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { LangchainService } from './services/LangchainService';
import { CommandHandler } from './services/CommandHandler';
import { ResponsePermissionService } from './services/ResponsePermissionService';
import { ConfigService } from './services/ConfigService';
import { ApiServer } from './services/ApiServer';

export interface BotCommand {
  name: string;
  description: string;
  execute: (interaction: any, langchainService: LangchainService) => Promise<void>;
}

class DiscordBot {
  public client: Client;
  public commands: Collection<string, BotCommand>;
  public langchainService: LangchainService;
  public commandHandler: CommandHandler;
  public responsePermissionService: ResponsePermissionService;
  public configService: ConfigService;
  public apiServer: ApiServer;
  private isStarted: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.commands = new Collection();
    this.configService = new ConfigService();
    this.langchainService = new LangchainService(this.configService);
    this.commandHandler = new CommandHandler(this);
    this.responsePermissionService = new ResponsePermissionService(this.configService);
    this.apiServer = new ApiServer(this.configService);
    
    // Set the bot instance in the API server for control functionality
    this.apiServer.setBotInstance(this);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.once('ready', () => {
      console.log(`✅ Bot is ready! Logged in as ${this.client.user?.tag}`);
      this.apiServer.setBotStatus('running');
    });

    this.client.on('disconnect', () => {
      console.log('❌ Bot disconnected');
      this.apiServer.setBotStatus('stopped');
    });

    this.client.on('error', (error) => {
      console.error('❌ Bot error:', error);
      this.apiServer.setBotStatus('error');
    });

    this.client.on('interactionCreate', async (interaction) => {
      await this.commandHandler.handleInteraction(interaction);
    });

    // Add message handling for direct responses
    this.client.on('messageCreate', async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      // Check if we should respond to this message
      if (!this.responsePermissionService.shouldRespond(message, this.client.user!)) {
        return;
      }

      // Get the message content, removing bot mention if present
      let content = message.content;
      if (message.mentions.users.has(this.client.user!.id)) {
        content = content.replace(`<@${this.client.user!.id}>`, '').trim();
      }

      // Extract image attachments
      const imageUrls: string[] = [];
      const imageConfig = this.configService.getImageProcessingConfig();
      
      if (message.attachments.size > 0 && imageConfig.enabled) {
        for (const attachment of message.attachments.values()) {
          if (this.langchainService.imageProcessingService.isImageSupported(attachment.contentType || '')) {
            // Check file size limit (convert MB to bytes)
            const maxSizeBytes = imageConfig.maxSize * 1024 * 1024;
            if (attachment.size <= maxSizeBytes) {
              imageUrls.push(attachment.url);
            } else {
              await message.reply(`⚠️ Image "${attachment.name}" is too large (${(attachment.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${imageConfig.maxSize}MB.`);
            }
          }
        }
      }

      // Skip if no content and no images, or if only images but auto-describe is disabled
      if (!content && imageUrls.length === 0) return;
      if (!content && imageUrls.length > 0 && !imageConfig.autoDescribe) {
        // If user only sent images but didn't ask anything, and auto-describe is disabled
        return;
      }

      // If only images with no text and auto-describe is enabled, provide a default prompt
      if (!content && imageUrls.length > 0 && imageConfig.autoDescribe) {
        content = "What do you see in this image?";
      }

      try {
        // Show typing indicator
        await message.channel.sendTyping();

        // Generate response using Langchain with image analysis
        const response = await this.langchainService.generateResponseWithImages(
          content,
          imageUrls,
          message.author.id,
          message.channel.id,
          message.guild?.id || 'dm',
          message.author.displayName || message.author.username,
          true // shouldRemember
        );

        // Send response
        await message.reply(response);
      } catch (error) {
        console.error('❌ Error handling message:', error);
        
        // Provide specific error messages for image processing issues
        if (error instanceof Error && error.message.includes('Image processing')) {
          await message.reply('Sorry, I encountered an error while processing the image(s). Please try again or check if image processing is properly configured.');
        } else if (error instanceof Error && error.message.includes('Vision model')) {
          await message.reply('Sorry, image analysis is not available right now. The vision model may not be configured correctly.');
        } else {
          await message.reply('Sorry, I encountered an error while processing your message.');
        }
      }
    });
  }

  public async start(): Promise<void> {
    try {
      // Start the API server first
      if (!this.isStarted) {
        await this.apiServer.start();
        this.isStarted = true;
      }

      // Make bot instance accessible to commands
      (this.client as any).bot = this;
      
      await this.commandHandler.loadCommands();
      await this.commandHandler.registerCommands();

      // Use ConfigService for Discord credentials
      const discordConfig = this.configService.getDiscordConfig();
      if (!discordConfig.token) {
        console.log('⚠️ Discord token not configured. API server is running at http://localhost:3001');
        console.log('💡 Please configure your Discord bot credentials via the web interface at http://localhost:3001');
        this.apiServer.setBotStatus('stopped');
        // Don't exit - keep the API server running so users can configure credentials
        return;
      }

      this.apiServer.setBotStatus('starting');
      await this.client.login(discordConfig.token);
    } catch (error: any) {
      console.error('❌ Error starting bot:', error);
      this.apiServer.setBotStatus('error');
      if (error?.message?.includes('not configured')) {
        console.log('💡 Please configure your Discord bot credentials via the web interface at http://localhost:3001');
        // Don't exit - keep the API server running
        return;
      }
      // Don't exit the process, just log the error and keep API server running
      console.log('💡 API server is still running at http://localhost:3001 for configuration');
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.client.isReady()) {
        await this.client.destroy();
      }
      this.apiServer.setBotStatus('stopped');
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
      this.apiServer.setBotStatus('error');
    }
  }

  public async restart(): Promise<void> {
    try {
      await this.stop();
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.start();
    } catch (error) {
      console.error('❌ Error restarting bot:', error);
      this.apiServer.setBotStatus('error');
    }
  }
}

// Start the bot
const bot = new DiscordBot();
bot.start();