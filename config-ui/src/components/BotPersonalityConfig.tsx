import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import { Save, Refresh, Chat, EmojiEmotions, Psychology } from '@mui/icons-material';

interface BotPersonalityConfigProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  onSaveSuccess?: () => void;
}

const personalityTraits = [
  { name: 'Friendliness', key: 'friendliness', min: 1, max: 10, description: 'How warm and approachable the bot is' },
  { name: 'Formality', key: 'formality', min: 1, max: 10, description: 'How formal vs casual the language is' },
  { name: 'Humor', key: 'humor', min: 1, max: 10, description: 'How much humor and jokes to include' },
  { name: 'Enthusiasm', key: 'enthusiasm', min: 1, max: 10, description: 'How energetic and excited the bot sounds' },
  { name: 'Helpfulness', key: 'helpfulness', min: 1, max: 10, description: 'How proactively helpful the bot is' },
  { name: 'Verbosity', key: 'verbosity', min: 1, max: 10, description: 'How detailed and lengthy responses are' }
];

const communicationStyles = [
  { value: 'concise', label: 'Concise', description: 'Short, to-the-point responses' },
  { value: 'conversational', label: 'Conversational', description: 'Natural, flowing dialogue' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive, thorough explanations' },
  { value: 'creative', label: 'Creative', description: 'Imaginative and expressive responses' }
];

const emotionalTones = [
  'Cheerful', 'Supportive', 'Neutral', 'Encouraging', 'Witty', 'Calm', 
  'Enthusiastic', 'Professional', 'Playful', 'Empathetic'
];

const BotPersonalityConfig: React.FC<BotPersonalityConfigProps> = ({ onNotification, onSaveSuccess }) => {
  const [botName, setBotName] = useState('');
  const [personalityTraitValues, setPersonalityTraitValues] = useState<Record<string, number>>({});
  const [communicationStyle, setCommunicationStyle] = useState('conversational');
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [useEmojis, setUseEmojis] = useState(true);
  const [roleplayMode, setRoleplayMode] = useState(false);
  const [characterDescription, setCharacterDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const savedName = localStorage.getItem('botName') || 'Assistant';
      const savedTraits = JSON.parse(localStorage.getItem('personalityTraits') || '{}');
      const savedStyle = localStorage.getItem('communicationStyle') || 'conversational';
      const savedTones = JSON.parse(localStorage.getItem('selectedTones') || '["Cheerful", "Supportive"]');
      const savedEmojis = localStorage.getItem('useEmojis') !== 'false';
      const savedRoleplay = localStorage.getItem('roleplayMode') === 'true';
      const savedDescription = localStorage.getItem('characterDescription') || '';

      setBotName(savedName);
      setPersonalityTraitValues(savedTraits);
      setCommunicationStyle(savedStyle);
      setSelectedTones(savedTones);
      setUseEmojis(savedEmojis);
      setRoleplayMode(savedRoleplay);
      setCharacterDescription(savedDescription);

      // Initialize default trait values if not set
      const defaultTraits: Record<string, number> = {};
      personalityTraits.forEach(trait => {
        defaultTraits[trait.key] = savedTraits[trait.key] || 5;
      });
      setPersonalityTraitValues(defaultTraits);
    } catch (error) {
      onNotification('Failed to load personality configuration', 'error');
    }
  };

  const handleTraitChange = (traitKey: string, value: number) => {
    setPersonalityTraitValues(prev => ({
      ...prev,
      [traitKey]: value
    }));
  };

  const handleToneToggle = (tone: string) => {
    setSelectedTones(prev => 
      prev.includes(tone) 
        ? prev.filter(t => t !== tone)
        : [...prev, tone]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem('botName', botName);
      localStorage.setItem('personalityTraits', JSON.stringify(personalityTraitValues));
      localStorage.setItem('communicationStyle', communicationStyle);
      localStorage.setItem('selectedTones', JSON.stringify(selectedTones));
      localStorage.setItem('useEmojis', useEmojis.toString());
      localStorage.setItem('roleplayMode', roleplayMode.toString());
      localStorage.setItem('characterDescription', characterDescription);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onNotification('Bot personality configuration saved successfully!', 'success');
      onSaveSuccess?.();
    } catch (error) {
      onNotification('Failed to save personality configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalityDescription = () => {
    const traits = Object.entries(personalityTraitValues);
    const highTraits = traits.filter(([_, value]) => value >= 7).map(([key, _]) => key);
    const lowTraits = traits.filter(([_, value]) => value <= 3).map(([key, _]) => key);
    
    let description = `${botName} is a ${communicationStyle} bot`;
    
    if (highTraits.length > 0) {
      description += ` with high ${highTraits.join(', ')}`;
    }
    
    if (selectedTones.length > 0) {
      description += ` and a ${selectedTones.join(', ').toLowerCase()} tone`;
    }
    
    return description;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chat color="primary" />
        Bot Personality Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fine-tune your bot's personality traits and communication style
      </Typography>

      <Grid container spacing={3}>
        {/* Bot Identity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Bot Identity</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bot Name"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g., Assistant, Helper, Buddy"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Communication Style</InputLabel>
                  <Select
                    value={communicationStyle}
                    label="Communication Style"
                    onChange={(e) => setCommunicationStyle(e.target.value)}
                  >
                    {communicationStyles.map((style) => (
                      <MenuItem key={style.value} value={style.value}>
                        {style.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Personality Traits */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Personality Traits</Typography>
            <Grid container spacing={3}>
              {personalityTraits.map((trait) => (
                <Grid item xs={12} sm={6} key={trait.key}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {trait.name}: {personalityTraitValues[trait.key] || 5}
                    </Typography>
                    <Slider
                      value={personalityTraitValues[trait.key] || 5}
                      onChange={(_, value) => handleTraitChange(trait.key, value as number)}
                      min={trait.min}
                      max={trait.max}
                      marks
                      step={1}
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {trait.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Emotional Tones */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Emotional Tones</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the emotional tones you want your bot to express
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {emotionalTones.map((tone) => (
                <Chip
                  key={tone}
                  label={tone}
                  onClick={() => handleToneToggle(tone)}
                  color={selectedTones.includes(tone) ? 'primary' : 'default'}
                  variant={selectedTones.includes(tone) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Additional Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Additional Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useEmojis}
                      onChange={(e) => setUseEmojis(e.target.checked)}
                    />
                  }
                  label="Use Emojis in Responses"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={roleplayMode}
                      onChange={(e) => setRoleplayMode(e.target.checked)}
                    />
                  }
                  label="Enable Roleplay Mode"
                />
              </Grid>
            </Grid>
            {roleplayMode && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Character Description"
                value={characterDescription}
                onChange={(e) => setCharacterDescription(e.target.value)}
                placeholder="Describe the character your bot should roleplay as..."
                sx={{ mt: 2 }}
              />
            )}
          </Paper>
        </Grid>

        {/* Personality Preview */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology color="primary" />
                Personality Preview
              </Typography>
              <Typography variant="body1">
                {generatePersonalityDescription()}
              </Typography>
            </CardContent>
          </Card>
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
              disabled={loading || !botName.trim()}
            >
              {loading ? 'Saving...' : 'Save Personality'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BotPersonalityConfig;