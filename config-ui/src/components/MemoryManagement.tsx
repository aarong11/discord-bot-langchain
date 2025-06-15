import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Memory, 
  Search, 
  Add, 
  Delete, 
  Refresh, 
  Analytics,
  Person,
  Clear,
  Download,
  Group
} from '@mui/icons-material';

interface MemoryManagementProps {
  onNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface UserFact {
  id: number;
  userId: string;
  userName: string;
  factType: string;
  factValue: string;
  reportedBy: string;
  reportedByName: string;
  channelId: string;
  guildId: string;
  timestamp: string;
  confidence: number;
}

interface MemoryEntry {
  id: number;
  content: string;
  speakerId: string;
  speakerName: string;
  channelId: string;
  guildId: string;
  timestamp: string;
  type: 'fact' | 'preference' | 'conversation';
  importance: number;
  subjectUserId?: string;
  subjectUserName?: string;
}

interface MemoryStats {
  totalMemories: number;
  totalFacts: number;
  memoryTypes: Record<string, number>;
  factTypes: Record<string, number>;
  topActiveUsers: Array<{ userId: string; userName: string; count: number }>;
}

const MemoryManagement: React.FC<MemoryManagementProps> = ({ onNotification }) => {
  const [tabValue, setTabValue] = useState(0);
  const [facts, setFacts] = useState<UserFact[]>([]);
  const [allFacts, setAllFacts] = useState<UserFact[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [allMemories, setAllMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [factTypeFilter, setFactTypeFilter] = useState('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState('');
  const [memoryUserFilter, setMemoryUserFilter] = useState('');
  const [memoryChannelFilter, setMemoryChannelFilter] = useState('');
  
  // Pagination
  const [factsPage, setFactsPage] = useState(0);
  const [factsRowsPerPage, setFactsRowsPerPage] = useState(10);
  const [allFactsPage, setAllFactsPage] = useState(0);
  const [allFactsRowsPerPage, setAllFactsRowsPerPage] = useState(10);
  const [allFactsTotal, setAllFactsTotal] = useState(0);
  const [memoriesPage, setMemoriesPage] = useState(0);
  const [memoriesRowsPerPage, setMemoriesRowsPerPage] = useState(10);
  const [allMemoriesPage, setAllMemoriesPage] = useState(0);
  const [allMemoriesRowsPerPage, setAllMemoriesRowsPerPage] = useState(25);
  const [allMemoriesTotal, setAllMemoriesTotal] = useState(0);
  
  // Dialog states
  const [addFactDialogOpen, setAddFactDialogOpen] = useState(false);
  const [clearUserDialogOpen, setClearUserDialogOpen] = useState(false);
  const [selectedUserToClear, setSelectedUserToClear] = useState('');
  
  // New fact form
  const [newFact, setNewFact] = useState({
    userId: '',
    userName: '',
    factType: '',
    factValue: '',
    guildId: '',
    confidence: 5
  });

  const factTypes = [
    'name', 'job', 'location', 'hobby', 'preference', 'skill', 'interest', 'goal', 'experience', 'other'
  ];

  const memoryTypes = ['conversation', 'fact', 'preference'];

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tabValue === 3) { // All Facts tab
      loadAllFacts();
    }
  }, [tabValue, allFactsPage, allFactsRowsPerPage, selectedGuildId, factTypeFilter]);

  useEffect(() => {
    if (tabValue === 4) { // All Memories tab
      loadAllMemories();
    }
  }, [tabValue, allMemoriesPage, allMemoriesRowsPerPage, selectedGuildId, memoryTypeFilter, memoryUserFilter, memoryChannelFilter]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/memory/stats${selectedGuildId ? `?guildId=${selectedGuildId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        onNotification('Failed to load memory statistics', 'error');
      }
    } catch (error) {
      onNotification('Failed to load memory statistics', 'error');
    }
  };

  const loadFacts = async () => {
    if (!selectedUserId) {
      onNotification('Please enter a User ID to load facts', 'warning');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: selectedUserId,
        page: (factsPage + 1).toString(),
        limit: factsRowsPerPage.toString()
      });
      
      if (selectedGuildId) params.append('guildId', selectedGuildId);
      if (factTypeFilter) params.append('factType', factTypeFilter);

      const response = await fetch(`/api/memory/facts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFacts(data.facts);
      } else {
        const error = await response.json();
        onNotification(`Failed to load facts: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to load facts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllFacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (allFactsPage + 1).toString(),
        limit: allFactsRowsPerPage.toString()
      });
      
      if (selectedGuildId) params.append('guildId', selectedGuildId);
      if (factTypeFilter) params.append('factType', factTypeFilter);

      const response = await fetch(`/api/memory/facts/all?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAllFacts(data.facts);
        setAllFactsTotal(data.total || data.facts.length);
      } else {
        const error = await response.json();
        onNotification(`Failed to load facts: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to load facts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllMemories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (allMemoriesPage + 1).toString(),
        limit: allMemoriesRowsPerPage.toString()
      });
      
      if (selectedGuildId) params.append('guildId', selectedGuildId);
      if (memoryTypeFilter) params.append('type', memoryTypeFilter);
      if (memoryUserFilter) params.append('userId', memoryUserFilter);
      if (memoryChannelFilter) params.append('channelId', memoryChannelFilter);

      const response = await fetch(`/api/memory/memories/all?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAllMemories(data.memories);
        setAllMemoriesTotal(data.total || data.memories.length);
      } else {
        const error = await response.json();
        onNotification(`Failed to load memories: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to load memories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      onNotification('Please enter a search query', 'warning');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        limit: memoriesRowsPerPage.toString()
      });
      
      if (selectedGuildId) params.append('guildId', selectedGuildId);

      const response = await fetch(`/api/memory/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories);
      } else {
        const error = await response.json();
        onNotification(`Failed to search memories: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to search memories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addFact = async () => {
    if (!newFact.userId || !newFact.userName || !newFact.factType || !newFact.factValue) {
      onNotification('Please fill in all required fields', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/memory/facts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newFact,
          guildId: newFact.guildId || 'default'
        }),
      });

      if (response.ok) {
        onNotification('Fact added successfully!', 'success');
        setAddFactDialogOpen(false);
        setNewFact({
          userId: '',
          userName: '',
          factType: '',
          factValue: '',
          guildId: '',
          confidence: 5
        });
        loadFacts();
        loadStats();
      } else {
        const error = await response.json();
        onNotification(`Failed to add fact: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to add fact', 'error');
    }
  };

  const deleteFact = async (factId: number) => {
    try {
      const response = await fetch(`/api/memory/facts/${factId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onNotification('Fact deleted successfully!', 'success');
        loadAllFacts();
        loadStats();
      } else {
        const error = await response.json();
        onNotification(`Failed to delete fact: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to delete fact', 'error');
    }
  };

  const deleteMemory = async (memoryId: number) => {
    try {
      const response = await fetch(`/api/memory/memories/${memoryId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onNotification('Memory deleted successfully!', 'success');
        loadAllMemories();
        loadStats();
      } else {
        const error = await response.json();
        onNotification(`Failed to delete memory: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to delete memory', 'error');
    }
  };

  const clearUserData = async () => {
    if (!selectedUserToClear) return;

    try {
      const params = selectedGuildId ? `?guildId=${selectedGuildId}` : '';
      const response = await fetch(`/api/memory/users/${selectedUserToClear}${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        onNotification(result.message, 'success');
        setClearUserDialogOpen(false);
        setSelectedUserToClear('');
        loadFacts();
        loadStats();
      } else {
        const error = await response.json();
        onNotification(`Failed to clear user data: ${error.error}`, 'error');
      }
    } catch (error) {
      onNotification('Failed to clear user data', 'error');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'success';
    if (confidence >= 6) return 'primary';
    if (confidence >= 4) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Memory color="primary" />
        Memory Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View, search, and manage bot memories and user facts
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Statistics" icon={<Analytics />} />
          <Tab label="User Facts" icon={<Person />} />
          <Tab label="Search Memories" icon={<Search />} />
          <Tab label="All Facts" icon={<Group />} />
          <Tab label="All Memories" icon={<Memory />} />
        </Tabs>
      </Box>

      {/* Statistics Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <TextField
              label="Guild ID (optional)"
              value={selectedGuildId}
              onChange={(e) => setSelectedGuildId(e.target.value)}
              placeholder="Leave empty for all guilds"
              size="small"
              sx={{ width: 250 }}
            />
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadStats}>
              Refresh Stats
            </Button>
          </Box>

          {stats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Overview</Typography>
                    <Typography variant="body1">Total Memories: {stats.totalMemories}</Typography>
                    <Typography variant="body1">Total Facts: {stats.totalFacts}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Memory Types</Typography>
                    {Object.entries(stats.memoryTypes).map(([type, count]) => (
                      <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{type}:</Typography>
                        <Typography variant="body2">{count}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {Object.keys(stats.factTypes).length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Fact Types</Typography>
                      {Object.entries(stats.factTypes).map(([type, count]) => (
                        <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">{type}:</Typography>
                          <Typography variant="body2">{count}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {stats.topActiveUsers.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Most Active Users</Typography>
                      {stats.topActiveUsers.map((user) => (
                        <Box key={user.userId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{user.userName}:</Typography>
                          <Typography variant="body2">{user.count} messages</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      )}

      {/* User Facts Tab */}
      {tabValue === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="Discord User ID"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Guild ID (optional)"
                  value={selectedGuildId}
                  onChange={(e) => setSelectedGuildId(e.target.value)}
                  placeholder="Discord Guild ID"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fact Type</InputLabel>
                  <Select
                    value={factTypeFilter}
                    label="Fact Type"
                    onChange={(e) => setFactTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {factTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" startIcon={<Search />} onClick={loadFacts} disabled={loading}>
                    Load Facts
                  </Button>
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setAddFactDialogOpen(true)}>
                    Add Fact
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<Clear />} 
                    onClick={() => {
                      setSelectedUserToClear(selectedUserId);
                      setClearUserDialogOpen(true);
                    }}
                    disabled={!selectedUserId}
                  >
                    Clear User
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Fact Type</TableCell>
                  <TableCell>Fact Value</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {facts.slice(factsPage * factsRowsPerPage, factsPage * factsRowsPerPage + factsRowsPerPage).map((fact) => (
                  <TableRow key={fact.id}>
                    <TableCell>{fact.userName}</TableCell>
                    <TableCell>
                      <Chip label={fact.factType} size="small" />
                    </TableCell>
                    <TableCell>{fact.factValue}</TableCell>
                    <TableCell>
                      <Chip 
                        label={fact.confidence} 
                        size="small" 
                        color={getConfidenceColor(fact.confidence)}
                      />
                    </TableCell>
                    <TableCell>{fact.reportedByName}</TableCell>
                    <TableCell>{formatTimestamp(fact.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={facts.length}
              rowsPerPage={factsRowsPerPage}
              page={factsPage}
              onPageChange={(e, newPage) => setFactsPage(newPage)}
              onRowsPerPageChange={(e) => setFactsRowsPerPage(parseInt(e.target.value, 10))}
            />
          </TableContainer>
        </Box>
      )}

      {/* Search Memories Tab */}
      {tabValue === 2 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Search Query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memories..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Guild ID (optional)"
                  value={selectedGuildId}
                  onChange={(e) => setSelectedGuildId(e.target.value)}
                  placeholder="Discord Guild ID"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button 
                  variant="contained" 
                  startIcon={<Search />} 
                  onClick={searchMemories} 
                  disabled={loading}
                  fullWidth
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Speaker</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Importance</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memories.slice(memoriesPage * memoriesRowsPerPage, memoriesPage * memoriesRowsPerPage + memoriesRowsPerPage).map((memory) => (
                  <TableRow key={memory.id}>
                    <TableCell>{memory.speakerName}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>
                        {memory.content.length > 100 
                          ? `${memory.content.substring(0, 100)}...` 
                          : memory.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={memory.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={memory.importance} 
                        size="small" 
                        color={getConfidenceColor(memory.importance)}
                      />
                    </TableCell>
                    <TableCell>{formatTimestamp(memory.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={memories.length}
              rowsPerPage={memoriesRowsPerPage}
              page={memoriesPage}
              onPageChange={(e, newPage) => setMemoriesPage(newPage)}
              onRowsPerPageChange={(e) => setMemoriesRowsPerPage(parseInt(e.target.value, 10))}
            />
          </TableContainer>
        </Box>
      )}

      {/* All Facts Tab */}
      {tabValue === 3 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Guild ID (optional)"
                  value={selectedGuildId}
                  onChange={(e) => setSelectedGuildId(e.target.value)}
                  placeholder="Discord Guild ID"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fact Type</InputLabel>
                  <Select
                    value={factTypeFilter}
                    label="Fact Type"
                    onChange={(e) => setFactTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {factTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button variant="contained" startIcon={<Refresh />} onClick={loadAllFacts} disabled={loading}>
                  Refresh
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button variant="outlined" startIcon={<Add />} onClick={() => setAddFactDialogOpen(true)}>
                  Add Fact
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Fact Type</TableCell>
                  <TableCell>Fact Value</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allFacts.map((fact) => (
                  <TableRow key={fact.id}>
                    <TableCell>{fact.userName}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {fact.userId}
                    </TableCell>
                    <TableCell>
                      <Chip label={fact.factType} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>
                        {fact.factValue.length > 50 
                          ? `${fact.factValue.substring(0, 50)}...` 
                          : fact.factValue}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={fact.confidence} 
                        size="small" 
                        color={getConfidenceColor(fact.confidence)}
                      />
                    </TableCell>
                    <TableCell>{fact.reportedByName}</TableCell>
                    <TableCell>{formatTimestamp(fact.timestamp)}</TableCell>
                    <TableCell>
                      <Tooltip title="Delete fact">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this fact?')) {
                              deleteFact(fact.id);
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={allFactsTotal}
              rowsPerPage={allFactsRowsPerPage}
              page={allFactsPage}
              onPageChange={(e, newPage) => setAllFactsPage(newPage)}
              onRowsPerPageChange={(e) => {
                setAllFactsRowsPerPage(parseInt(e.target.value, 10));
                setAllFactsPage(0);
              }}
            />
          </TableContainer>
        </Box>
      )}

      {/* All Memories Tab */}
      {tabValue === 4 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Guild ID"
                  value={selectedGuildId}
                  onChange={(e) => setSelectedGuildId(e.target.value)}
                  placeholder="Discord Guild ID"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={memoryUserFilter}
                  onChange={(e) => setMemoryUserFilter(e.target.value)}
                  placeholder="Filter by User ID"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Channel ID"
                  value={memoryChannelFilter}
                  onChange={(e) => setMemoryChannelFilter(e.target.value)}
                  placeholder="Filter by Channel"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Memory Type</InputLabel>
                  <Select
                    value={memoryTypeFilter}
                    label="Memory Type"
                    onChange={(e) => setMemoryTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {memoryTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button 
                  variant="contained" 
                  startIcon={<Refresh />} 
                  onClick={loadAllMemories} 
                  disabled={loading}
                  fullWidth
                >
                  Refresh
                </Button>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={() => {
                    setMemoryUserFilter('');
                    setMemoryChannelFilter('');
                    setMemoryTypeFilter('');
                    setSelectedGuildId('');
                  }}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Alert severity="info" sx={{ mb: 2 }}>
            Showing {allMemories.length} of {allMemoriesTotal.toLocaleString()} total memories. 
            Use filters to narrow down results.
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Speaker</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Importance</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allMemories.map((memory) => (
                  <TableRow key={memory.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {memory.id}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {memory.speakerName}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {memory.speakerId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Tooltip title={memory.content} placement="top">
                        <Typography variant="body2" noWrap>
                          {memory.content.length > 100 
                            ? `${memory.content.substring(0, 100)}...` 
                            : memory.content}
                        </Typography>
                      </Tooltip>
                      {memory.subjectUserId && memory.subjectUserId !== memory.speakerId && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          About: {memory.subjectUserName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={memory.type} 
                        size="small" 
                        color={memory.type === 'conversation' ? 'default' : 
                               memory.type === 'fact' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={memory.importance} 
                        size="small" 
                        color={getConfidenceColor(memory.importance)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {memory.channelId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimestamp(memory.timestamp.toString())}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete memory">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
                              deleteMemory(memory.id);
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={allMemoriesTotal}
              rowsPerPage={allMemoriesRowsPerPage}
              page={allMemoriesPage}
              onPageChange={(e, newPage) => setAllMemoriesPage(newPage)}
              onRowsPerPageChange={(e) => {
                setAllMemoriesRowsPerPage(parseInt(e.target.value, 10));
                setAllMemoriesPage(0);
              }}
            />
          </TableContainer>
        </Box>
      )}

      {/* Add Fact Dialog */}
      <Dialog open={addFactDialogOpen} onClose={() => setAddFactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Fact</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="User ID"
                value={newFact.userId}
                onChange={(e) => setNewFact({ ...newFact, userId: e.target.value })}
                placeholder="Discord User ID"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="User Name"
                value={newFact.userName}
                onChange={(e) => setNewFact({ ...newFact, userName: e.target.value })}
                placeholder="Display name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Fact Type</InputLabel>
                <Select
                  value={newFact.factType}
                  label="Fact Type"
                  onChange={(e) => setNewFact({ ...newFact, factType: e.target.value })}
                >
                  {factTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guild ID"
                value={newFact.guildId}
                onChange={(e) => setNewFact({ ...newFact, guildId: e.target.value })}
                placeholder="Discord Guild ID (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fact Value"
                value={newFact.factValue}
                onChange={(e) => setNewFact({ ...newFact, factValue: e.target.value })}
                placeholder="The actual fact or information"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Confidence: {newFact.confidence}
              </Typography>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 1, max: 10 }}
                value={newFact.confidence}
                onChange={(e) => setNewFact({ ...newFact, confidence: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFactDialogOpen(false)}>Cancel</Button>
          <Button onClick={addFact} variant="contained">Add Fact</Button>
        </DialogActions>
      </Dialog>

      {/* Clear User Dialog */}
      <Dialog open={clearUserDialogOpen} onClose={() => setClearUserDialogOpen(false)}>
        <DialogTitle>Clear User Data</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will permanently delete all memories and facts for user {selectedUserToClear}.
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to clear all data for this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={clearUserData} color="error" variant="contained">
            Clear Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemoryManagement;