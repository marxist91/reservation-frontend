import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link,
  keyframes,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  MeetingRoom as RoomIcon,
  CalendarMonth as CalendarIcon,
  Groups as GroupsIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Email ou mot de passe incorrect';
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>

      {/* ═══ LEFT PANEL — Branding ═══ */}
      {!isMobile && (
        <Box
          sx={{
            flex: '0 0 45%', position: 'relative', overflow: 'hidden',
            bgcolor: '#0a2463',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            p: 6, color: 'white',
          }}
        >
          {/* Background image */}
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/images/Hub.png)', backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          {/* Dark overlay for text readability */}
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,36,99,0.65) 0%, rgba(30,58,138,0.55) 40%, rgba(22,107,198,0.5) 100%)' }} />
          {/* Grid pattern */}
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
            <Box sx={{ mb: 4 }}>
              <img src="/images/logo.png" alt="Logo" style={{ height: 72, width: 72, borderRadius: 16 }} />
            </Box>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 2, lineHeight: 1.2, fontSize: '2.2rem' }}>
              Port Autonome de Lomé
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, lineHeight: 1.7 }}>
              Gérez vos réservations de salles de réunion en toute simplicité
            </Typography>

            {/* Feature highlights */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, textAlign: 'left' }}>
              {[
                { icon: <RoomIcon />, text: 'Salles modernes et équipées' },
                { icon: <CalendarIcon />, text: 'Réservation en temps réel' },
                { icon: <GroupsIcon />, text: 'Gestion collaborative simple' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, animation: `${fadeIn} 0.5s ease-out ${0.3 + i * 0.1}s both` }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2,
                    bgcolor: 'rgba(249,168,37,0.15)', color: '#f9a825',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ═══ RIGHT PANEL — Login form ═══ */}
      <Box
        sx={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          p: { xs: 3, sm: 4, md: 6 }, bgcolor: '#fafbfc', position: 'relative',
        }}
      >
        {/* Back to home */}
        <Box sx={{ position: 'absolute', top: 24, left: 24 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
          >
            Accueil
          </Button>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420, animation: `${fadeIn} 0.6s ease-out` }}>
          {/* Mobile logo */}
          {isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img src="/images/logo.png" alt="Logo" style={{ height: 56, width: 56, borderRadius: 12 }} />
            </Box>
          )}

          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: '1.6rem', md: '2rem' } }}>
            Bienvenue 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Connectez-vous pour accéder à votre espace
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Adresse Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: user@example.com"
              required
              autoFocus
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
              }}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2" color="text.secondary">Se souvenir de moi</Typography>}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 700, textTransform: 'none',
                bgcolor: '#166bc6',
                boxShadow: '0 4px 16px rgba(22,107,198,0.3)',
                '&:hover': {
                  bgcolor: '#1257a5',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 24px rgba(22,107,198,0.35)',
                },
                transition: 'all 0.2s ease',
                mb: 3,
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                sx={{ color: 'text.secondary', fontSize: '0.9rem', '&:hover': { color: 'primary.main' } }}
              >
                ← Retour à l'accueil
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
