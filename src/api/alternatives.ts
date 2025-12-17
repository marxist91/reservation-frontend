import apiClient from './client';
import type { ProposedAlternative, Room } from '../types';

export const alternativesAPI = {
  /**
   * Récupère les propositions alternatives en attente pour l'utilisateur connecté
   */
  getPending: async (): Promise<ProposedAlternative[]> => {
    const response = await apiClient.get<ProposedAlternative[]>('/alternatives/pending');
    return response.data;
  },

  /**
   * Accepte une proposition alternative
   * Crée automatiquement une nouvelle réservation validée
   */
  accept: async (alternativeId: number): Promise<{ message: string; newReservation: unknown }> => {
    const response = await apiClient.post(`/alternatives/${alternativeId}/accept`);
    return response.data;
  },

  /**
   * Refuse une proposition alternative
   */
  reject: async (alternativeId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/alternatives/${alternativeId}/reject`);
    return response.data;
  },

  /**
   * Récupère les salles disponibles pour une date et heure données
   */
  getAvailableRooms: async (params: {
    date: string;
    startTime: string;
    endTime: string;
    excludeReservationId?: number;
  }): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>('/alternatives/available-rooms', { params });
    return response.data;
  },
};
