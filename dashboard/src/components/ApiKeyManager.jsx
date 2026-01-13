/**
 * API Key Management Component
 * Allows users to generate, view, and manage blog API keys
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import blogApiKeyService from '../services/blogApiKeyService.js';
import { enhancedAuthService } from '../services/enhancedAuthService.js';

const ApiKeyManager = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: ['read'],
    domain: '',
    rateLimit: 1000,
    expiresIn: null
  });
  const [showApiKey, setShowApiKey] = useState({});
  const [generatedKey, setGeneratedKey] = useState(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const user = enhancedAuthService.getCurrentUser();
      const result = await blogApiKeyService.listApiKeys(user?.uid);
      setApiKeys(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to load API keys: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const user = enhancedAuthService.getCurrentUser();
      const keyOptions = {
        ...newKeyData,
        userId: user?.uid,
        expiresIn: newKeyData.expiresIn ? parseInt(newKeyData.expiresIn) * 24 * 60 * 60 * 1000 : null
      };

      const result = await blogApiKeyService.generateApiKey(keyOptions);
      setGeneratedKey(result.data);
      setCreateDialogOpen(false);
      setNewKeyData({
        name: '',
        permissions: ['read'],
        domain: '',
        rateLimit: 1000,
        expiresIn: null
      });
      await loadApiKeys();
      setSuccess('API key created successfully!');
    } catch (err) {
      setError('Failed to create API key: ' + err.message);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const user = enhancedAuthService.getCurrentUser();
      await blogApiKeyService.revokeApiKey(keyId, user?.uid);
      await loadApiKeys();
      setSuccess('API key revoked successfully!');
    } catch (err) {
      setError('Failed to revoke API key: ' + err.message);
    }
  };

  const handleCopyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    setSuccess('API key copied to clipboard!');
  };

  const toggleShowApiKey = (keyId) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString();
  };

  const getStatusColor = (isActive, expiresAt) => {
    if (!isActive) return 'error';
    if (expiresAt && new Date(expiresAt.seconds ? expiresAt.seconds * 1000 : expiresAt) < new Date()) {
      return 'warning';
    }
    return 'success';
  };

  const getStatusText = (isActive, expiresAt) => {
    if (!isActive) return 'Revoked';
    if (expiresAt && new Date(expiresAt.seconds ? expiresAt.seconds * 1000 : expiresAt) < new Date()) {
      return 'Expired';
    }
    return 'Active';
  };

  const createDefaultKey = async () => {
    try {
      const result = await blogApiKeyService.createDefaultWebsiteApiKey();
      setGeneratedKey(result.data);
      await loadApiKeys();
      setSuccess('Default website API key created!');
    } catch (err) {
      setError('Failed to create default API key: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading API keys...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          API Key Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={createDefaultKey}
            sx={{ mr: 1 }}
          >
            Create Default Key
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create API Key
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Integration Instructions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use these API endpoints to fetch blog content for your main website:
          </Typography>
          <Box component="pre" sx={{ 
            backgroundColor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
{`// Get all blog posts
GET /api/blog/posts?page=1&limit=10

// Get single blog post
GET /api/blog/posts/{id-or-slug}

// Get categories
GET /api/blog/categories

// Get tags
GET /api/blog/tags

// Headers required:
X-API-Key: your-api-key-here
X-Domain: your-domain.com (optional)`}
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>API Key</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Rate Limit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>{key.name}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                      {showApiKey[key.id] ? key.apiKeyPreview.replace('****', '••••••••') : key.apiKeyPreview}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleShowApiKey(key.id)}
                    >
                      {showApiKey[key.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  {key.permissions.map(perm => (
                    <Chip key={perm} label={perm} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>{key.domain || 'Any'}</TableCell>
                <TableCell>{key.rateLimit}/hour</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(key.isActive, key.expiresAt)}
                    color={getStatusColor(key.isActive, key.expiresAt)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(key.createdAt)}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {key.usage?.totalRequests || 0} total
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last: {formatDate(key.usage?.lastUsed)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleRevokeKey(key.id)}
                    disabled={!key.isActive}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {apiKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">
                    No API keys found. Create your first API key to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Key Name"
            value={newKeyData.name}
            onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
            margin="normal"
            placeholder="e.g., Main Website Blog Access"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Permissions</InputLabel>
            <Select
              multiple
              value={newKeyData.permissions}
              onChange={(e) => setNewKeyData({ ...newKeyData, permissions: e.target.value })}
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Allowed Domain (optional)"
            value={newKeyData.domain}
            onChange={(e) => setNewKeyData({ ...newKeyData, domain: e.target.value })}
            margin="normal"
            placeholder="e.g., devinquire.com"
            helperText="Leave empty to allow any domain"
          />

          <TextField
            fullWidth
            label="Rate Limit (requests per hour)"
            type="number"
            value={newKeyData.rateLimit}
            onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 1, max: 100000 }}
          />

          <TextField
            fullWidth
            label="Expires In (days)"
            type="number"
            value={newKeyData.expiresIn || ''}
            onChange={(e) => setNewKeyData({ ...newKeyData, expiresIn: e.target.value ? parseInt(e.target.value) : null })}
            margin="normal"
            helperText="Leave empty for no expiration"
            inputProps={{ min: 1, max: 3650 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateKey} variant="contained" disabled={!newKeyData.name}>
            Create Key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generated API Key Dialog */}
      <Dialog open={!!generatedKey} onClose={() => setGeneratedKey(null)} maxWidth="md" fullWidth>
        <DialogTitle>API Key Created Successfully</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> This is the only time you'll see the full API key. 
            Please copy it now and store it securely.
          </Alert>
          
          <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              API Key:
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography 
                variant="body1" 
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}
              >
                {generatedKey?.apiKey}
              </Typography>
              <IconButton onClick={() => handleCopyApiKey(generatedKey?.apiKey)}>
                <CopyIcon />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            <strong>Key ID:</strong> {generatedKey?.keyId}<br />
            <strong>Name:</strong> {generatedKey?.name}<br />
            <strong>Permissions:</strong> {generatedKey?.permissions?.join(', ')}<br />
            <strong>Domain:</strong> {generatedKey?.domain || 'Any'}<br />
            <strong>Rate Limit:</strong> {generatedKey?.rateLimit}/hour
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratedKey(null)} variant="contained">
            I've Saved the Key
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApiKeyManager;