/**
 * DocumentPreprocessor - Document and image upload component
 * Handles PDF/DOCX/image processing and indexing into Weaviate
 */
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { CloudUpload, Storage, Image } from '@mui/icons-material';
import { uploadDocument, indexDocument, uploadImage, indexImage } from '../services/api';
import KnowledgeManager from './KnowledgeManager';

// Standardized font family
const INTER_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

// Standardized input styling
const INPUT_STYLES = {
  '& .MuiInputBase-root': {
    fontFamily: INTER_FONT,
    fontSize: '1rem',
    backgroundColor: 'white'
  },
  '& .MuiInputBase-root:hover': {
    backgroundColor: 'white'
  },
  '& .MuiInputBase-root.Mui-focused': {
    backgroundColor: 'white'
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white'
  },
  '& .MuiOutlinedInput-root:hover': {
    backgroundColor: 'white'
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    backgroundColor: 'white'
  },
  '& .MuiInputLabel-root': {
    fontFamily: INTER_FONT
  }
};

// Standardized button styling
const BUTTON_STYLES = {
  fontFamily: INTER_FONT,
  fontSize: '0.875rem',
  fontWeight: 500,
  textTransform: 'none'
};

// Standardized alert styling
const ALERT_STYLES = {
  fontFamily: INTER_FONT,
  fontSize: '0.875rem'
};

