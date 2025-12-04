import apiClient from './client';

export const usersAPI = {
  // Récupérer tous les utilisateurs (admin)
  getAll: async () => {
    const response = await apiClient.get('/users/registry');
    // L'API retourne { utilisateurs: [...], total, count, ... } - on extrait le tableau
    return response.data.utilisateurs || response.data || [];
  },

  // Récupérer un utilisateur par ID
  getById: async (id) => {
    const response = await apiClient.get(`/users/registry`);
    // Filtrer pour trouver l'utilisateur
    const users = response.data.utilisateurs || response.data || [];
    const user = users.find(u => u.id === id);
    return user;
  },

  // Mettre à jour un utilisateur
  update: async (id, userData) => {
    const response = await apiClient.put(`/users/update/${id}`, userData);
    return response.data;
  },

  // Supprimer un utilisateur (admin) - route non disponible dans ce backend
  delete: async () => {
    // Le backend n'a pas de route delete user
    throw new Error('Suppression utilisateur non disponible');
  },

  // Mettre à jour mon profil
  updateProfile: async (userData) => {
    const response = await apiClient.put('/profile', userData);
    return response.data;
  },

  // Changer mon mot de passe
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/profile/password', passwordData);
    return response.data;
  },
};
