/**
 * Types pour les modèles de données de l'application
 */

// ============= ENUMS =============

export type UserRole = 'admin' | 'responsable' | 'user';

export enum ReservationStatus {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmee',
  VALIDEE = 'validee',
  REJETEE = 'rejetee',
  REFUSEE = 'refusee',
  ANNULEE = 'annulee',
  TERMINEE = 'terminee',
}

export enum NotificationType {
  RESERVATION_CREATED = 'reservation_created',
  RESERVATION_UPDATED = 'reservation_updated',
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  RESERVATION_REJECTED = 'reservation_rejected',
  RESERVATION_CANCELLED = 'reservation_cancelled',
  RESERVATION_VALIDATED = 'reservation_validated',
  NEW_RESERVATION = 'new_reservation',
  REMINDER = 'reminder',
  RESERVATION_CREATED_GROUP = 'reservation_created_group',
  ADMIN_NEW_RESERVATION_GROUP = 'admin_new_reservation_group',
  SYSTEM = 'system',
}

export enum HistoryActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum HistoryEntityType {
  USER = 'user',
  ROOM = 'room',
  RESERVATION = 'reservation',
  NOTIFICATION = 'notification',
}

// ============= MODELS =============

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: UserRole;
  actif?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  nom: string;
  description?: string;
  capacite: number;
  equipements?: string[];
  disponible: boolean;
  statut?: string;
  image_url?: string;
  batiment?: string;
  etage?: string;
  superficie?: number;
  responsable_id?: number;
  responsable?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  room_id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  date_debut: string; // ISO datetime string
  date_fin: string; // ISO datetime string
  statut: ReservationStatus;
  motif?: string;
  remarques?: string;
  rejection_reason?: string;
  nombre_participants?: number;
  group_id?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  utilisateur?: User;
  User?: User; // Alias for utilisateur
  salle?: Room;
  Room?: Room; // Alias for salle (backend compatibility)
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;
  reservation_id?: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  reservation?: Reservation;
}

export interface History {
  id: number;
  user_id: number;
  type: HistoryEntityType;
  action: HistoryActionType;
  entity_id?: number;
  details?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  
  // Relations
  utilisateur?: User;
}

// ============= API RESPONSES =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

// ============= FORM DATA =============

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ReservationFormData {
  room_id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif?: string;
  remarques?: string;
}

export interface RoomFormData {
  nom: string;
  description?: string;
  capacite: number;
  equipements?: string[];
  disponible: boolean;
  image_url?: string;
}

export interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  password?: string;
  actif?: boolean;
}

export interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============= FILTERS & QUERIES =============

export interface ReservationFilters {
  statut?: ReservationStatus;
  date_debut?: string;
  date_fin?: string;
  room_id?: number;
  user_id?: number;
}

export interface RoomFilters {
  disponible?: boolean;
  capacite_min?: number;
  capacite_max?: number;
  equipements?: string[];
}

export interface NotificationFilters {
  lu?: boolean;
  type?: NotificationType;
}

export interface HistoryFilters {
  type?: HistoryEntityType;
  action?: HistoryActionType;
  user_id?: number;
  date_debut?: string;
  date_fin?: string;
}

// ============= STATISTICS =============

export interface ReservationStats {
  total: number;
  confirmed: number;
  pending: number;
  rejected: number;
  tauxValidation: number;
  tauxRejet: number;
}

export interface RoomOccupancy {
  nom: string;
  reservations: number;
  capacite: number;
  taux: number;
}

export interface TopRoom {
  nom: string;
  count: number;
}

export interface TopUser {
  name: string;
  count: number;
}

export interface EvolutionDataPoint {
  date: string;
  total: number;
  confirmees: number;
  enAttente: number;
  rejetees: number;
}

export interface StatutDataPoint {
  name: string;
  value: number;
}

// ============= UTILITY TYPES =============

// Re-export notification types from store
export type { ExtendedNotification } from '../store/notificationStore';

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
