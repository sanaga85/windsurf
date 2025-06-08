import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // If authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    // Check if password change is required
    if (user.forcePasswordChange) {
      return <Navigate to="/auth/change-password" replace />;
    }

    // Check if profile completion is required
    if (!user.profileCompleted) {
      return <Navigate to="/auth/complete-profile" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};