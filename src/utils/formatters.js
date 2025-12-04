/**
 * Utilitaires de formatage pour l'application
 */

/**
 * Formate une date au format français (DD/MM/YYYY)
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {string} Date formatée
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
};

/**
 * Formate une date avec le jour de la semaine
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {string} Date formatée avec jour
 */
export const formatDateWithDay = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const jour = jours[date.getDay()];
    return `${jour} ${formatDate(dateString)}`;
  } catch (error) {
    return dateString;
  }
};

/**
 * Formate une heure (retourne directement si déjà au format HH:mm)
 * @param {string} timeString - Heure au format HH:mm
 * @returns {string} Heure formatée
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  return timeString; // Déjà au format HH:mm depuis le backend
};

/**
 * Formate un DateTime complet
 * @param {string} dateTimeString - DateTime ISO ou string
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Formate une plage horaire
 * @param {string} heureDebut - Heure de début (HH:mm)
 * @param {string} heureFin - Heure de fin (HH:mm)
 * @returns {string} Plage horaire formatée
 */
export const formatTimeRange = (heureDebut, heureFin) => {
  if (!heureDebut || !heureFin) return 'N/A';
  return `${heureDebut} - ${heureFin}`;
};

/**
 * Calcule la durée entre deux heures
 * @param {string} heureDebut - Heure de début (HH:mm)
 * @param {string} heureFin - Heure de fin (HH:mm)
 * @returns {string} Durée formatée
 */
export const calculateDuration = (heureDebut, heureFin) => {
  if (!heureDebut || !heureFin) return 'N/A';
  
  try {
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    
    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    
    if (totalMinutes < 0) return 'Durée invalide';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Formate un nom complet
 * @param {string} prenom - Prénom
 * @param {string} nom - Nom
 * @returns {string} Nom complet formaté
 */
export const formatFullName = (prenom, nom) => {
  if (!prenom && !nom) return 'N/A';
  if (!prenom) return nom;
  if (!nom) return prenom;
  return `${prenom} ${nom}`;
};

/**
 * Formate un statut pour l'affichage
 * @param {string} statut - Statut brut
 * @returns {string} Statut formaté
 */
export const formatStatus = (statut) => {
  if (!statut) return 'N/A';
  
  const statuts = {
    'en_attente': 'En attente',
    'validée': 'Validée',
    'validee': 'Validée',
    'annulée': 'Annulée',
    'annulee': 'Annulée',
    'refusée': 'Refusée',
    'refusee': 'Refusée'
  };
  return statuts[statut] || statut.charAt(0).toUpperCase() + statut.slice(1);
};

/**
 * Formate un rôle pour l'affichage
 * @param {string} role - Rôle brut
 * @returns {string} Rôle formaté
 */
export const formatRole = (role) => {
  const roles = {
    'admin': 'Administrateur',
    'responsable': 'Responsable',
    'user': 'Utilisateur'
  };
  return roles[role] || role;
};

/**
 * Tronque un texte avec ellipsis
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formate un nombre avec séparateur de milliers
 * @param {number} number - Nombre à formater
 * @returns {string} Nombre formaté
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  return new Intl.NumberFormat('fr-FR').format(number);
};

/**
 * Convertit une date YYYY-MM-DD en objet Date
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {Date|null} Objet Date ou null
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    return null;
  }
};

/**
 * Convertit un objet Date en string YYYY-MM-DD
 * @param {Date} date - Objet Date
 * @returns {string} Date au format YYYY-MM-DD
 */
export const dateToString = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtient la date d'aujourd'hui au format YYYY-MM-DD
 * @returns {string} Date du jour
 */
export const getToday = () => {
  return dateToString(new Date());
};

/**
 * Vérifie si une date est passée
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {boolean} True si la date est passée
 */
export const isPastDate = (dateString) => {
  if (!dateString) return false;
  const date = parseDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Vérifie si une date est aujourd'hui
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {boolean} True si la date est aujourd'hui
 */
export const isToday = (dateString) => {
  return dateString === getToday();
};
