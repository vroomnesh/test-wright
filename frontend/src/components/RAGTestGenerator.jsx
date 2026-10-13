// ============================================================================
// RAG TEST GENERATOR COMPONENT
// ============================================================================
// Advanced test case generation with two modes:
//
// RAG Mode (Retrieval Augmented Generation):
// - Uses uploaded documents as context for test generation
// - Searches Weaviate for relevant content based on user query
// - Generates contextually relevant test cases (20-50 per request)
//
// Non-RAG Mode:
// - Uses only GPT-4's training knowledge
// - Useful when no relevant documents are available
// - Generates general test cases based on query alone
//
// Features:
// - Toggle between test cases and user stories
// - Real-time preview before Excel download
// - Customizable number of test cases
// - Excel export with proper formatting
// ============================================================================

import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Psychology, Download, FileDownload, Preview } from '@mui/icons-material';
import MarkdownRenderer from './MarkdownRenderer';
import { generateRAGTestCases, downloadRAGExcel, previewRAGTestCases, downloadBlob } from '../services/api';

// Standardized font family
const INTER_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

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

const RAGTestGenerator = ({ userId }) => {
  const [query, setQuery] = useState('');
  const topK = 5; // Fixed at 5 chunks
  const [testCases, setTestCases] = useState('');
  const [userStories, setUserStories] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUserStories, setLoadingUserStories] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Preview states
  const [previewData, setPreviewData] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  // RAG toggle state
  const [useRag, setUseRag] = useState(true);

  const handleGenerateUserStories = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    if (!userId) {
      setError('Unable to generate test cases right now.');
      return;
    }

    console.log('RAG Generate User Stories - Query:', query.trim(), 'UserId:', userId, 'TopK:', topK, 'UseRAG:', useRag);
    setLoadingUserStories(true);
    setError('');
    setSuccess('');
    setUserStories('');

    try {
      const result = await generateRAGTestCases(query.trim(), userId, topK, 'Business', useRag, true); // Pass true for isUserStories
      if (result.success) {
        setUserStories(result.test_cases);
        if (useRag) {
          setSuccess(`Generated user stories using ${result.chunks_retrieved} retrieved chunks`);
        } else {
          setSuccess('Generated user stories without RAG context');
        }
      } else {
        setError(result.test_cases || 'Failed to generate user stories');
      }
    } catch (err) {
      console.error('RAG Generate User Stories Error:', err);
      setError('Error generating user stories: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingUserStories(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    if (!userId) {
      setError('Unable to generate test cases right now.');
      return;
    }
    if (!previewData) {
      setError('Please generate test cases preview first before downloading Excel');
      return;
    }

    // Prepare the query - if user stories exist, combine them with the original query
    let finalQuery = query.trim();
    if (userStories.trim()) {
      finalQuery = `${query.trim()}\n\nAdditional Context - User Stories:\n${userStories.trim()}`;
    }

    console.log('RAG Download Excel - Query:', finalQuery, 'UserId:', userId, 'TopK:', topK, 'UseRAG:', useRag);
    setDownloading(true);
    setError('');

    try {
      const blob = await downloadRAGExcel(finalQuery, userId, topK, 'Business', useRag, previewData);
      const filename = useRag ? 'rag_test_cases.xlsx' : 'test_cases.xlsx';
      downloadBlob(blob, filename);
      setSuccess(`Excel file downloaded successfully! Contains ${previewData.length} test cases from preview.`);
    } catch (err) {
      console.error('RAG Download Excel Error:', err);
      setError('Error downloading Excel: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewTestCases = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    if (!userId) {
      setError('Unable to generate test cases right now.');
      return;
    }

    // Prepare the query - if user stories exist, combine them with the original query
    let finalQuery = query.trim();
    if (userStories.trim()) {
      finalQuery = `${query.trim()}\n\nAdditional Context - User Stories:\n${userStories.trim()}`;
    }

    console.log('RAG Preview - Query:', finalQuery, 'UserId:', userId, 'TopK:', topK, 'UseRAG:', useRag);
    setPreviewing(true);
    setError('');

    try {
      const result = await previewRAGTestCases(finalQuery, userId, topK, 'Business', useRag);
      if (result.success) {
        setPreviewData(result.preview_data);
        let contextMessage = '';
        if (useRag && userStories.trim()) {
          contextMessage = 'with RAG context and user stories';
        } else if (useRag) {
          contextMessage = 'with RAG context';
        } else if (userStories.trim()) {
          contextMessage = 'with user stories context';
        } else {
          contextMessage = 'without RAG context';
        }
        setSuccess(`Preview generated for ${result.total_test_cases} test cases ${contextMessage}`);
      } else {
        setError('Failed to generate preview');
      }
    } catch (err) {
      console.error('RAG Preview Error:', err);
      setError('Error generating preview: ' + (err.response?.data?.detail || err.message));
    } finally {
      setPreviewing(false);
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
        Test Case Generator
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
        Generate test cases using Retrieval-Augmented Generation from your indexed documents.
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
          Test Case Request
        </Typography>

        <TextField
          fullWidth
          label="Enter your test-case request or question"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          margin="normal"
          multiline
          rows={3}
          placeholder="e.g., Generate test cases for user authentication functionality"
          required
          sx={{
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
          }}
        />
      </Paper>

      {/* RAG Toggle Section */}
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
          Context Settings
        </Typography>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1976d2',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#1976d2',
                  },
                }}
              />
            }
            label={
              <Box sx={{ ml: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: INTER_FONT,
                    fontWeight: 500,
                    color: useRag ? '#1976d2' : '#666'
                  }}
                >
                  {useRag ? 'RAG Enabled' : 'RAG Disabled'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: INTER_FONT,
                    color: '#666',
                    fontSize: '0.875rem'
                  }}
                >
                  {useRag
                    ? 'Test cases will be generated using your uploaded context documents'
                    : 'Test cases will be generated using only the AI model\'s knowledge'
                  }
                </Typography>
              </Box>
            }
            sx={{
              alignItems: 'flex-start',
              '& .MuiFormControlLabel-label': {
                fontFamily: INTER_FONT
              }
            }}
          />
        </Box>
      </Paper>

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
          Actions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateUserStories}
              disabled={!query.trim() || !userId || loadingUserStories}
              startIcon={loadingUserStories ? <CircularProgress size={20} /> : <Psychology />}
              sx={BUTTON_STYLES}
            >
              {loadingUserStories ? 'Generating...' : 'Generate User Stories'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handlePreviewTestCases}
              disabled={!query.trim() || !userId || previewing}
              startIcon={previewing ? <CircularProgress size={20} /> : <Preview />}
              sx={BUTTON_STYLES}
            >
              {previewing ? 'Loading...' : 'Generate Test Cases'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleDownloadExcel}
              disabled={!query.trim() || !userId || downloading || !previewData}
              startIcon={downloading ? <CircularProgress size={20} /> : <FileDownload />}
              sx={BUTTON_STYLES}
            >
              {downloading ? 'Downloading...' : 'Download Excel'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {userStories && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated User Stories
            </Typography>
            <MarkdownRenderer>{userStories}</MarkdownRenderer>
          </CardContent>
        </Card>
      )}

      {previewData && (
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
            Test Cases Preview
          </Typography>
          <Box sx={{
            overflowX: 'auto',
            overflowY: 'visible',
            width: '100%',
            '& table': {
              minWidth: '1400px', // Increased minimum width for wider columns
              width: 'auto'
            },
            // Add scrollbar styling
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#a8a8a8',
            }
          }}>
            <table style={{
              width: 'auto',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              tableLayout: 'auto' // Auto layout for natural column sizing
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((header) => {
                    // Define specific widths for important columns
                    let headerStyle = {
                      border: '1px solid #ddd',
                      padding: '8px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontFamily: INTER_FONT,
                      whiteSpace: 'nowrap'
                    };

                    // Set specific widths for key columns using pixels for scrollable table
                    if (header === 'Steps to be Executed') {
                      headerStyle.width = '350px';
                      headerStyle.minWidth = '350px';
                    } else if (header === 'Test Step Description') {
                      headerStyle.width = '320px';
                      headerStyle.minWidth = '320px';
                    } else if (header === 'Test Case Description') {
                      headerStyle.width = '200px';
                      headerStyle.minWidth = '200px';
                    } else if (header === 'Test Input Data') {
                      headerStyle.width = '180px';
                      headerStyle.minWidth = '180px';
                    } else if (header === 'Expected Result') {
                      headerStyle.width = '280px';
                      headerStyle.minWidth = '280px';
                    } else {
                      // Other columns get consistent width
                      headerStyle.width = '100px';
                      headerStyle.minWidth = '100px';
                    }

                    return (
                      <th key={header} style={headerStyle}>
                        {header}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    {Object.entries(row).map(([key, cell], cellIndex) => {
                      // Define specific cell styling based on column
                      let cellStyle = {
                        border: '1px solid #ddd',
                        padding: '8px',
                        fontFamily: INTER_FONT,
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        verticalAlign: 'top'
                      };

                      // Set specific widths and styling for key columns using pixels for scrollable table
                      if (key === 'Steps to be Executed') {
                        cellStyle.width = '350px';
                        cellStyle.maxWidth = '350px';
                      } else if (key === 'Test Step Description') {
                        cellStyle.width = '320px';
                        cellStyle.maxWidth = '320px';
                      } else if (key === 'Test Case Description') {
                        cellStyle.width = '200px';
                        cellStyle.maxWidth = '200px';
                      } else if (key === 'Test Input Data') {
                        cellStyle.width = '180px';
                        cellStyle.maxWidth = '180px';
                      } else if (key === 'Expected Result') {
                        cellStyle.width = '280px';
                        cellStyle.maxWidth = '280px';
                      } else {
                        // Other columns get consistent width
                        cellStyle.width = '100px';
                        cellStyle.maxWidth = '100px';
                      }

                      return (
                        <td key={cellIndex} style={cellStyle}>
                          {Array.isArray(cell) ? cell.filter(Boolean).join("\n") : (cell ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
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
    </Box>
  );
};

export default RAGTestGenerator;
