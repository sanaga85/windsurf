import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requireProfileCompletion?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles = [],
  requireProfileCompletion = true
}) => {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Force password change required
  if (user.forcePasswordChange && !location.pathname.includes('/auth/change-password')) {
    return <Navigate to="/auth/change-password" replace />;
  }

  // Profile completion required
  if (requireProfileCompletion && !user.profileCompleted && !location.pathname.includes('/auth/complete-profile')) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  // Role-based access control
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};