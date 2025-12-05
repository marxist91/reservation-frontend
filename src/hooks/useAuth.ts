import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { LoginFormData, RegisterFormData, UserRole } from '@/types';

type Action = 
  | 'manage_users'
  | 'manage_rooms'
  | 'validate_reservations'
  | 'view_all_reservations'
  | 'view_stats'
  | 'delete_reservations'
  | 'create_reservation'
  | 'cancel_own_reservation'
  | 'view_own_reservations'
  | 'update_profile';

export interface UseAuthReturn {
  // State
  user: ReturnType<typeof useAuthStore.getState>['user'];
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginFormData, redirectTo?: string) => Promise<void>;
  logout: (redirectTo?: string) => void;
  register: (userData: RegisterFormData, redirectTo?: string) => Promise<void>;
  
  // Role checks
  isAdmin: boolean;
  isResponsable: boolean;
  isUser: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canPerform: (action: Action) => boolean;
  
  // Helpers
  fullName: string;
  initials: string;
  roleLabel: string;
  checkTokenExpired: () => boolean;
}

/**
 * Hook personnalisé pour l'authentification
 * Fournit des utilitaires et helpers pour gérer l'auth
 */
export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
  } = useAuthStore();

  // Login avec redirection
  const login = useCallback(async (credentials: LoginFormData, redirectTo: string = '/dashboard'): Promise<void> => {
    await storeLogin(credentials);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [storeLogin, navigate]);

  // Register avec redirection
  const register = useCallback(async (userData: RegisterFormData, redirectTo: string = '/dashboard'): Promise<void> => {
    await storeRegister(userData);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [storeRegister, navigate]);

  // Logout avec redirection
  const logout = useCallback((redirectTo: string = '/login'): void => {
    storeLogout();
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [storeLogout, navigate]);

  // Vérifications de rôle
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  const isResponsable = useMemo(() => user?.role === 'responsable', [user?.role]);
  const isUser = useMemo(() => user?.role === 'user', [user?.role]);

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (Array.isArray(role)) {
      return role.includes(user?.role as UserRole);
    }
    return user?.role === role;
  }, [user?.role]);

  // Vérifier si l'utilisateur peut effectuer une action
  const canPerform = useCallback((action: Action): boolean => {
    const permissions: Record<Action, string[]> = {
      // Admin peut tout faire
      manage_users: ['admin'],
      manage_rooms: ['admin', 'responsable'],
      validate_reservations: ['admin', 'responsable'],
      view_all_reservations: ['admin', 'responsable'],
      view_stats: ['admin', 'responsable'],
      delete_reservations: ['admin'],
      
      // Actions utilisateur
      create_reservation: ['admin', 'responsable', 'user'],
      cancel_own_reservation: ['admin', 'responsable', 'user'],
      view_own_reservations: ['admin', 'responsable', 'user'],
      update_profile: ['admin', 'responsable', 'user'],
    };

    const allowedRoles = permissions[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user?.role as UserRole);
  }, [user?.role]);

  // Obtenir le nom complet de l'utilisateur
  const fullName = useMemo((): string => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user?.email || 'Utilisateur';
  }, [user]);

  // Obtenir les initiales
  const initials = useMemo((): string => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0)?.toUpperCase() || 'U';
  }, [user]);

  // Obtenir le label du rôle
  const roleLabel = useMemo((): string => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      responsable: 'Responsable',
      user: 'Utilisateur',
    };
    return labels[user?.role as string] || 'Utilisateur';
  }, [user?.role]);

  // Fonction pour vérifier si le token est expiré (appelée à la demande)
  const checkTokenExpired = useCallback((): boolean => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) return true;
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, [token]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    register,
    
    // Role checks
    isAdmin,
    isResponsable,
    isUser,
    hasRole,
    canPerform,
    
    // Helpers
    fullName,
    initials,
    roleLabel,
    checkTokenExpired,
  };
};

export default useAuth;
