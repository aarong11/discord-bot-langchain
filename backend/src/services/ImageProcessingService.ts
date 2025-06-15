import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from './ConfigService';
import { ChatOpenAI } from '@langchain/openai';

export interface ImageAnalysisResult {
  description: string;
  objects?: string[];
  text?: string;
  emotions?: string[];
  confidence: number;
}

export class ImageProcessingService {
  private configService: ConfigService;
  private tempDir: string;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public async analyzeImages(imageUrls: string[], userPrompt: string = ''): Promise<string> {
    try {
      const config = this.configService.getConfig();
      
      if (!config.enableImageProcessing) {
        throw new Error('Image processing is disabled');
      }

      const aiProvider = this.configService.getAIProvider();
      
      if (aiProvider === 'openai') {
        return await this.analyzeWithOpenAI(imageUrls, userPrompt);
      } else if (aiProvider === 'ollama') {
        return await this.analyzeWithOllama(imageUrls, userPrompt);
      } else {
        throw new Error(`Image processing not supported for provider: ${aiProvider}`);
      }
    } catch (error) {
      console.error('❌ Error analyzing images:', error);
      throw new Error('Image processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async analyzeWithOpenAI(imageUrls: string[], userPrompt: string): Promise<string> {
    const config = this.configService.getConfig();
    
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const model = new ChatOpenAI({
        openAIApiKey: config.openaiApiKey,
        modelName: config.openaiVisionModel || 'gpt-4o',
        temperature: config.openaiTemperature || 0.7,
      });

      let prompt = userPrompt || 'Describe what you see in this image in detail.';
      
      if (imageUrls.length > 1) {
        prompt = `${prompt}\n\nAnalyze these ${imageUrls.length} images and describe what you see in each one.`;
      }

      const response = await model.invoke([
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrls[0]
          }
        }
      ] as any);

      return typeof response.content === 'string' ? response.content : response.content.toString();
    } catch (error) {
      console.error('❌ OpenAI vision analysis failed:', error);
      throw new Error('OpenAI vision analysis failed');
    }
  }

  private async analyzeWithOllama(imageUrls: string[], userPrompt: string): Promise<string> {
    const config = this.configService.getConfig();
    
    try {
      throw new Error('Ollama vision analysis not yet implemented');
    } catch (error) {
      console.error('❌ Ollama vision analysis failed:', error);
      throw new Error('Ollama vision analysis failed');
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      throw new Error('Failed to download image');
    }
  }

  public getSupportedFormats(): string[] {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  }

  public isImageSupported(contentType: string): boolean {
    return this.getSupportedFormats().includes(contentType.toLowerCase());
  }

  public async testImageProcessing(): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.configService.getConfig();
      
      if (!config.enableImageProcessing) {
        return { success: false, message: 'Image processing is disabled' };
      }

      const aiProvider = this.configService.getAIProvider();
      
      if (aiProvider === 'openai') {
        if (!config.openaiApiKey) {
          return { success: false, message: 'OpenAI API key not configured' };
        }
        
        if (!config.openaiVisionModel) {
          return { success: false, message: 'OpenAI vision model not configured' };
        }
        
        return { success: true, message: 'Image processing configuration is valid' };
      } else if (aiProvider === 'ollama') {
        if (!config.ollamaBaseUrl) {
          return { success: false, message: 'Ollama base URL not configured' };
        }
        
        if (!config.ollamaVisionModel) {
          return { success: false, message: 'Ollama vision model not configured' };
        }
        
        return { success: true, message: 'Ollama vision configuration looks good (implementation pending)' };
      } else {
        return { success: false, message: `Image processing not supported for provider: ${aiProvider}` };
      }
    } catch (error) {
      return { success: false, message: 'Error testing image processing configuration' };
    }
  }

  public async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          const filePath = path.join(this.tempDir, file);
          const stats = fs.statSync(filePath);
          
          if (Date.now() - stats.mtime.getTime() > 3600000) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.warn('Error cleaning up temp files:', error);
    }
  }
}