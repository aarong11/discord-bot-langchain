import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
  Link
} from '@mui/material';
import { SmartToy, Settings, Psychology, Chat, Security, PowerSettingsNew, Memory, Image, Tune, Favorite } from '@mui/icons-material';
import BotPersonalityConfig from './components/BotPersonalityConfig';
import ResponseConfig from './components/ResponseConfig';
import AIProviderConfig from './components/AIProviderConfig';
import SystemPromptConfig from './components/SystemPromptConfig';
import DiscordConfig from './components/DiscordConfig';
import BotControl from './components/BotControl';
import MemoryManagement from './components/MemoryManagement';
import ImageProcessingConfig from './components/ImageProcessingConfig';
import MemoryContextConfig from './components/MemoryContextConfig';
import RestartConfirmationDialog from './components/RestartConfirmationDialog';
import './App.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5865F2', // Discord purple
    },
    secondary: {
      main: '#57F287', // Discord green
    },
    background: {
      default: '#2F3136',
      paper: '#36393F',
    },
  },
});

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [restartDialog, setRestartDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const showRestartDialog = () => {
    setRestartDialog(true);
  };

  const handleRestartConfirm = async () => {
    setRestartDialog(false);
    try {
      const response = await fetch('/api/bot/restart', {
        method: 'POST',
      });
      
      if (response.ok) {
        showNotification('Bot restart initiated successfully', 'success');
      } else {
        const errorData = await response.json();
        showNotification(`Failed to restart bot: ${errorData.error}`, 'error');
      }
    } catch (error) {
      showNotification('Failed to restart bot', 'error');
    }
  };

  const handleRestartCancel = () => {
    setRestartDialog(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <SmartToy sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Discord Bot Configuration Panel
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Donation Banner */}
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#FF5722'
            }
          }}
          icon={<Favorite />}
        >
          <Typography variant="body2">
            ☕ <strong>Support this project!</strong> If you find this Discord bot useful, please consider supporting development at{' '}
            <Link 
              href="https://ko-fi.com/rng" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ color: '#FF5722', fontWeight: 'bold' }}
            >
              ko-fi.com/rng
            </Link>
            . Your support helps keep this project maintained and improved!
          </Typography>
        </Alert>

        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="bot configuration tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<Security />} label="Discord Setup" />
              <Tab icon={<PowerSettingsNew />} label="Bot Control" />
              <Tab icon={<Psychology />} label="System Prompt" />
              <Tab icon={<Chat />} label="Personality" />
              <Tab icon={<SmartToy />} label="AI Provider" />
              <Tab icon={<Settings />} label="Response Settings" />
              <Tab icon={<Image />} label="Image Processing" />
              <Tab icon={<Tune />} label="Memory Context" />
              <Tab icon={<Memory />} label="Memory Management" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <DiscordConfig onNotification={showNotification} onSaveSuccess={showRestartDialog} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <BotControl onNotification={showNotification} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <SystemPromptConfig onNotification={showNotification} onSaveSuccess={showRestartDialog} />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <BotPersonalityConfig onNotification={showNotification} onSaveSuccess={showRestartDialog} />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <AIProviderConfig onNotification={showNotification} onSaveSuccess={showRestartDialog} />
          </TabPanel>
          <TabPanel value={tabValue} index={5}>
            <ResponseConfig onNotification={showNotification} onSaveSuccess={showRestartDialog} />
          </TabPanel>
          <TabPanel value={tabValue} index={6}>
            <ImageProcessingConfig onNotification={showNotification} />
          </TabPanel>
          <TabPanel value={tabValue} index={7}>
            <MemoryContextConfig onNotification={showNotification} />
          </TabPanel>
          <TabPanel value={tabValue} index={8}>
            <MemoryManagement onNotification={showNotification} />
          </TabPanel>
        </Paper>
      </Container>

      <RestartConfirmationDialog
        open={restartDialog}
        onClose={handleRestartCancel}
        onConfirm={handleRestartConfirm}
        onCancel={handleRestartCancel}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
