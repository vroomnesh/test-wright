// ============================================================================
// TESTWRIGHT REACT APPLICATION - MAIN ENTRY POINT
// ============================================================================
// This is the main React application that provides:
// - Public access with no sign-in
// - Responsive navigation with Material-UI components
// - Route management for all Testwright features
// - Theme configuration and global styling
// ============================================================================

import React, { useState } from 'react'
import { BrowserRouter as Router, NavLink, Routes, Route, Navigate } from 'react-router-dom'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
} from '@mui/material'
import { Description, Psychology, Transform, Home } from '@mui/icons-material'

// ============================================================================
// COMPONENT IMPORTS
// ============================================================================
// Import all main feature components and assets
import Homepage            from './components/Homepage'              // Landing page with feature overview
import DocumentPreprocessor from './components/DocumentPreprocessor' // PDF/DOCX/Image upload & processing
import RAGTestGenerator    from './components/RAGTestGenerator'      // RAG & non-RAG test case generation
import ETLTestGenerator    from './components/ETLTestGenerator'      // ETL test script generation

// Shared id for the public knowledge base. There is no per-user sign-in.
const PUBLIC_USER_ID = 'public'

const theme = createTheme({
  palette: {
    primary:   { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  },
})
const drawerWidth = 240
const menuItems = [
  { id: 'home',     label: 'Home',                 icon: <Home />,        path: '/' },
  { id: 'document', label: 'Knowledge Management', icon: <Description />, path: '/document' },
  { id: 'rag',      label: 'Test Case Generator',  icon: <Psychology />,  path: '/rag' },
  { id: 'etl',      label: 'ETL Test Generator',    icon: <Transform />,    path: '/etl' },
]

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <Router>
      <Routes>
        <Route path="/*" element={
              <Box sx={{ display: 'flex' }}>
                {/* AppBar */}
                <AppBar position="fixed" sx={{
                  zIndex: (t) => t.zIndex.drawer + 1,
                  backgroundColor: 'white',
                  color: 'black',
                  width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%',
                  marginLeft: sidebarOpen ? `${drawerWidth}px` : 0,
                  transition: 'width 0.3s ease, margin-left 0.3s ease'
                }}>
                  <Toolbar className="px-6" sx={{ minHeight: '80px !important', display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                      <Button
                        onClick={toggleSidebar}
                        sx={{
                          minWidth: 'auto',
                          p: 1,
                          mr: 2,
                          color: 'black',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                        </svg>
                      </Button>
                    </Box>

                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 4 }}>
                      <Typography variant="h4" noWrap sx={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#1a1a1a',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
                      }}>
                        Testwright
                      </Typography>
                    </Box>
                  </Toolbar>
                </AppBar>

                {/* Drawer */}
                <Drawer
                  variant="persistent"
                  open={sidebarOpen}
                  sx={{
                    width: drawerWidth,
                    '& .MuiDrawer-paper': {
                      width: drawerWidth,
                      boxSizing: 'border-box',
                      background: 'linear-gradient(180deg, #c2410c 0%, #ffedd5 100%)',
                      color: 'white',
                      borderRight: 'none',
                      zIndex: (t) => t.zIndex.drawer + 2,
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                      transition: 'transform 0.3s ease',
                      boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
                      display: 'flex',
                      flexDirection: 'column'
                    },
                  }}
                >
                  {/* Sidebar Header */}
                  <Box sx={{
                    height: 80,
                    padding: '0 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Psychology sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                      <Typography variant="h6" sx={{
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        letterSpacing: '0.5px'
                      }}>
                        Testwright
                      </Typography>
                    </Box>
                  </Box>

                  {/* Navigation Items - Always Visible */}
                  <List sx={{ padding: '0 8px', flexShrink: 0 }}>
                    {menuItems.map(({ id, label, icon, path }) => (
                      <ListItem
                        key={id}
                        component={NavLink}
                        to={path}
                        sx={{
                          '&.active': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            margin: '4px 0',
                            '& .MuiListItemIcon-root': {
                              color: 'white'
                            },
                            '& .MuiListItemText-primary': {
                              fontWeight: 600,
                              color: 'white'
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            '& .MuiListItemIcon-root': {
                              color: 'white'
                            },
                            '& .MuiListItemText-primary': {
                              color: 'white'
                            }
                          },
                          color: 'white',
                          margin: '4px 0',
                          borderRadius: '12px',
                          padding: '14px 20px',
                          minHeight: '52px'
                        }}
                      >
                        <ListItemIcon sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          minWidth: '44px'
                        }}>
                          {icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={label}
                          sx={{
                            color: 'white',
                            '& .MuiListItemText-primary': {
                              fontSize: '15px',
                              fontWeight: 500,
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {/* Testwright logo */}
                  <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 2,
                    alignItems: 'center',
                    paddingBottom: 2
                  }}>
                    <img
                      src={`/QA_logo.png?v=${Date.now()}`}
                      alt="Testwright"
                      style={{
                        width: '200px',
                        height: '200px',
                        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                  </Box>
                </Drawer>

                {/* Main Content */}
                <Box component="main" sx={{
                  flexGrow: 1,
                  paddingTop: 3,
                  paddingBottom: 3,
                  paddingLeft: 3,
                  paddingRight: 3,
                  marginLeft: sidebarOpen ? 0 : `-${drawerWidth}px`,
                  transition: 'margin-left 0.3s ease'
                }}>
                  <Toolbar />
                  <Box sx={{
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    paddingLeft: 3,
                    paddingRight: 3,
                    maxWidth: 'calc(100vw - 240px - 48px)' // Account for sidebar and desired white space
                  }}>
                    <Routes>
                      <Route path="/"         element={<Homepage userId={PUBLIC_USER_ID} />} />
                      <Route path="/document" element={<DocumentPreprocessor userId={PUBLIC_USER_ID} />} />
                      <Route path="/rag"      element={<RAGTestGenerator userId={PUBLIC_USER_ID} />} />
                      <Route path="/etl"      element={<ETLTestGenerator />} />
                      <Route path="*"         element={<Navigate to="/" replace />} />
                    </Routes>
                  </Box>
                </Box>


              </Box>
        } />
      </Routes>
    </Router>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  )
}

