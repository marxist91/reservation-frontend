import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Pages Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages Public
import LandingPage from './pages/public/LandingPage';

// Pages User
import UserDashboard from './pages/user/Dashboard';
import MyReservations from './pages/user/MyReservations';
import SearchRooms from './pages/user/SearchRooms';
import RoomDetails from './pages/user/RoomDetails';
import Profile from './pages/user/Profile';
import Calendar from './pages/user/Calendar';
import MyTickets from './pages/user/MyTickets';

// Pages Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import RoomsManagement from './pages/admin/RoomsManagement';
import ReservationsManagement from './pages/admin/ReservationsManagement';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminHistory from './pages/admin/AdminHistory';
import Statistics from './pages/admin/Statistics';
import Departments from './pages/admin/Departments';
import Settings from './pages/admin/Settings';
import SupportTickets from './pages/admin/SupportTickets';

// Pages Autres
import NotFound from './pages/NotFound';
import TestConnection from './pages/TestConnection';
import Notifications from './pages/common/Notifications';
import History from './pages/common/History';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import type { UserRole } from './types';

const ADMIN_ROLE: UserRole = 'admin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Thème Material-UI - Port Autonome de Lomé
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#63a4ff',
      dark: '#004ba0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f9a825',
      light: '#ffc046',
      dark: '#c17900',
      contrastText: '#000000',
    },
    background: {
      default: '#fafbfc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#546e7a',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 4px 8px rgba(10, 66, 117, 0.08)',
    '0px 8px 16px rgba(10, 66, 117, 0.1)',
    '0px 12px 24px rgba(10, 66, 117, 0.12)',
    '0px 16px 32px rgba(10, 66, 117, 0.14)',
    '0px 20px 40px rgba(10, 66, 117, 0.16)',
    '0px 24px 48px rgba(10, 66, 117, 0.18)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
    '0px 2px 4px rgba(10, 66, 117, 0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(10, 66, 117, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f9a825 0%, #fbc02d 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f57f17 0%, #f9a825 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(10, 66, 117, 0.08)',
          borderTop: '3px solid #f9a825',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <BrowserRouter>
            <Toaster position="top-right" />
          <Routes>
            {/* Page d'accueil publique */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/test-connection" element={<TestConnection />} />

            {/* Routes protégées avec Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard User */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/reservations" element={<MyReservations />} />
              <Route path="/rooms" element={<SearchRooms />} />
              <Route path="/rooms/:id" element={<RoomDetails />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Routes communes (notifications et historique) */}
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/history" element={<History />} />
              <Route path="/my-tickets" element={<MyTickets />} />

              {/* Routes Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole={[ADMIN_ROLE, 'responsable']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole={ADMIN_ROLE}>
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rooms"
                element={
                  <ProtectedRoute requiredRole={ADMIN_ROLE}>
                    <RoomsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reservations"
                element={
                  <ProtectedRoute requiredRole={[ADMIN_ROLE, 'responsable']}>
                    <ReservationsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute requiredRole={[ADMIN_ROLE, 'responsable']}>
                    <AdminNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/history"
                element={
                  <ProtectedRoute requiredRole={[ADMIN_ROLE, 'responsable']}>
                    <AdminHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/statistics"
                element={
                  <ProtectedRoute requiredRole={[ADMIN_ROLE, 'responsable']}>
                    <Statistics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute requiredRole={ADMIN_ROLE}>
                    <Departments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole={ADMIN_ROLE}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <ProtectedRoute requiredRole={ADMIN_ROLE}>
                    <SupportTickets />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </LocalizationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
