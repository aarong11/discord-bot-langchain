import * as fs from 'fs';
import * as path from 'path';

export interface BotConfig {
  // Discord settings (moved from .env)
  discordToken: string;
  clientId: string;
  guildId: string;
  
  // AI Provider settings
  aiProvider: 'openai' | 'ollama';
  openaiApiKey: string;
  openaiModel: string;
  openaiTemperature: number;
  openaiVisionModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaTemperature: number;
  ollamaVisionModel: string;
  
  // Image processing settings
  enableImageProcessing: boolean;
  maxImageSize: number;
  imageResponseMode: 'auto' | 'manual' | 'disabled';
  autoDescribeImages: boolean;
  
  // Bot personality settings
  botName: string;
  personalityTraits: Record<string, number>;
  communicationStyle: string;
  selectedTones: string[];
  useEmojis: boolean;
  roleplayMode: boolean;
  characterDescription: string;
  
  // System prompt settings
  systemPrompt: string;
  customInstructions: string;
  enableMemory: boolean;
  responseLength: string;
  
  // Memory context settings
  contextMessageCount: number;
  maxUserFacts: number;
  maxUserPreferences: number;
  includeFactsForMentionedUsers: boolean;
  maxMentionedUserFacts: number;
  
  // Response settings
  responseMode: string;
  allowedRoles: string[];
  allowedChannels: string[];
  respondToMentions: boolean;
}

const defaultConfig: BotConfig = {
  // Discord defaults (must be configured)
  discordToken: '',
  clientId: '',
  guildId: '',
  
  // AI Provider defaults
  aiProvider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-4o',
  openaiTemperature: 0.7,
  openaiVisionModel: 'gpt-4o',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama2',
  ollamaTemperature: 0.7,
  ollamaVisionModel: 'llava',
  
  // Image processing defaults
  enableImageProcessing: false,
  maxImageSize: 10, // MB
  imageResponseMode: 'auto',
  autoDescribeImages: true,
  
  // Bot personality defaults
  botName: 'Assistant',
  personalityTraits: {
    friendliness: 5,
    formality: 5,
    humor: 5,
    enthusiasm: 5,
    helpfulness: 5,
    verbosity: 5
  },
  communicationStyle: 'conversational',
  selectedTones: ['Cheerful', 'Supportive'],
  useEmojis: true,
  roleplayMode: false,
  characterDescription: '',
  
  // System prompt defaults
  systemPrompt: 'You are a helpful Discord bot assistant. Respond to users in a friendly and helpful way. Keep your responses concise but informative.',
  customInstructions: '',
  enableMemory: false,
  responseLength: 'medium',
  
  // Memory context defaults
  contextMessageCount: 100,
  maxUserFacts: 15,
  maxUserPreferences: 10,
  includeFactsForMentionedUsers: true,
  maxMentionedUserFacts: 5,
  
  // Response defaults
  responseMode: 'everyone',
  allowedRoles: [],
  allowedChannels: [],
  respondToMentions: true
};

export class ConfigService {
  private configPath: string;
  private config: BotConfig;

  constructor() {
    this.configPath = path.join(__dirname, '../../config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): BotConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(fileContent);
        
        // Merge with default config to ensure all properties exist
        this.config = { ...defaultConfig, ...loadedConfig };
        console.log('✅ Configuration loaded from config.json');
        return this.config;
      } else {
        console.log('📝 No config.json found, creating default configuration');
        this.config = { ...defaultConfig };
        this.saveConfig(this.config);
        return this.config;
      }
    } catch (error) {
      console.error('❌ Error loading config file:', error);
      console.log('📝 Using default configuration');
      return { ...defaultConfig };
    }
  }

  public getConfig(): BotConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<BotConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig(this.config);
  }

  public saveConfig(config: BotConfig): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log('✅ Configuration saved to config.json');
    } catch (error) {
      console.error('❌ Error saving config file:', error);
      throw error;
    }
  }

  // Specific getters for commonly used values
  public getDiscordConfig() {
    return {
      token: this.config.discordToken,
      clientId: this.config.clientId,
      guildId: this.config.guildId
    };
  }

  public getAIProvider(): string {
    return this.config.aiProvider;
  }

  public getOpenAIConfig() {
    return {
      apiKey: this.config.openaiApiKey,
      model: this.config.openaiModel,
      temperature: this.config.openaiTemperature
    };
  }

  public getOllamaConfig() {
    return {
      baseUrl: this.config.ollamaBaseUrl,
      model: this.config.ollamaModel,
      temperature: this.config.ollamaTemperature
    };
  }

  public getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  public getResponseSettings() {
    return {
      responseMode: this.config.responseMode,
      allowedRoles: this.config.allowedRoles,
      allowedChannels: this.config.allowedChannels,
      respondToMentions: this.config.respondToMentions
    };
  }

  public getImageProcessingConfig() {
    return {
      enabled: this.config.enableImageProcessing,
      maxSize: this.config.maxImageSize,
      responseMode: this.config.imageResponseMode,
      autoDescribe: this.config.autoDescribeImages
    };
  }

  public getMemoryContextConfig() {
    return {
      enableMemory: this.config.enableMemory,
      contextMessageCount: this.config.contextMessageCount,
      maxUserFacts: this.config.maxUserFacts,
      maxUserPreferences: this.config.maxUserPreferences,
      includeFactsForMentionedUsers: this.config.includeFactsForMentionedUsers,
      maxMentionedUserFacts: this.config.maxMentionedUserFacts
    };
  }
}