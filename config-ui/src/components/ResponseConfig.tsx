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
  Chip,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { Save, Refresh, Settings, Group, Tag, Notifications, Info } from '@mui/icons-material';

interface ResponseConfigProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  onSaveSuccess?: () => void;
}

const responseModes = [
  { value: 'everyone', label: 'Everyone', description: 'Bot responds to all messages in allowed channels' },
  { value: 'mention_only', label: 'Mention Only', description: 'Bot only responds when directly mentioned' },
  { value: 'roles', label: 'Specific Roles', description: 'Bot responds to users with specific roles' },
  { value: 'channels', label: 'Specific Channels', description: 'Bot responds only in specific channels' },
  { value: 'mixed', label: 'Mixed Mode', description: 'Bot responds to users with allowed roles OR in allowed channels' }
];

const ResponseConfig: React.FC<ResponseConfigProps> = ({ onNotification, onSaveSuccess }) => {
  const [responseMode, setResponseMode] = useState('mention_only');
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);
  const [respondToMentions, setRespondToMentions] = useState(true);
  const [newRole, setNewRole] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const savedMode = localStorage.getItem('responseMode') || 'mention_only';
      const savedRoles = JSON.parse(localStorage.getItem('allowedRoles') || '[]');
      const savedChannels = JSON.parse(localStorage.getItem('allowedChannels') || '[]');
      const savedMentions = localStorage.getItem('respondToMentions') !== 'false';

      setResponseMode(savedMode);
      setAllowedRoles(savedRoles);
      setAllowedChannels(savedChannels);
      setRespondToMentions(savedMentions);
    } catch (error) {
      onNotification('Failed to load response configuration', 'error');
    }
  };

  const handleAddRole = () => {
    if (newRole.trim() && !allowedRoles.includes(newRole.trim())) {
      setAllowedRoles([...allowedRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setAllowedRoles(allowedRoles.filter(role => role !== roleToRemove));
  };

  const handleAddChannel = () => {
    if (newChannel.trim() && !allowedChannels.includes(newChannel.trim())) {
      setAllowedChannels([...allowedChannels, newChannel.trim()]);
      setNewChannel('');
    }
  };

  const handleRemoveChannel = (channelToRemove: string) => {
    setAllowedChannels(allowedChannels.filter(channel => channel !== channelToRemove));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem('responseMode', responseMode);
      localStorage.setItem('allowedRoles', JSON.stringify(allowedRoles));
      localStorage.setItem('allowedChannels', JSON.stringify(allowedChannels));
      localStorage.setItem('respondToMentions', respondToMentions.toString());

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onNotification('Response configuration saved successfully!', 'success');
      onSaveSuccess?.();
    } catch (error) {
      onNotification('Failed to save response configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getResponseModeDescription = () => {
    const mode = responseModes.find(m => m.value === responseMode);
    return mode?.description || '';
  };

  const shouldShowRoleConfig = () => {
    return responseMode === 'roles' || responseMode === 'mixed';
  };

  const shouldShowChannelConfig = () => {
    return responseMode === 'channels' || responseMode === 'mixed';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings color="primary" />
        Response Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure when and where your bot should respond to messages
      </Typography>

      <Grid container spacing={3}>
        {/* Response Mode */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Response Mode</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={responseMode}
                label="Mode"
                onChange={(e) => setResponseMode(e.target.value)}
              >
                {responseModes.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mb: 2 }}>
              {getResponseModeDescription()}
            </Alert>
            
            <FormControlLabel
              control={
                <Switch
                  checked={respondToMentions}
                  onChange={(e) => setRespondToMentions(e.target.checked)}
                />
              }
              label="Always respond to direct mentions (regardless of other settings)"
            />
          </Paper>
        </Grid>

        {/* Role Configuration */}
        {shouldShowRoleConfig() && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group color="primary" />
                Allowed Roles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add role names or IDs that are allowed to interact with the bot
              </Typography>
              
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Role Name or ID"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g., Admin, Moderator, or 123456789012345678"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    onClick={handleAddRole}
                    disabled={!newRole.trim()}
                    fullWidth
                  >
                    Add Role
                  </Button>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allowedRoles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    onDelete={() => handleRemoveRole(role)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {allowedRoles.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No roles configured. Bot will respond based on other settings.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Channel Configuration */}
        {shouldShowChannelConfig() && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tag color="primary" />
                Allowed Channels
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add channel names or IDs where the bot should respond
              </Typography>
              
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Channel Name or ID"
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    placeholder="e.g., general, bot-commands, or 987654321098765432"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    onClick={handleAddChannel}
                    disabled={!newChannel.trim()}
                    fullWidth
                  >
                    Add Channel
                  </Button>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allowedChannels.map((channel) => (
                  <Chip
                    key={channel}
                    label={channel}
                    onDelete={() => handleRemoveChannel(channel)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
                {allowedChannels.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No channels configured. Bot will respond based on other settings.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Configuration Summary */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                Current Configuration Summary
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Settings /></ListItemIcon>
                  <ListItemText 
                    primary="Response Mode" 
                    secondary={responseModes.find(m => m.value === responseMode)?.label} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Notifications /></ListItemIcon>
                  <ListItemText 
                    primary="Respond to Mentions" 
                    secondary={respondToMentions ? 'Yes' : 'No'} 
                  />
                </ListItem>
                {shouldShowRoleConfig() && (
                  <ListItem>
                    <ListItemIcon><Group /></ListItemIcon>
                    <ListItemText 
                      primary="Allowed Roles" 
                      secondary={allowedRoles.length > 0 ? allowedRoles.join(', ') : 'None configured'} 
                    />
                  </ListItem>
                )}
                {shouldShowChannelConfig() && (
                  <ListItem>
                    <ListItemIcon><Tag /></ListItemIcon>
                    <ListItemText 
                      primary="Allowed Channels" 
                      secondary={allowedChannels.length > 0 ? allowedChannels.join(', ') : 'None configured'} 
                    />
                  </ListItem>
                )}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>Important Notes:</Typography>
                <Typography variant="body2" component="div">
                  • Bot always responds to direct messages regardless of settings<br/>
                  • Use role/channel names or their Discord IDs<br/>
                  • Mixed mode responds if user has allowed role OR is in allowed channel<br/>
                  • Mention setting overrides other restrictions when enabled
                </Typography>
              </Alert>
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

export default ResponseConfig;