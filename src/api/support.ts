import apiClient from './client';

export interface SupportTicket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  category: 'general' | 'bug' | 'feature' | 'reservation' | 'account' | 'other';
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: number;
  admin_id: number;
  admin_name: string;
  message: string;
  created_at: string;
}

export interface CreateTicketData {
  subject: string;
  category: string;
  message: string;
  priority?: string;
}

export interface SupportStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

const supportAPI = {
  // Créer un ticket de support
  createTicket: async (data: CreateTicketData): Promise<{ message: string; ticket: Partial<SupportTicket> }> => {
    const response = await apiClient.post('/support/tickets', data);
    return response.data;
  },

  // Récupérer tous les tickets (admin: tous, user: les siens)
  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.get('/support/tickets');
    return response.data;
  },

  // Récupérer un ticket spécifique
  getTicket: async (id: number): Promise<SupportTicket> => {
    const response = await apiClient.get(`/support/tickets/${id}`);
    return response.data;
  },

  // Répondre à un ticket (admin)
  respondToTicket: async (id: number, response: string, closeTicket: boolean = false): Promise<{ message: string; ticket: SupportTicket }> => {
    const res = await apiClient.post(`/support/tickets/${id}/respond`, {
      response,
      close_ticket: closeTicket
    });
    return res.data;
  },

  // Fermer un ticket
  closeTicket: async (id: number): Promise<{ message: string; ticket: SupportTicket }> => {
    const response = await apiClient.put(`/support/tickets/${id}/close`);
    return response.data;
  },

  // Statistiques (admin)
  getStats: async (): Promise<SupportStats> => {
    const response = await apiClient.get('/support/stats');
    return response.data;
  },
};

export default supportAPI;
