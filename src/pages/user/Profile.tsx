import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersAPI } from '@/api/users';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Alert,
  alpha,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

interface ProfileFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      await usersAPI.update(user.id, formData);
      toast.success('Profil mis à jour avec succès !');
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordLoading(true);
    try {
      await usersAPI.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Mot de passe modifié avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#90caf9' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1565c0' },
    },
  };

  const roleLabel = user?.role === 'admin'
    ? 'Administrateur'
    : user?.role === 'responsable'
      ? 'Responsable'
      : 'Utilisateur';

  const roleColor = user?.role === 'admin'
    ? '#1565c0'
    : user?.role === 'responsable'
      ? '#e65100'
      : '#2e7d32';

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 4 }}
      >
        Mon Profil
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card - Right on desktop, top on mobile */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: -1, md: 1 } }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {/* Gradient header */}
            <Box
              sx={{
                height: 100,
                background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
                position: 'relative',
              }}
            />
            <Box sx={{ p: 3, pt: 0, textAlign: 'center', mt: -6 }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: '#fff',
                  color: '#1565c0',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  border: '4px solid #fff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                {(user?.prenom?.charAt(0) || '').toUpperCase()}{(user?.nom?.charAt(0) || '').toUpperCase()}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {user?.prenom} {user?.nom}
              </Typography>
              <Chip
                label={roleLabel}
                size="small"
                sx={{
                  mt: 1,
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: alpha(roleColor, 0.1),
                  color: roleColor,
                }}
              />

              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1565c0',
                      flexShrink: 0,
                    }}
                  >
                    <EmailIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      flexShrink: 0,
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Téléphone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user?.telephone || 'Non renseigné'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Forms Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Personal Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1565c0',
                }}
              >
                <PersonIcon />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Informations personnelles
              </Typography>
            </Box>

            <form onSubmit={handleProfileSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled
                    helperText="L'email ne peut pas être modifié"
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
                      boxShadow: '0 4px 14px rgba(10,36,99,0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0d2f7a 0%, #1976d2 100%)',
                        boxShadow: '0 6px 20px rgba(10,36,99,0.4)',
                      },
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Change Password */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#fff3e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e65100',
                }}
              >
                <LockIcon />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Changer le mot de passe
              </Typography>
            </Box>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {passwordError}
              </Alert>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Mot de passe actuel"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nouveau mot de passe"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    helperText="Min. 8 caractères"
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Confirmer le mot de passe"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    error={passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword}
                    helperText={
                      passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword
                        ? 'Les mots de passe ne correspondent pas'
                        : ''
                    }
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="outlined"
                    startIcon={<LockIcon />}
                    disabled={passwordLoading}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      borderColor: alpha('#e65100', 0.4),
                      color: '#e65100',
                      '&:hover': {
                        bgcolor: alpha('#e65100', 0.06),
                        borderColor: '#e65100',
                      },
                    }}
                  >
                    {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
