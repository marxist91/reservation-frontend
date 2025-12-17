import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface NavbarProps {
  onMenuClick: () => void;
  drawerWidth?: number;
  title?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onMenuClick, 
  drawerWidth: customDrawerWidth = drawerWidth,
  title = 'Système de Réservation de Salles',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const navigate = useNavigate();
  const { user, logout, initials, isAdmin, isResponsable } = useAuth();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfile = (): void => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettings = (): void => {
    handleMenuClose();
    navigate('/admin/settings');
  };

  const handleHome = (): void => {
    handleMenuClose();
    navigate('/');
  };

  // Couleur de l'avatar basée sur le rôle (utilise isAdmin/isResponsable du hook)
  const getAvatarColor = (): string => {
    if (isAdmin) return 'error.main';
    if (isResponsable) return 'warning.main';
    return 'primary.main';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${customDrawerWidth}px)` },
        ml: { md: `${customDrawerWidth}px` },
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        color: '#1a1a2e',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderBottom: '3px solid #f9a825',
      }}
    >
      <Toolbar>
        {/* Menu burger pour mobile */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo et Titre */}
        <Box display="flex" alignItems="center" gap={1.5} flexGrow={1}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="Port Autonome de Lomé"
            sx={{
              height: 45,
              width: 'auto',
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: '#1976d2',
            }}
          >
            {title}
          </Typography>
        </Box>
        
        {/* Actualiser */}
        <Tooltip title="Actualiser la page">
          <IconButton 
            color="inherit" 
            onClick={() => window.location.reload()}
            sx={{ mr: 1 }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        {/* Historique */}
        <Tooltip title="Historique">
          <IconButton 
            color="inherit" 
            onClick={() => navigate('/history')}
            sx={{ mr: 1 }}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar et menu utilisateur */}
        <Tooltip title="Mon compte">
          <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
            <Avatar sx={{ bgcolor: getAvatarColor(), width: 40, height: 40 }}>
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Menu utilisateur */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: { width: 220 }
          }}
        >
          {/* Info utilisateur */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.prenom} {user?.nom}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'inline-block',
                mt: 0.5,
                px: 1, 
                py: 0.25, 
                bgcolor: getAvatarColor(),
                color: 'white',
                borderRadius: 1,
                textTransform: 'capitalize'
              }}
            >
              {user?.role}
            </Typography>
          </Box>
          <Divider />
          
          <MenuItem onClick={handleHome}>
            <ListItemIcon>
              <HomeIcon fontSize="small" />
            </ListItemIcon>
            Accueil
          </MenuItem>
          
          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Mon Profil
          </MenuItem>
          
          {isAdmin && (
            <MenuItem onClick={handleSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Paramètres
            </MenuItem>
          )}
          
          <Divider />
          
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
