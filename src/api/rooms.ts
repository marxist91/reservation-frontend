import apiClient from './client';
import type { Room, RoomFormData, RoomFilters, ApiResponse } from '@/types';

interface GetRoomsResponse {
  value?: Room[];
  Count?: number;
}

export const roomsAPI = {
  // Récupérer toutes les salles (route publique pour page d'accueil)
  getAllPublic: async (): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>(`/rooms/public?_t=${Date.now()}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Récupérer toutes les salles (authentifié)
  getAll: async (): Promise<Room[]> => {
    // Ajouter un timestamp pour éviter le cache
    const response = await apiClient.get<GetRoomsResponse | Room[]>(`/rooms?_t=${Date.now()}`);
    // L'API retourne { value: [...], Count: n } - on extrait le tableau
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data.value ?? [];
  },

  // Récupérer une salle par ID (via getAll car route /:id non disponible)
  getById: async (id: number): Promise<Room> => {
    // Utiliser getAll et filtrer car la route /rooms/:id n'existe pas
    const allRooms = await roomsAPI.getAll();
    const room = allRooms.find(r => r.id === parseInt(String(id)));
    if (!room) throw new Error('Salle non trouvée');
    return room;
  },

  // Créer une nouvelle salle (admin)
  create: async (roomData: RoomFormData): Promise<ApiResponse<Room>> => {
    const response = await apiClient.post<ApiResponse<Room>>('/rooms', roomData);
    return response.data;
  },

  // Mettre à jour une salle (admin)
  update: async (id: number, roomData: Partial<RoomFormData>): Promise<ApiResponse<Room>> => {
    const response = await apiClient.put<ApiResponse<Room>>(`/rooms/update/${id}`, roomData);
    return response.data;
  },

  // Supprimer une salle (admin)
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/rooms/delete/${id}`);
    return response.data;
  },

  // Rechercher des salles disponibles
  search: async (params: RoomFilters): Promise<ApiResponse<Room[]>> => {
    const response = await apiClient.get<ApiResponse<Room[]>>('/rooms', { params });
    return response.data;
  },
};
