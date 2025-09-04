// import React, { useRef, useEffect, useState, useCallback } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   IconButton,
//   Alert
// } from '@mui/material';
// import {
//   Videocam as VideocamIcon,
//   VideocamOff as VideocamOffIcon,
//   Face as FaceIcon
// } from '@mui/icons-material';

// function LiveVideo() {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [error, setError] = useState(null);
//   const [faceDetected, setFaceDetected] = useState(false);

//   const startVideo = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           width: { ideal: 640 },
//           height: { ideal: 480 },
//           facingMode: 'user'
//         }
//       });
      
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         streamRef.current = stream;
//         setIsStreaming(true);
//         setError(null);
        
//         videoRef.current.onloadedmetadata = () => {
//           startFaceDetection();
//         };
//       }
//     } catch (err) {
//       console.error('Error accessing camera:', err);
//       setError('Camera access denied. Please allow camera permissions.');
//       setIsStreaming(false);
//     }
//   }, []);

//   const stopVideo = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
//     setIsStreaming(false);
//     setFaceDetected(false);
//   }, []);

//   const startFaceDetection = useCallback(() => {
//     if (!videoRef.current || !canvasRef.current) return;

//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     const detectFaces = () => {
//       if (!video.paused && !video.ended) {
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         const faceDetected = detectFaceInImage(imageData);
        
//         setFaceDetected(faceDetected);
        
//         if (faceDetected) {
//           const boxSize = Math.min(canvas.width, canvas.height) * 0.3;
//           const x = (canvas.width - boxSize) / 2;
//           const y = (canvas.height - boxSize) / 2;
          
//           ctx.strokeStyle = '#00ff88';
//           ctx.lineWidth = 3;
//           ctx.setLineDash([10, 5]);
//           ctx.strokeRect(x, y, boxSize, boxSize);
          
//           ctx.shadowColor = '#00ff88';
//           ctx.shadowBlur = 20;
//           ctx.strokeRect(x, y, boxSize, boxSize);
//           ctx.shadowBlur = 0;
//         }
//       }
      
//       requestAnimationFrame(detectFaces);
//     };

//     detectFaces();
//   }, []);

//   const detectFaceInImage = (imageData) => {
//     const data = imageData.data;
//     let skinPixels = 0;
//     let totalPixels = 0;

//     for (let i = 0; i < data.length; i += 4) {
//       const r = data[i];
//       const g = data[i + 1];
//       const b = data[i + 2];
      
//       if (r > 95 && g > 40 && b > 20 && 
//           Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
//           Math.abs(r - g) > 15 && r > g && r > b) {
//         skinPixels++;
//       }
//       totalPixels++;
//     }

//     const skinRatio = skinPixels / totalPixels;
//     return skinRatio > 0.1;
//   };

//   const toggleVideo = useCallback(() => {
//     if (isStreaming) {
//       stopVideo();
//     } else {
//       startVideo();
//     }
//   }, [isStreaming, startVideo, stopVideo]);

//   useEffect(() => {
//     startVideo();
//     return () => {
//       stopVideo();
//     };
//   }, [startVideo, stopVideo]);

//   return (
//     <Paper
//       sx={{
//         p: 3,
//         background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)',
//         border: '2px solid rgba(0, 212, 255, 0.3)',
//         boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
//         backdropFilter: 'blur(20px)',
//         position: 'relative',
//         overflow: 'hidden',
//         '&::before': {
//           content: '""',
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           right: 0,
//           height: '2px',
//           background: 'linear-gradient(90deg, transparent 0%, #00d4ff 50%, transparent 100%)',
//           animation: 'scan 3s linear infinite',
//         },
//       }}
//     >
//       <Box sx={{ textAlign: 'center', mb: 2 }}>
//         <Typography
//           variant="h5"
//           sx={{
//             background: 'linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)',
//             backgroundClip: 'text',
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent',
//             fontWeight: 600,
//             letterSpacing: '0.1em',
//             textTransform: 'uppercase',
//             mb: 1,
//           }}
//         >
//           Live Camera Feed
//         </Typography>
//         <Typography
//           variant="body2"
//           sx={{
//             color: 'text.secondary',
//             letterSpacing: '0.05em',
//             textTransform: 'uppercase',
//           }}
//         >
//           Real-time face detection monitoring
//         </Typography>
//       </Box>

