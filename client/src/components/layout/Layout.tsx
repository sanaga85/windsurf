import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@store/index';
import { logout } from '@store/slices/authSlice';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tenant } = useSelector((state: RootState) => state.tenant);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {tenant?.name || 'ScholarBridge LMS'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.firstName || user?.username}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};