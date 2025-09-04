import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  LinearProgress,
  Fade,
  Slide
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Face as FaceIcon
} from '@mui/icons-material';

function RecognitionResult({ event, onAddPerson, onDismiss }) {
  const { data } = event;
  const isRecognized = data?.status !== 'red';

  if (data.recognized) {
    return (
      <Fade in timeout={800}>
        <Box>
          <Slide direction="left" in timeout={600}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  position: 'relative',
                  mr: 3,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    right: -10,
                    bottom: -10,
                    background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite',
                  },
                }}
              >
                <CheckCircleIcon 
                  color="success" 
                  sx={{ 
                    fontSize: 60, 
                    position: 'relative',
                    zIndex: 1,
                    filter: 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.5))',
                  }} 
                />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Access Granted
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    letterSpacing: '0.05em',
                  }}
                >
                  Identity verified successfully
                </Typography>
              </Box>
            </Box>
          </Slide>
          
          <Slide direction="up" in timeout={800}>
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                Person ID: {data.person_id}
              </Typography>
            </Box>
          </Slide>
          
          <Slide direction="up" in timeout={1000}>
            <Box sx={{ mt: 3 }}>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                gutterBottom
                sx={{ letterSpacing: '0.05em' }}
              >
                Confidence Score
              </Typography>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={data.confidence * 100} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #00ff88 0%, #00d4ff 100%)',
                      borderRadius: 6,
                      boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                    },
                  }}
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mt: 1,
                    color: 'success.main',
                    fontWeight: 600,
                    textAlign: 'center',
                    textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                  }}
                >
                  {(data.confidence * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Slide>
        </Box>
      </Fade>
    );
  }
  
  return (
    <Fade in timeout={800}>
      <Box>
        <Slide direction="left" in timeout={600}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                position: 'relative',
                mr: 3,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  right: -10,
                  bottom: -10,
                  background: 'radial-gradient(circle, rgba(255, 0, 102, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                },
              }}
            >
              <CancelIcon 
                color="error" 
                sx={{ 
                  fontSize: 60, 
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 0 10px rgba(255, 0, 102, 0.5))',
                }} 
              />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                sx={{
                  background: 'linear-gradient(135deg, #ff0066 0%, #ff00ff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Unknown Face Detected
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  letterSpacing: '0.05em',
                }}
              >
                Identity verification required
              </Typography>
            </Box>
          </Box>
        </Slide>
        
        {data.preview_image && (
          <Slide direction="up" in timeout={800}>
            <Paper 
              sx={{ 
                p: 2, 
                mb: 3, 
                maxWidth: 350,
                mx: 'auto',
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)',
                border: '2px solid rgba(255, 0, 102, 0.3)',
                boxShadow: '0 8px 32px rgba(255, 0, 102, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, #ff0066 50%, transparent 100%)',
                  animation: 'scan 2s linear infinite',
                },
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 1 }}>
                <FaceIcon sx={{ color: 'error.main', fontSize: 24, mb: 1 }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Detected Face
                </Typography>
              </Box>
              <img 
                src={`data:image/jpeg;base64,${data.preview_image}`}
                alt="Detected face"
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </Paper>
          </Slide>
        )}
        
        <Slide direction="up" in timeout={1000}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PersonAddIcon />}
                onClick={onAddPerson}
                sx={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4dffff 0%, #00d4ff 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 30px rgba(0, 212, 255, 0.4)',
                  },
                }}
              >
                Add Face to Database
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={onDismiss}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: 'error.light',
                    color: 'error.light',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 30px rgba(255, 0, 102, 0.3)',
                    background: 'rgba(255, 0, 102, 0.1)',
                  },
                }}
              >
                Ignore
              </Button>
            </Grid>
          </Grid>
        </Slide>
      </Box>
    </Fade>
  );
}

export default RecognitionResult; 