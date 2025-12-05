import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useInitializeNotifications } from '@/hooks';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Initialiser les notifications au chargement
  useInitializeNotifications();

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar 
        onMenuClick={handleDrawerToggle}
        drawerWidth={drawerWidth}
      />

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
        width={drawerWidth}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2.5, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
