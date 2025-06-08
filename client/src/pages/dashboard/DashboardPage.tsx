import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@store/index';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tenant } = useSelector((state: RootState) => state.tenant);

  const dashboardCards = [
    {
      title: 'Courses',
      description: 'Access your courses and learning materials',
      action: 'View Courses',
      path: '/courses',
      roles: ['student', 'faculty', 'institution_admin']
    },
    {
      title: 'Library',
      description: 'Browse books and digital resources',
      action: 'Browse Library',
      path: '/library',
      roles: ['student', 'faculty', 'librarian', 'institution_admin']
    },
    {
      title: 'Users',
      description: 'Manage users and permissions',
      action: 'Manage Users',
      path: '/users',
      roles: ['institution_admin', 'faculty']
    },
    {
      title: 'Analytics',
      description: 'View reports and analytics',
      action: 'View Analytics',
      path: '/analytics',
      roles: ['institution_admin', 'faculty']
    }
  ];

  const availableCards = dashboardCards.filter(card => 
    card.roles.includes(user?.role || '')
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to {tenant?.name || 'ScholarBridge LMS'}
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Hello {user?.firstName || user?.username}! Here's your dashboard overview.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {availableCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => navigate(card.path)}
                >
                  {card.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {user?.forcePasswordChange && (
        <Card sx={{ mt: 3, backgroundColor: '#fff3cd' }}>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              Password Change Required
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              For security reasons, you need to change your password.
            </Typography>
            <Button 
              variant="contained" 
              color="warning" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/auth/change-password')}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DashboardPage;