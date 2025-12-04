/**
 * Fonctions de validation pour les formulaires
 */

import { FORM_LIMITS, VALIDATION_MESSAGES } from './constants';

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} True si valide
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {object} { valid: boolean, message: string }
 */
export const validatePassword = (password) => {
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
 * @param {string} password - Mot de passe
 * @param {string} confirmPassword - Confirmation du mot de passe
 * @returns {boolean} True si correspondent
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Valide une date (format YYYY-MM-DD)
 * @param {string} dateString - Date à valider
 * @returns {boolean} True si valide
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Valide une heure (format HH:mm)
 * @param {string} timeString - Heure à valider
 * @returns {boolean} True si valide
 */
export const isValidTime = (timeString) => {
  if (!timeString) return false;
  
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeString);
};

/**
 * Vérifie qu'une date n'est pas dans le passé
 * @param {string} dateString - Date à vérifier (YYYY-MM-DD)
 * @returns {boolean} True si la date est future ou aujourd'hui
 */
export const isNotPastDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date >= today;
};

/**
 * Vérifie que l'heure de fin est après l'heure de début
 * @param {string} startTime - Heure de début (HH:mm)
 * @param {string} endTime - Heure de fin (HH:mm)
 * @returns {boolean} True si l'ordre est correct
 */
export const isValidTimeOrder = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes > startMinutes;
};

/**
 * Vérifie qu'une date/heure de réservation est dans le futur
 * @param {string} dateString - Date (YYYY-MM-DD)
 * @param {string} timeString - Heure (HH:mm)
 * @returns {boolean} True si dans le futur
 */
export const isFutureDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return false;
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    
    const dateTime = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    
    return dateTime > now;
  } catch (error) {
    return false;
  }
};

/**
 * Valide un nom (prénom ou nom de famille)
 * @param {string} name - Nom à valider
 * @returns {object} { valid: boolean, message: string }
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { valid: false, message: VALIDATION_MESSAGES.REQUIRED };
  }
  
  if (name.length > FORM_LIMITS.USER_NAME_MAX) {
    return { valid: false, message: `Trop long (max ${FORM_LIMITS.USER_NAME_MAX} caractères)` };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide un nom de salle
 * @param {string} roomName - Nom de salle à valider
 * @returns {object} { valid: boolean, message: string }
 */
