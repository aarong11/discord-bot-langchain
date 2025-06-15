import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Save, Refresh, Security, Key, Info, Launch, Visibility, VisibilityOff } from '@mui/icons-material';

interface DiscordConfigProps {
  onNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  onSaveSuccess?: () => void;
}

const DiscordConfig: React.FC<DiscordConfigProps> = ({ onNotification, onSaveSuccess }) => {
  const [discordToken, setDiscordToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [guildId, setGuildId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/config/discord');
      if (response.ok) {
        const config = await response.json();
        setDiscordToken(config.discordToken || '');
        setClientId(config.clientId);
        setGuildId(config.guildId);
      } else {
        onNotification('Failed to load Discord configuration', 'error');
      }
    } catch (error) {
      onNotification('Failed to load Discord configuration', 'error');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const configData = {
        discordToken: discordToken.trim(),
        clientId: clientId.trim(),
        guildId: guildId.trim()
      };

      const response = await fetch('/api/config/discord', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        onNotification('Discord configuration saved successfully!', 'success');
        onSaveSuccess?.();
      } else {
        const errorData = await response.json();
        onNotification(`Failed to save configuration: ${errorData.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to save Discord configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isConfigComplete = () => {
    return discordToken.trim() !== '' && clientId.trim() !== '';
  };

  const handleToggleTokenVisibility = () => {
    setShowToken(!showToken);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        Discord Bot Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your Discord bot credentials and settings
      </Typography>

      <Grid container spacing={3}>
        {/* Setup Instructions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="primary" />
              Setup Instructions
            </Typography>
            <Typography variant="body2" paragraph>
              To set up your Discord bot, you'll need to create a Discord application and bot. Follow these steps:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>1.</span></ListItemIcon>
                <ListItemText 
                  primary={
                    <span>
                      Go to the{' '}
                      <Link href="https://discord.com/developers/applications" target="_blank" rel="noopener">
                        Discord Developer Portal <Launch fontSize="small" />
                      </Link>
                    </span>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>2.</span></ListItemIcon>
                <ListItemText primary="Click 'New Application' and give your bot a name" />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>3.</span></ListItemIcon>
                <ListItemText primary="In the 'General Information' tab, copy the 'Application ID' (this is your Client ID)" />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>4.</span></ListItemIcon>
                <ListItemText primary="Go to the 'Bot' tab and click 'Add Bot'" />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>5.</span></ListItemIcon>
                <ListItemText primary="Under 'Token', click 'Reset Token' and copy the bot token" />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>6.</span></ListItemIcon>
                <ListItemText primary="Enable 'Message Content Intent' under 'Privileged Gateway Intents'" />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>7.</span></ListItemIcon>
                <ListItemText primary="Go to 'OAuth2' > 'URL Generator', select 'bot' and 'applications.commands' scopes" />
              </ListItem>
              <ListItem>
                <ListItemIcon><span style={{ fontSize: '14px' }}>8.</span></ListItemIcon>
                <ListItemText primary="Select required bot permissions and use the generated URL to invite the bot to your server" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Configuration Form */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Key color="primary" />
              Bot Credentials
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showToken ? "text" : "password"}
                  label="Discord Bot Token"
                  value={discordToken}
                  onChange={(e) => setDiscordToken(e.target.value)}
                  placeholder="Enter your Discord bot token"
                  helperText="The secret token for your Discord bot (starts with 'MTE...' or similar)"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle token visibility"
                          onClick={handleToggleTokenVisibility}
                          edge="end"
                        >
                          {showToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client ID (Application ID)"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Discord application ID"
                  helperText="The Application ID from the Discord Developer Portal"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guild ID (Server ID)"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  placeholder="Enter your Discord server ID (optional)"
                  helperText="Optional: For faster command registration in development"
                />
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Guild ID:</strong> This is optional but recommended for development. 
                It allows faster slash command registration (instant vs up to 1 hour globally). 
                Right-click your Discord server and select "Copy Server ID" to get this value.
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* Configuration Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    {discordToken.trim() ? 
                      <span style={{ color: 'green' }}>✅</span> : 
                      <span style={{ color: 'red' }}>❌</span>
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="Discord Bot Token" 
                    secondary={discordToken.trim() ? 'Configured' : 'Not configured'} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    {clientId.trim() ? 
                      <span style={{ color: 'green' }}>✅</span> : 
                      <span style={{ color: 'red' }}>❌</span>
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="Client ID" 
                    secondary={clientId.trim() ? 'Configured' : 'Not configured'} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    {guildId.trim() ? 
                      <span style={{ color: 'green' }}>✅</span> : 
                      <span style={{ color: 'orange' }}>⚠️</span>
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="Guild ID (Optional)" 
                    secondary={guildId.trim() ? 'Configured' : 'Not configured (will use global commands)'} 
                  />
                </ListItem>
              </List>
              
              {isConfigComplete() && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Bot configuration is complete! You can now start the bot.
                </Alert>
              )}
              
              {!isConfigComplete() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please configure at least the Discord Bot Token and Client ID to use the bot.
                </Alert>
              )}
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
              disabled={loading || !discordToken.trim() || !clientId.trim()}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiscordConfig;