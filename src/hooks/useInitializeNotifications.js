import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useHistoryStore } from '../store/historyStore';
import { useAuthStore } from '../store/authStore';

/**
 * Hook pour initialiser les notifications et l'historique au chargement de l'application
 * Charge les notifications et l'historique depuis l'API
 */
export const useInitializeNotifications = () => {
  const { fetchNotifications } = useNotificationStore();
  const { fetchHistory } = useHistoryStore();
  const currentUser = useAuthStore((state) => state.user);

  // Effet pour charger les notifications et l'historique depuis l'API
  useEffect(() => {
    if (currentUser) {
      console.log('🔔 Fetching notifications and history from API...');
      fetchNotifications();
      fetchHistory();
      
      // Polling toutes les 10 secondes pour les nouvelles notifications
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchNotifications, fetchHistory]);
};

export default useInitializeNotifications;
