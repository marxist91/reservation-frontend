import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface RegisterFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSubmit: (data: Omit<RegisterFormData, 'confirmPassword'>) => void;
  isLoading?: boolean;
  error?: string | null;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading = false, error = null }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (field: keyof RegisterFormData) => (event: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [field]: event.target.value });
    setValidationError('');
  };

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 8) {
      setValidationError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Le mot de passe doit contenir au moins une majuscule');
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setValidationError('Le mot de passe doit contenir au moins un chiffre');
      return false;
    }
    if (!/[!@#$%^&*]/.test(formData.password)) {
      setValidationError('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Exclude confirmPassword from submitted data
    const { confirmPassword: _confirmPassword, ...userData } = formData;
    onSubmit(userData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {(error || validationError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError || error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            id="prenom"
            name="prenom"
            fullWidth
            label="Prénom"
            required
            autoComplete="given-name"
            autoFocus
            value={formData.prenom}
            onChange={handleChange('prenom')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            id="nom"
            name="nom"
            fullWidth
            label="Nom"
            required
            autoComplete="family-name"
            value={formData.nom}
            onChange={handleChange('nom')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <TextField
        id="email"
        name="email"
        fullWidth
        label="Email"
        type="email"
        margin="normal"
        required
        autoComplete="email"
        value={formData.email}
        onChange={handleChange('email')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        id="password"
        name="password"
        fullWidth
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        margin="normal"
        required
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange('password')}
        helperText="Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        id="confirmPassword"
        name="confirmPassword"
        fullWidth
        label="Confirmer le mot de passe"
        type={showPassword ? 'text' : 'password'}
        margin="normal"
        required
        autoComplete="new-password"
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Button
        fullWidth
        variant="contained"
        type="submit"
        size="large"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? 'Inscription...' : "S'inscrire"}
      </Button>

      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Déjà un compte ?{' '}
          <Link component={RouterLink} to="/login">
            Se connecter
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;
