import { Message, GuildMember, TextChannel, User } from 'discord.js';
import { ConfigService } from './ConfigService';

export type ResponseMode = 'everyone' | 'roles' | 'channels' | 'mention_only' | 'mixed';

export class ResponsePermissionService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    
    const config = this.configService.getResponseSettings();
    console.log(`🔧 Bot response mode: ${config.responseMode}`);
    if (config.allowedRoles.length > 0) {
      console.log(`👥 Allowed roles: ${config.allowedRoles.join(', ')}`);
    }
    if (config.allowedChannels.length > 0) {
      console.log(`📢 Allowed channels: ${config.allowedChannels.join(', ')}`);
    }
  }

  public shouldRespond(message: Message, botUser: User): boolean {
    const config = this.configService.getResponseSettings();
    
    // Always respond to DMs
    if (message.guild === null) {
      return true;
    }

    // Check if bot is mentioned and mentions are enabled
    if (config.respondToMentions && message.mentions.users.has(botUser.id)) {
      return true;
    }

    // Handle different response modes
    switch (config.responseMode) {
      case 'mention_only':
        return message.mentions.users.has(botUser.id);

      case 'roles':
        if (config.allowedRoles.length === 0) {
          return false;
        }
        return message.member?.roles.cache.some(role => 
          config.allowedRoles.includes(role.name) || 
          config.allowedRoles.includes(role.id)
        ) || false;

      case 'channels':
        if (config.allowedChannels.length === 0) {
          return false;
        }
        return config.allowedChannels.includes(message.channel.id) ||
               config.allowedChannels.some(channelName => 
                 'name' in message.channel && message.channel.name === channelName
               );

      case 'mixed':
        // Respond if user has allowed role OR is in allowed channel
        const hasRole = config.allowedRoles.length === 0 || 
          message.member?.roles.cache.some(role => 
            config.allowedRoles.includes(role.name) || 
            config.allowedRoles.includes(role.id)
          );
        
        const inChannel = config.allowedChannels.length === 0 ||
          config.allowedChannels.includes(message.channel.id) ||
          config.allowedChannels.some(channelName => 
            'name' in message.channel && message.channel.name === channelName
          );

        return hasRole || inChannel;

      case 'everyone':
      default:
        return true;
    }
  }

  public getConfigSummary(): string {
    const config = this.configService.getResponseSettings();
    
    let summary = `**Response Mode:** ${config.responseMode}\n`;
    
    if (config.allowedRoles.length > 0) {
      summary += `**Allowed Roles:** ${config.allowedRoles.join(', ')}\n`;
    }
    
    if (config.allowedChannels.length > 0) {
      summary += `**Allowed Channels:** ${config.allowedChannels.join(', ')}\n`;
    }
    
    summary += `**Respond to Mentions:** ${config.respondToMentions ? 'Yes' : 'No'}`;
    
    return summary;
  }
}