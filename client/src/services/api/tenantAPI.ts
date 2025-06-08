import { apiClient } from './client';
import { Institution, TenantResolutionResult } from '@types/tenant';

export const tenantAPI = {
  // Resolve tenant from subdomain
  resolveTenant: (subdomain: string) =>
    apiClient.get<{ institution: Institution }>(`/tenant/resolve/${subdomain}`),

  // Get current tenant information
  getTenantInfo: () =>
    apiClient.get<{ institution: Institution }>('/tenant/info'),

  // Get tenant statistics
  getTenantStats: () =>
    apiClient.get('/tenant/stats'),

  // Get tenant usage data
  getTenantUsage: (params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'day' | 'week' | 'month';
  }) =>
    apiClient.get('/tenant/usage', { params }),

  // Update tenant settings (Admin only)
  updateTenantSettings: (settings: any) =>
    apiClient.put('/tenant/settings', settings),

  // Update tenant branding (Admin only)
  updateTenantBranding: (branding: any) =>
    apiClient.put('/tenant/branding', branding),

  // Upload tenant logo
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post<{ logoUrl: string }>('/tenant/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload tenant favicon
  uploadFavicon: (file: File) => {
    const formData = new FormData();
    formData.append('favicon', file);
    return apiClient.post<{ faviconUrl: string }>('/tenant/favicon', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};