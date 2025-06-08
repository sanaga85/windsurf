import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tenantAPI } from '@services/api/tenantAPI';
import { Institution } from '@types/tenant';

interface TenantState {
  tenant: Institution | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  tenant: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const resolveTenant = createAsyncThunk(
  'tenant/resolve',
  async (subdomain: string, { rejectWithValue }) => {
    try {
      const response = await tenantAPI.resolveTenant(subdomain);
      return response.data.institution;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resolve tenant');
    }
  }
);

export const getTenantInfo = createAsyncThunk(
  'tenant/getInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tenantAPI.getTenantInfo();
      return response.data.institution;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get tenant info');
    }
  }
);

// Tenant slice
const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    clearTenant: (state) => {
      state.tenant = null;
      state.error = null;
    },
    setTenant: (state, action: PayloadAction<Institution>) => {
      state.tenant = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Resolve Tenant
    builder
      .addCase(resolveTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resolveTenant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenant = action.payload;
        state.error = null;
      })
      .addCase(resolveTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.tenant = null;
      });

    // Get Tenant Info
    builder
      .addCase(getTenantInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTenantInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenant = action.payload;
      })
      .addCase(getTenantInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTenant, setTenant, clearError } = tenantSlice.actions;

export default tenantSlice.reducer;