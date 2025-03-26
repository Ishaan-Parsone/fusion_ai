import React from 'react';
import { Container, AppBar, Typography, Toolbar } from '@mui/material';
import ForecastChart from './ForecastChart'; // Import ForecastChart

const App = () => {
  return (
    <Container maxWidth="md" style={{ paddingTop: '50px' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Sales Forecast</Typography>
        </Toolbar>
      </AppBar>
      <ForecastChart /> {/* No need to pass productId here anymore */}
    </Container>
  );
};

export default App;
