import { useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Drawer,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Chip,
  Avatar,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { departmentsAPI } from '@/api/departments';
import {
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  EventNote as ReservationIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  Assessment as StatsIcon,
  Apartment as DepartmentsIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import UserGuide from './UserGuide';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: ReactElement;
  path: string;
  badge?: number;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  width?: number;
}

// Menu items pour utilisateurs standards
const userMenuItems: MenuItem[] = [
  { 
    text: 'Tableau de bord', 
    icon: <DashboardIcon />, 
    path: '/dashboard',
  },
  { 
    text: 'Mes Notifications', 
    icon: <NotificationsIcon />, 
    path: '/notifications',
  },
  { 
    text: 'Rechercher une salle', 
    icon: <SearchIcon />, 
    path: '/rooms',
  },
  { 
    text: 'Mes Réservations', 
    icon: <ReservationIcon />, 
    path: '/reservations',
  },
  { 
    text: 'Calendrier', 
    icon: <CalendarIcon />, 
    path: '/calendar',
  },
  { 
    text: 'Mon Historique', 
    icon: <HistoryIcon />, 
    path: '/history',
  },
  { 
    text: 'Mes Signalements', 
    icon: <HelpIcon />, 
    path: '/my-tickets',
  },
  { 
    text: 'Mon Profil', 
    icon: <PersonIcon />, 
    path: '/profile',
  },
];

// Menu items pour administrateurs
const adminMenuItems: MenuItem[] = [
  { 
    text: 'Dashboard', 
    icon: <AdminIcon />, 
    path: '/admin',
  },
  { 
    text: 'Notifications Globales', 
    icon: <NotificationsIcon />, 
    path: '/admin/notifications',
  },
  { 
    text: 'Gestion Réservations', 
    icon: <ReservationIcon />, 
    path: '/admin/reservations',
  },
  { 
    text: 'Historique Global', 
    icon: <HistoryIcon />, 
    path: '/admin/history',
  },
  { 
    text: 'Gestion Utilisateurs', 
    icon: <PeopleIcon />, 
    path: '/admin/users',
  },
  { 
    text: 'Gestion Salles', 
    icon: <RoomIcon />, 
    path: '/admin/rooms',
  },
  { 
    text: 'Départements',
    icon: <DepartmentsIcon />,
    path: '/admin/departments',
  },
  { 
    text: 'Statistiques', 
    icon: <StatsIcon />, 
    path: '/admin/statistics',
  },
  { 
    text: 'Support & Signalements', 
    icon: <HelpIcon />, 
    path: '/admin/support',
  },
  { 
    text: 'Paramètres',
    icon: <SettingsIcon />,
    path: '/admin/settings',
  },
];

// Composant Sidebar
const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  width = drawerWidth,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isResponsable, fullName, roleLabel, initials } = useAuth();
  const [adminOpen, setAdminOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  // Récupérer le nombre de départements pour afficher un badge
  const { data: departments = [], isLoading: depsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => departmentsAPI.getAll(),
    enabled: Boolean(isAdmin || isResponsable),
  });

  const departmentsCount = Array.isArray(departments) ? departments.length : 0;

  const handleNavigation = (path: string): void => {
    navigate(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const isActive = (path: string): boolean => {
    if (path === '/dashboard' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
      color: '#ffffff',
    }}>
      {/* Header avec logo */}
      <Toolbar sx={{ px: 2, py: 1.2, minHeight: '64px !important', borderBottom: '2px solid #f9a825' }}>
        <Box display="flex" alignItems="center" gap={1.5} width="100%">
          <Box
            component="img"
            src="/images/logo.png"
            alt="Port Autonome de Lomé"
            sx={{ height: 30, width: 'auto' }}
          />
          <Box>
            <Typography variant="body2" fontWeight="700" noWrap sx={{ color: '#ffffff', fontSize: '0.85rem' }}>
              Port Autonome
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: '#fbc02d', fontSize: '0.65rem' }}>
              Réservation de Salles
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Menu principal */}
      <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        {userMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                color: 'rgba(255,255,255,0.8)',
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  bgcolor: 'rgba(249, 168, 37, 0.25)',
                  color: '#ffffff',
                  borderLeft: '3px solid #f9a825',
                  boxShadow: '0 2px 8px rgba(249, 168, 37, 0.3)',
                  '& .MuiListItemIcon-root': {
                    color: '#fbc02d',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              {item.badge && (
                <Chip label={item.badge} size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Section Admin */}
      {(isAdmin || isResponsable) && (
        <>
          <Divider sx={{ mx: 2, my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          <List sx={{ px: 1.5 }}>
            {/* Header Admin */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setAdminOpen(!adminOpen)}
                sx={{ borderRadius: 2, color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#f9a825' }}>
                  <AdminIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Administration"
                  primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}
                />
                {adminOpen ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />}
              </ListItemButton>
            </ListItem>

            {/* Sous-menu Admin */}
            <Collapse in={adminOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {(() => {
                  let itemsToRender: MenuItem[] = [];
                  if (isAdmin) {
                    itemsToRender = adminMenuItems;
                  } else if (isResponsable) {
                    const excluded = ['/admin/users', '/admin/rooms', '/admin/departments', '/admin/settings', '/admin/support'];
                    itemsToRender = adminMenuItems.filter(i => !excluded.includes(i.path));
                  }
                  return itemsToRender.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton onClick={() => handleNavigation(item.path)} selected={isActive(item.path)} sx={{ pl: 3, borderRadius: 2, color: 'rgba(255,255,255,0.8)', '&.Mui-selected': { bgcolor: 'rgba(249, 168, 37, 0.25)', color: '#ffffff', '& .MuiListItemIcon-root': { color: '#f9a825' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                        <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.7)' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                        {item.path === '/admin/departments' && (
                          <Chip label={depsLoading ? '…' : departmentsCount} size="small" color="secondary" sx={{ ml: 1, height: 22, fontSize: '0.7rem' }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ));
                })()}
              </List>
            </Collapse>
          </List>
        </>
      )}

      {/* Bouton Guide d'utilisation */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />
      <Box sx={{ px: 1.5, py: 1 }}>
        <ListItemButton
          onClick={() => setGuideOpen(true)}
          sx={{
            borderRadius: 2,
            color: 'rgba(255,255,255,0.9)',
            bgcolor: 'rgba(249, 168, 37, 0.15)',
            border: '1px dashed rgba(249, 168, 37, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(249, 168, 37, 0.25)',
              borderColor: '#f9a825',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#f9a825' }}>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText
            primary="Guide d'utilisation"
            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>

      {/* Footer avec info utilisateur */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#f9a825', color: '#000000', fontSize: '0.875rem', fontWeight: 700, border: '2px solid #fbc02d', boxShadow: '0 2px 8px rgba(249, 168, 37, 0.4)' }}>{initials}</Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight="600" noWrap sx={{ color: '#ffffff' }}>{fullName}</Typography>
            <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.7)' }}>{roleLabel}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Modal du guide */}
      <UserGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={Boolean(mobileOpen)}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
            borderRight: 'none',
            boxShadow: 3,
            background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
            color: '#ffffff',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
            borderRight: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
            color: '#ffffff',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
