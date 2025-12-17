/**
 * Constantes de l'application
 */

import type { UserRole } from '@/types';

// URLs de l'API
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Rôles utilisateurs
export const ROLES = {
  ADMIN: 'admin',
  RESPONSABLE: 'responsable',
  USER: 'user',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.RESPONSABLE]: 'Responsable',
  [ROLES.USER]: 'Utilisateur',
};

// Statuts de réservation
export const RESERVATION_STATUS = {
  EN_ATTENTE: 'en_attente',
  VALIDEE: 'validée',
  CONFIRMEE: 'confirmee',
  ANNULEE: 'annulée',
  REFUSEE: 'refusée',
  REJETEE: 'rejetee',
} as const;

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  'en_attente': 'En attente',
  'validée': 'Validée',
  'validee': 'Validée',
  'confirmee': 'Confirmée',
  'annulée': 'Annulée',
  'annulee': 'Annulée',
  'refusée': 'Refusée',
  'refusee': 'Refusée',
  'rejetee': 'Rejetée',
};

export const RESERVATION_STATUS_COLORS: Record<string, 'warning' | 'success' | 'default' | 'error'> = {
  'en_attente': 'warning',
  'validée': 'success',
  'validee': 'success',
  'confirmee': 'success',
  'annulée': 'default',
  'annulee': 'default',
  'refusée': 'error',
  'refusee': 'error',
  'rejetee': 'error',
};

// Couleurs hex spécifiques pour l'affichage des événements dans un calendrier
export const RESERVATION_STATUS_EVENT_COLORS: Record<string, string> = {
  'en_attente': '#ed6c02', // orange
  'validée': '#2e7d32',
  'validee': '#2e7d32',
  'confirmee': '#2e7d32',
  'annulée': '#fdd835',
  'annulee': '#fdd835',
  'refusée': '#d32f2f',
  'refusee': '#d32f2f',
  'rejetee': '#d32f2f',
};

// Équipements disponibles
export const EQUIPMENTS = {
  PROJECTEUR: 'projecteur',
  TABLEAU_BLANC: 'tableau_blanc',
  ECRAN: 'écran',
  WIFI: 'wifi',
  CLIMATISATION: 'climatisation',
  ORDINATEUR: 'ordinateur',
  VISIO: 'visioconférence',
  IMPRIMANTE: 'imprimante',
} as const;

export const EQUIPMENT_LABELS: Record<string, string> = {
  [EQUIPMENTS.PROJECTEUR]: 'Projecteur',
  [EQUIPMENTS.TABLEAU_BLANC]: 'Tableau blanc',
  [EQUIPMENTS.ECRAN]: 'Écran',
  [EQUIPMENTS.WIFI]: 'Wi-Fi',
  [EQUIPMENTS.CLIMATISATION]: 'Climatisation',
  [EQUIPMENTS.ORDINATEUR]: 'Ordinateur',
  [EQUIPMENTS.VISIO]: 'Visioconférence',
  [EQUIPMENTS.IMPRIMANTE]: 'Imprimante',
};

// Icônes pour les équipements (Material-UI icons)
export const EQUIPMENT_ICONS: Record<string, string> = {
  [EQUIPMENTS.PROJECTEUR]: 'Videocam',
  [EQUIPMENTS.TABLEAU_BLANC]: 'Dashboard',
  [EQUIPMENTS.ECRAN]: 'Monitor',
  [EQUIPMENTS.WIFI]: 'Wifi',
  [EQUIPMENTS.CLIMATISATION]: 'AcUnit',
  [EQUIPMENTS.ORDINATEUR]: 'Computer',
  [EQUIPMENTS.VISIO]: 'VideoCall',
  [EQUIPMENTS.IMPRIMANTE]: 'Print',
};

// Créneaux horaires
export const TIME_SLOTS = {
  MATIN: 'matin',
  MIDI: 'midi',
  APRES_MIDI: 'après-midi',
  SOIR: 'soir',
} as const;

interface TimeRange {
  start: string;
  end: string;
}

export const TIME_SLOT_RANGES: Record<string, TimeRange> = {
  [TIME_SLOTS.MATIN]: { start: '08:00', end: '12:00' },
  [TIME_SLOTS.MIDI]: { start: '12:00', end: '14:00' },
  [TIME_SLOTS.APRES_MIDI]: { start: '14:00', end: '18:00' },
  [TIME_SLOTS.SOIR]: { start: '18:00', end: '22:00' },
};

