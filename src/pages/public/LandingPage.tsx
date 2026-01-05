import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  keyframes,
} from '@mui/material';
import {
  Login as LoginIcon,
  CalendarMonth as CalendarIcon,
  MeetingRoom as RoomIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { roomsAPI } from '../../api/rooms';
import { reservationsAPI } from '../../api/reservations';
import type { Room, Reservation } from '../../types';
import RoomCard from '../../components/rooms/RoomCard';

// Animations keyframes
const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

const gradientMove = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user, logout } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleGoToProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleGoToDashboard = () => {
    handleMenuClose();
    navigate('/dashboard');
  };

  useEffect(() => {
    loadRooms();
    loadReservations();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsAPI.getAllPublic();
      setRooms(data.slice(0, 6)); // Afficher les 6 premières salles
    } catch (error: any) {
      console.error('Erreur lors du chargement des salles:', error);
    }
  };

  const loadReservations = async () => {
    try {
      const response = await reservationsAPI.getAllPublic();
      console.log('📊 Réservations chargées:', response.data?.length || 0, 'réservations');
      console.log('📋 Détails:', response.data);
      setReservations(response.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des réservations:', error);
    }
  };

  // Générer les jours du mois avec offset pour le premier jour
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0
  };

  const daysInMonth = useMemo(() => 
    getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const firstDayOffset = useMemo(() => 
    getFirstDayOfMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Regrouper les réservations par date
  const reservationsByDate = useMemo(() => {
    const grouped: Record<string, Reservation[]> = {};
    
    reservations.forEach(reservation => {
      const date = reservation.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(reservation);
    });
    
    return grouped;
  }, [reservations]);

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (date: Date) => {
    const todayDate = new Date();
    return date.getDate() === todayDate.getDate() &&
           date.getMonth() === todayDate.getMonth() &&
           date.getFullYear() === todayDate.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getReservationsForDate = (date: Date): Reservation[] => {
    const dateKey = formatDateKey(date);
    return reservationsByDate[dateKey] || [];
  };

  const getStatusBgColor = (statut: string | undefined): string => {
    if (statut === 'rejetee' || statut === 'refusee') return '#d32f2f'; // Rouge
    if (statut === 'annulee') return '#757575'; // Gris
    if (statut === 'validee' || statut === 'confirmee') return '#2e7d32'; // Vert
    if (statut === 'en_attente') return '#ed6c02'; // Orange
    return '#1976d2'; // Bleu par défaut
  };

  const getStatusLabel = (statut: string | undefined): string => {
    if (statut === 'rejetee' || statut === 'refusee') return 'Refusée';
    if (statut === 'annulee') return 'Annulée';
    if (statut === 'validee') return 'Validée';
    if (statut === 'confirmee') return 'Confirmée';
    if (statut === 'en_attente') return 'En attente';
    return statut || 'Inconnue';
  };

  // Calculer le statut en temps réel d'une salle
  const getRoomStatus = (roomId: number) => {
    const now = new Date();
    const todayStr = formatDateKey(now);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Trouver les réservations validées/confirmées de cette salle aujourd'hui
    const todayReservations = reservations.filter(res => 
      res.room_id === roomId && 
      res.date === todayStr &&
      (res.statut === 'validee' || res.statut === 'confirmee')
    );

    if (todayReservations.length === 0) {
      return { 
        status: 'available', 
        label: 'Disponible', 
        color: '#2e7d32',
        icon: '✓'
      };
    }

    // Vérifier si occupée maintenant
    const currentReservation = todayReservations.find(res => {
      const start = res.heure_debut || '00:00';
      const end = res.heure_fin || '23:59';
      return currentTime >= start && currentTime <= end;
    });

    if (currentReservation) {
      return { 
        status: 'occupied', 
        label: `Occupée jusqu'à ${currentReservation.heure_fin}`, 
        color: '#d32f2f',
        icon: '●'
      };
    }

    // Trouver la prochaine réservation
    const nextReservation = todayReservations
      .filter(res => (res.heure_debut || '00:00') > currentTime)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))[0];

    if (nextReservation) {
      return { 
        status: 'soon', 
        label: `Disponible jusqu'à ${nextReservation.heure_debut}`, 
        color: '#ed6c02',
        icon: '◐'
      };
    }

    return { 
      status: 'available', 
      label: 'Disponible', 
      color: '#2e7d32',
      icon: '✓'
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <AppBar position="fixed" sx={{ bgcolor: '#166bc6', minHeight: 56, zIndex: 1100 }}>
        <Toolbar sx={{ minHeight: '56px !important', py: 0.5 }}>
          <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              style={{ height: 35 }}
            />
            <Typography variant="h6" fontWeight="bold" color="#f9a825" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
              Port Autonome de Lomé
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {isAuthenticated && user ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: '#f9a825',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user.prenom} {user.nom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <MenuItem onClick={handleGoToDashboard}>
                    <DashboardIcon sx={{ mr: 1, fontSize: 20 }} />
                    Tableau de bord
                  </MenuItem>
                  <MenuItem onClick={handleGoToProfile}>
                    <AccountIcon sx={{ mr: 1, fontSize: 20 }} />
                    Mon compte
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                    Se déconnecter
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon />}
              >
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Spacer pour compenser le navbar fixe */}
      <Box sx={{ height: 56 }} />

      {/* Hero Section - Bannière dynamique avec effets */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 500, md: 600 },
          backgroundImage: 'url(/images/togo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: { xs: 'scroll', md: 'fixed' }, // Effet parallax sur desktop
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Overlay uniforme léger pour lisibilité du texte
            background: 'rgba(0,0,0,0.35)',
          },
          // Grille animée en overlay
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: `${fadeIn} 2s ease-out`,
          },
        }}
      >
        {/* Particules décoratives animées */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 168, 37, 0.3) 0%, transparent 70%)',
            animation: `${float} 6s ease-in-out infinite`,
            filter: 'blur(20px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: '10%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22, 107, 198, 0.4) 0%, transparent 70%)',
            animation: `${float} 8s ease-in-out infinite 1s`,
            filter: 'blur(30px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '15%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
            animation: `${float} 7s ease-in-out infinite 0.5s`,
            filter: 'blur(15px)',
          }}
        />

        <Container 
          sx={{ 
            position: 'relative', 
            zIndex: 1, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'flex-end',
            pb: 6,
          }}
        >
          {/* Badge animé */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              animation: `${scaleIn} 0.8s ease-out`,
            }}
          >
            <Chip
              label="🏢 Port Autonome de Lomé"
              sx={{
                bgcolor: 'rgba(249, 168, 37, 0.2)',
                color: '#f9a825',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                py: 2.5,
                px: 1,
                border: '1px solid rgba(249, 168, 37, 0.4)',
                backdropFilter: 'blur(10px)',
                animation: `${pulse} 3s ease-in-out infinite`,
              }}
            />
          </Box>

          {/* Titre principal avec effet de slide-up */}
          <Typography 
            variant={isMobile ? 'h4' : 'h2'} 
            fontWeight="bold" 
            color="white" 
            gutterBottom
            sx={{
              animation: `${slideUp} 1s ease-out`,
              animationFillMode: 'both',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
              '& span': {
                background: 'linear-gradient(90deg, #f9a825, #ffca28, #f9a825)',
                backgroundSize: '200% auto',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `${shimmer} 3s linear infinite`,
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))',
              },
            }}
          >
            Plateforme de <span>réservation</span> de salles de réunion
          </Typography>

          {/* Sous-titre avec délai d'animation */}
          <Typography 
            variant={isMobile ? 'body1' : 'h6'} 
            color="white" 
            paragraph
            sx={{
              animation: `${slideUp} 1s ease-out 0.2s`,
              animationFillMode: 'both',
              opacity: 0,
              maxWidth: 600,
              mx: 'auto',
              textShadow: '1px 1px 3px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)',
            }}
          >
            Réservez facilement vos salles de réunion en ligne, 
            gérez vos créneaux et optimisez l'utilisation de vos espaces
          </Typography>

          {/* Statistiques animées */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 2, md: 4 },
              my: 3,
              animation: `${fadeIn} 1s ease-out 0.4s`,
              animationFillMode: 'both',
              opacity: 0,
            }}
          >
            {[
              { value: rooms.length || '10+', label: 'Salles' },
              { value: '24/7', label: 'Accès' },
              { value: '100%', label: 'En ligne' },
            ].map((stat, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: 'center',
                  px: { xs: 2, md: 3 },
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  animation: `${scaleIn} 0.5s ease-out ${0.6 + index * 0.1}s`,
                  animationFillMode: 'both',
                  opacity: 0,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    bgcolor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  color="#f9a825"
                  sx={{ textShadow: '0 2px 10px rgba(248, 245, 240, 1)' }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Boutons avec effet de slide-up */}
          <Box 
            display="flex" 
            gap={2} 
            justifyContent="center" 
            mt={2}
            sx={{
              animation: `${slideUp} 1s ease-out 0.6s`,
              animationFillMode: 'both',
              opacity: 0,
            }}
          >
            <Button
              variant="contained"
              size="large"
              sx={{ 
                background: 'linear-gradient(135deg, #f9a825 0%, #f57c00 100%)',
                backgroundSize: '200% 200%',
                animation: `${gradientMove} 5s ease infinite`,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 10px 30px rgba(249, 168, 37, 0.4)',
                },
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(249, 168, 37, 0.3)',
              }}
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/login')}
            >
              Réserver maintenant
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.5)',
                borderWidth: 2,
                backdropFilter: 'blur(10px)',
                '&:hover': { 
                  borderColor: '#f9a825', 
                  bgcolor: 'rgba(249, 168, 37, 0.15)',
                  borderWidth: 2,
                  transform: 'translateY(-3px)',
                },
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
              }}
              startIcon={<RoomIcon />}
              onClick={() => {
                document.getElementById('salles')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Voir les salles
            </Button>
          </Box>

          {/* Indicateur de scroll animé */}
          <Box
            sx={{
              mt: 4,
              animation: `${float} 2s ease-in-out infinite`,
              cursor: 'pointer',
            }}
            onClick={() => {
              document.getElementById('calendrier')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Typography 
              variant="body2" 
              color="rgba(255,255,255,0.6)"
              sx={{ mb: 1 }}
            >
              Découvrir
            </Typography>
            <Box
              sx={{
                width: 30,
                height: 50,
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 15,
                mx: 'auto',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 6,
                  height: 10,
                  bgcolor: '#f9a825',
                  borderRadius: 3,
                  animation: `${slideUp} 1.5s ease-in-out infinite`,
                },
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Section Calendrier */}
      <Container id="calendrier" sx={{ py: 8 }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
          }}
        >
          <Chip
            label="📅 Disponibilités"
            sx={{
              mb: 2,
              bgcolor: 'rgba(22, 107, 198, 0.1)',
              color: '#166bc6',
              fontWeight: 'bold',
            }}
          />
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            textAlign="center" 
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #166bc6 0%, #1e3a8a 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Calendrier de disponibilité
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" paragraph>
            Consultez les réservations de nos salles en temps réel
          </Typography>
        </Box>

        {/* Légende des statuts */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            flexWrap: 'wrap',
            mb: 3,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#2e7d32', borderRadius: 1 }} />
            <Typography variant="body2" fontWeight="medium">Validée/Confirmée</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#ed6c02', borderRadius: 1 }} />
            <Typography variant="body2" fontWeight="medium">En attente</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#d32f2f', borderRadius: 1 }} />
            <Typography variant="body2" fontWeight="medium">Refusée</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#757575', borderRadius: 1 }} />
            <Typography variant="body2" fontWeight="medium">Annulée</Typography>
          </Box>
        </Box>

        <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          {/* En-tête du calendrier */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <IconButton onClick={goToPreviousMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
              {monthName}
            </Typography>
            <IconButton onClick={goToNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* En-têtes des jours */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 1, 
              mb: 1,
              '& > *': { minWidth: 0 }
            }}
          >
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
              <Box 
                key={day}
                display="flex" 
                justifyContent="center" 
                alignItems="center"
                py={1.5}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Grille du calendrier */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 1,
              '& > *': { minWidth: 0 }
            }}
          >
            {/* Cases vides avant le premier jour du mois */}
            {Array.from({ length: firstDayOffset }).map((_, index) => (
              <Box key={`offset-${index}`} sx={{ minHeight: 100 }} />
            ))}

            {/* Jours du mois */}
            {daysInMonth.map((date) => {
              const dayReservations = getReservationsForDate(date);
              const hasReservations = dayReservations.length > 0;

              return (
                <Paper
                  key={date.toISOString()}
                  elevation={isSelected(date) ? 3 : 1}
                  onClick={() => {
                    setSelectedDate(date);
                    if (hasReservations) navigate('/login');
                  }}
                  sx={{
                    minHeight: 100,
                    p: 1.5,
                    cursor: 'pointer',
                    border: isToday(date) ? '2px solid' : '1px solid',
                    borderColor: isToday(date) ? 'primary.main' : 'divider',
                    bgcolor: isSelected(date) ? 'primary.50' : 'background.paper',
                    '&:hover': {
                      bgcolor: isSelected(date) ? 'primary.100' : 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    mb={1}
                    sx={{ flexShrink: 0 }}
                  >
                    <Typography 
                      variant="body1" 
                      fontWeight={isToday(date) ? 'bold' : 'medium'}
                      color={isToday(date) ? 'primary.main' : 'text.primary'}
                      sx={{ fontSize: isToday(date) ? '1.1rem' : '0.95rem' }}
                    >
                      {date.getDate()}
                    </Typography>
                    {hasReservations && (
                      <Chip
                        label={dayReservations.length}
                        size="small"
                        color="primary"
                        sx={{ height: 20, minWidth: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                  
                  {hasReservations && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 0.5,
                        overflow: 'hidden',
                        flex: 1,
                      }}
                    >
                      {dayReservations.slice(0, 3).map((res, idx) => (
                        <Tooltip 
                          key={idx}
                          title={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {res.salle?.nom || 'Salle'} - {getStatusLabel(res.statut)}
                              </Typography>
                              <Typography variant="caption">
                                {res.heure_debut} - {res.heure_fin}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {res.motif || 'Pas de motif'}
                              </Typography>
                              {res.utilisateur && (
                                <Typography variant="caption" display="block">
                                  Par: {res.utilisateur.prenom} {res.utilisateur.nom}
                                </Typography>
                              )}
                              {res.rejection_reason && (
                                <Typography variant="caption" display="block" color="error.light">
                                  Raison: {res.rejection_reason}
                                </Typography>
                              )}
                            </Box>
                          }
                          placement="top"
                        >
                          <Box
                            sx={{
                              px: 0.75,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: getStatusBgColor(res.statut),
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 'medium',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {res.heure_debut} • {res.salle?.nom || 'Salle'}
                            </Box>
                          </Box>
                        </Tooltip>
                      ))}
                      {dayReservations.length > 3 && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem', textAlign: 'center', fontWeight: 'medium' }}
                        >
                          +{dayReservations.length - 3} autre{dayReservations.length - 3 > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>

          <Box textAlign="center" mt={3}>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/login')}
            >
              Voir toutes les réservations
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Section Salles */}
      <Container sx={{ py: 8 }} id="salles">
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Nos Salles de Réunion
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" paragraph>
          Découvrez nos espaces modernes et équipés
        </Typography>

        {/* Légende des statuts des salles */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 3, 
            flexWrap: 'wrap',
            mb: 4,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: '#2e7d32', 
                borderRadius: '50%',
              }} 
            />
            <Typography variant="body2" fontWeight="medium">Disponible</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: '#ed6c02', 
                borderRadius: '50%',
              }} 
            />
            <Typography variant="body2" fontWeight="medium">Bientôt occupée</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: '#d32f2f', 
                borderRadius: '50%',
              }} 
            />
            <Typography variant="body2" fontWeight="medium">Occupée</Typography>
          </Box>
        </Box>

        <Grid container spacing={3} mt={2}>
          {rooms.map((room) => {
            const roomStatus = getRoomStatus(room.id);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
                <Box
                  sx={{
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  {/* Indicateur de statut en temps réel en haut à gauche */}
                  <Chip
                    icon={<Box component="span" sx={{ fontSize: '1rem' }}>{roomStatus.icon}</Box>}
                    label={roomStatus.label}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 10,
                      bgcolor: roomStatus.color,
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: 3,
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                  />
                  
                  <RoomCard
                    room={room}
                    onView={() => navigate('/login')}
                    onReserve={() => navigate('/login')}
                    compact
                    hideStatusBadge={true}
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {rooms.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              Aucune salle disponible pour le moment
            </Typography>
          </Box>
        )}

        <Box textAlign="center" mt={4}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
          >
            Voir toutes les salles
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#166bc6',
          color: 'white',
          py: 6,
          mt: 'auto',
        }}
      >
        <Container>
          <Grid container spacing={4}>
            {/* Colonne 1 - À propos */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="#f9a825" gutterBottom>
                Port Autonome de Lomé
              </Typography>
              <Typography variant="body2" paragraph>
                Plateforme de réservation de salles de réunion.
              </Typography>
            </Grid>

            {/* Colonne 2 - Liens Rapides */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="#f9a825" gutterBottom>
                Liens Rapides
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button 
                  color="inherit" 
                  sx={{ justifyContent: 'flex-start', pl: 0 }}
                  onClick={() => navigate('/')}
                >
                  Accueil
                </Button>
                <Button 
                  color="inherit" 
                  sx={{ justifyContent: 'flex-start', pl: 0 }}
                  onClick={() => {
                    document.getElementById('salles')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Salles
                </Button>
                <Button 
                  color="inherit" 
                  sx={{ justifyContent: 'flex-start', pl: 0 }}
                  onClick={() => navigate('/login')}
                >
                  Connexion
                </Button>
              </Box>
            </Grid>

            {/* Colonne 3 - Contact */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="#f9a825" gutterBottom>
                Contact
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2">
                    (+228) 22 27 26 27 / 22 23 78 00 / 22 27 47 42
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">
                    togoport@togoport.tg
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon fontSize="small" />
                  <Typography variant="body2">
                    Lomé, Togo
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Réseaux Sociaux */}
          <Box 
            display="flex" 
            justifyContent="center" 
            gap={2} 
            mt={4} 
            pt={4} 
            borderTop="1px solid rgba(255,255,255,0.1)"
          >
            <Typography variant="h6" fontWeight="bold" color="#f9a825" mr={2}>
              Réseaux Sociaux
            </Typography>
            <IconButton color="inherit" aria-label="Facebook">
              <FacebookIcon />
            </IconButton>
            <IconButton color="inherit" aria-label="Twitter">
              <TwitterIcon />
            </IconButton>
            <IconButton color="inherit" aria-label="LinkedIn">
              <LinkedInIcon />
            </IconButton>
          </Box>

          {/* Copyright */}
          <Typography variant="body2" textAlign="center" mt={4} color="rgba(255,255,255,0.6)">
            © {new Date().getFullYear()} Port Autonome de Lomé. Tous droits réservés.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
