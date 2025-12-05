import apiClient from './client';
import type { History } from '@/types';

export const historyApi = {
  // Récupérer tout l'historique (admin)
  getAll: async (): Promise<History[]> => {
    const response = await apiClient.get<History[]>('/history');
    return response.data;
  },

  // Récupérer l'historique d'une réservation spécifique
  getByReservation: async (reservationId: number): Promise<History[]> => {
    const response = await apiClient.get<History[]>(`/history/reservation/${reservationId}`);
    return response.data;
  },

  // Récupérer l'historique de l'utilisateur connecté
  getMyHistory: async (): Promise<History[]> => {
    const response = await apiClient.get<History[]>('/history/me');
    return response.data;
  }
};

export default historyApi;
