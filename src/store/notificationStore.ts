import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import notificationsApi from '@/api/notifications';
import type { Notification } from '@/types';
import { NotificationType } from '@/types';

type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ExtendedNotification extends Notification {
  severity: NotificationSeverity;
  actionUrl: string;
  read: boolean;
}

interface NotificationState {
  notifications: ExtendedNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  clearAll: () => void;
  clearRead: () => void;
  getUnreadNotifications: () => ExtendedNotification[];
  getNotificationsByType: (type: string) => ExtendedNotification[];
  // Méthodes legacy
  addNotification: (notification: unknown) => void;
  notifyReservationValidated: (reservation: any) => void;
  notifyReservationRejected: (reservation: any) => void;
  notifyNewReservationRequest: (reservation: any) => void;
  notifyReservationCancelled: (reservation: any) => void;
  notifyUpcomingReservation: (reservation: any) => void;
  loadPendingReservationsNotifications: () => void;
}

/**
 * Store pour gérer les notifications
 * Les notifications sont récupérées depuis l'API backend
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // État
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      
      // Récupérer les notifications depuis l'API
      fetchNotifications: async (): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          const rawNotifications = await notificationsApi.getAll();
          console.log('🔔 Notifications brutes reçues du backend:', rawNotifications);
          
          // Mapper les données backend vers le format frontend
          const notifications: ExtendedNotification[] = rawNotifications.map((n): ExtendedNotification => {
            // Déterminer severity et actionUrl selon le type
            let severity: NotificationSeverity = 'info';
            let actionUrl = '/reservations';
            
            switch(n.type) {
              case NotificationType.RESERVATION_VALIDATED:
                severity = 'success';
                actionUrl = '/reservations';
                break;
              case NotificationType.RESERVATION_REJECTED:
                severity = 'error';
                actionUrl = '/reservations';
                break;
              case NotificationType.NEW_RESERVATION:
                severity = 'info';
                actionUrl = '/admin/reservations';
                break;
              case NotificationType.RESERVATION_CANCELLED:
                severity = 'warning';
                actionUrl = '/reservations';
                break;
              case NotificationType.REMINDER:
                severity = 'info';
                actionUrl = '/reservations';
                break;
              case NotificationType.RESERVATION_CREATED_GROUP:
                severity = 'success';
                actionUrl = '/reservations';
                break;
              case NotificationType.ADMIN_NEW_RESERVATION_GROUP:
                severity = 'info';
                actionUrl = '/admin/reservations';
                break;
              case NotificationType.SUPPORT_TICKET:
                severity = 'warning';
                actionUrl = '/admin/support';
                break;
              case NotificationType.SUPPORT_RESPONSE:
                severity = 'info';
                actionUrl = '/my-tickets';
                break;
              default:
                severity = 'info';
            }

            // Conversion explicite du statut lu/non lu
            const isRead = Boolean(n.lu);

            return {
              ...n,
              severity,
              actionUrl,
              read: isRead,
            };
          });
          
          // Calculer le nombre de non-lues
          const unreadCount = notifications.filter(n => !n.read).length;
          
          set({ 
            notifications, 
            unreadCount,
            isLoading: false 
          });
        } catch (error) {
          console.error('Erreur lors du chargement des notifications:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Impossible de charger les notifications', 
            isLoading: false 
          });
        }
      },
      
      // Marquer comme lu
      markAsRead: async (notificationId: number): Promise<void> => {
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
      markAllAsRead: async (): Promise<void> => {
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
      deleteNotification: async (notificationId: number): Promise<void> => {
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
      clearAll: (): void => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },
      
      // Supprimer les notifications lues
      clearRead: (): void => {
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.read),
        }));
      },
      
      // Obtenir les notifications non lues
      getUnreadNotifications: (): ExtendedNotification[] => {
        return get().notifications.filter((n) => !n.read);
      },
      
      // Obtenir les notifications par type
      getNotificationsByType: (type: string): ExtendedNotification[] => {
        return get().notifications.filter((n) => n.type === type);
      },
      
      // --- Méthodes Legacy ---
      addNotification: (): void => { console.log('addNotification deprecated'); },
      notifyReservationValidated: (_reservation: any): void => {},
      notifyReservationRejected: (_reservation: any): void => {},
      notifyNewReservationRequest: (_reservation: any): void => {},
      notifyReservationCancelled: (_reservation: any): void => {},
      notifyUpcomingReservation: (_reservation: any): void => {},
      loadPendingReservationsNotifications: (): void => { get().fetchNotifications(); },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notifications: state.notifications, unreadCount: state.unreadCount }),
    }
  )
);
