import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from '../../components/auth/LoginForm';
import toast from 'react-hot-toast';
import {
  Container,
  Box,
  Typography,
  Paper,
} from '@mui/material';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: LoginFormData): Promise<void> => {
    setLoading(true);
    try {
      await login(formData, '/dashboard');
      toast.success('Connexion réussie !');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      console.error('Réponse du serveur:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erreur de connexion au serveur';
      
      toast.error(errorMessage, {
        duration: 5000,
      });
      
      if (!error.response) {
        console.error('Le backend ne répond pas. Vérifiez que le serveur est démarré sur http://localhost:3000');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Connexion
          </Typography>

          <LoginForm onSubmit={handleSubmit} isLoading={loading} />

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link to="/register">Pas de compte ? S'inscrire</Link>
          </Box>
            
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link to="/test-connection" style={{ fontSize: '0.875rem', color: '#666' }}>
              🔧 Tester la connexion au backend
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