export const validateRoomName = (roomName) => {
  if (!roomName || roomName.trim() === '') {
    return { valid: false, message: VALIDATION_MESSAGES.REQUIRED };
  }
  
  if (roomName.length > FORM_LIMITS.ROOM_NAME_MAX) {
    return { valid: false, message: `Trop long (max ${FORM_LIMITS.ROOM_NAME_MAX} caractères)` };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide une capacité de salle
 * @param {number} capacity - Capacité à valider
 * @returns {object} { valid: boolean, message: string }
 */
export const validateCapacity = (capacity) => {
  if (!capacity || capacity <= 0) {
    return { valid: false, message: VALIDATION_MESSAGES.CAPACITY_MIN };
  }
  
  if (capacity > 1000) {
    return { valid: false, message: 'Capacité trop élevée (max 1000)' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide un motif de réservation
 * @param {string} motif - Motif à valider
 * @returns {object} { valid: boolean, message: string }
 */
export const validateMotif = (motif) => {
  if (!motif || motif.trim() === '') {
    return { valid: false, message: VALIDATION_MESSAGES.REQUIRED };
  }
  
  if (motif.length > FORM_LIMITS.MOTIF_MAX) {
    return { valid: false, message: `Trop long (max ${FORM_LIMITS.MOTIF_MAX} caractères)` };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide une description
 * @param {string} description - Description à valider
 * @param {boolean} required - Si le champ est requis
 * @returns {object} { valid: boolean, message: string }
 */
export const validateDescription = (description, required = false) => {
  if (required && (!description || description.trim() === '')) {
    return { valid: false, message: VALIDATION_MESSAGES.REQUIRED };
  }
  
  if (description && description.length > FORM_LIMITS.ROOM_DESCRIPTION_MAX) {
    return { valid: false, message: `Trop long (max ${FORM_LIMITS.ROOM_DESCRIPTION_MAX} caractères)` };
  }
  
  return { valid: true, message: '' };
};

/**
 * Valide un formulaire de connexion
 * @param {object} formData - { email, password }
 * @returns {object} { valid: boolean, errors: object }
 */
export const validateLoginForm = (formData) => {
  const errors = {};
  
  if (!formData.email) {
    errors.email = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidEmail(formData.email)) {
    errors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
  }
  
  if (!formData.password) {
    errors.password = VALIDATION_MESSAGES.REQUIRED;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valide un formulaire d'inscription
 * @param {object} formData - { nom, prenom, email, password, confirmPassword }
 * @returns {object} { valid: boolean, errors: object }
 */
export const validateRegisterForm = (formData) => {
  const errors = {};
  
  const nameValidation = validateName(formData.nom);
  if (!nameValidation.valid) {
    errors.nom = nameValidation.message;
  }
  
  const prenomValidation = validateName(formData.prenom);
  if (!prenomValidation.valid) {
    errors.prenom = prenomValidation.message;
  }
  
  if (!formData.email) {
    errors.email = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidEmail(formData.email)) {
    errors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
  }
  
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.message;
  }
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = VALIDATION_MESSAGES.PASSWORD_MATCH;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valide un formulaire de réservation
 * @param {object} formData - { room_id, date, heure_debut, heure_fin, motif }
 * @returns {object} { valid: boolean, errors: object }
 */
export const validateReservationForm = (formData) => {
  const errors = {};
  
  if (!formData.room_id) {
    errors.room_id = 'Veuillez sélectionner une salle';
  }
  
  if (!formData.date) {
    errors.date = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidDate(formData.date)) {
    errors.date = VALIDATION_MESSAGES.DATE_INVALID;
  } else if (!isNotPastDate(formData.date)) {
    errors.date = VALIDATION_MESSAGES.DATE_PAST;
  }
  
  if (!formData.heure_debut) {
    errors.heure_debut = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidTime(formData.heure_debut)) {
    errors.heure_debut = VALIDATION_MESSAGES.TIME_INVALID;
  }
  
  if (!formData.heure_fin) {
    errors.heure_fin = VALIDATION_MESSAGES.REQUIRED;
  } else if (!isValidTime(formData.heure_fin)) {
    errors.heure_fin = VALIDATION_MESSAGES.TIME_INVALID;
  }
  
  if (formData.heure_debut && formData.heure_fin && !isValidTimeOrder(formData.heure_debut, formData.heure_fin)) {
    errors.heure_fin = VALIDATION_MESSAGES.TIME_ORDER;
  }
  
  const motifValidation = validateMotif(formData.motif);
  if (!motifValidation.valid) {
    errors.motif = motifValidation.message;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valide un formulaire de création de salle
 * @param {object} formData - { nom, capacite, description, equipements }
 * @returns {object} { valid: boolean, errors: object }
 */
export const validateRoomForm = (formData) => {
  const errors = {};
  
  const nameValidation = validateRoomName(formData.nom);
  if (!nameValidation.valid) {
    errors.nom = nameValidation.message;
  }
  
  const capacityValidation = validateCapacity(formData.capacite);
  if (!capacityValidation.valid) {
    errors.capacite = capacityValidation.message;
  }
  
  const descriptionValidation = validateDescription(formData.description, false);
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.message;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Nettoie une chaîne de caractères (trim + suppression espaces multiples)
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Échappe les caractères HTML pour prévenir XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
export const escapeHtml = (str) => {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Valide un numéro de téléphone français
 * @param {string} phone - Numéro à valider
 * @returns {boolean} True si valide
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Format: 0X XX XX XX XX ou +33 X XX XX XX XX
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

/**
 * Vérifie si un champ est requis et vide
 * @param {any} value - Valeur à vérifier
 * @returns {string|null} Message d'erreur ou null
 */
export const required = (value) => {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return VALIDATION_MESSAGES.REQUIRED;
  }
  return null;
};

/**
 * Combine plusieurs validateurs
 * @param {array} validators - Tableau de fonctions de validation
 * @param {any} value - Valeur à valider
 * @returns {string|null} Premier message d'erreur rencontré ou null
 */
export const composeValidators = (...validators) => (value) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};
