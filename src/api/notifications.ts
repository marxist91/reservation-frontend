import apiClient from './client';
import type { Notification, ApiResponse } from '@/types';

export const notificationsApi = {
  // Récupérer toutes les notifications de l'utilisateur connecté
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
  },

  // Marquer une notification comme lue
  markAsRead: async (id: number): Promise<ApiResponse<Notification>> => {
    const response = await apiClient.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data;
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.put<ApiResponse<void>>('/notifications/read-all');
    return response.data;
  },

  // Supprimer une notification
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationsApi;
