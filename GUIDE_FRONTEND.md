# 🎨 GUIDE DE DÉVELOPPEMENT FRONTEND

## 📋 Vue d'ensemble

Guide complet pour développer le frontend React connecté à votre backend de réservation de salles.

---

## 🚀 CRÉATION DU PROJET FRONTEND

### Étape 1 : Créer le projet Vite + React

```powershell
# Aller dans le dossier parent
cd c:\xampp\htdocs

# Créer le projet React avec Vite
npm create vite@latest reservation-frontend -- --template react

# Entrer dans le projet
cd reservation-frontend

# Installer les dépendances de base
npm install
```

### Étape 2 : Installer les bibliothèques nécessaires

```powershell
# UI Framework (Material-UI)
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Routing
npm install react-router-dom

# State Management
npm install zustand
# OU
npm install @reduxjs/toolkit react-redux

# API & Data Fetching
npm install axios @tanstack/react-query

# Forms
npm install react-hook-form yup @hookform/resolvers

# Date & Time
npm install date-fns

# Notifications
npm install react-hot-toast

# Charts (optionnel)
npm install recharts
```

---

## 📁 STRUCTURE DU PROJET FRONTEND

```
reservation-frontend/
├── src/
│   ├── api/                    # Configuration API
│   │   ├── client.js          # Axios client configuré
│   │   ├── auth.js            # Endpoints authentification
│   │   ├── users.js           # Endpoints utilisateurs
│   │   ├── rooms.js           # Endpoints salles
│   │   └── reservations.js    # Endpoints réservations
│   ├── components/            # Composants réutilisables
│   │   ├── common/            # Composants génériques
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── auth/              # Composants auth
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── rooms/             # Composants salles
│   │   │   ├── RoomCard.jsx
│   │   │   ├── RoomList.jsx
│   │   │   └── RoomForm.jsx
│   │   └── reservations/      # Composants réservations
│   │       ├── ReservationCard.jsx
│   │       ├── ReservationList.jsx
│   │       └── ReservationForm.jsx
│   ├── pages/                 # Pages principales
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── user/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyReservations.jsx
│   │   │   ├── SearchRooms.jsx
│   │   │   └── Profile.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── UsersManagement.jsx
│   │   │   ├── RoomsManagement.jsx
│   │   │   └── ReservationsManagement.jsx
│   │   └── NotFound.jsx
│   ├── store/                 # State management
│   │   ├── authStore.js       # Store auth (Zustand)
│   │   ├── userStore.js
│   │   └── index.js
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useRooms.js
│   │   └── useReservations.js
│   ├── utils/                 # Utilitaires
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── App.jsx                # Composant principal
│   ├── main.jsx               # Point d'entrée
│   └── index.css              # Styles globaux
├── public/
├── .env                       # Variables d'environnement
├── vite.config.js
└── package.json
```

---

## 🔧 CONFIGURATION DE BASE

### 1. Fichier `.env`

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Réservation de Salles
```

### 2. Configuration Axios (`src/api/client.js`)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. API Auth (`src/api/auth.js`)

```javascript
import apiClient from './client';

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/login', credentials);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },
};
```

### 4. Store Auth Zustand (`src/store/authStore.js`)

```javascript
import { create } from 'zustand';
import { authAPI } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (credentials) => {
    const data = await authAPI.login(credentials);
    set({
      user: data.data.user,
      token: data.data.token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    authAPI.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  register: async (userData) => {
    const data = await authAPI.register(userData);
    set({
      user: data.data.user,
      token: data.data.token,
      isAuthenticated: true,
    });
  },
}));
```

### 5. Routing (`src/App.jsx`)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserDashboard from './pages/user/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

### 6. Protected Route (`src/components/common/ProtectedRoute.jsx`)

```javascript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## 🎨 PAGES PRINCIPALES

### Login Page (`src/pages/auth/Login.jsx`)

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';

function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
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

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              margin="normal"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/register">Pas de compte ? S'inscrire</Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
```

### Dashboard User (`src/pages/user/Dashboard.jsx`)

```javascript
import { useAuthStore } from '../../store/authStore';
import { Container, Grid, Paper, Typography } from '@mui/material';

function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord
      </Typography>

      <Typography variant="h6" gutterBottom>
        Bienvenue, {user?.prenom} {user?.nom} !
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Mes Réservations</Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Salles Disponibles</Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">En Attente</Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
```

---

## 🔗 INTÉGRATION COMPLÈTE

### Hook personnalisé pour Rooms (`src/hooks/useRooms.js`)

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export const useRooms = () => {
  const queryClient = useQueryClient();

  // Récupérer toutes les salles
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await apiClient.get('/rooms');
      return response.data.data;
    },
  });

  // Créer une salle
  const createRoom = useMutation({
    mutationFn: async (roomData) => {
      const response = await apiClient.post('/rooms', roomData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Salle créée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur création salle');
    },
  });

  return { rooms, isLoading, createRoom };
};
```

---

## 🎯 FONCTIONNALITÉS À IMPLÉMENTER

### Phase 1 : Authentification
- [x] Page de connexion
- [x] Page d'inscription
- [x] Gestion du token JWT
- [x] Routes protégées
- [ ] Mot de passe oublié

### Phase 2 : Dashboard User
- [ ] Vue d'ensemble
- [ ] Mes réservations
- [ ] Recherche de salles
- [ ] Créer une réservation
- [ ] Profil utilisateur

### Phase 3 : Dashboard Admin
- [ ] Gestion utilisateurs
- [ ] Gestion salles
- [ ] Validation réservations
- [ ] Statistiques
- [ ] Logs audit

### Phase 4 : Fonctionnalités Avancées
- [ ] Calendrier interactif
- [ ] Notifications en temps réel
- [ ] Export PDF
- [ ] Graphiques statistiques
- [ ] Recherche avancée
- [ ] Filtres multiples

---

## 🚀 DÉMARRAGE

```powershell
# Démarrer le backend
cd c:\xampp\htdocs\reservation-backend
.\start-xampp.bat

# Dans un autre terminal, démarrer le frontend
cd c:\xampp\htdocs\reservation-frontend
npm run dev
```

**Backend** : http://localhost:3000  
**Frontend** : http://localhost:5173

---

## 📚 RESSOURCES

- [React Documentation](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Material-UI](https://mui.com/)
- [React Router](https://reactrouter.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Bon développement frontend ! 🎨🚀**
