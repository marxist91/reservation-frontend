import apiClient from './client';
import type { LoginFormData, RegisterFormData, LoginResponse, RegisterResponse, User, ApiResponse } from '@/types';

export const authAPI = {
  register: async (userData: RegisterFormData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/register', userData);
    return response.data;
  },

  login: async (credentials: LoginFormData): Promise<LoginResponse> => {
    const response = await apiClient.post<{ data: LoginResponse }>('/login', credentials);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/profile');
    return response.data.data!;
  },
};
