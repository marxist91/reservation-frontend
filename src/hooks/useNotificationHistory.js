import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '../store/notificationStore';
import { useHistoryStore } from '../store/historyStore';
import { useAuthStore } from '../store/authStore';

/**
 * Hook pour gérer les notifications et l'historique automatiquement
 * S'intègre avec les mutations de réservations pour logger toutes les actions
 */
export const useNotificationHistory = () => {
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
    logUserLogout,
  } = useHistoryStore();
  
  // Fonction pour créer une réservation avec notification et historique
  const onReservationCreated = (reservation) => {
    const userName = `${user?.prenom} ${user?.nom}`;
    
    // Ajouter à l'historique
    logReservationCreated(user?.id, userName, reservation);
    
    // Si l'utilisateur est admin/responsable, notifier aussi
    if (user?.role === 'admin' || user?.role === 'responsable') {
      // Ne pas se notifier soi-même, mais logger quand même
    }
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour valider une réservation
  const onReservationValidated = (reservation) => {
    const adminName = `${user?.prenom} ${user?.nom}`;
    
    // Notifier l'utilisateur concerné
    notifyReservationValidated(reservation);
    
    // Ajouter à l'historique
    logReservationValidated(user?.id, adminName, reservation);
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour refuser une réservation
  const onReservationRejected = (reservation, reason = null) => {
    const adminName = `${user?.prenom} ${user?.nom}`;
    
    // Notifier l'utilisateur concerné
    notifyReservationRejected(reservation);
    
    // Ajouter à l'historique
    logReservationRejected(user?.id, adminName, reservation, reason);
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour annuler une réservation
  const onReservationCancelled = (reservation) => {
    const userName = `${user?.prenom} ${user?.nom}`;
    
    // Notifier (optionnel, car c'est l'utilisateur lui-même qui annule)
    notifyReservationCancelled(reservation);
    
    // Ajouter à l'historique
    logReservationCancelled(user?.id, userName, reservation);
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour supprimer une réservation (admin)
  const onReservationDeleted = (reservation) => {
    const adminName = `${user?.prenom} ${user?.nom}`;
    
    // Ajouter à l'historique
    logReservationDeleted(user?.id, adminName, reservation);
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Fonction pour modifier une réservation
  const onReservationUpdated = (reservation, changes) => {
    const userName = `${user?.prenom} ${user?.nom}`;
    
    // Ajouter à l'historique
    logReservationUpdated(user?.id, userName, reservation, changes);
    
    // Invalider le cache
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  };
  
  // Logger la connexion au chargement du hook (si utilisateur connecté)
  useEffect(() => {
    if (user?.id) {
      const userName = `${user.prenom} ${user.nom}`;
      // Ne logger la connexion qu'une seule fois au chargement initial
      const hasLoggedLogin = sessionStorage.getItem(`login_logged_${user.id}`);
      if (!hasLoggedLogin) {
        logUserLogin(user.id, userName);
        sessionStorage.setItem(`login_logged_${user.id}`, 'true');
      }
    }
  }, [user?.id]);
  
  return {
    // Callbacks pour les mutations
    onReservationCreated,
    onReservationValidated,
    onReservationRejected,
    onReservationCancelled,
    onReservationDeleted,
    onReservationUpdated,
    
    // Helper pour notifier une nouvelle demande (admin)
    notifyNewRequest: (reservation) => {
      notifyNewReservationRequest(reservation);
    },
  };
};

export default useNotificationHistory;
