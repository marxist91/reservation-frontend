/**
 * Utilitaires de formatage pour l'application
 */

/**
 * Formate une date au format français (DD/MM/YYYY)
 */
export const formatDate = (dateString: string | null | undefined): string => {
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
 */
export const formatDateWithDay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const jours: readonly string[] = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const jour = jours[date.getDay()];
    return `${jour} ${formatDate(dateString)}`;
  } catch (error) {
    return dateString;
  }
};

/**
 * Formate une heure (retourne directement si déjà au format HH:mm)
 */
export const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return 'N/A';
  return timeString; // Déjà au format HH:mm depuis le backend
};

/**
 * Formate un DateTime complet
 */
export const formatDateTime = (dateTimeString: string | Date | null | undefined): string => {
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
 */
export const formatTimeRange = (heureDebut: string | null | undefined, heureFin: string | null | undefined): string => {
  if (!heureDebut || !heureFin) return 'N/A';
  return `${heureDebut} - ${heureFin}`;
};

/**
 * Calcule la durée entre deux heures
 */
export const calculateDuration = (heureDebut: string | null | undefined, heureFin: string | null | undefined): string => {
  if (!heureDebut || !heureFin) return 'N/A';
  
  try {
    const parts1 = heureDebut.split(':').map(Number);
    const parts2 = heureFin.split(':').map(Number);
    
    if (parts1.length !== 2 || parts2.length !== 2) return 'N/A';
    
    const [h1, m1] = parts1;
    const [h2, m2] = parts2;
    
    if (h1 === undefined || m1 === undefined || h2 === undefined || m2 === undefined) return 'N/A';
    
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
 */
export const formatFullName = (prenom: string | null | undefined, nom: string | null | undefined): string => {
  if (!prenom && !nom) return 'N/A';
  if (!prenom) return nom ?? 'N/A';
  if (!nom) return prenom;
  return `${prenom} ${nom}`;
};

/**
 * Formate un statut pour l'affichage
 */
export const formatStatus = (statut: string | null | undefined): string => {
  if (!statut) return 'N/A';
  
  const statuts: Record<string, string> = {
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
  return statuts[statut] ?? (statut.charAt(0).toUpperCase() + statut.slice(1));
};

/**
 * Formate un rôle pour l'affichage
 */
export const formatRole = (role: string | null | undefined): string => {
  if (!role) return 'N/A';
  
  const roles: Record<string, string> = {
    'admin': 'Administrateur',
    'responsable': 'Responsable',
    'user': 'Utilisateur',
  };
  return roles[role] ?? role;
};

/**
 * Tronque un texte avec ellipsis
 */
export const truncate = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formate un nombre avec séparateur de milliers
 */
export const formatNumber = (number: number | null | undefined): string => {
  if (number === null || number === undefined) return '0';
  return new Intl.NumberFormat('fr-FR').format(number);
};

/**
 * Convertit une date YYYY-MM-DD en objet Date
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const parts = dateString.split('-').map(Number);
    if (parts.length !== 3) return null;
    
    const [year, month, day] = parts;
    if (year === undefined || month === undefined || day === undefined) return null;
    
    return new Date(year, month - 1, day);
  } catch (error) {
    return null;
  }
};

/**
 * Convertit un objet Date en string YYYY-MM-DD
 */
export const dateToString = (date: Date | null | undefined): string => {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtient la date d'aujourd'hui au format YYYY-MM-DD
 */
export const getToday = (): string => {
  return dateToString(new Date());
};

/**
 * Vérifie si une date est passée
 */
export const isPastDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = parseDate(dateString);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (dateString: string | null | undefined): boolean => {
  return dateString === getToday();
};
