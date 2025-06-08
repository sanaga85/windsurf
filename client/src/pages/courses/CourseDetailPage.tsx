import React from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Course Details</Typography>
      <Typography variant="body1">Course ID: {id}</Typography>
      <Typography variant="body1">Detailed course view will be implemented here.</Typography>
    </Box>
  );
};

export default CourseDetailPage;