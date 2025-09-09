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
  Chip,
  Fade,
  Slide
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  Face as FaceIcon
} from '@mui/icons-material';

function NotificationList({ notifications = [], onAddPerson, onDismiss }) {
  if (!notifications.length) {
    return (
      <Fade in timeout={800}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            No recognition events yet
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block',
              mt: 1,
              letterSpacing: '0.1em',
            }}
          >
            System is monitoring for face detection
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent' }}>
      {notifications.map((notification, index) => {
        // Skip invalid notifications
        if (!notification || !notification.data) {
          return null;
        }

        const { event_type, timestamp, data } = notification;
        const isRecognition = event_type === 'recognition';
        const isPersonAdded = event_type === 'person_added';
        const isVisitUpdated = event_type === 'visit_updated';
        const isRecognized = isRecognition ? (data?.recognized ?? false) : isPersonAdded;
        const date = timestamp ? new Date(timestamp) : new Date();
        
        return (
          <Slide direction="up" in timeout={600 + index * 100} key={`${timestamp || index}-${index}`}>
            <ListItem 
              sx={{ 
                px: 0,
                '&:not(:last-child)': { mb: 3 }
              }}
            >
              <Card 
                sx={{ 
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)',
                  border: `3px solid ${isPersonAdded ? 'rgba(0, 255, 136, 0.5)' : isRecognized ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 0, 102, 0.3)'}`,
                  boxShadow: `0 8px 32px ${isPersonAdded ? 'rgba(0, 255, 136, 0.3)' : isRecognized ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 102, 0.2)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                  backdropFilter: 'blur(15px)',
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, transparent 0%, ${isPersonAdded ? '#00ff88' : isRecognized ? '#00ff88' : '#ff0066'} 50%, transparent 100%)`,
                    animation: 'scan 3s linear infinite',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${isPersonAdded ? 'rgba(0, 255, 136, 0.4)' : isRecognized ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 0, 102, 0.3)'}`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: -5,
                              left: -5,
                              right: -5,
                              bottom: -5,
                              background: `radial-gradient(circle, ${isPersonAdded ? 'rgba(0, 255, 136, 0.25)' : isRecognized ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 102, 0.2)'} 0%, transparent 70%)`,
                              borderRadius: '50%',
                              animation: 'pulse 2s infinite',
                            },
                          }}
                        >
                          {isPersonAdded ? (
                            <PersonAddIcon 
                              sx={{ 
                                color: 'success.main',
                                fontSize: 32,
                                position: 'relative',
                                zIndex: 1,
                                filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.6))',
                              }}
                            />
                          ) : isRecognized ? (
                            <CheckCircleIcon 
                              color="success" 
                              sx={{ 
                                fontSize: 32,
                                position: 'relative',
                                zIndex: 1,
                                filter: `drop-shadow(0 0 8px ${isRecognized ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 0, 102, 0.5)'})`,
                              }}
                            />
                          ) : (
                            <CancelIcon 
                              color="error" 
                              sx={{ 
                                fontSize: 32,
                                position: 'relative',
                                zIndex: 1,
                                filter: `drop-shadow(0 0 8px ${isRecognized ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 0, 102, 0.5)'})`,
                              }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="h6"
                          sx={{
                            background: `linear-gradient(135deg, ${isPersonAdded ? '#00ff88' : isRecognized ? '#00ff88' : '#ff0066'} 0%, ${isPersonAdded ? '#00d4ff' : isRecognized ? '#00d4ff' : '#ff00ff'} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isPersonAdded ? 'Face Added to Database' : isRecognized ? 'Access Granted' : 'Unknown Face Detected'}
                        </Typography>
                      </Stack>
                      
                      {isRecognition && isRecognized && (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            mt: 1,
                            color: 'primary.main',
                            fontWeight: 500,
                            letterSpacing: '0.05em',
                          }}
                        >
                          Person ID: {data.person_id}
                        </Typography>
                      )}
                      {isPersonAdded && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1,
                            color: 'success.main',
                            fontWeight: 500,
                            letterSpacing: '0.05em',
                          }}
                        >
                          New face stored successfully
                        </Typography>
                      )}
                      
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 2, 
                          display: 'block',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {date.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => onDismiss(index)}
                      sx={{ 
                        ml: 1,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  
                  {isRecognition && !isRecognized && (
                    <Slide direction="up" in timeout={800}>
                      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<PersonAddIcon />}
                          onClick={() => onAddPerson(data)}
                          sx={{
                            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #4dffff 0%, #00d4ff 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)',
                            },
                          }}
                        >
                          Add Person
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          sx={{
                            borderColor: 'error.main',
                            color: 'error.main',
                            '&:hover': {
                              borderColor: 'error.light',
                              color: 'error.light',
                              background: 'rgba(255, 0, 102, 0.1)',
                            },
                          }}
                        >
                          Ignore
                        </Button>
                      </Stack>
                    </Slide>
                  )}

                  {isRecognition && !isRecognized && data?.preview_image && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <img 
                        src={`data:image/jpeg;base64,${data.preview_image}`}
                        alt="Detected face"
                        style={{ 
                          width: 96, 
                          height: 'auto', 
                          borderRadius: 8,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ letterSpacing: '0.05em' }}
                      >
                        Snapshot from detection
                      </Typography>
                    </Box>
                  )}
                  
                  {isRecognition && isRecognized && data?.confidence && (
                    <Slide direction="up" in timeout={1000}>
                      <Box sx={{ mt: 3 }}>
                        <Chip
                          label={`Confidence: ${(data.confidence * 100).toFixed(1)}%`}
                          color="success"
                          size="small"
                          sx={{ 
                            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 212, 255, 0.2) 100%)',
                            border: '1px solid rgba(0, 255, 136, 0.3)',
                            color: 'success.main',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            '& .MuiChip-label': {
                              textShadow: '0 0 8px rgba(0, 255, 136, 0.5)',
                            },
                          }}
                        />
                      </Box>
                    </Slide>
                  )}
                </CardContent>
              </Card>
            </ListItem>
          </Slide>
        );
      })}
    </List>
  );
}

export default NotificationList; 