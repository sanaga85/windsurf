import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi';

interface UIState {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // For mobile
  language: Language;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  layout: {
    density: 'comfortable' | 'compact';
    fontSize: 'small' | 'medium' | 'large';
  };
  loading: {
    global: boolean;
    operations: Record<string, boolean>;
  };
  modals: {
    [key: string]: boolean;
  };
  snackbars: Array<{
    id: string;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
    autoHide?: boolean;
    duration?: number;
  }>;
}

const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  sidebarOpen: false,
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
  },
  layout: {
    density: 'comfortable',
    fontSize: 'medium',
  },
  loading: {
    global: false,
    operations: {},
  },
  modals: {},
  snackbars: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // Sidebar
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarOpen: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    // Language
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },

    // Notifications
    setNotificationSettings: (state, action: PayloadAction<Partial<UIState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },

    // Layout
    setLayoutSettings: (state, action: PayloadAction<Partial<UIState['layout']>>) => {
      state.layout = { ...state.layout, ...action.payload };
    },

    // Loading
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setOperationLoading: (state, action: PayloadAction<{ operation: string; loading: boolean }>) => {
      const { operation, loading } = action.payload;
      if (loading) {
        state.loading.operations[operation] = true;
      } else {
        delete state.loading.operations[operation];
      }
    },
    clearAllLoading: (state) => {
      state.loading.global = false;
      state.loading.operations = {};
    },

    // Modals
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    toggleModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    closeAllModals: (state) => {
      state.modals = {};
    },

    // Snackbars
    addSnackbar: (state, action: PayloadAction<Omit<UIState['snackbars'][0], 'id'>>) => {
      const id = Date.now().toString();
      state.snackbars.push({
        id,
        autoHide: true,
        duration: 6000,
        ...action.payload,
      });
    },
    removeSnackbar: (state, action: PayloadAction<string>) => {
      state.snackbars = state.snackbars.filter(snackbar => snackbar.id !== action.payload);
    },
    clearSnackbars: (state) => {
      state.snackbars = [];
    },

    // Bulk actions
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme,
        language: state.language,
        notifications: state.notifications,
        layout: state.layout,
      };
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebarCollapsed,
  setSidebarOpen,
  toggleSidebarOpen,
  setLanguage,
  setNotificationSettings,
  setLayoutSettings,
  setGlobalLoading,
  setOperationLoading,
  clearAllLoading,
  openModal,
  closeModal,
  toggleModal,
  closeAllModals,
  addSnackbar,
  removeSnackbar,
  clearSnackbars,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;