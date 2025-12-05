import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import toast from 'react-hot-toast';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

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
  const [formData, setFormData] = useState<RegisterFormData>({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
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

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Inscription
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* @ts-expect-error MUI Grid item prop typing issue with exactOptionalPropertyTypes */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                />
              </Grid>

              {/* @ts-expect-error MUI Grid item prop typing issue with exactOptionalPropertyTypes */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  name="prenom"
                  required
                  value={formData.prenom}
                  onChange={handleChange}
                />
              </Grid>

              {/* @ts-expect-error MUI Grid item prop typing issue with exactOptionalPropertyTypes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              {/* @ts-expect-error MUI Grid item prop typing issue with exactOptionalPropertyTypes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="telephone"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                />
              </Grid>

              {/* @ts-expect-error MUI Grid item prop typing issue with exactOptionalPropertyTypes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mot de passe"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/login">Déjà un compte ? Se connecter</Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
