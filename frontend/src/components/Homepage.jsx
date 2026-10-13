/**
 * Homepage - Testwright landing page
 * Displays feature overview and navigation cards
 */
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Container,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Description,
  Psychology,
  Transform,
  CloudUpload,
  AutoAwesome,
  GetApp,
  SmartToy,
  Search,
  Speed,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Homepage = ({ userId }) => {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      id: 'knowledge',
      title: 'Knowledge Management',
      description: 'Upload PDF, DOCX, and image files, index them, and use them as context when you generate test cases.',
      icon: <CloudUpload sx={{ fontSize: 28, color: '#1976d2' }} />,
      path: '/document',
      color: '#e3f2fd',
    },
    {
      id: 'testgen',
      title: 'Test Case Generator',
      description: 'Generate test cases and user stories from a request, with or without your indexed documents, and download them as Excel.',
      icon: <AutoAwesome sx={{ fontSize: 28, color: '#388e3c' }} />,
      path: '/rag',
      color: '#e8f5e8',
    },
    {
      id: 'etl',
      title: 'ETL Test Generator',
      description: 'Create ETL test scripts and Excel workbooks from source, target, and mapping details.',
      icon: <Transform sx={{ fontSize: 28, color: '#7b1fa2' }} />,
      path: '/etl',
      color: '#f3e5f5',
    },
  ];

  const systemFeatures = [
    {
      icon: <SmartToy sx={{ fontSize: 20, color: '#e91e63' }} />,
      title: 'AI-Powered Generation',
      description: 'Generates test cases and user stories from your request, using indexed documents when you turn context on.',
    },
    {
      icon: <Description sx={{ fontSize: 20, color: '#2196f3' }} />,
      title: 'Document Context',
      description: 'Indexed PDF, DOCX, and image files are available as context for later test generation.',
    },
    {
      icon: <Search sx={{ fontSize: 20, color: '#9c27b0' }} />,
      title: 'Document Processing',
      description: 'Reads PDF, DOCX, and images, including diagrams and charts, and prepares them for test generation.',
    },
    {
      icon: <Speed sx={{ fontSize: 20, color: '#ff9800' }} />,
      title: 'ETL Testing',
      description: 'Generates ETL test scripts and spreadsheets from source-to-target mappings.',
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#2c3e50',
            mb: 2,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            fontSize: '2.5rem'
          }}
        >
          Welcome to Testwright
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <AutoAwesome sx={{ color: '#1976d2', mr: 1 }} />
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
              fontSize: '1.25rem'
            }}
          >
            Enhanced with AI
          </Typography>
        </Box>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 800,
            mx: 'auto',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
          }}
        >
          Upload documents and images, generate test cases from them or from a request alone, and build ETL tests for your data pipelines.
          Choose one of the tools below to get started.
        </Typography>
      </Box>

      {/* Main Feature Cards Grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)'
        },
        gap: 4,
        width: '100%',
        maxWidth: '1400px',
        mx: 'auto',
        px: 2
      }}>
        {mainFeatures.map((feature) => (
          <Box key={feature.id}>
            <Card
              sx={{
                height: 320,
                width: '100%',
                maxWidth: 400,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                mx: 'auto',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  borderColor: '#1976d2',
                },
              }}
              onClick={() => handleCardClick(feature.path)}
            >
              <CardContent sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden'
              }}>
                {/* Icon Container */}
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    backgroundColor: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                  }}
                >
                  {feature.icon}
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: '#2c3e50',
                    mb: 1.5,
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                    fontSize: '1.25rem',
                    lineHeight: 1.3
                  }}
                >
                  {feature.title}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    flexGrow: 1,
                    lineHeight: 1.5,
                    fontSize: '0.95rem',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                  }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* About This System Section */}
      <Box sx={{ mt: 6 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#1a1a1a',
            mb: 3,
          }}
        >
          About This System
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#666',
            mb: 4,
            lineHeight: 1.6,
            fontSize: '1rem',
          }}
        >
          Testwright indexes documents and images, generates test cases from that material or from a request on its own, and writes ETL tests from source and target mappings.
        </Typography>

        {/* System Features Grid */}
        <Grid container spacing={3}>
          {systemFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.5,
                  }}
                >
                  {feature.icon}
                </Box>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                      mb: 0.5,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Homepage;
