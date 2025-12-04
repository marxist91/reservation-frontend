/**
 * Guide d'utilisation des stores et utilitaires
 * Documentation et exemples pratiques
 */

// ==================== STORES ====================

/**
 * 1. AUTH STORE (useAuthStore)
 * Gère l'authentification et l'utilisateur connecté
 */
import { useAuthStore } from '../store';

// Exemple d'utilisation
function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Connexion
  const handleLogin = async () => {
    await login({ email: 'user@example.com', password: 'password' });
  };
  
  // Déconnexion
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Bonjour {user?.prenom} {user?.nom}</p>
      ) : (
        <button onClick={handleLogin}>Se connecter</button>
      )}
    </div>
  );
}

/**
 * 2. USER STORE (useUserStore)
 * Gère la liste des utilisateurs, filtres et pagination
 */
import { useUserStore } from '../store';

function UsersListComponent() {
  const {
    users,                    // Tous les utilisateurs
    filters,                  // Filtres actuels
    pagination,              // État de pagination
    setFilters,              // Modifier les filtres
    setPagination,           // Modifier la pagination
    getFilteredUsers,        // Obtenir utilisateurs filtrés
    getPaginatedUsers,       // Obtenir utilisateurs paginés
    getUserStats,            // Obtenir statistiques
    addUser,                 // Ajouter un utilisateur
    updateUser,              // Mettre à jour un utilisateur
    deleteUser,              // Supprimer un utilisateur
  } = useUserStore();
  
  // Rechercher
  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm });
  };
  
  // Filtrer par rôle
  const handleFilterRole = (role) => {
    setFilters({ role });
  };
  
  // Changer de page
  const handlePageChange = (page) => {
    setPagination({ page });
  };
  
  // Obtenir les utilisateurs paginés
  const { users: paginatedUsers, total, totalPages } = getPaginatedUsers();
  
  // Obtenir les stats
  const stats = getUserStats();
  console.log(`Total: ${stats.total}, Admins: ${stats.admins}`);
}

// ==================== FORMATTERS ====================

import {
  formatDate,           // YYYY-MM-DD → DD/MM/YYYY
  formatDateWithDay,    // YYYY-MM-DD → Lundi 03/12/2025
  formatTime,           // HH:mm → HH:mm (passthrough)
  formatDateTime,       // ISO DateTime → DD/MM/YYYY à HH:mm
  formatTimeRange,      // (HH:mm, HH:mm) → HH:mm - HH:mm
  calculateDuration,    // (HH:mm, HH:mm) → 2h 30min
  formatFullName,       // (prénom, nom) → Prénom Nom
  formatStatus,         // en_attente → En attente
  formatRole,           // admin → Administrateur
  truncate,             // (text, length) → text...
  formatNumber,         // 1234 → 1 234
  parseDate,            // YYYY-MM-DD → Date object
  dateToString,         // Date object → YYYY-MM-DD
  getToday,             // → YYYY-MM-DD (aujourd'hui)
  isPastDate,           // YYYY-MM-DD → boolean
  isToday,              // YYYY-MM-DD → boolean
} from '../utils/formatters';

// Exemples d'utilisation
const Examples = () => {
  // Dates
  formatDate('2025-12-03');              // "03/12/2025"
  formatDateWithDay('2025-12-03');       // "Mardi 03/12/2025"
  formatDateTime('2025-12-03T14:30:00'); // "03/12/2025 à 14:30"
  
  // Heures
  formatTimeRange('14:00', '16:30');     // "14:00 - 16:30"
  calculateDuration('14:00', '16:30');   // "2h 30min"
  
  // Noms et texte
  formatFullName('Jean', 'Dupont');      // "Jean Dupont"
  truncate('Texte très long...', 10);    // "Texte très..."
  
  // Statuts et rôles
  formatStatus('en_attente');            // "En attente"
  formatRole('admin');                   // "Administrateur"
  
  // Nombres
  formatNumber(1234567);                 // "1 234 567"
  
  // Utilitaires de date
  const today = getToday();              // "2025-12-03"
  isPastDate('2025-01-01');              // true
  isToday('2025-12-03');                 // true
  
  const dateObj = parseDate('2025-12-03');
  const dateStr = dateToString(new Date());
};

// ==================== VALIDATORS ====================

import {
  isValidEmail,           // Vérifie format email
  validatePassword,       // Vérifie mot de passe
  passwordsMatch,         // Compare deux mots de passe
  isValidDate,           // Vérifie format YYYY-MM-DD
  isValidTime,           // Vérifie format HH:mm
  isNotPastDate,         // Vérifie date future
  isValidTimeOrder,      // Vérifie ordre heures
  isFutureDateTime,      // Vérifie date/heure future
  validateName,          // Valide un nom
  validateRoomName,      // Valide nom de salle
  validateCapacity,      // Valide capacité
  validateMotif,         // Valide motif réservation
  validateDescription,   // Valide description
  validateLoginForm,     // Valide formulaire login
  validateRegisterForm,  // Valide formulaire inscription
  validateReservationForm, // Valide formulaire réservation
  validateRoomForm,      // Valide formulaire salle
  sanitizeString,        // Nettoie une chaîne
  escapeHtml,           // Échappe HTML (XSS)
  isValidPhone,         // Valide téléphone FR
  required,             // Vérifie champ requis
  composeValidators,    // Combine validateurs
} from '../utils/validators';

