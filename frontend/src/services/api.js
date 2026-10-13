// ============================================================================
// TESTWRIGHT API SERVICE
// ============================================================================
// Centralized API client for all backend communication
// Handles all HTTP requests to the FastAPI backend including:
// - Document upload and processing
// - RAG test case generation (with and without context)
// - ETL test script generation
// - Knowledge base management
// - File download and blob handling
// ============================================================================

import axios from 'axios';

// Temporarily hardcode the URL to bypass import.meta.env issues
const API_BASE_URL = 'http://localhost:8002';
console.log('API_BASE_URL:', API_BASE_URL);

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================
// Create axios instance with default config optimized for Testwright operations
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minute timeout for large file operations
  maxContentLength: 100 * 1024 * 1024, // 100MB max content length
  maxBodyLength: 100 * 1024 * 1024, // 100MB max body length
});

// ============================================================================
// REQUEST INTERCEPTOR FOR FILE UPLOADS
// ============================================================================
// Add request interceptor to handle large uploads with extended timeouts
api.interceptors.request.use(
  (config) => {
    // For file uploads, ensure proper headers and timeouts
    if (config.data instanceof FormData) {
      config.timeout = 300000; // 5 minutes for file uploads
      config.maxContentLength = 100 * 1024 * 1024;
      config.maxBodyLength = 100 * 1024 * 1024;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - please check your connection');
      error.message = 'Request timeout - please check your connection';
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - please check if the backend server is running');
      error.message = 'Network error - please check if the backend server is running';
    } else if (error.response?.status === 413) {
      console.error('File too large - please use smaller files');
      error.message = 'File too large - please use smaller files (max 100MB)';
    } else if (!error.response) {
      console.error('Network error - unable to connect to server');
      error.message = 'Network error - unable to connect to server';
    }
    return Promise.reject(error);
  }
);

// Document preprocessing API calls
export const uploadDocument = async (file, userId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);

  const response = await api.post('/api/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const indexDocument = async (docId, userId) => {
  const formData = new FormData();
  formData.append('doc_id', docId);
  formData.append('user_id', userId);

  const response = await api.post('/api/documents/index', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Image processing API calls
export const uploadImage = async (file, userId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);

  const response = await api.post('/api/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const indexImage = async (imgId, userId) => {
  const formData = new FormData();
  formData.append('img_id', imgId);
  formData.append('user_id', userId);

  const response = await api.post('/api/images/index', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// RAG test generation API calls
export const generateRAGTestCases = async (query, userId, topK = 5, className = 'Business', useRag = true, isUserStories = false) => {
  const response = await api.post('/api/rag/generate', {
    query,
    user_id: userId,
    top_k: topK,
    class_name: className,
    use_rag: useRag,
    is_user_stories: isUserStories,
  }, {
    timeout: 300000, // 5 minutes for RAG processing
  });
  return response.data;
};

export const downloadRAGExcel = async (query, userId, topK = 5, className = 'Business', useRag = true, previewData = null) => {
  const response = await api.post('/api/rag/download-excel', {
    query,
    user_id: userId,
    top_k: topK,
    class_name: className,
    use_rag: useRag,
    preview_data: previewData,
  }, {
    responseType: 'blob',
    timeout: 300000, // 5 minutes for RAG processing and Excel generation
  });
  return response.data;
};

// Preview RAG test cases without generating Excel
export const previewRAGTestCases = async (query, userId, topK = 5, className = 'Business', useRag = true) => {
  const response = await api.post('/api/rag/preview-test-cases', {
    query,
    user_id: userId,
    top_k: topK,
    class_name: className,
    use_rag: useRag,
  }, {
    timeout: 300000, // 5 minutes for RAG processing
  });
  return response.data;
};

// ETL test generation API calls
export const generateETLScript = async (sources, targets, etlTestType, rules, language) => {
  const response = await api.post('/api/etl/generate-script', {
    sources,
    targets,
    etl_test_type: etlTestType,
    rules,
    language,
  });
  return response.data;
};

export const downloadETLExcel = async (sources, targets, etlTestType, rules, language) => {
  const response = await api.post('/api/etl/download-excel', {
    sources,
    targets,
    etl_test_type: etlTestType,
    rules,
    language,
  }, {
    responseType: 'blob',
  });
  return response.data;
};

// Utility function to download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ETL Excel upload API call
export const uploadETLExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/etl/upload-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Generate Excel from multiple test cases
export const generateExcelFromMultipleTestCases = async (testCases) => {
  const response = await api.post('/api/etl/generate-excel-from-upload', {
    test_cases: testCases
  }, {
    responseType: 'blob',
  });
  return response.data;
};

// Health check function to test backend connectivity
export const healthCheck = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.code === 'ERR_NETWORK' ? 'Backend server is not running or unreachable' : error.message
    };
  }
};

// Create an object with all the API methods for default export
const apiService = {
  ...api,
  uploadDocument,
  indexDocument,
  generateRAGTestCases,
  downloadRAGExcel,
  previewRAGTestCases,
  generateETLScript,
  downloadETLExcel,
  uploadETLExcel,
  generateExcelFromMultipleTestCases,
  downloadBlob,
  healthCheck,
};

// Knowledge Management API functions
export const getUserKnowledge = async (userId) => {
  try {
    const response = await api.get(`/knowledge/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user knowledge:', error);
    throw error;
  }
};

export const deleteDocument = async (userId, docId) => {
  try {
    const response = await api.delete(`/knowledge/${userId}/${docId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const renameDocument = async (userId, docId, newName) => {
  try {
    const response = await api.put(`/knowledge/${userId}/${docId}/rename`, {
      new_name: newName
    });
    return response.data;
  } catch (error) {
    console.error('Error renaming document:', error);
    throw error;
  }
};

export const getDocumentDetails = async (userId, docId) => {
  try {
    const response = await api.get(`/knowledge/${userId}/${docId}/details`);
    return response.data;
  } catch (error) {
    console.error('Error getting document details:', error);
    throw error;
  }
};

export default apiService;
