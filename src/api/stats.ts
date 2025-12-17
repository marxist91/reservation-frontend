import apiClient from './client';

export const statsAPI = {
  getReservationsByDepartment: async (params?: { startDate?: string; endDate?: string; statut?: string; page?: number; pageSize?: number; limit?: number; offset?: number }) => {
    const resp = await apiClient.get('/stats/reservations-by-department', { params });
    return resp.data;
  }
  ,
  getOverview: async (params?: { startDate?: string; endDate?: string; statut?: string }) => {
    const resp = await apiClient.get('/stats/overview', { params });
    return resp.data;
  }
};

export default statsAPI;
