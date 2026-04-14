import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Link,
  keyframes,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
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

interface RegisterFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirmPassword: string;
  telephone: string;
}

const Register: React.FC = () => {
  const { register } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState<RegisterFormData>({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await register(formData, '/dashboard');
      toast.success('Inscription réussie !');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const features = [
    { icon: <RoomIcon sx={{ fontSize: 28 }} />, text: 'Réservez vos salles en quelques clics' },
    { icon: <CalendarIcon sx={{ fontSize: 28 }} />, text: 'Planifiez vos réunions facilement' },
    { icon: <GroupsIcon sx={{ fontSize: 28 }} />, text: 'Collaborez avec votre équipe' },
  ];

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      bgcolor: '#f8f9fa',
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#90caf9' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1565c0' },
      '&.Mui-focused': { bgcolor: '#fff' },
    },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Panel - Branding */}
      {!isMobile && (
        <Box
          sx={{
            flex: '0 0 42%',
            background: 'linear-gradient(135deg, rgba(10,36,99,0.85) 0%, rgba(21,101,192,0.85) 100%)',
            backgroundImage: 'url(/images/Hub.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              component="img"
              src="/images/logo.png"
              alt="Logo"
              sx={{ height: 60, mb: 4, filter: 'brightness(0) invert(1)', opacity: 0.95 }}
            />
            <Typography
              variant="h3"
              sx={{ color: '#fff', fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}
            >
              Rejoignez-nous
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', mb: 5 }}>
              Créez votre compte pour accéder au système de réservation
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {features.map((f, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                    {f.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Right Panel - Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#fafbfc',
          px: { xs: 3, sm: 6 },
          py: 4,
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 480,
            animation: `${fadeIn} 0.5s ease-out`,
          }}
        >
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              mb: 4,
              '&:hover': { color: '#1565c0' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Retour à l'accueil</Typography>
          </Link>

          {isMobile && (
            <Box
              component="img"
              src="/images/logo.png"
              alt="Logo"
              sx={{ height: 40, mb: 3 }}
            />
          )}

          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5, letterSpacing: '-0.02em' }}
          >
            Créer un compte
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Remplissez vos informations pour commencer
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nom"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Prénom"
                  name="prenom"
                  required
                  value={formData.prenom}
                  onChange={handleChange}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="telephone"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Mot de passe"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  sx={inputSx}
                  helperText="Minimum 8 caractères"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  sx={inputSx}
                  error={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                  helperText={
                    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword
                      ? 'Les mots de passe ne correspondent pas'
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                          {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
                boxShadow: '0 4px 14px rgba(10,36,99,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d2f7a 0%, #1976d2 100%)',
                  boxShadow: '0 6px 20px rgba(10,36,99,0.4)',
                },
              }}
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Déjà un compte ?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{ color: '#1565c0', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Se connecter
                </Link>
              </Typography>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
