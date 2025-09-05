import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material';

function AddPersonDialog({ open, onClose, onSubmit, existingVector, existingImage }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState(existingImage || null);
  const [preview, setPreview] = useState(existingImage || null);
  const [error, setError] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImage(file);
        setError('');
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please select an image file');
        setImage(null);
        setPreview(null);
      }
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!existingVector) {
      setError('No face vector data available');
      return;
    }
    
    onSubmit(name, image, existingVector);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setImage(null);
    setPreview(null);
    setError('');
    onClose();
  };

  // Reset form when existingVector changes
  useEffect(() => {
    if (existingVector) {
      setError('');
    }
  }, [existingVector]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Person</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!error && !name.trim()}
            helperText={!name.trim() && error ? error : ''}
            sx={{ mb: 2 }}
          />
          
          {existingImage ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Detected Face Image:
              </Typography>
              <img
                src={existingImage}
                alt="Detected face"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  objectFit: 'contain',
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              />
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="face-image"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="face-image">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  Select Face Image
                </Button>
              </label>
            </Box>
          )}
          
          {preview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Preview:
              </Typography>
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || !existingVector}
        >
          Add Person
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddPersonDialog; 