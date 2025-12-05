import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { reservationsAPI } from '@/api/reservations';
import { useAuthStore, useHistoryStore, useNotificationStore } from '@/store';
import toast from 'react-hot-toast';
import type { Reservation, ReservationFormData } from '@/types';

interface ReservationStats {
  total: number;
  enAttente: number;
  validees: number;
  refusees: number;
  annulees: number;
  terminees: number;
  aVenir: number;
  enCours: number;
}

interface RoomAvailability {
  available: boolean;
  conflicts: Reservation[];
}

interface RejectParams {
  id: number;
  rejection_reason?: string;
}

interface UpdateParams {
  id: number;
  data: Partial<ReservationFormData>;
}

export interface UseReservationsReturn {
  // Data
  reservations: Reservation[];
  myReservations: Reservation[];
  isLoading: boolean;
  isLoadingMine: boolean;
  error: Error | null;
  
  // Queries
  refetchReservations: () => void;
  refetchMyReservations: () => void;
  
  // Mutations
  createReservation: any;
  updateReservation: UseMutationResult<any, Error, UpdateParams, unknown>;
  cancelReservation: UseMutationResult<any, Error, number, unknown>;
  validateReservation: UseMutationResult<any, Error, number, unknown>;
  rejectReservation: UseMutationResult<any, Error, RejectParams, unknown>;
  deleteReservation: UseMutationResult<any, Error, number, unknown>;
  
  // Helpers
  getReservationStats: () => ReservationStats | null;
  filterByStatus: (statut: string) => Reservation[];
  filterByRoom: (roomId: number) => Reservation[];
  filterByUser: (userId: number) => Reservation[];
  filterByDateRange: (startDate: string, endDate: string) => Reservation[];
  getTodayReservations: () => Reservation[];
  getWeekReservations: () => Reservation[];
  checkRoomAvailability: (roomId: number, dateDebut: string, dateFin: string, excludeReservationId?: number | null) => RoomAvailability;
  
  // User info
  isAdmin: boolean;
  isResponsable: boolean;
  canValidate: boolean;
}

/**
 * Hook pour la gestion des réservations
 * @param params - Paramètres de filtrage (statut, roomId, userId, etc.)
 */
export const useReservations = (params: Record<string, unknown> = {}): UseReservationsReturn => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';
  const isResponsable = currentUser?.role === 'responsable';
  
  // Stores pour historique et notifications
  const { logReservationCreated, logReservationValidated, logReservationRejected, logReservationCancelled, logReservationDeleted } = useHistoryStore();
  const { fetchNotifications, notifyReservationValidated, notifyReservationRejected, notifyReservationCancelled } = useNotificationStore();
  
  const getUserName = (user = currentUser): string => {
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
    select: (data): Reservation[] => {
      console.log('🔍 Raw ALL Reservations Response:', data);
      return data.data || data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    select: (data): Reservation[] => {
      const allReservations = (data as any).data || data || [];
      console.log('🔍 Raw My Reservations:', allReservations);
      console.log('👤 Current User ID:', currentUser?.id);
      
      const filtered = allReservations.filter((r: Reservation) => {
        const userId = r.user_id;
        console.log(`Reservation ${r.id}: user_id=${r.user_id}, currentUser=${currentUser?.id}, match=${userId == currentUser?.id}`);
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
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['reservations'] });
      
      const reservations: any = queryClient.getQueryData(['reservations', params]);
      const createdReservation = (response as any).data || (response as any).reservation || response;
      
      let fullReservation = createdReservation;
      if (reservations?.data) {
        const found = reservations.data.find((r: Reservation) => r.id === createdReservation.id);
        if (found) fullReservation = found;
      } else if (Array.isArray(reservations)) {
        const found = reservations.find((r: Reservation) => r.id === createdReservation.id);
        if (found) fullReservation = found;
      }
      
      if (currentUser && fullReservation) {
        logReservationCreated(currentUser.id, getUserName(), fullReservation);
        fetchNotifications();
      }
      
      toast.success('Réservation créée avec succès ! En attente de validation.');
    },
    onError: (error: any) => {
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
    mutationFn: ({ id, data }: UpdateParams) => reservationsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation mise à jour');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Annuler une réservation
  const cancelReservation = useMutation({
    mutationFn: reservationsAPI.cancel,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      const reservation = (response as any).data || response;
      if (currentUser) {
        logReservationCancelled(currentUser.id, getUserName(), reservation);
        notifyReservationCancelled(reservation);
      }
      
      toast.success('Réservation annulée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    },
  });

  // Valider une réservation (admin/responsable)
  const validateReservation = useMutation({
    mutationFn: reservationsAPI.validate,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      const reservation = (response as any).data || response;
      if (currentUser) {
        logReservationValidated(currentUser.id, getUserName(), reservation as Reservation);
        if ((reservation as Reservation).user_id !== currentUser.id) {
          notifyReservationValidated(reservation);
        }
      }
      
      toast.success('Réservation validée !');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    },
  });

  // Refuser une réservation (admin/responsable)
  const rejectReservation = useMutation({
    mutationFn: ({ id, rejection_reason }: RejectParams) => reservationsAPI.reject(id, rejection_reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      const reservation = (response as any).data || response;
      if (currentUser) {
        logReservationRejected(currentUser.id, getUserName(), reservation as Reservation, 'Refusé par l\'administrateur');
        if ((reservation as Reservation).user_id !== currentUser.id) {
          notifyReservationRejected(reservation);
        }
      }
      
      toast.success('Réservation refusée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    },
  });

  // Supprimer une réservation (admin)
  const deleteReservation = useMutation({
    mutationFn: reservationsAPI.delete,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      const reservation = (response as any).data || response;
      if (currentUser) {
        logReservationDeleted(currentUser.id, getUserName(), reservation as Reservation);
      }
      
      toast.success('Réservation supprimée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  // Stats des réservations
  const getReservationStats = (): ReservationStats | null => {
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
  const filterByStatus = (statut: string): Reservation[] => {
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
  const filterByRoom = (roomId: number): Reservation[] => {
    if (!reservations || !roomId) return reservations || [];
    return reservations.filter(r => r.room_id === roomId);
  };

  // Filtrer par utilisateur
  const filterByUser = (userId: number): Reservation[] => {
    if (!reservations || !userId) return reservations || [];
    return reservations.filter(r => r.user_id === userId);
  };

  // Filtrer par plage de dates
  const filterByDateRange = (startDate: string, endDate: string): Reservation[] => {
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
  const getTodayReservations = (): Reservation[] => {
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
  const getWeekReservations = (): Reservation[] => {
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
  const checkRoomAvailability = (roomId: number, dateDebut: string, dateFin: string, excludeReservationId: number | null = null): RoomAvailability => {
    if (!reservations) return { available: true, conflicts: [] };
    
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    
    const conflictingReservations = reservations.filter(r => {
      if (excludeReservationId && r.id === excludeReservationId) return false;
      if (r.room_id !== roomId) return false;
      if (!['validee', 'confirmee', 'en_attente'].includes(r.statut)) return false;
      
      const rStart = new Date(r.date_debut);
      const rEnd = new Date(r.date_fin);
      
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
export const useReservation = (reservationId: number | null): { reservation: Reservation | undefined; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => reservationsAPI.getById(reservationId!),
    enabled: !!reservationId,
    select: (data) => data.data,
  });

  return { reservation: data, isLoading, error };
};

export default useReservations;
