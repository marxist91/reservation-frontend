/**
 * Fonctions de validation pour les formulaires
 */

import { FORM_LIMITS, VALIDATION_MESSAGES } from './constants';

interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Valide un email
 */
export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un mot de passe
 */
export const validatePassword = (password: string | null | undefined): ValidationResult => {
  if (!password) {
    return { valid: false, message: VALIDATION_MESSAGES.REQUIRED };
  }
  
  if (password.length < FORM_LIMITS.PASSWORD_MIN) {
    return { valid: false, message: VALIDATION_MESSAGES.PASSWORD_MIN };
  }
  
  if (password.length > FORM_LIMITS.PASSWORD_MAX) {
    return { valid: false, message: `Le mot de passe est trop long (max ${FORM_LIMITS.PASSWORD_MAX} caractères)` };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide que deux mots de passe correspondent
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Valide une date (format YYYY-MM-DD)
 */
export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Valide une heure (format HH:mm)
 */
export const isValidTime = (timeString: string | null | undefined): boolean => {
  if (!timeString) return false;
  
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeString);
};

/**
 * Vérifie qu'une date n'est pas dans le passé
 */
export const isNotPastDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const inputDate = new Date(dateString);
  inputDate.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
};

/**
 * Vérifie que l'heure de fin est après l'heure de début
 */
export const isTimeRangeValid = (heureDebut: string | null | undefined, heureFin: string | null | undefined): boolean => {
  if (!heureDebut || !heureFin) return false;
  
  const parts1 = heureDebut.split(':').map(Number);
  const parts2 = heureFin.split(':').map(Number);
  
  if (parts1.length !== 2 || parts2.length !== 2) return false;
  
  const [h1, m1] = parts1;
  const [h2, m2] = parts2;
  
  if (h1 === undefined || m1 === undefined || h2 === undefined || m2 === undefined) return false;
  
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  
  return minutes2 > minutes1;
};

/**
 * Valide un nombre entier positif
 */
export const isPositiveInteger = (value: number | string | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0;
};

/**
 * Valide une capacité de salle
 */
export const isValidCapacity = (capacity: number | string | null | undefined): boolean => {
  return isPositiveInteger(capacity);
};

/**
 * Valide une chaîne de caractères (non vide)
 */
export const isNonEmptyString = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Valide la longueur d'une chaîne
 */
export const isValidLength = (value: string | null | undefined, maxLength: number): boolean => {
  if (!value) return true; // Vide est valide, utiliser isRequired pour les champs obligatoires
  return value.length <= maxLength;
};

/**
 * Valide un champ requis
 */
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return false;
};

/**
 * Valide un formulaire de connexion
 */
export const validateLoginForm = (email: string, password: string): ValidationResult => {
  if (!email || !password) {
    return { valid: false, message: 'Email et mot de passe requis' };
  }
  
  if (!isValidEmail(email)) {
    return { valid: false, message: VALIDATION_MESSAGES.EMAIL_INVALID };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide un formulaire d'inscription
 */
export const validateRegisterForm = (
  nom: string,
  prenom: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!nom || !prenom) {
    return { valid: false, message: 'Nom et prénom requis' };
  }
  
  if (!isValidEmail(email)) {
    return { valid: false, message: VALIDATION_MESSAGES.EMAIL_INVALID };
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }
  
  if (!passwordsMatch(password, confirmPassword)) {
    return { valid: false, message: VALIDATION_MESSAGES.PASSWORD_MATCH };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide un formulaire de réservation
 */
export const validateReservationForm = (
  roomId: number | string | null | undefined,
  date: string | null | undefined,
  heureDebut: string | null | undefined,
  heureFin: string | null | undefined
): ValidationResult => {
  if (!roomId) {
    return { valid: false, message: 'Veuillez sélectionner une salle' };
  }
  
  if (!date || !isValidDate(date)) {
    return { valid: false, message: VALIDATION_MESSAGES.DATE_INVALID };
  }
  
  if (!isNotPastDate(date)) {
    return { valid: false, message: VALIDATION_MESSAGES.DATE_PAST };
  }
  
  if (!heureDebut || !isValidTime(heureDebut)) {
    return { valid: false, message: VALIDATION_MESSAGES.TIME_INVALID };
  }
  
  if (!heureFin || !isValidTime(heureFin)) {
    return { valid: false, message: VALIDATION_MESSAGES.TIME_INVALID };
  }
  
  if (!isTimeRangeValid(heureDebut, heureFin)) {
    return { valid: false, message: VALIDATION_MESSAGES.TIME_ORDER };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide un formulaire de salle
 */
export const validateRoomForm = (
  nom: string | null | undefined,
  capacite: number | string | null | undefined
): ValidationResult => {
  if (!nom || !isNonEmptyString(nom)) {
    return { valid: false, message: 'Le nom de la salle est requis' };
  }
  
  if (!isValidLength(nom, FORM_LIMITS.ROOM_NAME_MAX)) {
    return { valid: false, message: `Le nom ne peut pas dépasser ${FORM_LIMITS.ROOM_NAME_MAX} caractères` };
  }
  
  if (!isValidCapacity(capacite)) {
    return { valid: false, message: VALIDATION_MESSAGES.CAPACITY_MIN };
  }
  
  return { valid: true, message: '' };
};

/**
 * Nettoie et valide une valeur numérique
 */
export const sanitizeNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
};

/**
 * Nettoie une chaîne de caractères (trim)
 */
export const sanitizeString = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.trim();
};

/**
 * Valide un URL
 */
export const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valide un numéro de téléphone français
 */
export const isValidPhoneNumber = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valide un format de fichier
 */
export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  if (!filename) return false;
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

/**
 * Valide la taille d'un fichier (en bytes)
 */
export const isValidFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize;
};
