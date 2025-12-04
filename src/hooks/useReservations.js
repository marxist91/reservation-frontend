import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsAPI } from '../api/reservations';
import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import { useNotificationStore } from '../store/notificationStore';
import toast from 'react-hot-toast';

/**
 * Hook pour la gestion des réservations
 * @param {Object} params - Paramètres de filtrage (statut, roomId, userId, etc.)
 */
export const useReservations = (params = {}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';
  const isResponsable = currentUser?.role === 'responsable';
  
  // Stores pour historique et notifications
  const { logReservationCreated, logReservationValidated, logReservationRejected, logReservationCancelled, logReservationDeleted } = useHistoryStore();
  const { fetchNotifications, notifyReservationValidated, notifyReservationRejected, notifyNewReservationRequest, notifyReservationCancelled } = useNotificationStore();
  
  const getUserName = (user = currentUser) => {
    if (!user) return 'Utilisateur inconnu';
    return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
  };

  // Récupérer toutes les réservations
  const { 
    data: reservations, 
    isLoading, 
    error,
    refetch: refetchReservations,
  } = useQuery({
    queryKey: ['reservations', params],
    queryFn: () => reservationsAPI.getAll(params),
    select: (data) => {
      console.log('🔍 Raw ALL Reservations Response:', data);
      return data.data || data;
    },
    staleTime: 0, // Les données deviennent périmées immédiatement
    refetchOnMount: true, // Toujours recharger au montage
    refetchOnWindowFocus: true, // Recharger quand on revient sur l'onglet
  });

  // Récupérer mes réservations uniquement
  const {
    data: myReservations,
    isLoading: isLoadingMine,
    refetch: refetchMyReservations,
  } = useQuery({
    queryKey: ['reservations', 'mine', currentUser?.id],
    queryFn: reservationsAPI.getMine,
    enabled: !!currentUser?.id,
    staleTime: 0, // Les données deviennent périmées immédiatement
    refetchOnMount: true, // Toujours recharger au montage
    refetchOnWindowFocus: true, // Recharger quand on revient sur l'onglet
    select: (data) => {
      const allReservations = data.data || data || [];
      console.log('🔍 Raw My Reservations:', allReservations);
      console.log('👤 Current User ID:', currentUser?.id);
      
      // Si l'API retourne déjà filtré (ce qui est probable pour getMine), on retourne tout
      // Sinon on filtre manuellement
      const filtered = allReservations.filter(r => {
        const userId = r.user_id || r.userId;
        console.log(`Reservation ${r.id}: user_id=${r.user_id}, userId=${r.userId}, currentUser=${currentUser?.id}, match=${userId == currentUser?.id}`);
        // Comparaison souple (string vs number)
        return userId == currentUser?.id;
      });
      
      console.log('✅ Filtered My Reservations:', filtered.length, 'out of', allReservations.length);
      return filtered;
    },
  });

  // Créer une réservation
  const createReservation = useMutation({
    mutationFn: reservationsAPI.create,
    onSuccess: async (response) => {
      // Invalider toutes les queries de réservations pour forcer le rechargement
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      // Attendre que les données soient rechargées pour avoir les relations
      await queryClient.refetchQueries({ queryKey: ['reservations'] });
      
      // Récupérer la réservation créée avec toutes les données
      const reservations = queryClient.getQueryData(['reservations', params]);
      const createdReservation = response.data || response.reservation || response;
      
      // Trouver la réservation complète dans la liste rechargée
      let fullReservation = createdReservation;
      if (reservations?.data) {
        const found = reservations.data.find(r => r.id === createdReservation.id);
        if (found) fullReservation = found;
      } else if (Array.isArray(reservations)) {
        const found = reservations.find(r => r.id === createdReservation.id);
        if (found) fullReservation = found;
      }
      
      // Log historique et notification avec les données complètes
      if (currentUser && fullReservation) {
        logReservationCreated(currentUser.id, getUserName(), fullReservation);
        // Rafraîchir les notifications depuis le backend
        fetchNotifications();
      }
      
      toast.success('Réservation créée avec succès ! En attente de validation.');
    },
    onError: (error) => {
      console.error('❌ Erreur création réservation:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Mettre à jour une réservation
  const updateReservation = useMutation({
    mutationFn: ({ id, data }) => reservationsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation mise à jour');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Annuler une réservation
  const cancelReservation = useMutation({
    mutationFn: reservationsAPI.cancel,
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      // Log historique et notification
      const reservation = response.data || response;
      if (currentUser) {
        logReservationCancelled(currentUser.id, getUserName(), reservation);
        notifyReservationCancelled(reservation);
      }
      
      toast.success('Réservation annulée');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    },
  });

  // Valider une réservation (admin/responsable)
  const validateReservation = useMutation({
    mutationFn: reservationsAPI.validate,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      // Log historique et notification
      const reservation = response.data || response;
      if (currentUser) {
        logReservationValidated(currentUser.id, getUserName(), reservation);
        if (reservation.user_id !== currentUser.id) {
          notifyReservationValidated(reservation);
        }
      }
      
      toast.success('Réservation validée !');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    },
  });

  // Refuser une réservation (admin/responsable)
  const rejectReservation = useMutation({
    mutationFn: ({ id, rejection_reason }) => reservationsAPI.reject(id, rejection_reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      // Log historique et notification
      const reservation = response.data || response;
      if (currentUser) {
        logReservationRejected(currentUser.id, getUserName(), reservation, 'Refusé par l\'administrateur');
        if (reservation.user_id !== currentUser.id) {
          notifyReservationRejected(reservation);
        }
      }
      
      toast.success('Réservation refusée');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    },
  });

  // Supprimer une réservation (admin)
  const deleteReservation = useMutation({
    mutationFn: reservationsAPI.delete,
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      // Log historique
      const reservation = response.data || response;
      if (currentUser) {
        logReservationDeleted(currentUser.id, getUserName(), reservation);
      }
      
      toast.success('Réservation supprimée');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  // Stats des réservations
  const getReservationStats = () => {
    if (!reservations) return null;
    
    const now = new Date();
    return {
      total: reservations.length,
      enAttente: reservations.filter(r => r.statut === 'en_attente').length,
      validees: reservations.filter(r => ['validee', 'confirmee'].includes(r.statut)).length,
      refusees: reservations.filter(r => ['refusee', 'rejetee'].includes(r.statut)).length,
      annulees: reservations.filter(r => r.statut === 'annulee').length,
      terminees: reservations.filter(r => r.statut === 'terminee').length,
      aVenir: reservations.filter(r => 
        ['validee', 'confirmee', 'en_attente'].includes(r.statut) && 
        new Date(r.date_debut) > now
      ).length,
      enCours: reservations.filter(r => {
        const debut = new Date(r.date_debut);
        const fin = new Date(r.date_fin);
        return ['validee', 'confirmee'].includes(r.statut) && debut <= now && fin >= now;
      }).length,
    };
  };

  // Filtrer les réservations par statut
  const filterByStatus = (statut) => {
    if (!reservations) return [];
    if (statut === 'all' || !statut) return reservations;
    
    if (statut === 'validees') {
      return reservations.filter(r => ['validee', 'confirmee'].includes(r.statut));
    }
    if (statut === 'refusees') {
      return reservations.filter(r => ['refusee', 'rejetee'].includes(r.statut));
    }
    return reservations.filter(r => r.statut === statut);
  };

  // Filtrer par salle
  const filterByRoom = (roomId) => {
    if (!reservations || !roomId) return reservations || [];
    return reservations.filter(r => r.room_id === roomId || r.roomId === roomId);
  };

  // Filtrer par utilisateur
  const filterByUser = (userId) => {
    if (!reservations || !userId) return reservations || [];
    return reservations.filter(r => r.user_id === userId || r.userId === userId);
  };

  // Filtrer par plage de dates
  const filterByDateRange = (startDate, endDate) => {
    if (!reservations) return [];
    return reservations.filter(r => {
      const reservationStart = new Date(r.date_debut);
      const reservationEnd = new Date(r.date_fin);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      return reservationStart >= filterStart && reservationEnd <= filterEnd;
    });
  };

  // Réservations du jour
  const getTodayReservations = () => {
    if (!reservations) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return reservations.filter(r => {
      const reservationDate = new Date(r.date_debut);
      return reservationDate >= today && reservationDate < tomorrow;
    });
  };

  // Réservations de la semaine
  const getWeekReservations = () => {
    if (!reservations) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return reservations.filter(r => {
      const reservationDate = new Date(r.date_debut);
      return reservationDate >= today && reservationDate < nextWeek;
    });
  };

  // Vérifier si une salle est disponible pour un créneau
  const checkRoomAvailability = (roomId, dateDebut, dateFin, excludeReservationId = null) => {
    if (!reservations) return true;
    
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    
    const conflictingReservations = reservations.filter(r => {
      if (excludeReservationId && r.id === excludeReservationId) return false;
      if (r.room_id !== roomId && r.roomId !== roomId) return false;
      if (!['validee', 'confirmee', 'en_attente'].includes(r.statut)) return false;
      
      const rStart = new Date(r.date_debut);
      const rEnd = new Date(r.date_fin);
      
      // Vérifier le chevauchement
      return (start < rEnd && end > rStart);
    });
    
    return {
      available: conflictingReservations.length === 0,
      conflicts: conflictingReservations,
    };
  };

  return {
    // Data
    reservations: reservations || [],
    myReservations: myReservations || [],
    isLoading,
    isLoadingMine,
    error,
    
    // Queries
    refetchReservations,
    
    // Mutations
    createReservation,
    updateReservation,
    cancelReservation,
    validateReservation,
    rejectReservation,
    deleteReservation,
    
    // Helpers
    getReservationStats,
    filterByStatus,
    filterByRoom,
    filterByUser,
    filterByDateRange,
    getTodayReservations,
    getWeekReservations,
    checkRoomAvailability,
    refetchMyReservations,
    
    // User info
    isAdmin,
    isResponsable,
    canValidate: isAdmin || isResponsable,
  };
};

/**
 * Hook pour récupérer une seule réservation par ID
 */
export const useReservation = (reservationId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => reservationsAPI.getById(reservationId),
    enabled: !!reservationId,
    select: (data) => data.data,
  });

  return { reservation: data, isLoading, error };
};

export default useReservations;
