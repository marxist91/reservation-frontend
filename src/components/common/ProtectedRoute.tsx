import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Vérifier aussi le token dans localStorage (pour le rafraîchissement)
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  // Si pas authentifié mais token existe, on laisse passer
  // le client API va gérer la validation du token
  const hasValidSession = isAuthenticated || (token && storedUser);

  if (!hasValidSession) {
    // Sauvegarder la route actuelle pour rediriger après login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier le rôle si requis
  const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
  
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    console.log('🔒 ProtectedRoute Check:', { 
      required: allowedRoles, 
      current: currentUser?.role,
      user: currentUser 
    });
    
    if (!allowedRoles.includes(currentUser?.role)) {
      console.warn('⛔ Access Denied: Role mismatch');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
