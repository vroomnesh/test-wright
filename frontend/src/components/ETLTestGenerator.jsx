// ============================================================================
// ETL TEST GENERATOR COMPONENT
// ============================================================================
// Comprehensive ETL test case generation with two input methods:
//
// Manual Configuration Tab:
// - Interactive UI for defining source/target table mappings
// - Add/remove source and target configurations dynamically
// - Specify ETL rules, transformation logic, and test types
// - Support for multiple programming languages (SQL, Python, etc.)
//
// Excel Upload Tab:
// - Upload Excel files with pre-configured ETL mappings
// - LLM parses complex Excel structures automatically
// - Extracts multiple test case scenarios from single upload
// - Supports business rules and validation logic
//
// Output Features:
// - Generates detailed ETL test scripts with validation
// - Excel format with proper test case numbering (TC_XXX_YY format)
// - Supports multiple ETL test types and scenarios
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Remove, Transform, FileDownload, Upload, Edit } from '@mui/icons-material';
import { generateETLScript, downloadETLExcel, uploadETLExcel, generateExcelFromMultipleTestCases, downloadBlob } from '../services/api';

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
  },
  '& .MuiSelect-select': {
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

const ETLTestGenerator = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0); // 0 = Manual Entry, 1 = File Upload

  // Manual entry states
  const [sources, setSources] = useState([
    { type: 'Database', db: 'MySQL', coll: 'source_data', cols_attrs: '' }
  ]);
  const [targets, setTargets] = useState([
    { type: 'Database', db: 'MySQL', coll: 'target_data', cols_attrs: '' }
  ]);
  const [etlTestType, setEtlTestType] = useState('Data Validation');
  const [rules, setRules] = useState('');
  const [language, setLanguage] = useState('Python');

  // File upload states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileConfig, setFileConfig] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Common states
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const typeOptions = ['Database', 'CSV', 'JSON', 'XML', 'API', 'Warehouse'];
  const dbOptions = ['MySQL', 'PostgreSQL', 'Oracle', 'SQLServer', 'MongoDB', 'None'];
  const testTypeOptions = [
    'Data Validation',
    'Data Transformation',
    'Data Integrity',
    'Performance Testing',
    'Error Handling',
    'Incremental Load Testing'
  ];

  const addSource = () => {
    setSources([...sources, { type: 'Database', db: 'MySQL', coll: '', cols_attrs: '' }]);
  };

  const removeSource = (index) => {
    if (sources.length > 1) {
      setSources(sources.filter((_, i) => i !== index));
    }
  };

  const updateSource = (index, field, value) => {
    const newSources = [...sources];
    newSources[index][field] = value;
    setSources(newSources);
  };

  const addTarget = () => {
    setTargets([...targets, { type: 'Database', db: 'MySQL', coll: '', cols_attrs: '' }]);
  };

  const removeTarget = (index) => {
    if (targets.length > 1) {
      setTargets(targets.filter((_, i) => i !== index));
    }
  };

  const updateTarget = (index, field, value) => {
    const newTargets = [...targets];
    newTargets[index][field] = value;
    setTargets(newTargets);
  };

  const handleGenerateScript = async () => {
    if (!rules.trim()) {
      setError('Please enter transformation rules');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setScript('');

    try {
      const result = await generateETLScript(sources, targets, etlTestType, rules.trim(), language);
      if (result.success) {
        setScript(result.script);
        setSuccess('ETL test script generated successfully!');
      } else {
        setError(result.script || 'Failed to generate script');
      }
    } catch (err) {
      setError('Error generating script: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!rules.trim()) {
      setError('Please enter transformation rules');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const blob = await downloadETLExcel(sources, targets, etlTestType, rules.trim(), language);
      downloadBlob(blob, 'etl_test_cases.xlsx');
      setSuccess('Excel file downloaded successfully!');
    } catch (err) {
      setError('Error downloading Excel: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDownloading(false);
    }
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Clear file upload states when switching to Manual Entry
    if (newValue === 0) {
      setUploadedFile(null);
      setFileConfig(null);
      setError('');
      setSuccess('');
      setScript('');
    }
  };

  // File upload handlers
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // IMMEDIATELY clear previous states as soon as file is selected
    setUploadedFile(null);
    setFileConfig(null);
    setError('');
    setSuccess('');
    setScript('');
    setLoading(false);
    setDownloading(false);

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setUploading(true);
    setUploadedFile(file);

    try {
      const result = await uploadETLExcel(file);
      if (result.success) {
        setFileConfig(result.config);
        setSuccess(result.message || 'Excel file uploaded and parsed successfully!');
      } else {
        setError(result.message || 'Failed to parse Excel file');
        setFileConfig(null);
      }
    } catch (err) {
      setError('Error uploading file: ' + (err.response?.data?.detail || err.message));
      setFileConfig(null);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!fileConfig || !fileConfig.test_cases) {
      setError('Please upload and parse an Excel file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setScript('');

    try {
      // Generate script for the first test case as an example
      const firstTestCase = fileConfig.test_cases[0];

      // Convert the file data to the expected API format
      // The API expects SourceTarget objects with specific structure
      const formattedSources = firstTestCase.sources.map(source => ({
        type: source.type || 'Database',
        db: source.db || '',
        coll: source.coll || '',
        cols_attrs: source.cols_attrs || ''
      }));

      const formattedTargets = firstTestCase.targets.map(target => ({
        type: target.type || 'Database',
        db: target.db || '',
        coll: target.coll || '',
        cols_attrs: target.cols_attrs || ''
      }));

      const result = await generateETLScript(
        formattedSources,
        formattedTargets,
        firstTestCase.etl_test_type,
        firstTestCase.rules,
        firstTestCase.language
      );
      if (result.success) {
        setScript(result.script);
        setSuccess(`ETL test script generated for first test case (${fileConfig.test_cases.length} total test cases found)!`);
      } else {
        setError(result.script || 'Failed to generate script');
      }
    } catch (err) {
      setError('Error generating script: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFromFile = async () => {
    if (!fileConfig || !fileConfig.test_cases) {
      setError('Please upload and parse an Excel file first');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const blob = await generateExcelFromMultipleTestCases(fileConfig.test_cases);
      downloadBlob(blob, 'etl_multiple_test_cases.xlsx');
      setSuccess(`Excel file with ${fileConfig.test_cases.length} test cases downloaded successfully!`);
    } catch (err) {
      setError('Error downloading Excel: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDownloading(false);
    }
  };

  const renderSourceTarget = (items, updateItem, addItem, removeItem, title) => (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: INTER_FONT,
            fontWeight: 600,
            fontSize: '1.25rem'
          }}
        >
          {title}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={addItem}
          sx={BUTTON_STYLES}
        >
          Add {title.slice(0, -1)}
        </Button>
      </Box>
      
      {items.map((item, index) => (
        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small" sx={INPUT_STYLES}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={item.type}
                  onChange={(e) => updateItem(index, 'type', e.target.value)}
                  label="Type"
                >
                  {typeOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small" sx={INPUT_STYLES}>
                <InputLabel>DB</InputLabel>
                <Select
                  value={item.db}
                  onChange={(e) => updateItem(index, 'db', e.target.value)}
                  label="DB"
                >
                  {dbOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                label="Table/Collection"
                value={item.coll}
                onChange={(e) => updateItem(index, 'coll', e.target.value)}
                sx={INPUT_STYLES}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                size="small"
                label="Column names & Attributes"
                value={item.cols_attrs}
                onChange={(e) => updateItem(index, 'cols_attrs', e.target.value)}
                placeholder="column name(attribute), column name(attribute), ..."
                sx={INPUT_STYLES}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton
                color="error"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Remove />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Paper>
  );

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
        ETL Test Script Generator
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
        Generate ETL test scripts with dynamic source and target configuration.
      </Typography>

      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontFamily: INTER_FONT,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '1rem'
            }
          }}
        >
          <Tab
            icon={<Edit />}
            label="Manual Entry"
            iconPosition="start"
          />
          <Tab
            icon={<Upload />}
            label="File Upload"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Manual Entry Tab */}
      {activeTab === 0 && (
        <>
          {renderSourceTarget(sources, updateSource, addSource, removeSource, 'Sources')}
          {renderSourceTarget(targets, updateTarget, addTarget, removeTarget, 'Targets')}

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
          Test Configuration
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" sx={INPUT_STYLES}>
              <InputLabel>ETL Test Type</InputLabel>
              <Select
                value={etlTestType}
                onChange={(e) => setEtlTestType(e.target.value)}
                label="ETL Test Type"
              >
                {testTypeOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Programming Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              margin="normal"
              sx={INPUT_STYLES}
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Transformation Rules (one per line)"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          margin="normal"
          multiline
          rows={6}
          placeholder={`1. Convert customer_id to integer
2. Concatenate first_name and last_name into full_name
3. Format date fields to YYYY-MM-DD
4. Calculate total_amount as quantity * price
5. Filter out records with status = 'inactive'`}
          required
          sx={INPUT_STYLES}
        />
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
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateScript}
              disabled={!rules.trim() || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Transform />}
              sx={BUTTON_STYLES}
            >
              {loading ? 'Streaming...' : 'Generate ETL Test Script'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleDownloadExcel}
              disabled={!rules.trim() || downloading}
              startIcon={downloading ? <CircularProgress size={20} /> : <FileDownload />}
              sx={BUTTON_STYLES}
            >
              {downloading ? 'Downloading...' : 'Generate ETL Test Excel'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
        </>
      )}

      {/* File Upload Tab */}
      {activeTab === 1 && (
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
            Upload Excel Configuration
          </Typography>

          <Box sx={{ mb: 3 }}>
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="excel-upload"
              type="file"
              onChange={handleFileUpload}
              onClick={(e) => {
                // Clear the file input value so the same file can be selected again
                e.target.value = '';
                // Clear previous configuration immediately when file input is clicked
                setUploadedFile(null);
                setFileConfig(null);
                setError('');
                setSuccess('');
                setScript('');
                setLoading(false);
                setDownloading(false);
              }}
            />
            <label htmlFor="excel-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                disabled={uploading}
                sx={BUTTON_STYLES}
              >
                {uploading ? 'Uploading...' : 'Choose Excel File'}
              </Button>
            </label>
            {uploadedFile && (
              <Typography variant="body2" sx={{ mt: 1, fontFamily: INTER_FONT }}>
                Selected: {uploadedFile.name}
              </Typography>
            )}
          </Box>

          {uploading && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
              <Typography variant="subtitle2" sx={{ fontFamily: INTER_FONT, fontWeight: 600, mb: 1, color: '#1976d2' }}>
                Processing Excel File...
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: INTER_FONT, color: '#1976d2' }}>
                Analyzing columns and extracting data from your Excel file.
              </Typography>
            </Box>
          )}

          {fileConfig && fileConfig.test_cases && !uploading && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontFamily: INTER_FONT, fontWeight: 600, mb: 1 }}>
                ✅ Extracted Configuration:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: INTER_FONT, mb: 1 }}>
                <strong>Sources:</strong> {(() => {
                  const uniqueSources = new Set();
                  fileConfig.test_cases.forEach(tc => {
                    tc.sources?.forEach(source => {
                      // Only count sources with actual table names (ignore empty values)
                      if (source.coll && source.coll.trim() !== '') {
                        uniqueSources.add(source.coll.trim());
                      }
                    });
                  });
                  return uniqueSources.size;
                })()} configured
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: INTER_FONT, mb: 1 }}>
                <strong>Targets:</strong> {(() => {
                  const uniqueTargets = new Set();
                  fileConfig.test_cases.forEach(tc => {
                    tc.targets?.forEach(target => {
                      // Only count targets with actual table names (ignore empty values)
                      if (target.coll && target.coll.trim() !== '') {
                        uniqueTargets.add(target.coll.trim());
                      }
                    });
                  });
                  return uniqueTargets.size;
                })()} configured
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: INTER_FONT }}>
                <strong>Language:</strong> pyspark
              </Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateFromFile}
                disabled={!fileConfig || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Transform />}
                sx={BUTTON_STYLES}
              >
                {loading ? 'Streaming...' : 'Generate ETL Test Script'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleDownloadFromFile}
                disabled={!fileConfig || downloading}
                startIcon={downloading ? <CircularProgress size={20} /> : <FileDownload />}
                sx={BUTTON_STYLES}
              >
                {downloading ? 'Downloading...' : 'Generate ETL Test Excel'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {script && (
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
              Generated ETL Test Script
            </Typography>
            <Box
              sx={{
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                p: 3,
                borderRadius: 1,
                maxHeight: 1200,
                overflow: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                border: '1px solid #333',
                '& .keyword': { color: '#569cd6' },
                '& .string': { color: '#ce9178' },
                '& .comment': { color: '#6a9955' },
                '& .function': { color: '#dcdcaa' },
              }}
            >
              {script}
            </Box>
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
    </Box>
  );
};

export default ETLTestGenerator;
