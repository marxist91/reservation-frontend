import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Skeleton,
  alpha,
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
  EventAvailable as EventAvailableIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  TouchApp as TouchAppIcon,
  Verified as VerifiedIcon,
  KeyboardArrowDown as ScrollDownIcon,
} from '@mui/icons-material';
import { roomsAPI } from '../../api/rooms';
import { reservationsAPI } from '../../api/reservations';
import type { Room, Reservation } from '../../types';
import RoomCard from '../../components/rooms/RoomCard';

/* ── Animations ── */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const morphBlob = keyframes`
  0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
  25% { border-radius: 65% 35% 45% 55% / 50% 60% 40% 50%; }
  50% { border-radius: 40% 60% 55% 45% / 65% 35% 55% 45%; }
  75% { border-radius: 55% 45% 35% 65% / 40% 55% 50% 60%; }
`;

const scrollBounce = keyframes`
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(8px); opacity: 0.5; }
`;

/* ── Hook: animate on scroll ── */
function useOnScreen(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

/* ── Component ── */
const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user, logout } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const stepsSection = useOnScreen();
  const calendarSection = useOnScreen();
  const roomsSection = useOnScreen();
  const statsSection = useOnScreen();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); handleMenuClose(); navigate('/'); };
  const handleGoToDashboard = () => { handleMenuClose(); navigate('/dashboard'); };
  const handleGoToProfile = () => { handleMenuClose(); navigate('/profile'); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { loadRooms(); loadReservations(); }, []);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try { const data = await roomsAPI.getAllPublic(); setRooms(data.slice(0, 6)); }
    catch { /* silent */ }
    finally { setLoadingRooms(false); }
  };

  const loadReservations = async () => {
    try { const response = await reservationsAPI.getAllPublic(); setReservations(response.data || []); }
    catch { /* silent */ }
  };

  /* Calendar helpers */
  const getDaysInMonth = useCallback((year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) { days.push(new Date(date)); date.setDate(date.getDate() + 1); }
    return days;
  }, []);

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth, getDaysInMonth]);
  const firstDayOffset = useMemo(() => getFirstDayOfMonth(currentYear, currentMonth), [currentYear, currentMonth, getFirstDayOfMonth]);

  const reservationsByDate = useMemo(() => {
    const grouped: Record<string, Reservation[]> = {};
    reservations.forEach(r => { const d = r.date; if (!grouped[d]) grouped[d] = []; grouped[d].push(r); });
    return grouped;
  }, [reservations]);

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const goToPreviousMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const goToNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };
  const isToday = (d: Date) => { const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); };
  const isSelected = (d: Date) => selectedDate ? d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear() : false;
  const formatDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const getReservationsForDate = (d: Date): Reservation[] => reservationsByDate[formatDateKey(d)] || [];

  const getStatusBgColor = (s: string | undefined) => {
    if (s === 'rejetee' || s === 'refusee') return '#d32f2f';
    if (s === 'annulee') return '#757575';
    if (s === 'validee' || s === 'confirmee') return '#2e7d32';
    if (s === 'en_attente') return '#ed6c02';
    return '#1976d2';
  };

  const getStatusLabel = (s: string | undefined) => {
    if (s === 'rejetee' || s === 'refusee') return 'Refus\u00e9e';
    if (s === 'annulee') return 'Annul\u00e9e';
    if (s === 'validee') return 'Valid\u00e9e';
    if (s === 'confirmee') return 'Confirm\u00e9e';
    if (s === 'en_attente') return 'En attente';
    return s || 'Inconnue';
  };

  const getRoomStatus = (roomId: number) => {
    const now = new Date();
    const todayStr = formatDateKey(now);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayRes = reservations.filter(r => r.room_id === roomId && r.date === todayStr && (r.statut === 'validee' || r.statut === 'confirmee'));
    if (todayRes.length === 0) return { status: 'available', label: 'Disponible', color: '#2e7d32', icon: '\u2713' };
    const curr = todayRes.find(r => { const s = r.heure_debut || '00:00'; const e = r.heure_fin || '23:59'; return currentTime >= s && currentTime <= e; });
    if (curr) return { status: 'occupied', label: `Occup\u00e9e jusqu'\u00e0 ${curr.heure_fin}`, color: '#d32f2f', icon: '\u25cf' };
    const next = todayRes.filter(r => (r.heure_debut || '00:00') > currentTime).sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))[0];
    if (next) return { status: 'soon', label: `Libre jusqu'\u00e0 ${next.heure_debut}`, color: '#ed6c02', icon: '\u25d0' };
    return { status: 'available', label: 'Disponible', color: '#2e7d32', icon: '\u2713' };
  };

  /* ── RENDER ── */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#fafbfc' }}>

      {/* ═══ NAVBAR ═══ */}
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          bgcolor: scrolled ? 'rgba(22, 107, 198, 0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', py: 0.5 }}>
          <Box display="flex" alignItems="center" gap={1.5} flexGrow={1}>
            <Box sx={{ width: 40, height: 40, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <img src="/images/logo.png" alt="Logo" style={{ height: 40, width: 40, objectFit: 'cover' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="white" lineHeight={1.2} sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>
                Port Autonome de Lom&eacute;
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', display: { xs: 'none', sm: 'block' } }}>
                Syst&egrave;me de R&eacute;servation
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Box display="flex" gap={1} mr={2}>
              {[
                { label: 'Accueil', href: '#' },
                { label: 'Calendrier', href: '#calendrier' },
                { label: 'Salles', href: '#salles' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <Button
                  key={link.label}
                  color="inherit"
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.85rem',
                    '&:hover': { color: '#f9a825', bgcolor: 'rgba(255,255,255,0.08)' },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    if (link.href === '#') window.scrollTo({ top: 0, behavior: 'smooth' });
                    else document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          {isAuthenticated && user ? (
            <>
              <IconButton onClick={handleMenuOpen} sx={{ color: 'white' }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#f9a825', fontSize: '0.9rem', fontWeight: 700 }}>
                  {user.prenom?.[0]}{user.nom?.[0]}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 220 } } }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={700}>{user.prenom} {user.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <MenuItem onClick={handleGoToDashboard}><DashboardIcon sx={{ mr: 1.5, fontSize: 20 }} />Tableau de bord</MenuItem>
                <MenuItem onClick={handleGoToProfile}><AccountIcon sx={{ mr: 1.5, fontSize: 20 }} />Mon compte</MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />D&eacute;connexion</MenuItem>
              </Menu>
            </>
          ) : (
            <Button variant="contained" size="small" onClick={() => navigate('/login')} startIcon={<LoginIcon />}
              sx={{ bgcolor: '#f9a825', color: '#000', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#f57c00' } }}>
              Connexion
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* ═══ HERO SECTION ═══ */}
      <Box
        sx={{
          position: 'relative', minHeight: { xs: '100vh', md: '100vh' },
          display: 'flex', alignItems: 'center', overflow: 'hidden',
          bgcolor: '#0a2463',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/togo.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,36,99,0.7) 0%, rgba(30,58,138,0.6) 30%, rgba(22,107,198,0.55) 70%, rgba(30,136,229,0.5) 100%)' }} />
        <Box sx={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: { xs: 300, md: 500 }, height: { xs: 300, md: 500 },
          background: 'radial-gradient(circle, rgba(249,168,37,0.25) 0%, transparent 70%)',
          animation: `${morphBlob} 12s ease-in-out infinite`, filter: 'blur(40px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: { xs: 250, md: 450 }, height: { xs: 250, md: 450 },
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: `${morphBlob} 15s ease-in-out infinite 3s`, filter: 'blur(50px)',
        }} />
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <Container sx={{ position: 'relative', zIndex: 1, py: { xs: 12, md: 8 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label={"\ud83c\udfe2 Port Autonome de Lom\u00e9"}
                sx={{
                  bgcolor: 'rgba(249,168,37,0.15)', color: '#f9a825', fontWeight: 600, fontSize: '0.85rem',
                  py: 2, px: 0.5, border: '1px solid rgba(249,168,37,0.3)', backdropFilter: 'blur(8px)',
                  mb: 3, animation: `${fadeIn} 0.8s ease-out`,
                }}
              />
              <Typography
                variant={isSmall ? 'h3' : 'h2'} fontWeight={800} color="white"
                sx={{
                  animation: `${slideUp} 0.8s ease-out`, lineHeight: 1.15, mb: 2,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.2rem' }, letterSpacing: '-0.02em',
                }}
              >
                {"R\u00e9servez vos salles "}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #f9a825, #ffca28)',
                  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  en quelques clics
                </Box>
              </Typography>

              <Typography variant="h6" sx={{
                color: 'rgba(255,255,255,0.75)', fontWeight: 400, maxWidth: 520, lineHeight: 1.6, mb: 4,
                animation: `${slideUp} 0.8s ease-out 0.15s both`, fontSize: { xs: '0.95rem', md: '1.1rem' },
              }}>
                {"Plateforme moderne de gestion et r\u00e9servation de salles de r\u00e9union. Consultez les disponibilit\u00e9s, r\u00e9servez et recevez vos confirmations instantan\u00e9ment."}
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap" sx={{ animation: `${slideUp} 0.8s ease-out 0.3s both` }}>
                <Button variant="contained" size="large" startIcon={<CalendarIcon />} endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: '#f9a825', color: '#000', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem',
                    '&:hover': { bgcolor: '#f57c00', transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(249,168,37,0.35)' },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 16px rgba(249,168,37,0.25)',
                  }}
                >
                  {"R\u00e9server maintenant"}
                </Button>
                <Button variant="outlined" size="large" startIcon={<RoomIcon />}
                  onClick={() => document.getElementById('salles')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{
                    color: 'white', borderColor: 'rgba(255,255,255,0.35)', borderWidth: 2, fontWeight: 600,
                    px: 3, py: 1.5, borderRadius: 3, backdropFilter: 'blur(8px)',
                    '&:hover': { borderColor: '#f9a825', bgcolor: 'rgba(249,168,37,0.1)', borderWidth: 2, transform: 'translateY(-2px)' },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Voir les salles
                </Button>
              </Box>

              <Box display="flex" gap={3} mt={5} sx={{ animation: `${fadeIn} 1s ease-out 0.6s both` }}>
                {[
                  { value: rooms.length || '10+', label: 'Salles \u00e9quip\u00e9es' },
                  { value: '24/7', label: 'Acc\u00e8s en ligne' },
                  { value: '100%', label: 'Num\u00e9rique' },
                ].map((stat, i) => (
                  <Box key={i} sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#f9a825">{stat.value}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {!isMobile && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={{ animation: `${scaleIn} 0.8s ease-out 0.4s both` }}>
                  <Paper elevation={0} sx={{
                    bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, p: 4, color: 'white',
                  }}>
                    <Typography variant="h6" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventAvailableIcon sx={{ color: '#f9a825' }} /> Pourquoi cette plateforme ?
                    </Typography>
                    {[
                      { icon: <SpeedIcon />, title: 'Rapide', desc: 'R\u00e9servez en moins de 30 secondes' },
                      { icon: <GroupsIcon />, title: 'Collaboratif', desc: 'Partagez les disponibilit\u00e9s en temps r\u00e9el' },
                      { icon: <VerifiedIcon />, title: 'Fiable', desc: 'Confirmations et rappels automatiques' },
                    ].map((item, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2.5, alignItems: 'flex-start', animation: `${slideUp} 0.5s ease-out ${0.6 + i * 0.12}s both` }}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(249,168,37,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f9a825',
                        }}>
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>{item.desc}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              </Grid>
            )}
          </Grid>

          <Box sx={{
            position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            cursor: 'pointer', textAlign: 'center', animation: `${fadeIn} 1s ease-out 1s both`,
          }}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>D&eacute;couvrir</Typography>
            <ScrollDownIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 28, animation: `${scrollBounce} 2s ease-in-out infinite` }} />
          </Box>
        </Container>
      </Box>

      {/* ═══ HOW IT WORKS ═══ */}
      <Box id="how-it-works" ref={stepsSection.ref} sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white' }}>
        <Container>
          <Box textAlign="center" mb={6}>
            <Chip label={"Comment \u00e7a marche"} sx={{ mb: 2, bgcolor: alpha('#166bc6', 0.08), color: '#166bc6', fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{
              opacity: stepsSection.isVisible ? 1 : 0, transform: stepsSection.isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)', fontSize: { xs: '1.8rem', md: '2.4rem' },
            }}>
              {"R\u00e9servez en "}
              <Box component="span" sx={{ color: '#f9a825' }}>{"3 \u00e9tapes simples"}</Box>
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { icon: <TouchAppIcon sx={{ fontSize: 40 }} />, step: '01', title: 'Choisissez', desc: 'Parcourez les salles disponibles et s\u00e9lectionnez celle qui correspond \u00e0 vos besoins.', color: '#166bc6' },
              { icon: <CalendarIcon sx={{ fontSize: 40 }} />, step: '02', title: 'R\u00e9servez', desc: "S\u00e9lectionnez la date, l'heure et la dur\u00e9e de votre r\u00e9union en quelques clics.", color: '#f9a825' },
              { icon: <CheckCircleIcon sx={{ fontSize: 40 }} />, step: '03', title: 'Confirmez', desc: 'Recevez la confirmation par notification. Votre salle est r\u00e9serv\u00e9e !', color: '#2e7d32' },
            ].map((step, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Paper elevation={0} sx={{
                  p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 4,
                  opacity: stepsSection.isVisible ? 1 : 0, transform: stepsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.15}s`,
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: step.color },
                  cursor: 'default',
                }}>
                  <Typography variant="overline" fontWeight={800} sx={{ color: step.color, fontSize: '0.9rem', letterSpacing: 2 }}>{step.step}</Typography>
                  <Box sx={{
                    width: 72, height: 72, borderRadius: 3, bgcolor: alpha(step.color, 0.1), color: step.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', my: 2,
                  }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{step.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══ CALENDAR SECTION ═══ */}
      <Box id="calendrier" ref={calendarSection.ref} sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f5f7fa' }}>
        <Container>
          <Box textAlign="center" mb={4}>
            <Chip label={"\ud83d\udcc5 Disponibilit\u00e9s"} sx={{ mb: 2, bgcolor: alpha('#166bc6', 0.08), color: '#166bc6', fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{
              opacity: calendarSection.isVisible ? 1 : 0, transform: calendarSection.isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s ease', fontSize: { xs: '1.8rem', md: '2.4rem' },
            }}>
              {"Calendrier de disponibilit\u00e9"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 500, mx: 'auto' }}>
              {"Consultez les r\u00e9servations de nos salles en temps r\u00e9el"}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {[
              { color: '#2e7d32', label: 'Valid\u00e9e' },
              { color: '#ed6c02', label: 'En attente' },
              { color: '#d32f2f', label: 'Refus\u00e9e' },
              { color: '#757575', label: 'Annul\u00e9e' },
            ].map((s) => (
              <Box key={s.label} display="flex" alignItems="center" gap={0.8}>
                <Box sx={{ width: 12, height: 12, bgcolor: s.color, borderRadius: '50%' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          <Paper elevation={0} sx={{
            p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 4,
            opacity: calendarSection.isVisible ? 1 : 0, transform: calendarSection.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s ease 0.2s',
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <IconButton onClick={goToPreviousMonth} sx={{ bgcolor: alpha('#166bc6', 0.08), '&:hover': { bgcolor: alpha('#166bc6', 0.15) } }}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h5" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{monthName}</Typography>
              <IconButton onClick={goToNextMonth} sx={{ bgcolor: alpha('#166bc6', 0.08), '&:hover': { bgcolor: alpha('#166bc6', 0.15) } }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <Box key={d} sx={{ textAlign: 'center', py: 1, color: 'text.secondary' }}>
                  <Typography variant="body2" fontWeight={600} fontSize="0.8rem">{d}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {Array.from({ length: firstDayOffset }).map((_, i) => <Box key={`o-${i}`} sx={{ minHeight: { xs: 60, md: 90 } }} />)}
              {daysInMonth.map((date) => {
                const dayRes = getReservationsForDate(date);
                const hasRes = dayRes.length > 0;
                return (
                  <Paper
                    key={date.toISOString()} elevation={0}
                    onClick={() => { setSelectedDate(date); if (hasRes) navigate('/login'); }}
                    sx={{
                      minHeight: { xs: 60, md: 90 }, p: 1, cursor: 'pointer',
                      border: isToday(date) ? '2px solid' : '1px solid',
                      borderColor: isToday(date) ? 'primary.main' : 'divider', borderRadius: 2,
                      bgcolor: isSelected(date) ? alpha('#166bc6', 0.05) : 'background.paper',
                      '&:hover': { bgcolor: alpha('#166bc6', 0.04), transform: 'scale(1.02)', boxShadow: 1 },
                      transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5} sx={{ flexShrink: 0 }}>
                      <Typography variant="body2" fontWeight={isToday(date) ? 800 : 500}
                        color={isToday(date) ? 'primary.main' : 'text.primary'}
                        sx={{ fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
                        {date.getDate()}
                      </Typography>
                      {hasRes && (
                        <Chip label={dayRes.length} size="small" color="primary"
                          sx={{ height: 18, minWidth: 18, fontSize: '0.65rem', fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }} />
                      )}
                    </Box>
                    {hasRes && !isSmall && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, overflow: 'hidden', flex: 1 }}>
                        {dayRes.slice(0, 2).map((r, idx) => (
                          <Tooltip key={idx} title={
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{r.salle?.nom || 'Salle'} {'\u2014'} {getStatusLabel(r.statut)}</Typography>
                              <Typography variant="caption">{r.heure_debut} - {r.heure_fin}</Typography>
                              {r.motif && <Typography variant="caption" display="block">{r.motif}</Typography>}
                            </Box>
                          } placement="top">
                            <Box sx={{
                              px: 0.5, py: 0.3, borderRadius: 1,
                              bgcolor: getStatusBgColor(r.statut), color: 'white',
                              fontSize: '0.65rem', fontWeight: 500,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {r.heure_debut} {'\u2022'} {r.salle?.nom || 'Salle'}
                            </Box>
                          </Tooltip>
                        ))}
                        {dayRes.length > 2 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                            +{dayRes.length - 2} autre{dayRes.length - 2 > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>

            <Box textAlign="center" mt={3}>
              <Button variant="contained" startIcon={<CalendarIcon />} onClick={() => navigate('/login')}
                sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 600 }}>
                {"Voir toutes les r\u00e9servations"}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* ═══ ROOMS SECTION ═══ */}
      <Box id="salles" ref={roomsSection.ref} sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white' }}>
        <Container>
          <Box textAlign="center" mb={2}>
            <Chip label={"\ud83c\udfe2 Nos espaces"} sx={{ mb: 2, bgcolor: alpha('#166bc6', 0.08), color: '#166bc6', fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{
              opacity: roomsSection.isVisible ? 1 : 0, transform: roomsSection.isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s ease', fontSize: { xs: '1.8rem', md: '2.4rem' },
            }}>
              {"Nos Salles de R\u00e9union"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 480, mx: 'auto' }}>
              {"D\u00e9couvrez nos espaces modernes et enti\u00e8rement \u00e9quip\u00e9s"}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            {[
              { color: '#2e7d32', label: 'Disponible' },
              { color: '#ed6c02', label: "Bient\u00f4t occup\u00e9e" },
              { color: '#d32f2f', label: "Occup\u00e9e" },
            ].map((s) => (
              <Box key={s.label} display="flex" alignItems="center" gap={0.8}>
                <Box sx={{ width: 10, height: 10, bgcolor: s.color, borderRadius: '50%' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          <Grid container spacing={3}>
            {loadingRooms
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                    <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))
              : rooms.map((room, i) => {
                  const roomStatus = getRoomStatus(room.id);
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
                      <Box sx={{
                        height: '100%', position: 'relative',
                        opacity: roomsSection.isVisible ? 1 : 0, transform: roomsSection.isVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: `all 0.5s ease ${i * 0.1}s`,
                        '&:hover': { transform: 'translateY(-6px)' },
                      }}>
                        <Chip
                          icon={<Box component="span" sx={{ fontSize: '0.9rem' }}>{roomStatus.icon}</Box>}
                          label={roomStatus.label} size="small"
                          sx={{
                            position: 'absolute', top: 12, left: 12, zIndex: 10,
                            bgcolor: roomStatus.color, color: 'white', fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', '& .MuiChip-icon': { color: 'white' },
                          }}
                        />
                        <RoomCard room={room} onView={() => navigate('/login')} onReserve={() => navigate('/login')} compact hideStatusBadge={true} />
                      </Box>
                    </Grid>
                  );
                })
            }
          </Grid>

          {!loadingRooms && rooms.length === 0 && (
            <Box textAlign="center" py={6}>
              <RoomIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Aucune salle disponible pour le moment</Typography>
            </Box>
          )}

          <Box textAlign="center" mt={5}>
            <Button variant="outlined" size="large" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/login')}
              sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 600, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
              Voir toutes les salles
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ═══ STATS ═══ */}
      <Box ref={statsSection.ref} sx={{ py: { xs: 6, md: 8 }, background: 'linear-gradient(135deg, #0a2463 0%, #166bc6 100%)', color: 'white' }}>
        <Container>
          <Grid container spacing={4} justifyContent="center">
            {[
              { value: rooms.length || '10+', label: 'Salles disponibles', icon: <RoomIcon sx={{ fontSize: 36 }} /> },
              { value: reservations.length || '500+', label: "R\u00e9servations trait\u00e9es", icon: <CalendarIcon sx={{ fontSize: 36 }} /> },
              { value: '100%', label: 'En ligne', icon: <SpeedIcon sx={{ fontSize: 36 }} /> },
              { value: '24/7', label: 'Accessible', icon: <EventAvailableIcon sx={{ fontSize: 36 }} /> },
            ].map((stat, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Box sx={{
                  textAlign: 'center',
                  opacity: statsSection.isVisible ? 1 : 0, transform: statsSection.isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s ease ${i * 0.1}s`,
                }}>
                  <Box sx={{ color: '#f9a825', mb: 1 }}>{stat.icon}</Box>
                  <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══ FOOTER ═══ */}
      <Box component="footer" id="contact" sx={{ bgcolor: '#0a1929', color: 'white', pt: 8, pb: 4 }}>
        <Container>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <img src="/images/logo.png" alt="Logo" style={{ height: 36 }} />
                <Typography variant="h6" fontWeight={700} color="#f9a825">{"Port Autonome de Lom\u00e9"}</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: 300 }}>
                {"Plateforme de r\u00e9servation de salles de r\u00e9union du Port Autonome de Lom\u00e9. Moderne, rapide et fiable."}
              </Typography>
              <Box display="flex" gap={1} mt={2}>
                {[
                  { icon: <FacebookIcon fontSize="small" />, label: 'Facebook' },
                  { icon: <TwitterIcon fontSize="small" />, label: 'Twitter' },
                  { icon: <LinkedInIcon fontSize="small" />, label: 'LinkedIn' },
                ].map((s) => (
                  <IconButton key={s.label} aria-label={s.label} sx={{
                    color: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'rgba(249,168,37,0.15)', color: '#f9a825' }, transition: 'all 0.2s',
                  }}>
                    {s.icon}
                  </IconButton>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Liens Rapides</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {[
                  { label: 'Accueil', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                  { label: 'Calendrier', action: () => document.getElementById('calendrier')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Salles', action: () => document.getElementById('salles')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Connexion', action: () => navigate('/login') },
                ].map((link) => (
                  <Typography key={link.label} variant="body2" onClick={link.action}
                    sx={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer', '&:hover': { color: '#f9a825' }, transition: 'color 0.2s' }}>
                    {link.label}
                  </Typography>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Contact</Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                {[
                  { icon: <PhoneIcon sx={{ fontSize: 18 }} />, text: '(+228) 22 27 26 27 / 22 23 78 00' },
                  { icon: <EmailIcon sx={{ fontSize: 18 }} />, text: 'togoport@togoport.tg' },
                  { icon: <LocationIcon sx={{ fontSize: 18 }} />, text: "Lom\u00e9, Togo" },
                ].map((item, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ color: '#f9a825' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{item.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', mt: 6, pt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {"\u00a9 "}{new Date().getFullYear()}{" Port Autonome de Lom\u00e9. Tous droits r\u00e9serv\u00e9s."}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
