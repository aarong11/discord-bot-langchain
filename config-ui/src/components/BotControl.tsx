import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  PlayArrow, 
  Stop, 
  RestartAlt, 
  PowerSettingsNew, 
  CheckCircle, 
  Error, 
  Pending, 
  Refresh,
  AccessTime,
  Info
} from '@mui/icons-material';

interface BotControlProps {
  onNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

interface BotStatus {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  connected: boolean;
  uptime: number;
  timestamp: string;
}

const BotControl: React.FC<BotControlProps> = ({ onNotification }) => {
  const [botStatus, setBotStatus] = useState<BotStatus>({
    status: 'stopped',
    connected: false,
    uptime: 0,
    timestamp: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchBotStatus();
    
    // Auto-refresh status every 5 seconds if enabled
    const interval = autoRefresh ? setInterval(fetchBotStatus, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status');
      if (response.ok) {
        const status = await response.json();
        setBotStatus(status);
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  const handleStartBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        onNotification(result.message, 'success');
        await fetchBotStatus();
      } else {
        onNotification(result.error || 'Failed to start bot', 'error');
      }
    } catch (error) {
      onNotification('Failed to start bot', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        onNotification(result.message, 'success');
        await fetchBotStatus();
      } else {
        onNotification(result.error || 'Failed to stop bot', 'error');
      }
    } catch (error) {
      onNotification('Failed to stop bot', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        onNotification(result.message, 'success');
        await fetchBotStatus();
      } else {
        onNotification(result.error || 'Failed to restart bot', 'error');
      }
    } catch (error) {
      onNotification('Failed to restart bot', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'starting': return 'info';
      case 'stopping': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle color="success" />;
      case 'starting': case 'stopping': return <Pending color="info" />;
      case 'error': return <Error color="error" />;
      default: return <PowerSettingsNew color="disabled" />;
    }
  };

  const formatUptime = (uptime: number) => {
    if (uptime === 0) return 'Not running';
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const isActionDisabled = (action: string) => {
    if (loading) return true;
    
    switch (action) {
      case 'start':
        return botStatus.status === 'running' || botStatus.status === 'starting';
      case 'stop':
        return botStatus.status === 'stopped' || botStatus.status === 'stopping';
      case 'restart':
        return botStatus.status === 'starting' || botStatus.status === 'stopping';
      default:
        return false;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PowerSettingsNew color="primary" />
        Bot Control Panel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Start, stop, and restart your Discord bot from the web interface
      </Typography>

      <Grid container spacing={3}>
        {/* Current Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(botStatus.status)}
                Bot Status
                <Tooltip title="Toggle auto-refresh">
                  <IconButton 
                    size="small" 
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    color={autoRefresh ? 'primary' : 'default'}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon><PowerSettingsNew /></ListItemIcon>
                  <ListItemText 
                    primary="Status" 
                    secondary={
                      <Chip 
                        label={botStatus.status.charAt(0).toUpperCase() + botStatus.status.slice(1)} 
                        color={getStatusColor(botStatus.status) as any}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><CheckCircle /></ListItemIcon>
                  <ListItemText 
                    primary="Discord Connection" 
                    secondary={botStatus.connected ? 'Connected' : 'Not connected'} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><AccessTime /></ListItemIcon>
                  <ListItemText 
                    primary="Uptime" 
                    secondary={formatUptime(botStatus.uptime)} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><Info /></ListItemIcon>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={new Date(botStatus.timestamp).toLocaleString()} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Control Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Bot Actions</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={loading && botStatus.status === 'starting' ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleStartBot}
                  disabled={isActionDisabled('start')}
                  size="large"
                >
                  Start Bot
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={loading && botStatus.status === 'stopping' ? <CircularProgress size={20} /> : <Stop />}
                  onClick={handleStopBot}
                  disabled={isActionDisabled('stop')}
                  size="large"
                >
                  Stop Bot
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  startIcon={loading ? <CircularProgress size={20} /> : <RestartAlt />}
                  onClick={handleRestartBot}
                  disabled={isActionDisabled('restart')}
                  size="large"
                >
                  Restart Bot
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Status Information */}
        <Grid item xs={12}>
          {botStatus.status === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Bot encountered an error. Check the configuration and try restarting.
            </Alert>
          )}
          
          {botStatus.status === 'stopped' && !loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Bot is currently stopped. Make sure your Discord configuration is complete before starting.
            </Alert>
          )}
          
          {botStatus.status === 'running' && botStatus.connected && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Bot is running and connected to Discord successfully!
            </Alert>
          )}

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Usage Notes</Typography>
            <Typography variant="body2" component="div">
              • <strong>Start Bot:</strong> Initializes the Discord bot with current configuration<br/>
              • <strong>Stop Bot:</strong> Safely disconnects the bot from Discord<br/>
              • <strong>Restart Bot:</strong> Stops and starts the bot (useful after configuration changes)<br/>
              • Auto-refresh is enabled by default to show real-time status updates<br/>
              • Ensure Discord token and Client ID are configured before starting
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BotControl;