const DocumentPreprocessor = ({ userId }) => {
  // Document upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUploadResult, setImageUploadResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageIndexing, setImageIndexing] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileType = file.name.toLowerCase();
      if (fileType.endsWith('.pdf') || fileType.endsWith('.docx')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a PDF or DOCX file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await uploadDocument(selectedFile, userId);
      setUploadResult(result);
      if (result.success) {
        setSuccess('Document processed successfully!');
      } else {
        setError(result.message || 'Failed to process document');
      }
    } catch (err) {
      setError('Error uploading document: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleIndex = async () => {
    if (!uploadResult?.doc_id || !userId) {
      setError('Please upload and process a document first');
      return;
    }

    setIndexing(true);
    setError('');
    setSuccess('');

    try {
      const result = await indexDocument(uploadResult.doc_id, userId);
      if (result.success) {
        setSuccess('Document indexed successfully!');
        setUploadResult(null); // Clear upload result after successful indexing
      } else {
        setError(result.message || 'Failed to index document');
      }
    } catch (err) {
      console.error('Full indexing error object:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError('Error indexing document: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIndexing(false);
    }
  };

  // Image handling functions
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileType = file.name.toLowerCase();
      if (fileType.endsWith('.jpg') || fileType.endsWith('.jpeg') ||
          fileType.endsWith('.png') || fileType.endsWith('.gif') ||
          fileType.endsWith('.bmp') || fileType.endsWith('.webp')) {
        setSelectedImage(file);
        setImageError('');
      } else {
        setImageError('Please select an image file (JPG, PNG, GIF, BMP, WebP)');
        setSelectedImage(null);
      }
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !userId) {
      setImageError('Please select an image file');
      return;
    }

    setImageLoading(true);
    setImageError('');
    setImageSuccess('');

    try {
      const result = await uploadImage(selectedImage, userId);
      setImageUploadResult(result);
      if (result.success) {
        setImageSuccess('Image analyzed successfully!');
      } else {
        setImageError(result.message || 'Failed to analyze image');
      }
    } catch (err) {
      setImageError('Error uploading image: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageIndex = async () => {
    if (!imageUploadResult || !imageUploadResult.doc_id) {
      setImageError('No processed image to index');
      return;
    }

    setImageIndexing(true);
    setImageError('');
    setImageSuccess('');

    try {
      const result = await indexImage(imageUploadResult.doc_id, userId);
      if (result.success) {
        setImageSuccess('Image analysis indexed to Weaviate successfully!');
        setImageUploadResult(null); // Clear the upload result after successful indexing
      } else {
        setImageError(result.message || 'Failed to index image analysis');
      }
    } catch (err) {
      setImageError('Error indexing image analysis: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImageIndexing(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: INTER_FONT,
          fontWeight: 600,
          fontSize: '2rem',
          color: '#2c3e50'
        }}
      >
        Knowledge Management
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
        sx={{
          fontFamily: INTER_FONT,
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}
      >
        Upload PDF/DOCX documents or images (database diagrams, charts, technical documentation) to preprocess and index them for test case generation.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: INTER_FONT,
            fontWeight: 600,
            fontSize: '1.25rem'
          }}
        >
          Document Upload
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <input
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mr: 2, ...BUTTON_STYLES }}
            >
              Choose File
            </Button>
          </label>
          {selectedFile && (
            <Typography
              variant="body2"
              component="span"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem'
              }}
            >
              Selected: {selectedFile.name}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || !userId || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
          sx={BUTTON_STYLES}
        >
          {loading ? 'Processing...' : 'Upload & Process Document'}
        </Button>
      </Paper>

      {uploadResult && uploadResult.success && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontFamily: INTER_FONT,
                fontWeight: 600,
                fontSize: '1.25rem'
              }}
            >
              Processing Results
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              <strong>Document ID:</strong> {uploadResult.doc_id}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              <strong>Text Length:</strong> {uploadResult.text_length.toLocaleString()} characters
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              <strong>Chunks Generated:</strong> {uploadResult.chunk_count}
            </Typography>
            {uploadResult.page_count && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: INTER_FONT,
                  fontSize: '0.875rem',
                  mb: 1
                }}
              >
                <strong>Pages Processed:</strong> {uploadResult.page_count}
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Button
              variant="contained"
              color="secondary"
              onClick={handleIndex}
              disabled={indexing}
              startIcon={indexing ? <CircularProgress size={20} /> : <Storage />}
              sx={BUTTON_STYLES}
            >
              {indexing ? 'Indexing...' : 'Index to Weaviate'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Image Upload Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: INTER_FONT,
            fontWeight: 600,
            fontSize: '1.25rem'
          }}
        >
          Image Upload
        </Typography>

        <Box sx={{ mb: 2 }}>
          <input
            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleImageSelect}
          />
          <label htmlFor="image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<Image />}
              sx={{ mr: 2, ...BUTTON_STYLES }}
            >
              Choose Image
            </Button>
          </label>
          {selectedImage && (
            <Typography
              variant="body2"
              component="span"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem'
              }}
            >
              Selected: {selectedImage.name}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleImageUpload}
          disabled={!selectedImage || !userId || imageLoading}
          startIcon={imageLoading ? <CircularProgress size={20} /> : <CloudUpload />}
          sx={BUTTON_STYLES}
        >
          {imageLoading ? 'Analyzing...' : 'Upload & Analyze Image'}
        </Button>
      </Paper>

      {imageUploadResult && imageUploadResult.success && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontFamily: INTER_FONT,
                fontWeight: 600,
                fontSize: '1.25rem'
              }}
            >
              Image Analysis Complete
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              <strong>Analysis Length:</strong> {imageUploadResult.text_length.toLocaleString()} characters
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: INTER_FONT,
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              <strong>Chunks Generated:</strong> {imageUploadResult.chunk_count}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="secondary"
              onClick={handleImageIndex}
              disabled={imageIndexing}
              startIcon={imageIndexing ? <CircularProgress size={20} /> : <Storage />}
              sx={BUTTON_STYLES}
            >
              {imageIndexing ? 'Indexing...' : 'Index to Weaviate'}
            </Button>
          </CardContent>
        </Card>
      )}

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

      {imageError && (
        <Alert severity="error" sx={{ mb: 2, ...ALERT_STYLES }}>
          {imageError}
        </Alert>
      )}

      {imageSuccess && (
        <Alert severity="success" sx={{ mb: 2, ...ALERT_STYLES }}>
          {imageSuccess}
        </Alert>
      )}

      {/* Knowledge Manager Component */}
      <KnowledgeManager userId={userId} />
    </Box>
  );
};

export default DocumentPreprocessor;
