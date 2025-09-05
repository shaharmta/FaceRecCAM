import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

function RecognitionResult({ event, onAddPerson, onDismiss }) {
  const { data } = event;
  const isRecognized = data?.status !== 'red';

  if (data.recognized) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h5">
            Access Granted
          </Typography>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Person ID: {data.person_id}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Confidence Score
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={data.confidence * 100} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {(data.confidence * 100).toFixed(1)}%
          </Typography>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CancelIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
        <Typography variant="h5">
          Unknown Face Detected
        </Typography>
      </Box>
      
      {data.preview_image && (
        <Paper 
          sx={{ 
            p: 1, 
            mb: 2, 
            maxWidth: 300,
            mx: 'auto'
          }}
        >
          <img 
            src={`data:image/jpeg;base64,${data.preview_image}`}
            alt="Detected face"
            style={{ width: '100%', height: 'auto' }}
          />
        </Paper>
      )}
      
      <Grid container spacing={2} justifyContent="center">
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => onAddPerson(data.vector)}
          >
            Add Face
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={onDismiss}
          >
            Ignore
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default RecognitionResult; 