// Heures de travail
export const WORKING_HOURS = {
  START: '08:00',
  END: '22:00',
  STEP: 30, // Minutes
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [5, 10, 25, 50, 100] as const,
} as const;

// Limites de formulaire
export const FORM_LIMITS = {
  ROOM_NAME_MAX: 100,
  ROOM_DESCRIPTION_MAX: 500,
  MOTIF_MAX: 500,
  USER_NAME_MAX: 50,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 100,
} as const;

// Messages de validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  EMAIL_INVALID: 'Email invalide',
  PASSWORD_MIN: `Le mot de passe doit contenir au moins ${FORM_LIMITS.PASSWORD_MIN} caractères`,
  PASSWORD_MATCH: 'Les mots de passe ne correspondent pas',
  DATE_INVALID: 'Date invalide',
  TIME_INVALID: 'Heure invalide',
  TIME_ORDER: "L'heure de fin doit être après l'heure de début",
  DATE_PAST: 'La date ne peut pas être dans le passé',
  CAPACITY_MIN: 'La capacité doit être supérieure à 0',
} as const;

// Messages de succès
export const SUCCESS_MESSAGES = {
  LOGIN: 'Connexion réussie',
  LOGOUT: 'Déconnexion réussie',
  REGISTER: 'Inscription réussie',
  RESERVATION_CREATED: 'Réservation créée avec succès',
  RESERVATION_UPDATED: 'Réservation mise à jour',
  RESERVATION_CANCELLED: 'Réservation annulée',
  RESERVATION_VALIDATED: 'Réservation validée',
  RESERVATION_REJECTED: 'Réservation refusée',
  ROOM_CREATED: 'Salle créée avec succès',
  ROOM_UPDATED: 'Salle mise à jour',
  ROOM_DELETED: 'Salle supprimée',
  USER_CREATED: 'Utilisateur créé avec succès',
  USER_UPDATED: 'Utilisateur mis à jour',
  USER_DELETED: 'Utilisateur supprimé',
  PROFILE_UPDATED: 'Profil mis à jour',
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  GENERIC: 'Une erreur est survenue',
  NETWORK: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  SERVER_ERROR: 'Erreur serveur',
  LOGIN_FAILED: 'Email ou mot de passe incorrect',
  ROOM_NOT_AVAILABLE: 'Salle non disponible',
  INVALID_DATA: 'Données invalides',
} as const;

// Durées de notification (ms)
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
} as const;

// Clés de stockage local
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Routes de l'application
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MY_RESERVATIONS: '/my-reservations',
  SEARCH_ROOMS: '/search-rooms',
  PROFILE: '/profile',
  
  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_RESERVATIONS: '/admin/reservations',
  ADMIN_STATS: '/admin/stats',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_HISTORY: '/admin/history',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
} as const;

// Permissions par rôle
type Permission = 
  | 'view_all_reservations'
  | 'validate_reservations'
  | 'manage_users'
  | 'manage_rooms'
  | 'view_statistics'
  | 'delete_any_reservation'
  | 'create_reservation'
  | 'view_own_reservations'
  | 'cancel_own_reservation';

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  [ROLES.ADMIN]: [
    'view_all_reservations',
    'validate_reservations',
    'manage_users',
    'manage_rooms',
    'view_statistics',
    'delete_any_reservation',
  ],
  [ROLES.RESPONSABLE]: [
    'view_all_reservations',
    'validate_reservations',
    'view_statistics',
  ],
  [ROLES.USER]: [
    'create_reservation',
    'view_own_reservations',
    'cancel_own_reservation',
  ],
};

// Couleurs de thème
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
} as const;

// Jours de la semaine
export const DAYS_OF_WEEK: readonly string[] = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

// Mois
export const MONTHS: readonly string[] = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

// Formats de date
export const DATE_FORMATS = {
  API: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  FULL: 'DD/MM/YYYY à HH:mm',
} as const;

// Filtres de recherche
export const SEARCH_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export const SEARCH_FILTER_LABELS: Record<string, string> = {
  [SEARCH_FILTERS.ALL]: 'Toutes',
  [SEARCH_FILTERS.TODAY]: "Aujourd'hui",
  [SEARCH_FILTERS.WEEK]: 'Cette semaine',
  [SEARCH_FILTERS.MONTH]: 'Ce mois',
};

// Tri
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// Configuration React Query
export const QUERY_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  REFETCH_ON_WINDOW_FOCUS: true,
  RETRY: 3,
} as const;
