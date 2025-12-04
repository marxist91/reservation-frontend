/**
 * Point d'entrée centralisé pour tous les stores Zustand
 * Facilite l'import et la gestion des stores dans l'application
 */

// Stores
export { useAuthStore } from './authStore';
export { useUserStore } from './userStore';
export { useNotificationStore } from './notificationStore';
export { useHistoryStore } from './historyStore';

/**
 * Hook pour réinitialiser tous les stores
 * Utile lors de la déconnexion ou du reset de l'application
 */
export const useResetAllStores = () => {
  const { reset: resetUserStore } = useUserStore();
  const { clearAll: clearNotifications } = useNotificationStore();
  const { clearHistory } = useHistoryStore();
  
  return () => {
    // Réinitialiser tous les stores sauf authStore
    // (authStore a sa propre logique de logout)
    resetUserStore();
    // Optionnel: garder les notifications et historique
    // clearNotifications();
    // clearHistory();
  };
};

/**
 * Utilitaire pour créer des sélecteurs de store optimisés
 * Évite les re-renders inutiles en sélectionnant uniquement les données nécessaires
 */
export const createSelector = (store, selector) => {
  return () => store(selector);
};

/**
 * Configuration globale des stores
 */
export const storeConfig = {
  // Configuration pour le dev tools (si nécessaire)
  devtools: {
    enabled: import.meta.env.DEV,
    name: 'Reservation App Store'
  },
  
  // Configuration de persistence (si nécessaire)
  persist: {
    enabled: false,
    storage: 'localStorage',
    whitelist: ['auth'] // Stores à persister
  }
};

/**
 * Types d'actions communes (pour le logging/debugging)
 */
export const ActionTypes = {
  // Auth
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  REGISTER: 'auth/register',
  
  // Users
  FETCH_USERS: 'users/fetch',
  ADD_USER: 'users/add',
  UPDATE_USER: 'users/update',
  DELETE_USER: 'users/delete',
  
  // Filters
  SET_FILTER: 'filter/set',
  RESET_FILTERS: 'filter/reset',
  
  // Pagination
  SET_PAGE: 'pagination/setPage',
  SET_PER_PAGE: 'pagination/setPerPage'
};

/**
 * Logger pour le développement
 * Active/désactive selon l'environnement
 */
export const storeLogger = {
  enabled: import.meta.env.DEV,
  
  log: (storeName, action, payload) => {
    if (storeLogger.enabled) {
      console.group(`🏪 [${storeName}] ${action}`);
      console.log('Payload:', payload);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },
  
  error: (storeName, action, error) => {
    if (storeLogger.enabled) {
      console.group(`❌ [${storeName}] ${action} - ERROR`);
      console.error('Error:', error);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }
};

/**
 * Middleware pour logger les actions des stores
 * Usage: create(logger(yourStore, 'StoreName'))
 */
export const logger = (config, name) => (set, get, api) =>
  config(
    (...args) => {
      storeLogger.log(name, 'State Update', args);
      set(...args);
    },
    get,
    api
  );

/**
 * Middleware pour persister un store dans localStorage
 * Usage: create(persist(yourStore, 'storageKey'))
 */
export const persist = (config, key) => (set, get, api) => {
  // Charger l'état initial depuis localStorage
  const storedState = localStorage.getItem(key);
  const initialState = storedState ? JSON.parse(storedState) : {};
  
  return config(
    (...args) => {
      set(...args);
      // Sauvegarder l'état dans localStorage après chaque mise à jour
      localStorage.setItem(key, JSON.stringify(get()));
    },
    () => ({ ...config(set, get, api), ...initialState }),
    api
  );
};

/**
 * Utilitaire pour créer des actions asynchrones avec gestion d'erreur
 */
export const createAsyncAction = (store, actionName) => {
  return async (asyncFn, onSuccess, onError) => {
    const { setLoading, setError } = store.getState();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      storeLogger.log(store.name || 'Store', actionName, { success: true });
      
      return result;
    } catch (error) {
      setError(error.message || 'Une erreur est survenue');
      storeLogger.error(store.name || 'Store', actionName, error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };
};

/**
 * Utilitaire pour combiner plusieurs sélecteurs
 */
export const combineSelectors = (...selectors) => {
  return (state) => {
    return selectors.map(selector => selector(state));
  };
};

/**
 * Utilitaire pour créer un sélecteur mémoïsé
 * Évite les recalculs inutiles
 */
export const createMemoizedSelector = (selector) => {
  let lastArgs = null;
  let lastResult = null;
  
  return (state) => {
    const args = selector(state);
    
    if (JSON.stringify(args) !== JSON.stringify(lastArgs)) {
      lastArgs = args;
      lastResult = args;
    }
    
    return lastResult;
  };
};

// Export par défaut d'un objet contenant tous les stores
export default {
  useAuthStore,
  useUserStore,
  useResetAllStores,
  createSelector,
  storeConfig,
  ActionTypes,
  storeLogger
};
