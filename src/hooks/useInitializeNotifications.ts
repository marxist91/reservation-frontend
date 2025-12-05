import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useHistoryStore } from '../store/historyStore';

/**
 * Hook pour initialiser les notifications et l'historique au chargement de l'application
 * Récupère les données initiales et configure un polling pour les nouvelles notifications
 */
export const useInitializeNotifications = (): void => {
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const fetchHistory = useHistoryStore((state) => state.fetchHistory);

  useEffect(() => {
    // Charger les notifications et l'historique au montage
    fetchNotifications();
    fetchHistory();

    // Polling toutes les 10 secondes pour les nouvelles notifications
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [fetchNotifications, fetchHistory]);
};

export default useInitializeNotifications;
