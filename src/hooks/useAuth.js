import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Hook personnalisé pour l'authentification
 * Fournit des utilitaires et helpers pour gérer l'auth
 */
export const useAuth = () => {
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
  const login = useCallback(async (credentials, redirectTo = '/dashboard') => {
    await storeLogin(credentials);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [storeLogin, navigate]);

  // Register avec redirection
  const register = useCallback(async (userData, redirectTo = '/dashboard') => {
    await storeRegister(userData);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [storeRegister, navigate]);

  // Logout avec redirection
  const logout = useCallback((redirectTo = '/login') => {
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
  const hasRole = useCallback((role) => {
    if (Array.isArray(role)) {
      return role.includes(user?.role);
    }
    return user?.role === role;
  }, [user?.role]);

  // Vérifier si l'utilisateur peut effectuer une action
  const canPerform = useCallback((action) => {
    const permissions = {
      // Admin peut tout faire
      'manage_users': ['admin'],
      'manage_rooms': ['admin', 'responsable'],
      'validate_reservations': ['admin', 'responsable'],
      'view_all_reservations': ['admin', 'responsable'],
      'view_stats': ['admin', 'responsable'],
      'delete_reservations': ['admin'],
      
      // Actions utilisateur
      'create_reservation': ['admin', 'responsable', 'user'],
      'cancel_own_reservation': ['admin', 'responsable', 'user'],
      'view_own_reservations': ['admin', 'responsable', 'user'],
      'update_profile': ['admin', 'responsable', 'user'],
    };

    const allowedRoles = permissions[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user?.role);
  }, [user?.role]);

  // Obtenir le nom complet de l'utilisateur
  const fullName = useMemo(() => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user?.email || 'Utilisateur';
  }, [user]);

  // Obtenir les initiales
  const initials = useMemo(() => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0)?.toUpperCase() || 'U';
  }, [user]);

  // Obtenir le label du rôle
  const roleLabel = useMemo(() => {
    const labels = {
      admin: 'Administrateur',
      responsable: 'Responsable',
      user: 'Utilisateur',
    };
    return labels[user?.role] || 'Utilisateur';
  }, [user?.role]);

  // Fonction pour vérifier si le token est expiré (appelée à la demande)
  const checkTokenExpired = useCallback(() => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
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
