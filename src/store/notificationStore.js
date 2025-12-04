import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import notificationsApi from '../api/notifications';

/**
 * Store pour gérer les notifications
 * Les notifications sont récupérées depuis l'API backend
 */
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      // État
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      
      // Récupérer les notifications depuis l'API
      fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
          const rawNotifications = await notificationsApi.getAll();
          console.log('🔔 Notifications brutes reçues du backend:', rawNotifications);
          
          // Mapper les données backend vers le format frontend
          const notifications = rawNotifications.map(n => {
            // Déterminer severity et actionUrl selon le type
            let severity = 'info';
            let actionUrl = '/reservations';
            
            switch(n.type) {
              case 'reservation_validated':
                severity = 'success';
                actionUrl = '/reservations';
                break;
              case 'reservation_rejected':
                severity = 'error';
                actionUrl = '/reservations';
                break;
              case 'new_reservation':
                severity = 'info';
                actionUrl = '/admin/reservations';
                break;
              case 'reservation_cancelled':
                severity = 'warning';
                actionUrl = '/reservations';
                break;
              case 'reminder':
                severity = 'info';
                actionUrl = '/reservations';
                break;
              case 'reservation_created_group':
                severity = 'success';
                actionUrl = '/reservations';
                break;
              case 'admin_new_reservation_group':
                severity = 'info';
                actionUrl = '/admin/reservations';
                break;
              default:
                severity = 'info';
            }

            // Conversion explicite du statut lu/non lu
            // Le backend renvoie 'lu' (0 ou 1), le frontend utilise 'read' (boolean)
            const isRead = Boolean(n.lu) || Boolean(n.read) || false;

            return {
              id: n.id,
              title: n.titre || n.title, // Supporte les deux formats
              message: n.message,
              type: n.type,
              severity: severity,
              timestamp: n.created_at || n.createdAt || n.timestamp, // Supporte snake_case et camelCase
              read: isRead,
              lu: isRead,
              reservationId: n.reservation_id || n.reservationId,
              actionUrl: actionUrl
            };
          });
          
          // Calculer le nombre de non-lues
          const unreadCount = notifications.filter(n => !n.read).length;
          
          set({ 
            notifications: notifications, 
            unreadCount: unreadCount,
            isLoading: false 
          });
        } catch (error) {
          console.error('Erreur lors du chargement des notifications:', error);
          set({ 
            error: error.message || 'Impossible de charger les notifications', 
            isLoading: false 
          });
        }
      },
      
      // Marquer comme lu
      markAsRead: async (notificationId) => {
        // Mise à jour optimiste
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, lu: true, read: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        try {
          await notificationsApi.markAsRead(notificationId);
        } catch (error) {
          console.error('Erreur lors du marquage comme lu:', error);
        }
      },
      
      // Marquer toutes comme lues
      markAllAsRead: async () => {
        // Mise à jour optimiste
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, lu: true, read: true })),
          unreadCount: 0,
        }));

        try {
          await notificationsApi.markAllAsRead();
        } catch (error) {
          console.error('Erreur lors du marquage de tout comme lu:', error);
        }
      },
      
      // Supprimer une notification
      deleteNotification: async (notificationId) => {
        // Mise à jour optimiste
        set((state) => {
          const notif = state.notifications.find((n) => n.id === notificationId);
          const wasUnread = notif && !notif.read;
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });

        try {
          await notificationsApi.delete(notificationId);
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      },
      
      // Supprimer toutes les notifications (localement seulement pour l'instant)
      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },
      
      // Supprimer les notifications lues
      clearRead: () => {
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.read),
        }));
      },
      
      // Obtenir les notifications non lues
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },
      
      // Obtenir les notifications par type
      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },
      
      // --- Méthodes Legacy ---
      addNotification: (notification) => { console.log('addNotification deprecated'); },
      notifyReservationValidated: () => {},
      notifyReservationRejected: () => {},
      notifyNewReservationRequest: () => {},
      notifyReservationCancelled: () => {},
      notifyUpcomingReservation: () => {},
      loadPendingReservationsNotifications: () => { get().fetchNotifications(); },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notifications: state.notifications, unreadCount: state.unreadCount }),
    }
  )
);
