import { create } from 'zustand';
import { authAPI } from '../api/auth';
import type { User, LoginFormData, RegisterFormData } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterFormData) => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') ?? 'null') as User | null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (credentials: LoginFormData): Promise<void> => {
    console.log('🔐 Tentative de connexion avec:', { email: credentials.email });
    const data = await authAPI.login(credentials);
    console.log('✅ Réponse du serveur:', data);
    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
    });
    console.log('✅ Utilisateur connecté:', data.user);
  },

  logout: (): void => {
    authAPI.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  register: async (userData: RegisterFormData): Promise<void> => {
    const data = await authAPI.register(userData);
    // Note: RegisterResponse ne retourne pas de token, l'utilisateur doit se connecter
    set({
      user: data.user,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User | null): void => {
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token: string | null): void => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },
}));
