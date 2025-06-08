import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';
import { PublicRoute } from '@components/auth/PublicRoute';
import { Layout } from '@components/layout/Layout';
import { LoadingScreen } from '@components/common/LoadingScreen';

// Pages
import LoginPage from '@pages/auth/LoginPage';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@pages/auth/ResetPasswordPage';
import CompleteProfilePage from '@pages/auth/CompleteProfilePage';
import ChangePasswordPage from '@pages/auth/ChangePasswordPage';

import DashboardPage from '@pages/dashboard/DashboardPage';
import CoursesPage from '@pages/courses/CoursesPage';
import CourseDetailPage from '@pages/courses/CourseDetailPage';
import ContentViewerPage from '@pages/content/ContentViewerPage';
import LibraryPage from '@pages/library/LibraryPage';
import UsersPage from '@pages/users/UsersPage';
import ProfilePage from '@pages/profile/ProfilePage';
import SettingsPage from '@pages/settings/SettingsPage';
import AnalyticsPage from '@pages/analytics/AnalyticsPage';
import NotFoundPage from '@pages/error/NotFoundPage';

const App: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { tenant, isLoading: tenantLoading } = useSelector((state: RootState) => state.tenant);

  // Show loading screen while initializing
  if (isLoading || tenantLoading) {
    return <LoadingScreen />;
  }

  // If no tenant is resolved and we're not on a public route, show error
  if (!tenant && !window.location.pathname.includes('/auth')) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <h1>Institution Not Found</h1>
        <p>The institution you're trying to access could not be found.</p>
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/auth/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/auth/complete-profile"
        element={
          <ProtectedRoute requireProfileCompletion={false}>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth/change-password"
        element={
          <ProtectedRoute requireProfileCompletion={false}>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Main Application Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Courses */}
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/content/:id" element={<ContentViewerPage />} />
                
                {/* Library */}
                <Route path="/library" element={<LibraryPage />} />
                
                {/* Users (Admin/Faculty only) */}
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute roles={['institution_admin', 'faculty']}>
                      <UsersPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Analytics (Admin/Faculty only) */}
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute roles={['institution_admin', 'faculty']}>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Profile & Settings */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default App;