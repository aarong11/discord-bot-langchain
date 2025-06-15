import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Slider,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  Image as ImageIcon, 
  Visibility, 
  Settings, 
  Science,
  Info
} from '@mui/icons-material';

interface ImageProcessingConfigProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface ImageConfig {
  enableImageProcessing: boolean;
  maxImageSize: number;
  imageResponseMode: 'auto' | 'manual' | 'disabled';
  autoDescribeImages: boolean;
  openaiVisionModel: string;
  ollamaVisionModel: string;
}

const ImageProcessingConfig: React.FC<ImageProcessingConfigProps> = ({ onNotification }) => {
  const [config, setConfig] = useState<ImageConfig>({
    enableImageProcessing: false,
    maxImageSize: 10,
    imageResponseMode: 'auto',
    autoDescribeImages: true,
    openaiVisionModel: 'gpt-4-vision-preview',
    ollamaVisionModel: 'llava'
  });

  const [loading, setLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/image-processing');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        onNotification('Failed to load image processing configuration', 'error');
      }
    } catch (error) {
      onNotification('Failed to load image processing configuration', 'error');
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config/image-processing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        onNotification('Image processing configuration saved successfully!', 'success');
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

  const testImageProcessing = async () => {
    if (!testImageUrl.trim()) {
      onNotification('Please enter an image URL for testing', 'warning');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-image-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: testImageUrl,
          testMessage: testMessage || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(data.result);
        onNotification('Image processing test completed!', 'success');
      } else {
        onNotification(`Test failed: ${data.error}${data.details ? ` - ${data.details}` : ''}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to test image processing', 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const openaiVisionModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-vision-preview',
    'gpt-4-turbo'
  ];

  const ollamaVisionModels = [
    'llava',
    'llava:13b',
    'llava:34b',
    'bakllava',
    'moondream'
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ImageIcon color="primary" />
        Image Processing Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how the bot processes and responds to images shared in Discord
      </Typography>

      <Grid container spacing={3}>
        {/* Main Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings />
              Basic Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={config.enableImageProcessing}
                  onChange={(e) => setConfig({ ...config, enableImageProcessing: e.target.checked })}
                  color="primary"
                />
              }
              label="Enable Image Processing"
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Maximum Image Size (MB)</Typography>
                <Slider
                  value={config.maxImageSize}
                  onChange={(e, value) => setConfig({ ...config, maxImageSize: value as number })}
                  min={1}
                  max={25}
                  step={1}
                  marks={[
                    { value: 1, label: '1MB' },
                    { value: 10, label: '10MB' },
                    { value: 25, label: '25MB' }
                  ]}
                  valueLabelDisplay="on"
                  disabled={!config.enableImageProcessing}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!config.enableImageProcessing}>
                  <InputLabel>Response Mode</InputLabel>
                  <Select
                    value={config.imageResponseMode}
                    label="Response Mode"
                    onChange={(e) => setConfig({ ...config, imageResponseMode: e.target.value as any })}
                  >
                    <MenuItem value="auto">Auto - Respond to all images</MenuItem>
                    <MenuItem value="manual">Manual - Only when asked</MenuItem>
                    <MenuItem value="disabled">Disabled - Don't analyze images</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoDescribeImages}
                      onChange={(e) => setConfig({ ...config, autoDescribeImages: e.target.checked })}
                      disabled={!config.enableImageProcessing || config.imageResponseMode === 'disabled'}
                    />
                  }
                  label="Auto-describe images when no message is provided"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>Vision Models</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!config.enableImageProcessing}>
                  <InputLabel>OpenAI Vision Model</InputLabel>
                  <Select
                    value={config.openaiVisionModel}
                    label="OpenAI Vision Model"
                    onChange={(e) => setConfig({ ...config, openaiVisionModel: e.target.value })}
                  >
                    {openaiVisionModels.map((model) => (
                      <MenuItem key={model} value={model}>{model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!config.enableImageProcessing}>
                  <InputLabel>Ollama Vision Model</InputLabel>
                  <Select
                    value={config.ollamaVisionModel}
                    label="Ollama Vision Model"
                    onChange={(e) => setConfig({ ...config, ollamaVisionModel: e.target.value })}
                  >
                    {ollamaVisionModels.map((model) => (
                      <MenuItem key={model} value={model}>{model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={saveConfig}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setTestDialogOpen(true)}
                startIcon={<Science />}
                disabled={!config.enableImageProcessing}
              >
                Test Image Processing
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                How It Works
              </Typography>
              
              <Typography variant="body2" paragraph>
                When users share images in Discord, the bot can analyze them and provide descriptions or answer questions about the content.
              </Typography>

              <Typography variant="body2" paragraph>
                <strong>Response Modes:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                <li><strong>Auto:</strong> Bot responds to all supported images</li>
                <li><strong>Manual:</strong> Bot only analyzes when specifically asked</li>
                <li><strong>Disabled:</strong> No image analysis performed</li>
              </ul>

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Supported Formats:</strong> JPEG, PNG, GIF, WebP
              </Typography>

              <Alert severity="info" sx={{ mt: 2 }}>
                Vision models require significant computational resources. OpenAI models are generally faster but require API credits.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Dialog */}
      <Dialog 
        open={testDialogOpen} 
        onClose={() => setTestDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Test Image Processing</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter an image URL to test the vision capabilities of your configured model.
          </Typography>
          
          <TextField
            fullWidth
            label="Image URL"
            value={testImageUrl}
            onChange={(e) => setTestImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Test Message (Optional)"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="What do you see in this image?"
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          {testResult && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Analysis Result:</Typography>
              <Typography variant="body2" paragraph>
                {testResult.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confidence: {(testResult.confidence * 100).toFixed(1)}%
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          <Button 
            onClick={testImageProcessing}
            variant="contained"
            disabled={testLoading || !testImageUrl.trim()}
            startIcon={testLoading ? <CircularProgress size={20} /> : <Visibility />}
          >
            {testLoading ? 'Analyzing...' : 'Test Image'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageProcessingConfig;