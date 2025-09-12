import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme'; // Assuming this theme file exists from the onboarding-tool
import { NotificationProvider } from './context/NotificationContext'; // Assuming this context provider exists

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        {/* The <BrowserRouter> wrapper has been removed from here */}
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);