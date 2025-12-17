import apiClient from './client';
import type { Reservation, ReservationFormData, ApiResponse } from '@/types';

interface TimeSlot {
  heure_debut: string;
  heure_fin: string;
}

interface MultiReservationData extends Omit<ReservationFormData, 'heure_debut' | 'heure_fin'> {
  isMultiDay?: boolean;
  date_debut: string;
  date_fin: string;
  days?: number;
  timeSlots: TimeSlot[];
  description?: string;
  nombre_participants?: number;
  equipements_supplementaires?: string | null;
}

interface GetAllResponse {
  value?: Reservation[];
  Count?: number;
}

interface ReservationsAPIResponse {
  data: Reservation[];
}

export const reservationsAPI = {
  // Récupérer toutes les réservations publiques (pour page d'accueil)
  getAllPublic: async (params: Record<string, unknown> = {}): Promise<ReservationsAPIResponse> => {
    const response = await apiClient.get<{ data: Reservation[] }>('/reservations/all-public', { params });
    const data = response.data.data ?? [];
    return { data: Array.isArray(data) ? data : [] };
  },

  // Récupérer toutes les réservations (admin, authentifié)
  getAll: async (params: Record<string, unknown> = {}): Promise<ReservationsAPIResponse> => {
    const response = await apiClient.get<GetAllResponse>('/reservations/all', { params });
    console.log('📡 API Response /reservations/all:', response.data);
    // L'API retourne { value: [...], Count: n } - on extrait le tableau
    // Si response.data est directement le tableau, on l'utilise
    const rawData = response.data.value ?? response.data;
    const data = Array.isArray(rawData) ? rawData : [];
    console.log('📊 Extracted data:', data.length, 'items');
    return { data };
  },

  // Récupérer une réservation par ID
  getById: async (id: number): Promise<{ data: Reservation | undefined }> => {
    const response = await apiClient.get<GetAllResponse>('/reservations');
    const data = response.data.value ?? response.data ?? [];
    const dataArray = Array.isArray(data) ? data : [];
    const reservation = dataArray.find((r: Reservation) => r.id === id);
    return { data: reservation };
  },

  // Créer une nouvelle réservation
  create: async (reservationData: ReservationFormData | MultiReservationData): Promise<ApiResponse<Reservation | Reservation[]>> => {
    // Le backend attend: room_id, date, heure_debut, heure_fin, motif, nombre_participants
    // Assurons-nous que les heures ont les secondes pour le format SQL TIME
    const formatTime = (time: string | undefined): string | null => {
      if (!time) return null;
      return time.length === 5 ? `${time}:00` : time;
    };

    // Si c'est une réservation multiple (créneaux multiples OU multi-jours)
    const multiData = reservationData as MultiReservationData;
    const hasMultipleSlots = multiData.timeSlots && multiData.timeSlots.length > 1;
    const isReallyMultiDay = multiData.isMultiDay && multiData.date_debut !== multiData.date_fin;
    
    if (hasMultipleSlots || isReallyMultiDay) {
      const backendData = {
        room_id: parseInt(String(multiData.room_id)),
        motif: multiData.motif ?? '',
        description: multiData.description ?? '',
        department_id: (multiData as any).department_id ?? multiData.departement ?? null,
        isMultiDay: multiData.isMultiDay ?? false,
        date_debut: multiData.date_debut,
        date_fin: multiData.date_fin,
        days: multiData.days ?? 1,
        timeSlots: multiData.timeSlots.map(slot => ({
          heure_debut: formatTime(slot.heure_debut),
          heure_fin: formatTime(slot.heure_fin),
        })),
      };
      
      console.log('Sending multi-reservation data:', backendData);
      const response = await apiClient.post<ApiResponse<Reservation[]>>('/reservations/create-multiple', backendData);
      return response.data;
    } else {
      // Réservation simple (ancien format pour compatibilité)
      const singleData = reservationData as ReservationFormData;
      const firstSlot = multiData.timeSlots?.[0];
      
      const backendData = {
        room_id: parseInt(String(singleData.room_id)),
        date: singleData.date ?? multiData.date_debut,
        heure_debut: formatTime(firstSlot?.heure_debut ?? singleData.heure_debut),
        heure_fin: formatTime(firstSlot?.heure_fin ?? singleData.heure_fin),
        motif: singleData.motif ?? '',
        description: multiData.description ?? '',
        department_id: (multiData as any).department_id ?? multiData.departement ?? null,
        nombre_participants: multiData.nombre_participants ?? 1,
        equipements_supplementaires: multiData.equipements_supplementaires ?? null,
      };
      
      console.log('Sending reservation data:', backendData);
      const response = await apiClient.post<ApiResponse<Reservation>>('/reservations/create', backendData);
      return response.data;
    }
  },

  // Mettre à jour une réservation
  update: async (id: number, reservationData: Partial<ReservationFormData>): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.put<ApiResponse<Reservation>>(`/reservations/update/${id}`, reservationData);
    return response.data;
  },

  // Annuler une réservation (route dédiée pour permettre au créateur d'annuler)
  cancel: async (id: number): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.put<ApiResponse<Reservation>>(`/reservations/cancel/${id}`);
    return response.data;
  },

  // Supprimer une réservation (admin)
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/reservations/delete/${id}`);
    return response.data;
  },

  // Récupérer mes réservations (utilise la route principale avec filtre)
  getMine: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<GetAllResponse>('/reservations/all');
    // L'API retourne { value: [...], Count: n } - on extrait le tableau
    const rawData = response.data.value ?? response.data;
    return Array.isArray(rawData) ? rawData : [];
  },

  // Valider une réservation (admin)
  validate: async (id: number): Promise<ApiResponse<Reservation>> => {
    console.log(`📡 Appel validate pour ID: ${id}`);
    try {
      const response = await apiClient.put<ApiResponse<Reservation>>(`/reservations/validate/${id}`, { action: 'valider' });
      console.log(`✅ Réponse validate reçue:`, response);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur dans reservationsAPI.validate:`, error);
      throw error;
    }
  },

  // Refuser une réservation (admin)
  reject: async (
    id: number, 
    rejection_reason?: string,
    proposed_alternative?: {
      proposed_room_id: number;
      proposed_date_debut: string;
      proposed_date_fin: string;
      motif?: string;
    }
  ): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.put<ApiResponse<Reservation>>(`/reservations/validate/${id}`, { 
      action: 'refuser',
      rejection_reason,
      proposed_alternative
    });
    return response.data;
  },
};
