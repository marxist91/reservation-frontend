import apiClient from './client';

export interface SettingsData {
  id?: number;
  // Général
  app_name: string;
  app_description: string;
  max_reservations_per_user: number;
  max_days_in_advance: number;
  max_booking_duration_hours: number;
  // Notifications
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  // Supprimer notifications admins si responsable déjà notifié
  suppress_admin_if_responsable_notified?: boolean;
  notify_on_booking: boolean;
  notify_on_approval: boolean;
  notify_on_rejection: boolean;
  notify_on_cancellation: boolean;
  notify_on_modification: boolean;
  reminder_before_hours: number;
  // Sécurité
  require_approval: boolean;
  session_timeout_minutes: number;
  min_password_length: number;
  require_special_char: boolean;
  require_number: boolean;
  require_uppercase: boolean;
  // Horaires
  working_days: number[];
  opening_time: string;
  closing_time: string;
  break_start_time: string | null;
  break_end_time: string | null;
  // Apparence
  primary_color: string;
  secondary_color: string;
  dark_mode: boolean;
  compact_mode: boolean;
  // Email SMTP
  smtp_host: string | null;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string | null;
  smtp_password: string | null;
  email_from_name: string;
  email_from_address: string | null;
}

export const settingsAPI = {
  // Récupérer les paramètres
  getSettings: async (): Promise<SettingsData> => {
    const response = await apiClient.get<SettingsData>('/settings');
    return response.data;
  },

  // Mettre à jour les paramètres
  updateSettings: async (settings: Partial<SettingsData>): Promise<{ message: string; settings: SettingsData }> => {
    const response = await apiClient.put<{ message: string; settings: SettingsData }>('/settings', settings);
    return response.data;
  },
};
