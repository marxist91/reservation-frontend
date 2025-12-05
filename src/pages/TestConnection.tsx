import { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import apiClient from '@/api/client';

interface TestResult {
  name: string;
  status: 'success' | 'error';
  message: string;
  details?: string;
}

interface TestResults {
  apiUrl: string;
  timestamp: string;
  tests: TestResult[];
}

interface LoginTestData {
  email: string;
  password: string;
}

interface LoginResult {
  status: 'success' | 'error';
  message: string;
  details?: any;
  data?: any;
}

const TestConnection: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [loginTest, setLoginTest] = useState<LoginTestData>({ email: '', password: '' });
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);

  const testBackendConnection = async (): Promise<void> => {
    setTesting(true);
    const testResults: TestResults = {
      apiUrl: import.meta.env.VITE_API_URL as string,
      timestamp: new Date().toLocaleString(),
      tests: [],
    };

    // Test 1: Backend accessible
    try {
      const response = await fetch('http://localhost:3000/api');
      testResults.tests.push({
        name: 'Backend accessible',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Backend répond correctement' : `Erreur HTTP ${response.status}`,
        details: `URL: http://localhost:3000/api`,
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Backend accessible',
        status: 'error',
        message: 'Backend non accessible',
        details: error.message,
      });
    }

    // Test 2: CORS Configuration
    try {
      await apiClient.get('/');
      testResults.tests.push({
        name: 'CORS Configuration',
        status: 'success',
        message: 'CORS configuré correctement',
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'CORS Configuration',
        status: 'error',
        message: 'Problème CORS détecté',
        details: error.message,
      });
    }

    // Test 3: Base de données
    try {
      const response = await apiClient.get('/users');
      testResults.tests.push({
        name: 'Base de données',
        status: 'success',
        message: 'Connexion à la base de données OK',
        details: `${response.data.data?.length || 0} utilisateurs trouvés`,
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Base de données',
        status: 'error',
        message: 'Erreur base de données',
        details: error.response?.data?.message || error.message,
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const testLogin = async (): Promise<void> => {
    setLoginResult(null);
    try {
      const response = await apiClient.post('/login', loginTest);
      setLoginResult({
        status: 'success',
        message: 'Connexion réussie !',
        data: response.data,
      });
    } catch (error: any) {
      setLoginResult({
        status: 'error',
        message: error.response?.data?.message || 'Erreur de connexion',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
      });
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔧 Test de Connexion Backend
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Cette page permet de diagnostiquer la connexion entre le frontend et le backend.
        </Typography>

        <Button
          variant="contained"
          onClick={testBackendConnection}
          disabled={testing}
          startIcon={testing ? <CircularProgress size={20} /> : <RefreshIcon />}
          fullWidth
          size="large"
        >
          {testing ? 'Test en cours...' : 'Tester la connexion'}
        </Button>

        {results && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>URL API:</strong> {results.apiUrl}
              <br />
              <strong>Test effectué:</strong> {results.timestamp}
            </Alert>

            {results.tests.map((test, index) => (
              <Alert
                key={index}
                severity={test.status}
                icon={test.status === 'success' ? <CheckIcon /> : <ErrorIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {test.name}
                </Typography>
                <Typography variant="body2">{test.message}</Typography>
                {test.details && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Détails: {test.details}
                  </Typography>
                )}
              </Alert>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>
          🔐 Test de Connexion
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={loginTest.email}
            onChange={(e) => setLoginTest({ ...loginTest, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            margin="normal"
            value={loginTest.password}
            onChange={(e) => setLoginTest({ ...loginTest, password: e.target.value })}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={testLogin}
            fullWidth
            sx={{ mt: 2 }}
          >
            Tester la connexion
          </Button>
        </Box>

        {loginResult && (
          <Alert severity={loginResult.status} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {loginResult.message}
            </Typography>
            {loginResult.details && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(loginResult.details, null, 2)}
                </Typography>
              </Box>
            )}
            {loginResult.data && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(loginResult.data, null, 2)}
                </Typography>
              </Box>
            )}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default TestConnection;
