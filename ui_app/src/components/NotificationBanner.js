import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

function NotificationBanner({ event, onAddPerson }) {
  if (!event) return null;
  
  const { data } = event;
  
  if (data.recognized) {
    return (
      <Alert 
        severity="success" 
        icon={<CheckCircleIcon />}
        sx={{ 
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          minWidth: 300,
          boxShadow: 2
        }}
      >
        <AlertTitle>Access Granted</AlertTitle>
        Welcome, {data.person_name}!
      </Alert>
    );
  }
  
  return (
    <Alert 
      severity="error" 
      icon={<CancelIcon />}
      sx={{ 
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        minWidth: 300,
        boxShadow: 2
      }}
    >
      <AlertTitle>Unknown Face Detected</AlertTitle>
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={onAddPerson}
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
    </Alert>
  );
}

export default NotificationBanner; 