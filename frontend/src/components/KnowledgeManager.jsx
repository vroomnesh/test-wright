/**
 * KnowledgeManager - Weaviate knowledge base management
 * Displays, deletes, renames, and manages uploaded documents and images
 */
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Folder,
  Image,
  Description,
  Delete,
  Edit,
  Refresh,
  ExpandMore,
  ExpandLess,
  Info,
  Storage,
} from '@mui/icons-material';
import { getUserKnowledge, deleteDocument, renameDocument, getDocumentDetails } from '../services/api';

// Standardized font family
const INTER_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

const BUTTON_STYLES = {
  fontFamily: INTER_FONT,
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
};

const ALERT_STYLES = {
  fontFamily: INTER_FONT,
  fontSize: '0.875rem',
  borderRadius: '8px',
};

const KnowledgeManager = ({ userId }) => {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [documentDetails, setDocumentDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    if (userId) {
      loadKnowledge();
    }
  }, [userId]);

  const loadKnowledge = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await getUserKnowledge(userId);
      if (result && result.files) {
        setKnowledge(result.files || []);
        setSuccess(`Loaded ${result.files.length} documents from knowledge base`);
      } else {
        setError('No files found in knowledge base');
        setKnowledge([]);
      }
    } catch (err) {
      console.error('Full knowledge loading error object:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError('Error loading knowledge: ' + (err.response?.data?.detail || err.message));
      setKnowledge([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = (doc) => {
    setDocumentToRename(doc);
    setNewDocumentName(doc.doc_id);
    setRenameDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const result = await deleteDocument(userId, documentToDelete.doc_id);
      if (result.success) {
        setSuccess(`Document "${documentToDelete.doc_id}" deleted successfully`);
        // Remove from local state
        setKnowledge(prev => prev.filter(doc => doc.doc_id !== documentToDelete.doc_id));
        // Clean up expanded state and details
        setExpandedDocs(prev => {
          const newState = { ...prev };
          delete newState[documentToDelete.doc_id];
          return newState;
        });
        setDocumentDetails(prev => {
          const newState = { ...prev };
          delete newState[documentToDelete.doc_id];
          return newState;
        });
      } else {
        setError(result.error || 'Failed to delete document');
      }
    } catch (err) {
      setError('Error deleting document: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleRenameConfirm = async () => {
    if (!documentToRename || !newDocumentName.trim()) return;

    setRenaming(true);
    setError('');
    setSuccess('');

    try {
      const result = await renameDocument(userId, documentToRename.doc_id, newDocumentName.trim());

      if (result.success) {
        setSuccess(result.message);
        await loadKnowledge(); // Refresh the list
      } else {
        setError(result.error || 'Failed to rename document');
      }
    } catch (err) {
      setError('Error renaming document: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRenaming(false);
      setRenameDialogOpen(false);
      setDocumentToRename(null);
      setNewDocumentName('');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setDocumentToRename(null);
    setNewDocumentName('');
  };

  const toggleDocumentExpansion = async (docId) => {
    const isExpanded = expandedDocs[docId];
    
    if (!isExpanded) {
      // Load document details if not already loaded
      if (!documentDetails[docId] && !loadingDetails[docId]) {
        setLoadingDetails(prev => ({ ...prev, [docId]: true }));
        try {
          const result = await getDocumentDetails(userId, docId);
          if (result.success) {
            setDocumentDetails(prev => ({ ...prev, [docId]: result }));
          }
        } catch (err) {
          console.error('Error loading document details:', err);
        } finally {
          setLoadingDetails(prev => ({ ...prev, [docId]: false }));
        }
      }
    }

    setExpandedDocs(prev => ({ ...prev, [docId]: !isExpanded }));
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <Image color="primary" />;
      case 'document':
        return <Description color="secondary" />;
      default:
        return <Folder color="action" />;
    }
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'image':
        return 'primary';
      case 'document':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatFileSize = (length) => {
    if (length < 1024) return `${length} chars`;
    if (length < 1024 * 1024) return `${(length / 1024).toFixed(1)}K chars`;
    return `${(length / (1024 * 1024)).toFixed(1)}M chars`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: INTER_FONT,
            fontWeight: 600,
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Storage color="primary" />
          Knowledge Manager
        </Typography>
        <Button
          variant="outlined"
          onClick={loadKnowledge}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
          sx={BUTTON_STYLES}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, ...ALERT_STYLES }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2, ...ALERT_STYLES }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : knowledge.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ fontFamily: INTER_FONT }}
          >
            No documents or images found in your knowledge base.
            <br />
            Upload and index some documents or images to get started.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {knowledge.map((doc) => (
            <Card key={doc.doc_id} variant="outlined" sx={{ borderRadius: '8px', width: '100%' }}>
                <CardContent sx={{ pb: '16px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      {getFileIcon(doc.file_type)}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: INTER_FONT,
                          fontWeight: 500,
                          fontSize: '1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={doc.doc_id}
                      >
                        {doc.doc_id}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={doc.file_type}
                        size="small"
                        color={getFileTypeColor(doc.file_type)}
                        sx={{ fontFamily: INTER_FONT, fontSize: '0.75rem' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => toggleDocumentExpansion(doc.doc_id)}
                        disabled={loadingDetails[doc.doc_id]}
                      >
                        {loadingDetails[doc.doc_id] ? (
                          <CircularProgress size={16} />
                        ) : expandedDocs[doc.doc_id] ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleRenameClick(doc)}
                        title="Rename document"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(doc)}
                        title="Delete document"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: INTER_FONT, fontSize: '0.875rem' }}
                    >
                      <strong>Chunks:</strong> {doc.chunk_count}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: INTER_FONT, fontSize: '0.875rem' }}
                    >
                      <strong>Size:</strong> {formatFileSize(doc.total_text_length)}
                    </Typography>
                  </Box>

                  <Collapse in={expandedDocs[doc.doc_id]}>
                    {documentDetails[doc.doc_id] && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontFamily: INTER_FONT, fontWeight: 600, mb: 1 }}
                        >
                          Document Chunks:
                        </Typography>
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                          {documentDetails[doc.doc_id].chunks?.map((chunk, index) => (
                            <React.Fragment key={index}>
                              <ListItem sx={{ px: 0 }}>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body2"
                                      sx={{ fontFamily: INTER_FONT, fontSize: '0.75rem', fontWeight: 500 }}
                                    >
                                      Chunk {chunk.index + 1} ({formatFileSize(chunk.length)})
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: INTER_FONT,
                                        fontSize: '0.75rem',
                                        color: 'text.secondary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                      }}
                                    >
                                      {chunk.text}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                              {index < documentDetails[doc.doc_id].chunks.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: INTER_FONT }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: INTER_FONT }}>
            Are you sure you want to delete "{documentToDelete?.doc_id}"?
            <br />
            This will remove all {documentToDelete?.chunk_count} chunks from the knowledge base.
            <br />
            <strong>This action cannot be undone.</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleting}
            sx={BUTTON_STYLES}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
            sx={BUTTON_STYLES}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Document Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={handleRenameCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: INTER_FONT }}>
          Rename Document
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: INTER_FONT, mb: 2 }}>
            Enter a new name for "{documentToRename?.doc_id}":
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Document Name"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
            disabled={renaming}
            sx={{ fontFamily: INTER_FONT }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newDocumentName.trim()) {
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleRenameCancel}
            disabled={renaming}
            sx={BUTTON_STYLES}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRenameConfirm}
            color="primary"
            variant="contained"
            disabled={renaming || !newDocumentName.trim()}
            startIcon={renaming ? <CircularProgress size={16} /> : <Edit />}
            sx={BUTTON_STYLES}
          >
            {renaming ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default KnowledgeManager;