//       {error && (
//         <Alert
//           severity="error"
//           sx={{
//             mb: 2,
//             background: 'linear-gradient(135deg, rgba(255, 0, 102, 0.1) 0%, rgba(255, 0, 102, 0.05) 100%)',
//             border: '1px solid rgba(255, 0, 102, 0.3)',
//           }}
//         >
//           {error}
//         </Alert>
//       )}

//       <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
//         <Box
//           sx={{
//             position: 'relative',
//             borderRadius: '12px',
//             overflow: 'hidden',
//             border: '2px solid rgba(0, 212, 255, 0.3)',
//             boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
//             background: '#000',
//           }}
//         >
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             muted
//             style={{
//               width: '100%',
//               height: 'auto',
//               maxWidth: '640px',
//               display: isStreaming ? 'block' : 'none',
//             }}
//           />
//           <canvas
//             ref={canvasRef}
//             style={{
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               width: '100%',
//               height: '100%',
//               pointerEvents: 'none',
//             }}
//           />
          
//           {!isStreaming && (
//             <Box
//               sx={{
//                 width: '640px',
//                 height: '480px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
//                 color: 'text.secondary',
//               }}
//             >
//               <Box sx={{ textAlign: 'center' }}>
//                 <VideocamOffIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
//                 <Typography variant="h6" sx={{ letterSpacing: '0.1em' }}>
//                   Camera Offline
//                 </Typography>
//               </Box>
//             </Box>
//           )}

//           {faceDetected && (
//             <Box
//               sx={{
//                 position: 'absolute',
//                 top: 20,
//                 right: 20,
//                 background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 212, 255, 0.2) 100%)',
//                 border: '1px solid rgba(0, 255, 136, 0.5)',
//                 borderRadius: '8px',
//                 p: 1,
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 1,
//                 backdropFilter: 'blur(10px)',
//                 animation: 'pulse 2s infinite',
//               }}
//             >
//               <FaceIcon sx={{ color: 'success.main', fontSize: 20 }} />
//               <Typography
//                 variant="caption"
//                 sx={{
//                   color: 'success.main',
//                   fontWeight: 600,
//                   letterSpacing: '0.05em',
//                   textTransform: 'uppercase',
//                 }}
//               >
//                 Face Detected
//               </Typography>
//             </Box>
//           )}
//         </Box>
//       </Box>

//       <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
//         <IconButton
//           onClick={toggleVideo}
//           sx={{
//             background: isStreaming 
//               ? 'linear-gradient(135deg, #ff0066 0%, #ff00ff 100%)'
//               : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
//             color: 'white',
//             p: 2,
//             '&:hover': {
//               transform: 'scale(1.1)',
//               boxShadow: isStreaming 
//                 ? '0 8px 25px rgba(255, 0, 102, 0.3)'
//                 : '0 8px 25px rgba(0, 212, 255, 0.3)',
//             },
//             transition: 'all 0.3s ease',
//           }}
//         >
//           {isStreaming ? <VideocamOffIcon /> : <VideocamIcon />}
//         </IconButton>
//       </Box>

//       <Box sx={{ textAlign: 'center', mt: 2 }}>
//         <Typography
//           variant="body2"
//           sx={{
//             color: isStreaming ? 'success.main' : 'text.secondary',
//             letterSpacing: '0.05em',
//             textTransform: 'uppercase',
//           }}
//         >
//           {isStreaming ? '● Live Streaming' : '● Camera Disconnected'}
//         </Typography>
//       </Box>
//     </Paper>
//   );
// }

// export default LiveVideo;

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Face as FaceIcon
} from '@mui/icons-material';

function LiveVideo() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState({});

  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);
        
        videoRef.current.onloadedmetadata = () => {
          startFaceDetection();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setIsStreaming(false);
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setFaceDetected(false);
  }, []);

  // Face detection that mimics OpenCV's detectMultiScale with scaleFactor=1.1, minNeighbors=5
  const detectFacesInImage = (imageData) => {
    const { width, height, data } = imageData;
    const faces = [];
    
    // Convert to grayscale (like cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY))
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grayData[i / 4] = gray;
    }
    
    // Mimic OpenCV's detectMultiScale with scaleFactor=1.1, minNeighbors=5
    const minFaceSize = Math.min(width, height) / 6;
    const maxFaceSize = Math.min(width, height) / 2;
    
    // Use scaleFactor=1.1 (like OpenCV)
    const scaleFactor = 1.1;
    const minNeighbors = 5;
    
    for (let faceSize = minFaceSize; faceSize <= maxFaceSize; faceSize *= scaleFactor) {
      const stepSize = Math.floor(faceSize / 4);
      
      for (let y = 0; y < height - faceSize; y += stepSize) {
        for (let x = 0; x < width - faceSize; x += stepSize) {
          const faceScore = analyzeFaceRegion(grayData, x, y, faceSize, width, height);
          
          if (faceScore > 0.6) {
            // Check minNeighbors (like OpenCV's minNeighbors=5)
            let neighborCount = 0;
            const neighborRadius = Math.floor(faceSize / 8);
            
            for (let ny = Math.max(0, y - neighborRadius); 
                 ny < Math.min(height - faceSize, y + neighborRadius); 
                 ny += stepSize) {
              for (let nx = Math.max(0, x - neighborRadius); 
                   nx < Math.min(width - faceSize, x + neighborRadius); 
                   nx += stepSize) {
                if (nx !== x || ny !== y) {
                  const neighborScore = analyzeFaceRegion(grayData, nx, ny, faceSize, width, height);
                  if (neighborScore > 0.5) {
                    neighborCount++;
                  }
                }
              }
            }
            
            // Only add face if it has enough neighbors (minNeighbors=5)
            if (neighborCount >= minNeighbors) {
              // Check for overlap with existing faces
              let isNewFace = true;
              for (const existingFace of faces) {
                const overlap = calculateOverlap(
                  x, y, faceSize, faceSize,
                  existingFace.x, existingFace.y, existingFace.width, existingFace.height
                );
                if (overlap > 0.3) {
                  isNewFace = false;
                  break;
                }
              }
              
              if (isNewFace) {
                faces.push({
                  x: x,
                  y: y,
                  width: faceSize,
                  height: faceSize,
                  score: faceScore
                });
              }
            }
          }
        }
      }
    }
    
    return faces;
  };

  const analyzeFaceRegion = (grayData, x, y, size, width, height) => {
    let edgePixels = 0;
    let totalPixels = 0;
    let varianceSum = 0;
    let meanSum = 0;
    
    // Calculate mean
    for (let py = y; py < y + size && py < height; py++) {
      for (let px = x; px < x + size && px < width; px++) {
        const grayIdx = py * width + px;
        meanSum += grayData[grayIdx];
        totalPixels++;
      }
    }
    
    if (totalPixels === 0) return 0;
    const mean = meanSum / totalPixels;
    
    // Calculate variance and edge detection
    for (let py = y; py < y + size && py < height; py++) {
      for (let px = x; px < x + size && px < width; px++) {
        const grayIdx = py * width + px;
        const pixelValue = grayData[grayIdx];
        
        // Variance calculation
        varianceSum += (pixelValue - mean) ** 2;
        
        // Edge detection (like Haar features)
        if (py > 0 && py < height - 1 && px > 0 && px < width - 1) {
          const gx = Math.abs(pixelValue - grayData[grayIdx + 1]);
          const gy = Math.abs(pixelValue - grayData[(py + 1) * width + px]);
          if (gx + gy > 20) {
            edgePixels++;
          }
        }
      }
    }
    
    const variance = varianceSum / totalPixels;
    const edgeRatio = edgePixels / totalPixels;
    
    // Face score based on variance (texture) and edges (features)
    return (variance / 10000) * 0.6 + edgeRatio * 0.4;
  };

  const calculateOverlap = (x1, y1, w1, h1, x2, y2, w2, h2) => {
    const left = Math.max(x1, x2);
    const right = Math.min(x1 + w1, x2 + w2);
    const top = Math.max(y1, y2);
    const bottom = Math.min(y1 + h1, y2 + h2);
    
    if (left >= right || top >= bottom) return 0;
    
    const intersection = (right - left) * (bottom - top);
    const union = w1 * h1 + w2 * h2 - intersection;
    
    return intersection / union;
  };

  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFaces = () => {
      if (!video.paused && !video.ended) {
        // Clear the canvas completely each frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Detect faces using OpenCV-style algorithm
        const faces = detectFacesInImage(imageData);
        setFaceDetected(faces.length > 0);
        
        // Draw boxes around detected faces (exactly like face_capture.py)
        faces.forEach((face, index) => {
          const faceId = `face_${index}_${Date.now()}`;
          const result = recognitionResults[faceId];
          
          // Determine color based on recognition result
          let color = '#00ff00'; // Default green like face_capture.py
          if (result) {
            if (result.recognized) {
              color = '#00ff00'; // Green for known person
            } else {
              color = '#ff0000'; // Red for unknown person
            }
          }
          
          // Draw rectangle exactly like cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(face.x, face.y, face.width, face.height);
          
          // Add label
          ctx.fillStyle = color;
          ctx.font = 'bold 14px Arial';
          const label = result ? (result.recognized ? 'KNOWN' : 'UNKNOWN') : 'DETECTED';
          ctx.fillText(label, face.x, face.y - 5);
        });
      }
      
      requestAnimationFrame(detectFaces);
    };

    detectFaces();
  }, [recognitionResults]);

  const toggleVideo = useCallback(() => {
    if (isStreaming) {
      stopVideo();
    } else {
      startVideo();
    }
  }, [isStreaming, startVideo, stopVideo]);

  useEffect(() => {
    startVideo();
    return () => {
      stopVideo();
    };
  }, [startVideo, stopVideo]);

  return (
    <Paper
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)',
        border: '2px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
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
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          Live Camera Feed
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Real-time face detection monitoring
        </Typography>
      </Box>

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

      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid rgba(0, 212, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
            background: '#000',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '640px',
              display: isStreaming ? 'block' : 'none',
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
          
          {!isStreaming && (
            <Box
              sx={{
                width: '640px',
                height: '480px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                color: 'text.secondary',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <VideocamOffIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ letterSpacing: '0.1em' }}>
                  Camera Offline
                </Typography>
              </Box>
            </Box>
          )}

          {/* Face Detection Indicator */}
          {faceDetected && (
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 212, 255, 0.2) 100%)',
                border: '1px solid rgba(0, 255, 136, 0.5)',
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backdropFilter: 'blur(10px)',
                animation: 'pulse 2s infinite',
              }}
            >
              <FaceIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'success.main',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Face Detected
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <IconButton
          onClick={toggleVideo}
          sx={{
            background: isStreaming 
              ? 'linear-gradient(135deg, #ff0066 0%, #ff00ff 100%)'
              : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: 'white',
            p: 2,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: isStreaming 
                ? '0 8px 25px rgba(255, 0, 102, 0.3)'
                : '0 8px 25px rgba(0, 212, 255, 0.3)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isStreaming ? <VideocamOffIcon /> : <VideocamIcon />}
        </IconButton>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: isStreaming ? 'success.main' : 'text.secondary',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {isStreaming ? '● Live Streaming & Auto-Detection' : '● Camera Disconnected'}
        </Typography>
      </Box>
    </Paper>
  );
}

export default LiveVideo;