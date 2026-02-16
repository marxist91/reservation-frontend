
import apiClient from './client';
import type { User, UserFormData, ApiResponse } from '@/types';
// Désactiver ou réactiver un utilisateur (admin)
// (doit être dans l'objet usersAPI plus bas)

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
    // Désactiver ou réactiver un utilisateur (admin)
    toggleActive: async (id: number, actif: boolean): Promise<ApiResponse<{ success: boolean; id: number; actif: boolean }>> => {
      const response = await apiClient.put(`/users/${id}/actif`, { actif });
      return response.data;
    },
  // Récupérer tous les utilisateurs (admin)
  getAll: async (params?: { page?: number; perPage?: number; search?: string }): Promise<{ utilisateurs: User[]; total: number; count: number; offset: number; limit: number }> => {
    // Calculer offset et limit
    const page = params?.page ?? 0;
    const perPage = params?.perPage ?? 10;
    const offset = page * perPage;
    const queryParams: any = {
      limit: perPage,
      offset,
    };
    if (params?.search) queryParams.nom = params.search;
    const response = await apiClient.get('/users/registry', { params: queryParams });
    // L'API retourne { utilisateurs, total, count, offset, limit }
    return response.data;
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

  // Supprimer un utilisateur (admin)
  delete: async (id: number): Promise<ApiResponse<{ success: boolean; deletedId: number }>> => {
    const response = await apiClient.delete<ApiResponse<{ success: boolean; deletedId: number }>>(`/users/${id}`);
    return response.data;
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
