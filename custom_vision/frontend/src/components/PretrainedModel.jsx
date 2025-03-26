import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Paper,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import {
  Security,
  Visibility
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';

function PretrainedModel() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [privacyLevel, setPrivacyLevel] = useState('high');
  const { token } = useAuth();
  const originalImageRef = useRef(null);
  const detectionsImageRef = useRef(null);

  // Class mapping for converting numeric classes to readable names
  const classMapping = {
    0: 'Hammer',
    1: 'Piler',
    // Add more mappings as needed for your model
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        setFile(acceptedFiles[0]);
        setError(null);
      }
    }
  });

  const drawBoundingBoxes = (canvas, image, detections) => {
    if (!detections || !canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / image.width;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    detections.forEach(detection => {
      // Handle the nested array structure for bbox
      const [x, y, width, height] = Array.isArray(detection.bbox[0])
        ? detection.bbox[0]
        : detection.bbox;

      // Draw bounding box
      ctx.strokeStyle = '#9c27b0';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x * scale,
        y * scale,
        (width - x) * scale,
        (height - y) * scale
      );

      // Draw label background
      ctx.fillStyle = '#9c27b0';

      // Convert class number to readable name
      const className = classMapping[detection.class] || `Class ${detection.class}`;
      const label = `${className} ${(detection.confidence * 100).toFixed(1)}%`;
      const labelWidth = ctx.measureText(label).width + 10;

      ctx.fillRect(
        x * scale,
        y * scale - 25,
        labelWidth,
        20
      );

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(
        label,
        x * scale + 5,
        y * scale - 10
      );
    });
  };

  const handleDetection = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('privacy_level', privacyLevel);
    formData.append('analysis_type', 'object');
    formData.append('debug', 'true');

    try {
      const response = await axios.post(
        'http://localhost:8000/api/predict/pretrained/',
        formData,
        {
          headers: {
            'X-Admin-Token': token,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      console.log("API Response:", response.data);
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderImageWithDetections = () => {
    if (!file || !result) return null;

    return (
      <Grid container spacing={3}>
        {/* Original Image */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Original Image
            </Typography>
            <Box sx={{ position: 'relative', mt: 2 }}>
              <img
                src={URL.createObjectURL(file)}
                alt="Original"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Detection Results */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Detection Results
            </Typography>
            <Box sx={{ position: 'relative', mt: 2 }}>
              <canvas
                ref={detectionsImageRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  useEffect(() => {
    if (file && result?.detections) {
      const img = new Image();
      img.onload = () => {
        const canvas = detectionsImageRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          drawBoundingBoxes(canvas, img, result.detections);
        }
      };
      img.src = URL.createObjectURL(file);

      return () => {
        URL.revokeObjectURL(img.src);
      };
    }
  }, [file, result]);

  return (
    <Card>
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Upload Section */}
          <Paper sx={{ p: 3 }}>
            <Box {...getRootProps()} sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'rgba(156, 39, 176, 0.04)',
              },
            }}>
              <input {...getInputProps()} />
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography>
                Drag & drop an image here, or click to select
              </Typography>
              {file && (
                <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                  Selected: {file.name}
                </Typography>
              )}
            </Box>

            {/* Privacy Level Selection */}
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Privacy Level</InputLabel>
              <Select
                value={privacyLevel}
                label="Privacy Level"
                onChange={(e) => setPrivacyLevel(e.target.value)}
              >
                <MenuItem value="high">High Privacy</MenuItem>
                <MenuItem value="medium">Medium Privacy</MenuItem>
                <MenuItem value="low">Low Privacy</MenuItem>
              </Select>
            </FormControl>

            {file && (
              <Button
                variant="contained"
                onClick={handleDetection}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Process Image'
                )}
              </Button>
            )}
          </Paper>

          {/* Results Section */}
          {result && (
            <>
              {renderImageWithDetections()}

              {/* Detection Stats */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Detected Objects
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Objects
                      </Typography>
                      <Typography variant="h3" sx={{ color: 'primary.main' }}>
                        {result.detections?.length || 0}
                      </Typography>
                    </Box>
                  </Grid>

                  {result.detections?.map((obj, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            icon={<Visibility />}
                            label={obj.name || `Class ${obj.class}`}  // Use the name property directly
                            color="primary"
                            variant="outlined"
                          />
                          <Typography sx={{ ml: 1 }}>
                            {(obj.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={obj.confidence * 100}
                          sx={{ mt: 1 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PretrainedModel;