import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Slider,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Save, Refresh, SmartToy, Cloud, Computer, CheckCircle, Error, Psychology, Settings, Visibility, VisibilityOff } from '@mui/icons-material';

interface AIProviderConfigProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  onSaveSuccess?: () => void;
}

const openAIModels = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Latest and most capable model' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Fast and powerful GPT-4 variant' },
  { value: 'gpt-4', label: 'GPT-4', description: 'Most capable GPT-4 model' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' }
];

const ollamaModels = [
  { value: 'llama2', label: 'Llama 2', description: 'General purpose model' },
  { value: 'llama2:13b', label: 'Llama 2 13B', description: 'Larger, more capable version' },
  { value: 'mistral', label: 'Mistral', description: 'Fast and efficient' },
  { value: 'codellama', label: 'Code Llama', description: 'Specialized for coding' },
  { value: 'neural-chat', label: 'Neural Chat', description: 'Optimized for conversations' }
];

const AIProviderConfig: React.FC<AIProviderConfigProps> = ({ onNotification, onSaveSuccess }) => {
  const [provider, setProvider] = useState<'openai' | 'ollama'>('openai');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama2');
  const [ollamaTemperature, setOllamaTemperature] = useState(0.7);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/config/ai-provider');
      if (response.ok) {
        const config = await response.json();
        setProvider(config.aiProvider || 'openai');
        setOpenaiApiKey(config.openaiApiKey || '');
        setOpenaiModel(config.openaiModel || 'gpt-4o');
        setOpenaiTemperature(config.openaiTemperature || 0.7);
        setOllamaBaseUrl(config.ollamaBaseUrl || 'http://localhost:11434');
        setOllamaModel(config.ollamaModel || 'llama2');
        setOllamaTemperature(config.ollamaTemperature || 0.7);
      } else {
        onNotification('Failed to load AI provider configuration', 'error');
      }
    } catch (error) {
      onNotification('Failed to load AI provider configuration', 'error');
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        const result = await response.json();
        setConnectionStatus('success');
        onNotification(result.message, 'success');
      } else {
        const errorData = await response.json();
        setConnectionStatus('error');
        onNotification(errorData.error || 'Connection test failed', 'error');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      onNotification(`Connection failed: ${error.message || error}`, 'error');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const configData = {
        aiProvider: provider,
        openaiApiKey: openaiApiKey.trim(),
        openaiModel,
        openaiTemperature,
        ollamaBaseUrl: ollamaBaseUrl.trim(),
        ollamaModel,
        ollamaTemperature
      };

      const response = await fetch('/api/config/ai-provider', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        onNotification('AI provider configuration saved successfully!', 'success');
        onSaveSuccess?.();
      } else {
        const errorData = await response.json();
        onNotification(`Failed to save configuration: ${errorData.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to save AI provider configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      default: return null;
    }
  };

  const handleToggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy color="primary" />
        AI Provider Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the AI model and provider for your Discord bot
      </Typography>

      <Grid container spacing={3}>
        {/* Provider Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>AI Provider</Typography>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={provider}
                label="Provider"
                onChange={(e) => setProvider(e.target.value as 'openai' | 'ollama')}
              >
                <MenuItem value="openai">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cloud />
                    OpenAI (Cloud)
                  </Box>
                </MenuItem>
                <MenuItem value="ollama">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Computer />
                    Ollama (Local)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* OpenAI Configuration */}
        {provider === 'openai' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cloud color="primary" />
                OpenAI Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type={showApiKey ? "text" : "password"}
                    label="OpenAI API Key"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    helperText="Your OpenAI API key from platform.openai.com"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle API key visibility"
                            onClick={handleToggleApiKeyVisibility}
                            edge="end"
                          >
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={openaiModel}
                      label="Model"
                      onChange={(e) => setOpenaiModel(e.target.value)}
                    >
                      {openAIModels.map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          <Box>
                            <Typography variant="body2">{model.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {model.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Temperature: {openaiTemperature}
                  </Typography>
                  <Slider
                    value={openaiTemperature}
                    onChange={(_, value) => setOpenaiTemperature(value as number)}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: 'Focused' },
                      { value: 1, label: 'Balanced' },
                      { value: 2, label: 'Creative' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Ollama Configuration */}
        {provider === 'ollama' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Computer color="primary" />
                Ollama Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ollama Base URL"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    helperText="URL where your Ollama instance is running"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={ollamaModel}
                      label="Model"
                      onChange={(e) => setOllamaModel(e.target.value)}
                    >
                      {ollamaModels.map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          <Box>
                            <Typography variant="body2">{model.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {model.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Temperature: {ollamaTemperature}
                  </Typography>
                  <Slider
                    value={ollamaTemperature}
                    onChange={(_, value) => setOllamaTemperature(value as number)}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: 'Focused' },
                      { value: 1, label: 'Balanced' },
                      { value: 2, label: 'Creative' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                Make sure Ollama is installed and the selected model is pulled. 
                Run: <code>ollama pull {ollamaModel}</code>
              </Alert>
            </Paper>
          </Grid>
        )}

        {/* Connection Test */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Connection Test</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
              >
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </Button>
              {getConnectionStatusIcon()}
            </Box>
            
            {connectionStatus === 'success' && (
              <Alert severity="success">
                Connection to {provider === 'openai' ? 'OpenAI' : 'Ollama'} successful!
              </Alert>
            )}
            
            {connectionStatus === 'error' && (
              <Alert severity="error">
                Failed to connect to {provider === 'openai' ? 'OpenAI' : 'Ollama'}. 
                Please check your configuration.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Model Information */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Configuration</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><SmartToy /></ListItemIcon>
                  <ListItemText 
                    primary="Provider" 
                    secondary={provider === 'openai' ? 'OpenAI (Cloud)' : 'Ollama (Local)'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Psychology /></ListItemIcon>
                  <ListItemText 
                    primary="Model" 
                    secondary={provider === 'openai' ? openaiModel : ollamaModel} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Settings /></ListItemIcon>
                  <ListItemText 
                    primary="Temperature" 
                    secondary={provider === 'openai' ? openaiTemperature : ollamaTemperature} 
                  />
                </ListItem>
              </List>
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
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIProviderConfig;