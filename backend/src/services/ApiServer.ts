import express, { Request, Response } from 'express';
import cors from 'cors';
import { ConfigService, BotConfig } from './ConfigService';

export class ApiServer {
  private app: express.Application;
  private configService: ConfigService;
  private botInstance: any = null;
  private botStatus: string = 'stopped';
  private botStartTime: Date | null = null;

  constructor(configService: ConfigService) {
    this.app = express();
    this.configService = configService;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  public setBotInstance(botInstance: any): void {
    this.botInstance = botInstance;
  }

  public setBotStatus(status: string): void {
    this.botStatus = status;
    if (status === 'running') {
      this.botStartTime = new Date();
    } else if (status === 'stopped') {
      this.botStartTime = null;
    }
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Bot control endpoints
    this.app.post('/api/bot/start', async (req: Request, res: Response) => {
      try {
        if (this.botStatus === 'running') {
          return res.status(400).json({ error: 'Bot is already running' });
        }

        if (this.botStatus === 'starting') {
          return res.status(400).json({ error: 'Bot is already starting' });
        }

        // Check if configuration is complete
        const config = this.configService.getConfig();
        if (!config.discordToken || !config.clientId) {
          return res.status(400).json({ error: 'Discord configuration is incomplete. Please configure Discord token and client ID.' });
        }

        this.setBotStatus('starting');
        
        // Start the bot
        if (this.botInstance && typeof this.botInstance.start === 'function') {
          await this.botInstance.start();
          this.setBotStatus('running');
          res.json({ success: true, message: 'Bot started successfully' });
        } else {
          this.setBotStatus('error');
          res.status(500).json({ error: 'Bot instance not available' });
        }
      } catch (error) {
        console.error('Error starting bot:', error);
        this.setBotStatus('error');
        res.status(500).json({ error: 'Failed to start bot' });
      }
    });

    this.app.post('/api/bot/stop', async (req: Request, res: Response) => {
      try {
        if (this.botStatus === 'stopped') {
          return res.status(400).json({ error: 'Bot is already stopped' });
        }

        this.setBotStatus('stopping');
        
        if (this.botInstance && typeof this.botInstance.stop === 'function') {
          await this.botInstance.stop();
          this.setBotStatus('stopped');
          res.json({ success: true, message: 'Bot stopped successfully' });
        } else {
          this.setBotStatus('error');
          res.status(500).json({ error: 'Bot instance not available' });
        }
      } catch (error) {
        console.error('Error stopping bot:', error);
        this.setBotStatus('error');
        res.status(500).json({ error: 'Failed to stop bot' });
      }
    });

    this.app.post('/api/bot/restart', async (req: Request, res: Response) => {
      try {
        this.setBotStatus('stopping');
        
        // Stop the bot first
        if (this.botInstance && typeof this.botInstance.stop === 'function') {
          await this.botInstance.stop();
        }

        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check configuration again
        const config = this.configService.getConfig();
        if (!config.discordToken || !config.clientId) {
          this.setBotStatus('stopped');
          return res.status(400).json({ error: 'Discord configuration is incomplete. Please configure Discord token and client ID.' });
        }

        this.setBotStatus('starting');

        // Start the bot again
        if (this.botInstance && typeof this.botInstance.start === 'function') {
          await this.botInstance.start();
          this.setBotStatus('running');
          res.json({ success: true, message: 'Bot restarted successfully' });
        } else {
          this.setBotStatus('error');
          res.status(500).json({ error: 'Bot instance not available' });
        }
      } catch (error) {
        console.error('Error restarting bot:', error);
        this.setBotStatus('error');
        res.status(500).json({ error: 'Failed to restart bot' });
      }
    });

    this.app.get('/api/bot/status', (req: Request, res: Response) => {
      const uptime = this.botStartTime ? Date.now() - this.botStartTime.getTime() : 0;
      res.json({
        status: this.botStatus,
        connected: this.botStatus === 'running' && this.botInstance?.client?.isReady(),
        uptime: Math.floor(uptime / 1000), // in seconds
        timestamp: new Date().toISOString()
      });
    });

    // Configuration endpoints
    this.app.get('/api/config/discord', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const discordConfig = {
          discordToken: config.discordToken,
          clientId: config.clientId,
          guildId: config.guildId
        };
        res.json(discordConfig);
      } catch (error) {
        console.error('Error getting Discord config:', error);
        res.status(500).json({ error: 'Failed to get Discord configuration' });
      }
    });

