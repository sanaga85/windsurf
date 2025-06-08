import React from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const ContentViewerPage: React.FC = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Content Viewer</Typography>
      <Typography variant="body1">Content ID: {id}</Typography>
      <Typography variant="body1">Advanced content viewer with annotations will be implemented here.</Typography>
    </Box>
  );
};

export default ContentViewerPage;