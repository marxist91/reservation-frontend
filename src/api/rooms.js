import apiClient from './client';

export const roomsAPI = {
  // Récupérer toutes les salles
  getAll: async () => {
    // Ajouter un timestamp pour éviter le cache
    const response = await apiClient.get(`/rooms?_t=${Date.now()}`);
    // L'API retourne { value: [...], Count: n } - on extrait le tableau
    return response.data.value || response.data || [];
  },

  // Récupérer une salle par ID (via getAll car route /:id non disponible)
  getById: async (id) => {
    // Utiliser getAll et filtrer car la route /rooms/:id n'existe pas
    const allRooms = await roomsAPI.getAll();
    const room = allRooms.find(r => r.id === parseInt(id));
    if (!room) throw new Error('Salle non trouvée');
    return room;
  },

  // Créer une nouvelle salle (admin)
  create: async (roomData) => {
    const response = await apiClient.post('/rooms', roomData);
    return response.data;
  },

  // Mettre à jour une salle (admin)
  update: async (id, roomData) => {
    const response = await apiClient.put(`/rooms/update/${id}`, roomData);
    return response.data;
  },

  // Supprimer une salle (admin)
  delete: async (id) => {
    const response = await apiClient.delete(`/rooms/delete/${id}`);
    return response.data;
  },

  // Rechercher des salles disponibles
  search: async (params) => {
    const response = await apiClient.get('/rooms', { params });
    return response.data;
  },
};
