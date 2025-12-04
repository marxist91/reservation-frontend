// Export de tous les hooks personnalisés

export { useRooms } from './useRooms';
export { useReservations } from './useReservations';
export { useUsers } from './useUsers';
export { useAuth } from './useAuth';
export { default as useInitializeNotifications } from './useInitializeNotifications';

// Export par défaut
export default {
  useRooms: () => require('./useRooms').useRooms,
  useReservations: () => require('./useReservations').useReservations,
  useUsers: () => require('./useUsers').useUsers,
  useAuth: () => require('./useAuth').useAuth,
  useInitializeNotifications: () => require('./useInitializeNotifications').default,
};
