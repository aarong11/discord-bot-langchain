import { ChatInputCommandInteraction } from 'discord.js';
import { LangchainService } from '../services/LangchainService';

module.exports = {
  name: 'config',
  description: 'Show the current bot response configuration',
  async execute(interaction: ChatInputCommandInteraction, langchainService: LangchainService) {
    // Access the bot instance through the client
    const bot = (interaction.client as any).bot;
    
    if (!bot?.responsePermissionService) {
      await interaction.reply({
        content: '❌ Configuration service not available.',
        ephemeral: true
      });
      return;
    }

    const configSummary = bot.responsePermissionService.getConfigSummary();
    const aiInfo = langchainService.getProviderInfo();
    
    let aiSummary = `**AI Provider:** ${aiInfo.provider}\n**Model:** ${aiInfo.model}`;
    if (aiInfo.baseUrl) {
      aiSummary += `\n**Base URL:** ${aiInfo.baseUrl}`;
    }
    
    await interaction.reply({
      content: `🔧 **Bot Configuration**\n\n${configSummary}\n\n🤖 **AI Configuration**\n${aiSummary}`,
      ephemeral: true
    });
  },
};