import apiClient from './client';

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/login', credentials);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },
};