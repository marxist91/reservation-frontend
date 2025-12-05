import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore, useHistoryStore, useAuthStore } from '@/store';
import type { Reservation } from '@/types';

export interface UseNotificationHistoryReturn {
  onReservationCreated: (reservation: Reservation) => void;
  onReservationValidated: (reservation: Reservation) => void;
  onReservationRejected: (reservation: Reservation, reason?: string) => void;
  onReservationCancelled: (reservation: Reservation) => void;
  onReservationDeleted: (reservation: Reservation) => void;
  onReservationUpdated: (reservation: Reservation, changes: Record<string, unknown>) => void;
  notifyNewRequest: (reservation: Reservation) => void;
}

/**
 * Hook pour gérer les notifications et l'historique automatiquement
 * S'intègre avec les mutations de réservations pour logger toutes les actions
 */
export const useNotificationHistory = (): UseNotificationHistoryReturn => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  
  const {
    notifyReservationValidated,
    notifyReservationRejected,
    notifyNewReservationRequest,
    notifyReservationCancelled,
  } = useNotificationStore();
  
  const {
    logReservationCreated,
    logReservationValidated,
    logReservationRejected,
    logReservationCancelled,
    logReservationDeleted,
    logReservationUpdated,
    logUserLogin,
  } = useHistoryStore();
  
  // Fonction pour créer une réservation avec notification et historique
  const onReservationCreated = (reservation: Reservation): void => {
    const userName = `${user?.prenom} ${user?.nom}`;
    
    // Ajouter à l'historique
    if (user?.id) {
      logReservationCreated(user.id, userName, reservation);
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour valider une réservation
  const onReservationValidated = (reservation: Reservation): void => {
    const adminName = `${user?.prenom} ${user?.nom}`;
    
    // Notifier l'utilisateur concerné
    notifyReservationValidated(reservation);
    
    // Ajouter à l'historique
    if (user?.id) {
      logReservationValidated(user.id, adminName, reservation);
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour refuser une réservation
  const onReservationRejected = (reservation: Reservation, reason?: string): void => {
    const adminName = `${user?.prenom} ${user?.nom}`;
    
    // Notifier l'utilisateur concerné
    notifyReservationRejected(reservation);
    
    // Ajouter à l'historique
    if (user?.id) {
      logReservationRejected(user.id, adminName, reservation, reason);
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour annuler une réservation
  const onReservationCancelled = (reservation: Reservation): void => {
    const userName = `${user?.prenom} ${user?.nom}`;
    
    // Notifier
    notifyReservationCancelled(reservation);
    
    // Ajouter à l'historique
    if (user?.id) {
      logReservationCancelled(user.id, userName, reservation);
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour supprimer une réservation (admin)
  const onReservationDeleted = (reservation: Reservation): void => {
    const adminName = `${user?.prenom} ${user?.nom}`;
    
    // Ajouter à l'historique
    if (user?.id) {
      logReservationDeleted(user.id, adminName, reservation);
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour modifier une réservation
  const onReservationUpdated = (reservation: Reservation, changes: Record<string, unknown>): void => {
    const userName = `${user?.prenom} ${user?.nom}`;
    
    // Ajouter à l'historique
    if (user?.id) {
      logReservationUpdated(user.id, userName, reservation, changes);
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Logger la connexion au chargement du hook (si utilisateur connecté)
  useEffect(() => {
    if (user?.id) {
      const userName = `${user.prenom} ${user.nom}`;
      const hasLoggedLogin = sessionStorage.getItem(`login_logged_${user.id}`);
      if (!hasLoggedLogin) {
        logUserLogin(user.id, userName);
        sessionStorage.setItem(`login_logged_${user.id}`, 'true');
      }
    }
  }, [user?.id, user?.prenom, user?.nom, logUserLogin]);
  
  return {
    // Callbacks pour les mutations
    onReservationCreated,
    onReservationValidated,
    onReservationRejected,
    onReservationCancelled,
    onReservationDeleted,
    onReservationUpdated,
    
    // Helper pour notifier une nouvelle demande (admin)
    notifyNewRequest: (reservation: Reservation) => {
      notifyNewReservationRequest(reservation);
    },
  };
};

export default useNotificationHistory;
