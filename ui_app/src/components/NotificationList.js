import React from 'react';
import {
  List,
  ListItem,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material';

function NotificationList({ notifications = [], onAddPerson, onDismiss }) {
  if (!notifications.length) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
        No recognition events yet
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {notifications.map((notification, index) => {
        // Skip invalid notifications
        if (!notification || !notification.data) {
          return null;
        }

        const { event_type, timestamp, data } = notification;
        const isRecognized = data?.recognized ?? false;
        const date = timestamp ? new Date(timestamp) : new Date();
        
        return (
          <ListItem 
            key={`${timestamp || index}-${index}`}
            sx={{ 
              px: 0,
              '&:not(:last-child)': { mb: 2 }
            }}
          >
            <Card 
              sx={{ 
                width: '100%',
                borderLeft: 6,
                borderColor: isRecognized ? 'success.main' : 'error.main'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {isRecognized ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                      <Typography variant="h6">
                        {isRecognized ? 'Access Granted' : 'Unknown Face Detected'}
                      </Typography>
                    </Stack>
                    
                    {isRecognized && (
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Person ID: {data.person_id}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {date.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => onDismiss(index)}
                    sx={{ ml: 1 }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                {!isRecognized && (
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => onAddPerson(data)}
                    >
                      Add Person
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                    >
                      Ignore
                    </Button>
                  </Stack>
                )}
                
                {isRecognized && data?.confidence && (
                  <Chip
                    label={`Confidence: ${(data.confidence * 100).toFixed(1)}%`}
                    color="success"
                    size="small"
                    sx={{ mt: 2 }}
                  />
                )}
              </CardContent>
            </Card>
          </ListItem>
        );
      })}
    </List>
  );
}

export default NotificationList; 