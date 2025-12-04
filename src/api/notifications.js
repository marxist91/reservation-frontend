import apiClient from './client';

export const notificationsApi = {
  // Récupérer toutes les notifications de l'utilisateur connecté
  getAll: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  // Marquer une notification comme lue
  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Supprimer une notification
  delete: async (id) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationsApi;
