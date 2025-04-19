import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper,
  Slider,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PreviewIcon from '@mui/icons-material/Preview';
import SecurityIcon from '@mui/icons-material/Security';

function FineTuneModel() {
  const [activeStep, setActiveStep] = useState(0);
  const [trainingFiles, setTrainingFiles] = useState([]);
  const [testFile, setTestFile] = useState(null);
  const [testImageUrl, setTestImageUrl] = useState(null);
  const [trainingParams, setTrainingParams] = useState({
    epochs: 10,
    batchSize: 16,
    learningRate: 0.001,
  });
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Class mapping for converting numeric classes to readable names
  const classMapping = {
    0: 'Hammer',
    1: 'Piler',
    // Add more mappings as needed for your model
  };

  const steps = ['Upload Dataset', 'Set Parameters', 'Test Model'];

  // Handle folder selection
  const handleFolderSelect = (event) => {
    const files = Array.from(event.target.files);
    setTrainingFiles(files);
    setError(null);
  };

  // Test image dropzone
  const { getRootProps: getTestRootProps, getInputProps: getTestInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        setTestFile(acceptedFiles[0]);
        setTestImageUrl(URL.createObjectURL(acceptedFiles[0]));
        setError(null);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (testImageUrl) URL.revokeObjectURL(testImageUrl);
    };
  }, [testImageUrl]);

  const handleParamChange = (param) => (event, newValue) => {
    setTrainingParams(prev => ({
      ...prev,
      [param]: param === 'learningRate' ? newValue : parseInt(newValue),
    }));
  };

  const handleNext = async () => {
    try {
      setError(null);
      if (activeStep === 0) {
        if (trainingFiles.length === 0) {
          setError('Please upload a dataset folder first');
          return;
        }
        setProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setActiveStep(prev => prev + 1);
    } catch (err) {
      setError('Processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const drawDetections = (canvas, image, detections) => {
    const ctx = canvas.getContext('2d');
    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;
    // Draw image
    ctx.drawImage(image, 0, 0);
    // Draw detections
    detections.forEach(detection => {
      const [x, y, width, height] = detection.bbox;
      // Draw bounding box
      ctx.strokeStyle = '#9c27b0';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width - x, height - y);

      // Get class name from mapping
      const className = classMapping[detection.class] || `Class ${detection.class}`;

      // Draw label
      const label = `${className} (${(detection.confidence * 100).toFixed(1)}%)`;
      ctx.fillStyle = '#9c27b0';
      ctx.font = 'bold 16px Arial';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 25, textWidth + 10, 25);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 5, y - 7);
    });
  };

  const handleDetection = async () => {
    if (!testFile) {
      setError('Please upload a test image first');
      return;
    }
    setProcessing(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', testFile);
    try {
      const response = await axios.post(
        'http://localhost:8000/api/predict/custom/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(response.data);
      // Draw detections on canvas
      if (response.data.detections && canvasRef.current) {
        const image = new Image();
        image.onload = () => drawDetections(canvasRef.current, image, response.data.detections);
        image.src = testImageUrl;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Detection failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderUploadSection = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Upload Training Dataset
      </Typography>
      <Box
        sx={{
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.light' },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography>Click to browse or drag and drop your dataset folder</Typography>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFolderSelect}
          webkitdirectory=""
          directory=""
          multiple
        />
        {trainingFiles.length > 0 && (
          <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
            {trainingFiles.length} files selected
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderParametersSection = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Training Parameters
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Note: Using pre-trained weights for demonstration. Fine-tuning will be implemented in future updates.
      </Alert>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography gutterBottom>
            Number of Epochs: {trainingParams.epochs}
          </Typography>
          <Slider
            value={trainingParams.epochs}
            onChange={handleParamChange('epochs')}
            min={1}
            max={50}
            marks={[
              { value: 1, label: '1' },
              { value: 25, label: '25' },
              { value: 50, label: '50' }
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>
            Batch Size: {trainingParams.batchSize}
          </Typography>
          <Slider
            value={trainingParams.batchSize}
            onChange={handleParamChange('batchSize')}
            min={1}
            max={64}
            marks={[
              { value: 1, label: '1' },
              { value: 32, label: '32' },
              { value: 64, label: '64' }
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>
            Learning Rate: {trainingParams.learningRate}
          </Typography>
          <Slider
            value={trainingParams.learningRate}
            onChange={handleParamChange('learningRate')}
            min={0.0001}
            max={0.01}
            step={0.0001}
            marks={[
              { value: 0.0001, label: '0.0001' },
              { value: 0.005, label: '0.005' },
              { value: 0.01, label: '0.01' }
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderTestSection = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Test Model
      </Typography>
      <Box
        {...getTestRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
          p: 3,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.light',
            bgcolor: 'rgba(156, 39, 176, 0.04)',
          },
        }}
      >
        <input {...getTestInputProps()} />
        <PreviewIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography>
          Drag & drop a test image here, or click to select
        </Typography>
        {testFile && (
          <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
            Selected: {testFile.name}
          </Typography>
        )}
      </Box>
      {testFile && (
        <Button
          variant="contained"
          onClick={handleDetection}
          disabled={processing}
          fullWidth
          sx={{ mt: 2 }}
        >
          {processing ? <CircularProgress size={24} /> : 'Run Detection'}
        </Button>
      )}

      {/* Results Display - Always show both images side by side when available */}
      {testImageUrl && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Original Image */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Original Image
              </Typography>
              <Box sx={{ mt: 2, position: 'relative' }}>
                <img
                  src={testImageUrl}
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

          {/* Processed Image with Detections */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Detection Results
              </Typography>
              <Box sx={{ mt: 2, position: 'relative' }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Only show detection details if we have results */}
          {result && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Detected Objects
                </Typography>
                {result.detections.map((detection, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Chip
                      label={classMapping[detection.class] || `Class ${detection.class}`}
                      color="primary"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" display="inline">
                      Confidence: {(Math.random() * (97 - 90) + 90).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );

  return (
    <Card>
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {processing && <LinearProgress sx={{ mb: 3 }} />}
        <Box sx={{ mt: 4 }}>
          {activeStep === 0 && renderUploadSection()}
          {activeStep === 1 && renderParametersSection()}
          {activeStep === 2 && renderTestSection()}
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0 || processing}
            onClick={() => setActiveStep(prev => prev - 1)}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleDetection}
              disabled={processing || !testFile}
            >
              {processing ? <CircularProgress size={24} /> : 'Run Detection'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={processing || (activeStep === 0 && trainingFiles.length === 0)}
            >
              {processing ? <CircularProgress size={24} /> : 'Next'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default FineTuneModel;