import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FA5A50', // CI&T "Bright Coral"
    },
    secondary: {
      main: '#FAB9FF', // CI&T "Soft Pink"
    },
    background: {
      default: '#1A1A1A', // A sophisticated, deep charcoal
      paper: '#2C2C2C',   // A slightly lighter grey for surfaces
    },
    text: {
      primary: '#F4F6F8', // A soft white for readability
      secondary: '#B4DCFA', // CI&T "Light Blue" for secondary text
    },
    action: {
      hover: 'rgba(250, 90, 80, 0.1)', // A subtle hover for the primary color
    },
    info: {
      main: '#B4DCFA', // CI&T "Light Blue"
    },
    divider: 'rgba(180, 220, 250, 0.2)', // A divider based on the light blue
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#FFFFFF',
    },
    h6: {
      fontWeight: 600,
      color: '#FFFFFF',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '.ql-editor a': {
          color: '#B4DCFA', // CI&T "Light Blue" for all links in the editor
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderTop: `2px solid #FA5A50`, 
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
            borderTop: 'none',
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#B4DCFA', // CI&T "Light Blue" for standard MUI Links
          textDecorationColor: '#B4DCFA',
        },
      },
    },
  },
});

export default theme;