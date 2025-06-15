import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Memory as MemoryIcon, 
  Settings, 
  Info,
  Psychology
} from '@mui/icons-material';

interface MemoryContextConfigProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface MemoryContextConfig {
  contextMessageCount: number;
  maxUserFacts: number;
  maxUserPreferences: number;
  includeFactsForMentionedUsers: boolean;
  maxMentionedUserFacts: number;
  memoryDecayEnabled: boolean;
  memoryDecayFactor: number;
  memoryDecayThreshold: number;
  memoryDecayMaxDays: number;
}

const MemoryContextConfig: React.FC<MemoryContextConfigProps> = ({ onNotification }) => {
  const [config, setConfig] = useState<MemoryContextConfig>({
    contextMessageCount: 100,
    maxUserFacts: 15,
    maxUserPreferences: 10,
    includeFactsForMentionedUsers: true,
    maxMentionedUserFacts: 5,
    memoryDecayEnabled: false,
    memoryDecayFactor: 0.5,
    memoryDecayThreshold: 0.1,
    memoryDecayMaxDays: 30
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/memory-context');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        onNotification('Failed to load memory context configuration', 'error');
      }
    } catch (error) {
      onNotification('Failed to load memory context configuration', 'error');
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config/memory-context', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        onNotification('Memory context configuration saved successfully!', 'success');
      } else {
        const error = await response.json();
        onNotification(`Failed to save configuration: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to save configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (field: keyof MemoryContextConfig, value: number) => {
    setConfig({ ...config, [field]: value });
  };

  const getTokenEstimate = () => {
    // Rough estimation: each message ~50 tokens, each fact ~15 tokens
    let messageTokens = config.contextMessageCount * 50;
    let factTokens = config.maxUserFacts * 15;
    let preferenceTokens = config.maxUserPreferences * 15;
    let mentionedTokens = config.includeFactsForMentionedUsers ? config.maxMentionedUserFacts * 15 * 3 : 0;
    
    // If decay is enabled, estimate reduction in token usage
    if (config.memoryDecayEnabled) {
      const decayMultiplier = Math.exp(-config.memoryDecayFactor * 7); // Assume average 7 days old
      messageTokens *= (0.3 + 0.7 * decayMultiplier); // Some messages will be filtered out
      factTokens *= (0.5 + 0.5 * decayMultiplier); // Some facts will be filtered out
      preferenceTokens *= (0.5 + 0.5 * decayMultiplier);
      mentionedTokens *= (0.5 + 0.5 * decayMultiplier);
    }
    
    return Math.round(messageTokens + factTokens + preferenceTokens + mentionedTokens);
  };

  const getWarningLevel = () => {
    const estimate = getTokenEstimate();
    if (estimate > 8000) return 'high';
    if (estimate > 4000) return 'medium';
    return 'low';
  };

  const getWarningMessage = () => {
    const level = getWarningLevel();
    switch (level) {
      case 'high':
        return 'Very high token usage - may exceed model limits and increase costs significantly';
      case 'medium':
        return 'Moderate token usage - monitor costs and response quality';
      default:
        return 'Low token usage - good balance of context and efficiency';
    }
  };

  const getWarningColor = () => {
    const level = getWarningLevel();
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        Memory Context Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how much conversation history and user information is sent to the AI model for context
      </Typography>

      <Grid container spacing={3}>
        {/* Main Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings />
              Context Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Context Message Count: {config.contextMessageCount} messages
                </Typography>
                <Slider
                  value={config.contextMessageCount}
                  onChange={(e, value) => handleSliderChange('contextMessageCount', value as number)}
                  min={10}
                  max={500}
                  step={10}
                  marks={[
                    { value: 10, label: '10' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                    { value: 200, label: '200' },
                    { value: 500, label: '500' }
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  Number of recent conversation messages to include as context
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>
                  Max User Facts: {config.maxUserFacts}
                </Typography>
                <Slider
                  value={config.maxUserFacts}
                  onChange={(e, value) => handleSliderChange('maxUserFacts', value as number)}
                  min={0}
                  max={50}
                  step={1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' }
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  Maximum facts about the current user to include
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>
                  Max User Preferences: {config.maxUserPreferences}
                </Typography>
                <Slider
                  value={config.maxUserPreferences}
                  onChange={(e, value) => handleSliderChange('maxUserPreferences', value as number)}
                  min={0}
                  max={25}
                  step={1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 5, label: '5' },
                    { value: 15, label: '15' },
                    { value: 25, label: '25' }
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  Maximum user preferences to include
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.includeFactsForMentionedUsers}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        includeFactsForMentionedUsers: e.target.checked 
                      })}
                      color="primary"
                    />
                  }
                  label="Include facts for mentioned users"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  When users mention others (@username), include facts about those mentioned users
                </Typography>
              </Grid>

              {config.includeFactsForMentionedUsers && (
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>
                    Max Facts per Mentioned User: {config.maxMentionedUserFacts}
                  </Typography>
                  <Slider
                    value={config.maxMentionedUserFacts}
                    onChange={(e, value) => handleSliderChange('maxMentionedUserFacts', value as number)}
                    min={1}
                    max={15}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' },
                      { value: 15, label: '15' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum facts to include for each mentioned user
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Token Usage Estimate */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Token Usage Estimate</Typography>
              <Alert severity={getWarningColor() as any} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Estimated tokens per request: ~{getTokenEstimate().toLocaleString()}</strong>
                </Typography>
                <Typography variant="body2">
                  {getWarningMessage()}
                </Typography>
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                This is a rough estimate. Actual token usage may vary based on message length and complexity.
                Higher token usage means more context but also higher API costs and slower responses.
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Memory Decay Settings */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Memory Decay (Stickiness)</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.memoryDecayEnabled}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      memoryDecayEnabled: e.target.checked 
                    })}
                    color="primary"
                  />
                }
                label="Enable memory decay"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                When enabled, older memories become less relevant over time and may be filtered out
              </Typography>

              {config.memoryDecayEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>
                      Decay Factor: {config.memoryDecayFactor.toFixed(2)}
                    </Typography>
                    <Slider
                      value={config.memoryDecayFactor}
                      onChange={(e, value) => handleSliderChange('memoryDecayFactor', value as number)}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      marks={[
                        { value: 0.1, label: '0.1 (slow)' },
                        { value: 0.5, label: '0.5' },
                        { value: 1.0, label: '1.0 (fast)' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary">
                      How quickly memories lose relevance (higher = faster decay)
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>
                      Relevance Threshold: {config.memoryDecayThreshold.toFixed(2)}
                    </Typography>
                    <Slider
                      value={config.memoryDecayThreshold}
                      onChange={(e, value) => handleSliderChange('memoryDecayThreshold', value as number)}
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      marks={[
                        { value: 0.01, label: '0.01' },
                        { value: 0.1, label: '0.1' },
                        { value: 0.5, label: '0.5' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Minimum relevance score to include a memory
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      Max Age: {config.memoryDecayMaxDays} days
                    </Typography>
                    <Slider
                      value={config.memoryDecayMaxDays}
                      onChange={(e, value) => handleSliderChange('memoryDecayMaxDays', value as number)}
                      min={1}
                      max={365}
                      step={1}
                      marks={[
                        { value: 7, label: '1 week' },
                        { value: 30, label: '1 month' },
                        { value: 90, label: '3 months' },
                        { value: 365, label: '1 year' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Memories older than this will never be included (regardless of relevance)
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>How decay works:</strong> Memory relevance = base_importance × e^(-decay_factor × days_old)
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        With current settings, a memory with importance 8/10 will have relevance {(0.8 * Math.exp(-config.memoryDecayFactor * 7)).toFixed(2)} after 7 days
                        and {(0.8 * Math.exp(-config.memoryDecayFactor * 30)).toFixed(2)} after 30 days.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Button
              variant="contained"
              onClick={saveConfig}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                How Context Works
              </Typography>
              
              <Typography variant="body2" paragraph>
                The bot uses conversation history and user facts to provide more personalized and contextually aware responses.
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>Context includes:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                <li>Recent conversation messages</li>
                <li>Facts about the current user</li>
                <li>User preferences and interests</li>
                <li>Facts about mentioned users (if enabled)</li>
              </ul>

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Performance Impact:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                <li><strong>More context:</strong> Better responses, higher costs</li>
                <li><strong>Less context:</strong> Faster responses, lower costs</li>
                <li><strong>Optimal range:</strong> 50-200 messages for most use cases</li>
              </ul>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Very high context counts may cause timeouts or exceed model token limits (typically 4K-8K tokens).
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MemoryIcon color="primary" />
                Memory Features
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>User Facts:</strong> Persistent information about users (name, job, location, hobbies)
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Preferences:</strong> Things users like, dislike, or prefer
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Mentioned Users:</strong> When someone mentions another user, their facts are included for better context
              </Typography>
              
              <Typography variant="body2">
                All facts are automatically extracted from conversations and stored securely in the local database.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemoryContextConfig;