import { createTheme } from '@mui/material/styles';

// This theme is based on the styles defined in the original production-support-portal's CSS.
// It will serve as the single source of truth for the entire integrated application.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50', // Green, from your portal's --primary-color
    },
    secondary: {
      main: '#f48fb1', // A complementary pink
    },
    background: {
      default: '#1a1a1a', // From --background-color
      paper: '#242424',   // From --card-background-color
    },
    text: {
      primary: '#e0e0e0', // From --text-color
      secondary: '#a0a0a0', // From --text-secondary-color
    },
    divider: '#3e3e3e', // From --border-color
    action: {
      hover: 'rgba(76, 175, 80, 0.08)', // A subtle hover based on the primary green
      selected: 'rgba(76, 175, 80, 0.16)',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Styling for links inside the rich text editor
        '.ql-editor a': {
          color: '#4caf50',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Ensure a flat background for cards
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
            backgroundColor: '#1E1E1E',
            color: '#FFFFFF',
        }
      }
    },
  },
});

export default theme;
