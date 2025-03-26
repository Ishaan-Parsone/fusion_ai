// src/components/Dashboard.jsx
import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import PretrainedModel from './PretrainedModel';
import FineTuneModel from './FineTuneModel';

function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ pt: 4, pb: 3, color: 'primary.main' }}>
          Secure Vision AI Platform
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Pre-trained Model" />
          <Tab label="Fine-tune Model" />
        </Tabs>

        {activeTab === 0 && <PretrainedModel />}
        {activeTab === 1 && <FineTuneModel />}
      </Container>
    </Box>
  );
}

export default Dashboard;
