import { apiClient } from './client';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  CompleteProfileRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
} from '@types/auth';

export const authAPI = {
  // Authentication
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),

  logout: () =>
    apiClient.post('/auth/logout'),

  logoutAll: () =>
    apiClient.post('/auth/logout-all'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken }),

  // Profile management
  getProfile: () =>
    apiClient.get<{ user: User }>('/auth/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<{ user: User }>('/auth/me', data),

  completeProfile: (data: CompleteProfileRequest) =>
    apiClient.post<{ profileCompleted: boolean }>('/auth/complete-profile', data),

  // Password management
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post('/auth/change-password', data),

  forgotPassword: (identifier: string) =>
    apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { identifier }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post('/auth/reset-password', data),

  // Two-factor authentication
  setupTwoFactor: () =>
    apiClient.post<TwoFactorSetupResponse>('/auth/setup-2fa'),

  enableTwoFactor: (data: TwoFactorVerifyRequest) =>
    apiClient.post('/auth/enable-2fa', data),

  disableTwoFactor: (data: TwoFactorVerifyRequest) =>
    apiClient.post('/auth/disable-2fa', data),

  verifyTwoFactor: (data: TwoFactorVerifyRequest) =>
    apiClient.post('/auth/verify-2fa', data),

  // Avatar upload
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post<{ avatarUrl: string }>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};