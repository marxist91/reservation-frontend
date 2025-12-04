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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

function LoginForm({ onSubmit, isLoading = false, error = null }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        id="email"
        name="email"
        fullWidth
        label="Email"
        type="email"
        margin="normal"
        required
        autoComplete="email"
        autoFocus
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
        autoComplete="current-password"
        value={formData.password}
        onChange={handleChange('password')}
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

      <Button
        fullWidth
        variant="contained"
        type="submit"
        size="large"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </Button>

      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Pas encore de compte ?{' '}
          <Link component={RouterLink} to="/register">
            S'inscrire
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default LoginForm;
