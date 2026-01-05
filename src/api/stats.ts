import apiClient from './client';

export interface WeeklyReportData {
  periode: {
    debut: string;
    fin: string;
    semainePrecedente: { debut: string; fin: string };
  };
  resume: {
    total: number;
    confirmees: number;
    en_attente: number;
    rejetees: number;
    tauxValidation: string;
  };
  evolution: {
    total: string;
    confirmees: string;
  };
  topSalles: Array<{
    id: number;
    nom: string;
    reservations: number;
    confirmees: number;
    en_attente: number;
    rejetees: number;
  }>;
  topDepartments: Array<{
    id: number;
    name: string;
    reservations: number;
    confirmees: number;
  }>;
  dailyStats: Array<{
    date: string;
    jour: string;
    total: number;
    confirmees: number;
    en_attente: number;
    rejetees: number;
  }>;
  reservations: Array<{
    id: number;
    motif: string;
    statut: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string;
    demandeur: string;
    departement: string;
    date_demande: string;
  }>;
  generatedAt: string;
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  type?: 'week' | 'month';
}

export const statsAPI = {
  getReservationsByDepartment: async (params?: { startDate?: string; endDate?: string; statut?: string; page?: number; pageSize?: number; limit?: number; offset?: number }) => {
    const resp = await apiClient.get('/stats/reservations-by-department', { params });
    return resp.data;
  },
  
  getOverview: async (params?: { startDate?: string; endDate?: string; statut?: string }) => {
    const resp = await apiClient.get('/stats/overview', { params });
    return resp.data;
  },

  getWeeklyReport: async (params?: ReportParams): Promise<WeeklyReportData> => {
    const resp = await apiClient.get('/stats/weekly-report', { params });
    return resp.data;
  }
};

export default statsAPI;
