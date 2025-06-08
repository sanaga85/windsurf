import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import App from './App';
import { store } from '@store/index';
import { createAppTheme } from '@utils/theme';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { ToastProvider } from '@components/common/ToastProvider';
import { AuthProvider } from '@components/auth/AuthProvider';
import { TenantProvider } from '@components/tenant/TenantProvider';

import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Create theme
const theme = createAppTheme();

// Hide loading screen when app loads
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  document.body.classList.add('app-loaded');
};

// Root component
const Root: React.FC = () => {
  React.useEffect(() => {
    // Hide loading screen after a short delay to ensure smooth transition
    const timer = setTimeout(hideLoadingScreen, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <BrowserRouter>
                    <TenantProvider>
                      <AuthProvider>
                        <ToastProvider>
                          <App />
                        </ToastProvider>
                      </AuthProvider>
                    </TenantProvider>
                  </BrowserRouter>
                </LocalizationProvider>
              </ThemeProvider>
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </QueryClientProvider>
          </Provider>
        </HelmetProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Render app
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<Root />);
} else {
  console.error('Root container not found');
}