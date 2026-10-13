/**
 * MarkdownRenderer - Styled markdown display component
 * Renders markdown content with consistent styling
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box } from '@mui/material';

// Standardized font family
const INTER_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

const MarkdownRenderer = ({ children, ...props }) => {
  return (
    <Box
      sx={{
        backgroundColor: '#f9f9f9',
        p: 3,
        borderRadius: 1,
        maxHeight: 600,
        overflow: 'auto',
        border: '1px solid #e0e0e0',
        fontFamily: INTER_FONT,
        '& h1': {
          color: '#1976d2',
          fontSize: '1.8rem',
          fontWeight: 600,
          marginTop: '1.5rem',
          marginBottom: '0.8rem',
          borderBottom: '2px solid #1976d2',
          paddingBottom: '0.3rem',
          fontFamily: INTER_FONT,
        },
        '& h2': {
          color: '#1976d2',
          fontSize: '1.5rem',
          fontWeight: 600,
          marginTop: '1.3rem',
          marginBottom: '0.7rem',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '0.2rem',
          fontFamily: INTER_FONT,
        },
        '& h3': {
          color: '#1976d2',
          fontSize: '1.3rem',
          fontWeight: 600,
          marginTop: '1.2rem',
          marginBottom: '0.6rem',
          fontFamily: INTER_FONT,
        },
        '& h4, & h5, & h6': {
          color: '#1976d2',
          fontWeight: 600,
          marginTop: '1rem',
          marginBottom: '0.5rem',
          fontFamily: INTER_FONT,
        },
        '& p': {
          marginBottom: '0.8rem',
          lineHeight: 1.6,
          color: '#333',
          fontFamily: INTER_FONT,
          fontSize: '1rem',
        },
        '& ul, & ol': {
          paddingLeft: '1.5rem',
          marginBottom: '1rem',
        },
        '& li': {
          marginBottom: '0.4rem',
          lineHeight: 1.5,
        },
        '& strong': {
          fontWeight: 600,
          color: '#1565c0',
        },
        '& em': {
          fontStyle: 'italic',
          color: '#666',
        },
        '& code': {
          backgroundColor: '#f0f0f0',
          padding: '0.2rem 0.4rem',
          borderRadius: '3px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.9em',
          color: '#d32f2f',
        },
        '& pre': {
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '5px',
          overflow: 'auto',
          marginBottom: '1rem',
          border: '1px solid #e0e0e0',
          '& code': {
            backgroundColor: 'transparent',
            padding: 0,
            color: '#333',
          },
        },
        '& blockquote': {
          borderLeft: '4px solid #1976d2',
          paddingLeft: '1rem',
          marginLeft: 0,
          marginBottom: '1rem',
          fontStyle: 'italic',
          color: '#666',
          backgroundColor: '#f8f9fa',
          padding: '0.5rem 1rem',
          borderRadius: '0 4px 4px 0',
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '1rem',
          '& th, & td': {
            border: '1px solid #e0e0e0',
            padding: '0.5rem',
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: '#f5f5f5',
            fontWeight: 600,
          },
        },
        '& hr': {
          border: 'none',
          borderTop: '2px solid #e0e0e0',
          margin: '1.5rem 0',
        },
      }}
      {...props}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
