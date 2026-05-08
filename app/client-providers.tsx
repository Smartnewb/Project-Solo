'use client';

import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme, type Shadows } from '@mui/material/styles';
import { ModalProvider } from '@/shared/ui/modal/context';

const airbnbShadow =
  'rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0';

const airbnbAdminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff385c',
      dark: '#e00b41',
      light: '#ffd1da',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#222222',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#222222',
      secondary: '#6a6a6a',
      disabled: '#929292',
    },
    divider: '#dddddd',
    error: {
      main: '#c13515',
      dark: '#b32505',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#b26a00',
    },
    success: {
      main: '#008a05',
    },
  },
  typography: {
    fontFamily: '"Airbnb Cereal VF", Circular, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    h1: { fontSize: 28, lineHeight: 1.43, fontWeight: 700, letterSpacing: 0 },
    h2: { fontSize: 22, lineHeight: 1.18, fontWeight: 500, letterSpacing: '-0.44px' },
    h3: { fontSize: 21, lineHeight: 1.43, fontWeight: 700, letterSpacing: 0 },
    h4: { fontSize: 20, lineHeight: 1.2, fontWeight: 600, letterSpacing: '-0.18px' },
    h5: { fontSize: 16, lineHeight: 1.25, fontWeight: 600, letterSpacing: 0 },
    h6: { fontSize: 16, lineHeight: 1.25, fontWeight: 500, letterSpacing: 0 },
    body1: { fontSize: 16, lineHeight: 1.5, fontWeight: 400, letterSpacing: 0 },
    body2: { fontSize: 14, lineHeight: 1.43, fontWeight: 400, letterSpacing: 0 },
    button: { fontSize: 16, lineHeight: 1.25, fontWeight: 500, letterSpacing: 0, textTransform: 'none' },
    caption: { fontSize: 13, lineHeight: 1.23, fontWeight: 400, letterSpacing: 0 },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: ['none', ...Array(24).fill(airbnbShadow)] as Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
          color: '#222222',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: '#dddddd',
        },
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #dddddd',
          borderRadius: 14,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 40,
          boxShadow: 'none',
          textTransform: 'none',
        },
        containedPrimary: {
          backgroundColor: '#ff385c',
          '&:hover': {
            backgroundColor: '#e00b41',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#222222',
          color: '#222222',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
        },
        colorPrimary: {
          backgroundColor: '#ff385c',
          color: '#ffffff',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#222222',
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: '#dddddd',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#222222',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#6a6a6a',
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-selected': {
            color: '#222222',
          },
        },
      },
    },
  },
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={airbnbAdminTheme}>
      <CssBaseline />
      <ModalProvider>
        {children}
      </ModalProvider>
    </ThemeProvider>
  );
}
