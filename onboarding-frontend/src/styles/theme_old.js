import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // A blue color similar to the reference
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b',   // slate-800
    },
    text: {
      primary: '#e2e8f0', // slate-200
      secondary: '#94a3b8', // slate-400
    },
    action: {
      hover: 'rgba(59, 130, 246, 0.15)', // Lighter blue on hover
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove gradients for a flatter look
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Buttons with normal capitalization
          borderRadius: '0.5rem',
        },
      },
    },
  },
});

export default theme;