    this.app.get('/api/config/ai-provider', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const aiConfig = {
          aiProvider: config.aiProvider,
          openaiApiKey: config.openaiApiKey,
          openaiModel: config.openaiModel,
          openaiTemperature: config.openaiTemperature,
          ollamaBaseUrl: config.ollamaBaseUrl,
          ollamaModel: config.ollamaModel,
          ollamaTemperature: config.ollamaTemperature
        };
        res.json(aiConfig);
      } catch (error) {
        console.error('Error getting AI provider config:', error);
        res.status(500).json({ error: 'Failed to get AI provider configuration' });
      }
    });

    this.app.get('/api/config/personality', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const personalityConfig = {
          botName: config.botName,
          personalityTraits: config.personalityTraits,
          communicationStyle: config.communicationStyle,
          selectedTones: config.selectedTones,
          useEmojis: config.useEmojis,
          roleplayMode: config.roleplayMode,
          characterDescription: config.characterDescription
        };
        res.json(personalityConfig);
      } catch (error) {
        console.error('Error getting personality config:', error);
        res.status(500).json({ error: 'Failed to get personality configuration' });
      }
    });

    this.app.get('/api/config/system-prompt', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const systemPromptConfig = {
          systemPrompt: config.systemPrompt,
          customInstructions: config.customInstructions,
          enableMemory: config.enableMemory,
          responseLength: config.responseLength
        };
        res.json(systemPromptConfig);
      } catch (error) {
        console.error('Error getting system prompt config:', error);
        res.status(500).json({ error: 'Failed to get system prompt configuration' });
      }
    });

    this.app.get('/api/config/response', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const responseConfig = {
          responseMode: config.responseMode,
          allowedRoles: config.allowedRoles,
          allowedChannels: config.allowedChannels,
          respondToMentions: config.respondToMentions
        };
        res.json(responseConfig);
      } catch (error) {
        console.error('Error getting response config:', error);
        res.status(500).json({ error: 'Failed to get response configuration' });
      }
    });

    this.app.get('/api/config/image-processing', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const imageConfig = {
          enableImageProcessing: config.enableImageProcessing,
          maxImageSize: config.maxImageSize,
          imageResponseMode: config.imageResponseMode,
          autoDescribeImages: config.autoDescribeImages
        };
        res.json(imageConfig);
      } catch (error) {
        console.error('Error getting image processing config:', error);
        res.status(500).json({ error: 'Failed to get image processing configuration' });
      }
    });

    this.app.get('/api/config/memory-context', (req: Request, res: Response) => {
      try {
        const config = this.configService.getConfig();
        const memoryConfig = {
          enableMemory: config.enableMemory,
          contextMessageCount: config.contextMessageCount,
          maxUserFacts: config.maxUserFacts,
          maxUserPreferences: config.maxUserPreferences,
          includeFactsForMentionedUsers: config.includeFactsForMentionedUsers,
          maxMentionedUserFacts: config.maxMentionedUserFacts
        };
        res.json(memoryConfig);
      } catch (error) {
        console.error('Error getting memory context config:', error);
        res.status(500).json({ error: 'Failed to get memory context configuration' });
      }
    });

    // Update configuration endpoints
    this.app.put('/api/config/discord', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['discordToken', 'clientId', 'guildId'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'Discord configuration updated successfully' });
      } catch (error) {
        console.error('Error updating Discord config:', error);
        res.status(500).json({ error: 'Failed to update Discord configuration' });
      }
    });

    this.app.put('/api/config/ai-provider', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['aiProvider', 'openaiApiKey', 'openaiModel', 'openaiTemperature', 'ollamaBaseUrl', 'ollamaModel', 'ollamaTemperature'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'AI provider configuration updated successfully' });
      } catch (error) {
        console.error('Error updating AI provider config:', error);
        res.status(500).json({ error: 'Failed to update AI provider configuration' });
      }
    });

    this.app.put('/api/config/personality', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['botName', 'personalityTraits', 'communicationStyle', 'selectedTones', 'useEmojis', 'roleplayMode', 'characterDescription'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'Personality configuration updated successfully' });
      } catch (error) {
        console.error('Error updating personality config:', error);
        res.status(500).json({ error: 'Failed to update personality configuration' });
      }
    });

    this.app.put('/api/config/system-prompt', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['systemPrompt', 'customInstructions', 'enableMemory', 'responseLength'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'System prompt configuration updated successfully' });
      } catch (error) {
        console.error('Error updating system prompt config:', error);
        res.status(500).json({ error: 'Failed to update system prompt configuration' });
      }
    });

    this.app.put('/api/config/response', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['responseMode', 'allowedRoles', 'allowedChannels', 'respondToMentions'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'Response configuration updated successfully' });
      } catch (error) {
        console.error('Error updating response config:', error);
        res.status(500).json({ error: 'Failed to update response configuration' });
      }
    });

    this.app.put('/api/config/image-processing', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['enableImageProcessing', 'maxImageSize', 'imageResponseMode', 'autoDescribeImages'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'Image processing configuration updated successfully' });
      } catch (error) {
        console.error('Error updating image processing config:', error);
        res.status(500).json({ error: 'Failed to update image processing configuration' });
      }
    });

    this.app.put('/api/config/memory-context', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        
        const validFields = ['enableMemory', 'contextMessageCount', 'maxUserFacts', 'maxUserPreferences', 'includeFactsForMentionedUsers', 'maxMentionedUserFacts'];
        const filteredUpdates: Partial<BotConfig> = {};
        
        for (const field of validFields) {
          if (updates[field] !== undefined) {
            filteredUpdates[field as keyof BotConfig] = updates[field];
          }
        }

        this.configService.updateConfig(filteredUpdates);
        res.json({ success: true, message: 'Memory context configuration updated successfully' });
      } catch (error) {
        console.error('Error updating memory context config:', error);
        res.status(500).json({ error: 'Failed to update memory context configuration' });
      }
    });
  }

  public async start(): Promise<void> {
    const PORT = process.env.PORT || 3001;
    this.app.listen(PORT, () => {
      console.log(`🌐 API Server running on port ${PORT}`);
      console.log(`🔗 Web interface: http://localhost:3000`);
      console.log(`📡 API endpoint: http://localhost:${PORT}`);
    });
  }
}