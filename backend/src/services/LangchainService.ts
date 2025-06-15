import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from './ConfigService';
import { ImageProcessingService } from './ImageProcessingService';
import { MemoryService } from './MemoryService';

export class LangchainService {
  private configService: ConfigService;
  public imageProcessingService: ImageProcessingService;
  private memoryService: MemoryService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.imageProcessingService = new ImageProcessingService(configService);
    this.memoryService = new MemoryService(configService);
    console.log('🤖 LangchainService initialized');
  }

  private getModel() {
    const aiProvider = this.configService.getAIProvider();
    
    if (aiProvider === 'openai') {
      const config = this.configService.getOpenAIConfig();
      
      if (!config.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      return new ChatOpenAI({
        openAIApiKey: config.apiKey,
        modelName: config.model,
        temperature: config.temperature,
      });
    } else if (aiProvider === 'ollama') {
      const config = this.configService.getOllamaConfig();
      
      // For Ollama, we would use a different Langchain integration
      // This is a placeholder - you'd need to implement Ollama support
      throw new Error('Ollama integration not yet implemented');
    } else {
      throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }
  }

  public async generateResponse(
    message: string,
    userId: string,
    channelId: string,
    guildId: string,
    userName: string,
    shouldRemember: boolean = true
  ): Promise<string> {
    try {
      const model = this.getModel();
      const systemPrompt = this.buildSystemPrompt(userId, userName);
      
      // Get conversation context if memory is enabled
      let context = '';
      const memoryConfig = this.configService.getMemoryContextConfig();
      if (memoryConfig.enableMemory && shouldRemember) {
        context = await this.memoryService.getConversationContext(userId, channelId, guildId);
      }

      // Build the full prompt
      const fullPrompt = this.buildFullPrompt(systemPrompt, context, message, userName);
      
      // Generate response
      const response = await model.invoke(fullPrompt);
      const responseText = typeof response.content === 'string' ? response.content : response.content.toString();

      // Store in memory if enabled
      if (memoryConfig.enableMemory && shouldRemember) {
        await this.memoryService.storeInteraction(userId, channelId, guildId, message, responseText, userName);
      }

      return responseText;
    } catch (error) {
      console.error('❌ Error generating response:', error);
      throw error;
    }
  }

  public async generateResponseWithImages(
    message: string,
    imageUrls: string[],
    userId: string,
    channelId: string,
    guildId: string,
    userName: string,
    shouldRemember: boolean = true
  ): Promise<string> {
    try {
      // If no images, use regular text generation
      if (imageUrls.length === 0) {
        return this.generateResponse(message, userId, channelId, guildId, userName, shouldRemember);
      }

      // Check if image processing is enabled
      const imageConfig = this.configService.getImageProcessingConfig();
      if (!imageConfig.enabled) {
        return this.generateResponse(message, userId, channelId, guildId, userName, shouldRemember);
      }

      // Process images and generate response
      const imageAnalysis = await this.imageProcessingService.analyzeImages(imageUrls, message);
      
      // Combine image analysis with text message
      const combinedMessage = message + '\n\nImage Analysis:\n' + imageAnalysis;
      
      return this.generateResponse(combinedMessage, userId, channelId, guildId, userName, shouldRemember);
    } catch (error) {
      console.error('❌ Error generating response with images:', error);
      throw error;
    }
  }

  private buildSystemPrompt(userId: string, userName: string): string {
    const config = this.configService.getConfig();
    let systemPrompt = config.systemPrompt;

    // Add personality traits
    if (config.personalityTraits) {
      const traits = Object.entries(config.personalityTraits)
        .map(([trait, value]) => `${trait}: ${value}/10`)
        .join(', ');
      systemPrompt += `\n\nPersonality traits: ${traits}`;
    }

    // Add communication style
    if (config.communicationStyle) {
      systemPrompt += `\nCommunication style: ${config.communicationStyle}`;
    }

    // Add selected tones
    if (config.selectedTones && config.selectedTones.length > 0) {
      systemPrompt += `\nTone: ${config.selectedTones.join(', ')}`;
    }

    // Add emoji usage preference
    if (config.useEmojis) {
      systemPrompt += '\nFeel free to use emojis in your responses to make them more engaging.';
    }

    // Add roleplay mode if enabled
    if (config.roleplayMode && config.characterDescription) {
      systemPrompt += `\n\nCharacter Description: ${config.characterDescription}`;
      systemPrompt += '\nYou are roleplaying as this character. Stay in character throughout the conversation.';
    }

    // Add custom instructions
    if (config.customInstructions) {
      systemPrompt += `\n\nAdditional Instructions: ${config.customInstructions}`;
    }

    // Add response length preference
    if (config.responseLength) {
      const lengthGuide = {
        'short': 'Keep responses brief and to the point (1-2 sentences).',
        'medium': 'Provide moderate length responses (2-4 sentences).',
        'long': 'Give detailed and comprehensive responses when appropriate.'
      };
      systemPrompt += `\n\nResponse Length: ${lengthGuide[config.responseLength as keyof typeof lengthGuide] || lengthGuide.medium}`;
    }

    return systemPrompt;
  }

  private buildFullPrompt(systemPrompt: string, context: string, message: string, userName: string): string {
    let fullPrompt = systemPrompt;

    if (context) {
      fullPrompt += `\n\nConversation Context:\n${context}`;
    }

    fullPrompt += `\n\nUser (${userName}): ${message}`;
    fullPrompt += '\n\nAssistant:';

    return fullPrompt;
  }

  public getProviderInfo(): { provider: string; model: string; baseUrl?: string } {
    const aiProvider = this.configService.getAIProvider();
    
    if (aiProvider === 'openai') {
      const config = this.configService.getOpenAIConfig();
      return {
        provider: 'OpenAI',
        model: config.model
      };
    } else if (aiProvider === 'ollama') {
      const config = this.configService.getOllamaConfig();
      return {
        provider: 'Ollama',
        model: config.model,
        baseUrl: config.baseUrl
      };
    }

    return { provider: 'Unknown', model: 'Unknown' };
  }
}