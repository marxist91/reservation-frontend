import apiClient from './client';

export const historyApi = {
  // Récupérer tout l'historique (admin)
  getAll: async () => {
    const response = await apiClient.get('/history');
    return response.data;
  },

  // Récupérer l'historique d'une réservation spécifique
  getByReservation: async (reservationId) => {
    const response = await apiClient.get(`/history/reservation/${reservationId}`);
    return response.data;
  },

  // Récupérer l'historique de l'utilisateur connecté
  getMyHistory: async () => {
    const response = await apiClient.get('/history/me');
    return response.data;
  }
};

export default historyApi;
