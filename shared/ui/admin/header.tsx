'use client';

import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  title?: string;
}

export function AdminHeader({ onMenuToggle, title = 'Admin' }: AdminHeaderProps) {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1a1a2e',
      }}
    >
      <Toolbar>
        {onMenuToggle && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap component="div">
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </AppBar>
  );
}
