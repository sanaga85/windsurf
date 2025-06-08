import React from 'react';
import { Box, Typography } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Typography variant="body1">Application settings and preferences will be implemented here.</Typography>
    </Box>
  );
};

export default SettingsPage;