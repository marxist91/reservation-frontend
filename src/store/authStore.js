import { create } from 'zustand';
import { authAPI } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (credentials) => {
    console.log('🔐 Tentative de connexion avec:', { email: credentials.email });
    const data = await authAPI.login(credentials);
    console.log('✅ Réponse du serveur:', data);
    set({
      user: data.data.user,
      token: data.data.token,
      isAuthenticated: true,
    });
    console.log('✅ Utilisateur connecté:', data.data.user);
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