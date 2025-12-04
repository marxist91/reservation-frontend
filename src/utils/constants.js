/**
 * Constantes de l'application
 */

// URLs de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Rôles utilisateurs
export const ROLES = {
  ADMIN: 'admin',
  RESPONSABLE: 'responsable',
  USER: 'user'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.RESPONSABLE]: 'Responsable',
  [ROLES.USER]: 'Utilisateur'
};

// Statuts de réservation
export const RESERVATION_STATUS = {
  EN_ATTENTE: 'en_attente',
  VALIDEE: 'validée',
  ANNULEE: 'annulée',
  REFUSEE: 'refusée'
};

export const RESERVATION_STATUS_LABELS = {
  'en_attente': 'En attente',
  'validée': 'Validée',
  'validee': 'Validée',
  'annulée': 'Annulée',
  'annulee': 'Annulée',
  'refusée': 'Refusée',
  'refusee': 'Refusée'
};

export const RESERVATION_STATUS_COLORS = {
  'en_attente': 'warning',
  'validée': 'success',
  'validee': 'success',
  'annulée': 'default',
  'annulee': 'default',
  'refusée': 'error',
  'refusee': 'error'
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
  IMPRIMANTE: 'imprimante'
};

export const EQUIPMENT_LABELS = {
  [EQUIPMENTS.PROJECTEUR]: 'Projecteur',
  [EQUIPMENTS.TABLEAU_BLANC]: 'Tableau blanc',
  [EQUIPMENTS.ECRAN]: 'Écran',
  [EQUIPMENTS.WIFI]: 'Wi-Fi',
  [EQUIPMENTS.CLIMATISATION]: 'Climatisation',
  [EQUIPMENTS.ORDINATEUR]: 'Ordinateur',
  [EQUIPMENTS.VISIO]: 'Visioconférence',
  [EQUIPMENTS.IMPRIMANTE]: 'Imprimante'
};

// Icônes pour les équipements (Material-UI icons)
export const EQUIPMENT_ICONS = {
  [EQUIPMENTS.PROJECTEUR]: 'Videocam',
  [EQUIPMENTS.TABLEAU_BLANC]: 'Dashboard',
  [EQUIPMENTS.ECRAN]: 'Monitor',
  [EQUIPMENTS.WIFI]: 'Wifi',
  [EQUIPMENTS.CLIMATISATION]: 'AcUnit',
  [EQUIPMENTS.ORDINATEUR]: 'Computer',
  [EQUIPMENTS.VISIO]: 'VideoCall',
  [EQUIPMENTS.IMPRIMANTE]: 'Print'
};

// Créneaux horaires
export const TIME_SLOTS = {
  MATIN: 'matin',
  MIDI: 'midi',
  APRES_MIDI: 'après-midi',
  SOIR: 'soir'
};

export const TIME_SLOT_RANGES = {
  [TIME_SLOTS.MATIN]: { start: '08:00', end: '12:00' },
  [TIME_SLOTS.MIDI]: { start: '12:00', end: '14:00' },
  [TIME_SLOTS.APRES_MIDI]: { start: '14:00', end: '18:00' },
  [TIME_SLOTS.SOIR]: { start: '18:00', end: '22:00' }
};

// Heures de travail
export const WORKING_HOURS = {
  START: '08:00',
  END: '22:00',
  STEP: 30 // Minutes
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [5, 10, 25, 50, 100]
};

// Limites de formulaire
export const FORM_LIMITS = {
  ROOM_NAME_MAX: 100,
  ROOM_DESCRIPTION_MAX: 500,
  MOTIF_MAX: 500,
  USER_NAME_MAX: 50,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 100
};

// Messages de validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  EMAIL_INVALID: 'Email invalide',
  PASSWORD_MIN: `Le mot de passe doit contenir au moins ${FORM_LIMITS.PASSWORD_MIN} caractères`,
  PASSWORD_MATCH: 'Les mots de passe ne correspondent pas',
  DATE_INVALID: 'Date invalide',
  TIME_INVALID: 'Heure invalide',
  TIME_ORDER: 'L\'heure de fin doit être après l\'heure de début',
  DATE_PAST: 'La date ne peut pas être dans le passé',
  CAPACITY_MIN: 'La capacité doit être supérieure à 0'
};

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
  PROFILE_UPDATED: 'Profil mis à jour'
};

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
  INVALID_DATA: 'Données invalides'
};

// Durées de notification (ms)
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000
};

// Clés de stockage local
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
};

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
  ADMIN_STATS: '/admin/stats'
};

// Permissions par rôle
export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'view_all_reservations',
    'validate_reservations',
    'manage_users',
    'manage_rooms',
    'view_statistics',
    'delete_any_reservation'
  ],
  [ROLES.RESPONSABLE]: [
    'view_all_reservations',
    'validate_reservations',
    'manage_rooms',
    'view_statistics'
  ],
  [ROLES.USER]: [
    'create_reservation',
    'view_own_reservations',
    'cancel_own_reservation'
  ]
};

// Couleurs de thème
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3'
};

// Jours de la semaine
export const DAYS_OF_WEEK = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi'
];

// Mois
export const MONTHS = [
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
  'Décembre'
];

// Formats de date
export const DATE_FORMATS = {
  API: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  FULL: 'DD/MM/YYYY à HH:mm'
};

// Filtres de recherche
export const SEARCH_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month'
};

export const SEARCH_FILTER_LABELS = {
  [SEARCH_FILTERS.ALL]: 'Toutes',
  [SEARCH_FILTERS.TODAY]: 'Aujourd\'hui',
  [SEARCH_FILTERS.WEEK]: 'Cette semaine',
  [SEARCH_FILTERS.MONTH]: 'Ce mois'
};

// Tri
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
};

// Configuration React Query
export const QUERY_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  REFETCH_ON_WINDOW_FOCUS: true,
  RETRY: 3
};