// Exemples d'utilisation
const ValidationExamples = () => {
  // Email
  isValidEmail('user@example.com');  // true
  isValidEmail('invalid');           // false
  
  // Mot de passe
  const pwdResult = validatePassword('123456');
  console.log(pwdResult.valid);      // true
  console.log(pwdResult.message);    // ""
  
  // Dates et heures
  isValidDate('2025-12-03');         // true
  isValidTime('14:30');              // true
  isNotPastDate('2025-12-03');       // true
  isValidTimeOrder('14:00', '16:00'); // true
  
  // Formulaires complets
  const loginResult = validateLoginForm({
    email: 'user@example.com',
    password: '123456'
  });
  console.log(loginResult.valid);    // true ou false
  console.log(loginResult.errors);   // { email: "...", password: "..." }
  
  const reservationResult = validateReservationForm({
    room_id: 1,
    date: '2025-12-03',
    heure_debut: '14:00',
    heure_fin: '16:00',
    motif: 'Réunion importante'
  });
  
  // Composition de validateurs
  const validateEmail = composeValidators(
    required,
    (value) => isValidEmail(value) ? null : 'Email invalide'
  );
  
  const error = validateEmail('user@example.com'); // null si valide
};

// ==================== CONSTANTS ====================

import {
  API_BASE_URL,
  ROLES,
  ROLE_LABELS,
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  EQUIPMENTS,
  EQUIPMENT_LABELS,
  TIME_SLOTS,
  WORKING_HOURS,
  PAGINATION,
  FORM_LIMITS,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  STORAGE_KEYS,
  ROUTES,
  PERMISSIONS,
  THEME_COLORS,
  DAYS_OF_WEEK,
  MONTHS,
  QUERY_CONFIG,
} from '../utils/constants';

// Exemples d'utilisation
const ConstantsExamples = () => {
  // Rôles
  console.log(ROLES.ADMIN);                    // "admin"
  console.log(ROLE_LABELS[ROLES.ADMIN]);       // "Administrateur"
  
  // Statuts
  console.log(RESERVATION_STATUS.EN_ATTENTE);  // "en_attente"
  console.log(RESERVATION_STATUS_LABELS['en_attente']); // "En attente"
  console.log(RESERVATION_STATUS_COLORS['validée']);    // "success"
  
  // Messages
  console.log(VALIDATION_MESSAGES.REQUIRED);   // "Ce champ est requis"
  console.log(SUCCESS_MESSAGES.LOGIN);         // "Connexion réussie"
  console.log(ERROR_MESSAGES.NETWORK);         // "Erreur de connexion..."
  
  // Routes
  console.log(ROUTES.DASHBOARD);               // "/dashboard"
  console.log(ROUTES.ADMIN_USERS);             // "/admin/users"
  
  // Permissions
  const canManageUsers = PERMISSIONS[ROLES.ADMIN].includes('manage_users');
  
  // Limites
  console.log(FORM_LIMITS.PASSWORD_MIN);       // 6
  console.log(FORM_LIMITS.MOTIF_MAX);          // 500
  
  // Pagination
  console.log(PAGINATION.DEFAULT_PER_PAGE);    // 10
  console.log(PAGINATION.PER_PAGE_OPTIONS);    // [5, 10, 25, 50, 100]
};

// ==================== INTÉGRATION COMPLÈTE ====================

/**
 * Exemple complet d'un composant utilisant tout
 */
import { useState } from 'react';
import { useUserStore } from '../store';
import { formatFullName, formatRole, formatDateTime } from '../utils/formatters';
import { validateEmail } from '../utils/validators';
import { ROLES, ROLE_LABELS, VALIDATION_MESSAGES } from '../utils/constants';

function CompleteExample() {
  const { users, setFilters, getPaginatedUsers } = useUserStore();
  const [search, setSearch] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const handleSearch = (value) => {
    setSearch(value);
    
    // Validation
    if (value && !validateEmail(value)) {
      setEmailError(VALIDATION_MESSAGES.EMAIL_INVALID);
    } else {
      setEmailError('');
      setFilters({ search: value });
    }
  };
  
  const { users: paginatedUsers } = getPaginatedUsers();
  
  return (
    <div>
      <input 
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Rechercher par email..."
      />
      {emailError && <p style={{ color: 'red' }}>{emailError}</p>}
      
      <ul>
        {paginatedUsers.map(user => (
          <li key={user.id}>
            {formatFullName(user.prenom, user.nom)} - 
            {formatRole(user.role)} -
            Créé le {formatDateTime(user.createdAt)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CompleteExample;
