import apiClient from './client';
import type { User, UserFormData, ApiResponse } from '@/types';

interface GetUsersResponse {
  utilisateurs?: User[];
  total?: number;
  count?: number;
}

interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
}

export const usersAPI = {
  // Récupérer tous les utilisateurs (admin)
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<GetUsersResponse | User[]>('/users/registry');
    // L'API retourne { utilisateurs: [...], total, count, ... } - on extrait le tableau
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data.utilisateurs ?? [];
  },

  // Récupérer un utilisateur par ID
  getById: async (id: number): Promise<User | undefined> => {
    const response = await apiClient.get<GetUsersResponse | User[]>('/users/registry');
    // Filtrer pour trouver l'utilisateur
    const data = response.data;
    const users = Array.isArray(data) ? data : (data.utilisateurs ?? []);
    const user = users.find(u => u.id === id);
    return user;
  },

  // Mettre à jour un utilisateur
  update: async (id: number, userData: Partial<UserFormData>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/update/${id}`, userData);
    return response.data;
  },

  // Supprimer un utilisateur (admin) - route non disponible dans ce backend
  delete: async (): Promise<never> => {
    // Le backend n'a pas de route delete user
    throw new Error('Suppression utilisateur non disponible');
  },

  // Mettre à jour mon profil
  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>('/profile', userData);
    return response.data;
  },

  // Changer mon mot de passe
  changePassword: async (passwordData: PasswordChangeData): Promise<ApiResponse<void>> => {
    const response = await apiClient.put<ApiResponse<void>>('/profile/password', passwordData);
    return response.data;
  },
};
