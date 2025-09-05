import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { CheckCircle, PersonAdd, Cancel } from '@mui/icons-material';
import RecognitionResult from './components/RecognitionResult';
import AddPersonDialog from './components/AddPersonDialog';
import NotificationList from './components/NotificationList';

function App() {
  const [ws, setWs] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000/ws');
    
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
      setNotifications(prev => [data, ...prev].slice(0, 10)); // Keep last 10 notifications
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);

  const handleAddPerson = async (vector) => {
    if (!vector) {
      setError('No face vector data available');
      return;
    }
    
    setShowAddPerson(true);
  };

  const API_BASE_URL = 'http://localhost:8000';

  const handleSubmitPerson = async (name, image, vector) => {
    try {
      const response = await fetch(`${API_BASE_URL}/add-person`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: vector
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add person');
      }
      
      setShowAddPerson(false);
    } catch (error) {
      setError('Failed to add person: ' + error.message);
    }
  };

  const handleDismissNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Face Recognition Dashboard
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Connecting to server...
          </Alert>
        )}
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {lastEvent ? (
            <RecognitionResult 
              event={lastEvent}
              onAddPerson={() => setShowAddPerson(true)}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Waiting for face recognition events...
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Recognition Events
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <NotificationList
            notifications={notifications}
            onAddPerson={() => setShowAddPerson(true)}
            onDismiss={handleDismissNotification}
          />
        </Paper>
      </Box>
      
      <AddPersonDialog
        open={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        onSubmit={handleSubmitPerson}
        existingVector={lastEvent?.data?.vector}
        existingImage={lastEvent?.data?.preview_image ? `data:image/jpeg;base64,${lastEvent.data.preview_image}` : null}
      />
    </Container>
  );
}

export default App; 