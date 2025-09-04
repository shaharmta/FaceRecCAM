import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Grid
} from '@mui/material';
import { Security, Face, Wifi, WifiOff } from '@mui/icons-material';
import RecognitionResult from './components/RecognitionResult';
import NotificationList from './components/NotificationList';
import LiveVideo from './components/LiveVideo';

// Create a high-tech dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#4dffff',
      dark: '#0099cc',
    },
    secondary: {
      main: '#ff00ff',
      light: '#ff4dff',
      dark: '#cc00cc',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    success: {
      main: '#00ff88',
      light: '#4dffaa',
      dark: '#00cc6a',
    },
    error: {
      main: '#ff0066',
      light: '#ff4d88',
      dark: '#cc0052',
    },
    warning: {
      main: '#ffaa00',
      light: '#ffcc4d',
      dark: '#cc8800',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '0.1em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          border: '1px solid #333',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.05em',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4dffff 0%, #00d4ff 100%)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid',
        },
      },
    },
  },
});

function App() {
  const [lastEvent, setLastEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://127.0.0.1:8000/ws')

    websocket.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    websocket.onclose = () => {
      setIsConnected(false);
      setError('WebSocket connection lost. Reconnecting...');
    };
    
    websocket.onerror = (error) => {
      setError('WebSocket error: ' + error.message);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastEvent(data);
      setNotifications(prev => [data, ...prev].slice(0, 10));
    };
    
    return () => {
      websocket.close();
    };
  }, []);

  const handleAddPerson = async () => {
    try {
      console.log("=== Add Person Request ===");
      console.log("Last event:", lastEvent);
      
      if (!lastEvent?.data?.vector) {
        console.error("No vector in lastEvent:", lastEvent);
        throw new Error("No face vector available to add.");
      }
  
      const requestData = {
        vector: lastEvent.data.vector,
      };
      
      console.log("Request data:", requestData);
      console.log("Vector type:", typeof lastEvent.data.vector);
      console.log("Vector length:", lastEvent.data.vector.length);
  
      const response = await fetch('/add-person', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);
  
      if (!response.ok) {
        throw new Error(`Failed to add person: ${responseText}`);
      }
    } catch (error) {
      console.error("=== Add Person Error ===");
      console.error("Error type:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      setError('Failed to add person: ' + error.message);
    }
  };

  const handleDismissNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ my: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Security sx={{ fontSize: 48, color: 'primary.main', mr: 2, animation: 'pulse 2s infinite' }} />
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  }}
                >
                  FACE RECOGNITION
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Access Control System
              </Typography>
            </Box>

            {/* Connection Status */}
            <Box sx={{ mb: 3 }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    background: 'linear-gradient(135deg, rgba(255, 0, 102, 0.1) 0%, rgba(255, 0, 102, 0.05) 100%)',
                    border: '1px solid rgba(255, 0, 102, 0.3)',
                  }}
                >
                  {error}
                </Alert>
              )}
              
              {!isConnected && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 2,
                    background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.1) 0%, rgba(255, 170, 0, 0.05) 100%)',
                    border: '1px solid rgba(255, 170, 0, 0.3)',
                  }}
                >
                  <WifiOff sx={{ mr: 1 }} />
                  Connecting to server...
                </Alert>
              )}

              {isConnected && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 2,
                    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                  }}
                >
                  <Wifi sx={{ mr: 1 }} />
                  Connected to server
                </Alert>
              )}
            </Box>
            
            {/* Main Content Grid */}
            <Grid container spacing={4}>
              {/* Live Video Feed - Left Column */}
              <Grid item xs={12} lg={8}>
                <LiveVideo />
              </Grid>

              {/* Recognition Results - Right Column */}
              <Grid item xs={12} lg={4}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent 0%, #00d4ff 50%, transparent 100%)',
                      animation: 'scan 3s linear infinite',
                    },
                  }}
                >
                  {lastEvent ? (
                    <RecognitionResult 
                      event={lastEvent}
                      onAddPerson={handleAddPerson}
                      onDismiss={() => setLastEvent(null)}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress 
                        size={60}
                        sx={{ 
                          color: 'primary.main',
                          mb: 3,
                          '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                          },
                        }}
                      />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'text.secondary',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <Face sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Waiting for face recognition events...
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Events - Full Width */}
            <Paper 
              sx={{ 
                p: 4,
                mt: 4,
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)',
                border: '1px solid rgba(255, 0, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(255, 0, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{
                  background: 'linear-gradient(135deg, #ff00ff 0%, #00d4ff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Recent Recognition Events
              </Typography>
              <Divider 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(90deg, transparent 0%, #ff00ff 50%, transparent 100%)',
                  height: '1px',
                }} 
              />
              <NotificationList
                notifications={notifications}
                onAddPerson={handleAddPerson}
                onDismiss={handleDismissNotification}
              />
            </Paper>
          </Box>
        </Container>

        {/* Global CSS for animations */}
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            @keyframes scan {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes glow {
              0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
              50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.6); }
            }
          `}
        </style>
      </Box>
    </ThemeProvider>
  );
}

export default App;