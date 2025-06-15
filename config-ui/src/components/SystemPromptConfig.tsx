import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Save, Refresh, Psychology, Info } from '@mui/icons-material';

interface SystemPromptConfigProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  onSaveSuccess?: () => void;
}

const presetPrompts = [
  {
    name: 'Default Assistant',
    prompt: 'You are a helpful Discord bot assistant. Respond to users in a friendly and helpful way. Keep your responses concise but informative.'
  },
  {
    name: 'Casual Friend',
    prompt: 'You are a casual, friendly Discord bot who talks like a good friend. Use casual language, emojis, and be encouraging. Keep responses fun and engaging.'
  },
  {
    name: 'Professional Helper',
    prompt: 'You are a professional Discord bot assistant. Provide clear, accurate, and well-structured responses. Maintain a professional tone while being helpful.'
  },
  {
    name: 'Gaming Buddy',
    prompt: 'You are a gaming-focused Discord bot. You love talking about games, strategies, and helping with gaming-related questions. Use gaming terminology and be enthusiastic.'
  },
  {
    name: 'Study Assistant',
    prompt: 'You are an educational Discord bot designed to help with learning and studying. Provide clear explanations, break down complex topics, and encourage learning.'
  },
  {
    name: 'Creative Writer',
    prompt: 'You are a creative Discord bot who loves storytelling, writing, and creative expression. Help users with creative projects and inspire imagination.'
  }
];

const SystemPromptConfig: React.FC<SystemPromptConfigProps> = ({ onNotification, onSaveSuccess }) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [enableMemory, setEnableMemory] = useState(false);
  const [responseLength, setResponseLength] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      // In a real implementation, this would fetch from your bot's config API
      // For now, we'll simulate loading from localStorage
      const savedPrompt = localStorage.getItem('systemPrompt') || presetPrompts[0].prompt;
      const savedInstructions = localStorage.getItem('customInstructions') || '';
      const savedMemory = localStorage.getItem('enableMemory') === 'true';
      const savedLength = localStorage.getItem('responseLength') || 'medium';
      
      setSystemPrompt(savedPrompt);
      setCustomInstructions(savedInstructions);
      setEnableMemory(savedMemory);
      setResponseLength(savedLength);
    } catch (error) {
      onNotification('Failed to load current configuration', 'error');
    }
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = presetPrompts.find(p => p.name === presetName);
    if (preset) {
      setSystemPrompt(preset.prompt);
      setSelectedPreset(presetName);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would save to your bot's config API
      localStorage.setItem('systemPrompt', systemPrompt);
      localStorage.setItem('customInstructions', customInstructions);
      localStorage.setItem('enableMemory', enableMemory.toString());
      localStorage.setItem('responseLength', responseLength);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onNotification('System prompt configuration saved successfully!', 'success');
      onSaveSuccess?.();
    } catch (error) {
      onNotification('Failed to save configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getResponseLengthDescription = (length: string) => {
    switch (length) {
      case 'short': return 'Brief, concise responses (1-2 sentences)';
      case 'medium': return 'Balanced responses (2-4 sentences)';
      case 'long': return 'Detailed, comprehensive responses';
      default: return '';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        System Prompt Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the core personality and behavior of your Discord bot
      </Typography>

      <Grid container spacing={3}>
        {/* Preset Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Quick Presets</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {presetPrompts.map((preset) => (
                <Chip
                  key={preset.name}
                  label={preset.name}
                  onClick={() => handlePresetSelect(preset.name)}
                  color={selectedPreset === preset.name ? 'primary' : 'default'}
                  variant={selectedPreset === preset.name ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Main System Prompt */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="System Prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter the core personality and instructions for your bot..."
            helperText="This is the main instruction that defines your bot's personality and behavior"
          />
        </Grid>

        {/* Additional Instructions */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Custom Instructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific rules, restrictions, or additional context..."
            helperText="Optional: Add specific guidelines or constraints for your bot"
          />
        </Grid>

        {/* Response Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Response Behavior</Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Response Length</InputLabel>
                  <Select
                    value={responseLength}
                    label="Response Length"
                    onChange={(e) => setResponseLength(e.target.value)}
                  >
                    <MenuItem value="short">Short</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="long">Long</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  {getResponseLengthDescription(responseLength)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableMemory}
                      onChange={(e) => setEnableMemory(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Conversation Memory
                      <Tooltip title="When enabled, the bot will remember previous messages in the conversation">
                        <Info fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadCurrentConfig}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading || !systemPrompt.trim()}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemPromptConfig;