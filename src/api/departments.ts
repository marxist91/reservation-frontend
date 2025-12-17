import apiClient from './client';
import type { Department, ApiResponse } from '@/types';

interface GetDepsResponse {
  data?: Department[];
}

export const departmentsAPI = {
  getAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<GetDepsResponse>('/departments');
    console.log('API /departments response:', response.data);
    const data = response.data?.data ?? [];
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: { name: string; description?: string; slug?: string; responsable_id?: number | null }): Promise<ApiResponse<Department>> => {
    const response = await apiClient.post<ApiResponse<Department>>('/departments', payload);
    return response.data;
  },

  update: async (id: number, payload: { name?: string; description?: string; slug?: string; responsable_id?: number | null }): Promise<ApiResponse<Department>> => {
    const response = await apiClient.put<ApiResponse<Department>>(`/departments/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/departments/${id}`);
    return response.data;
  },
};

export default departmentsAPI;
