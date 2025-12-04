/**
 * Store Zustand pour la gestion des utilisateurs
 */
import { create } from 'zustand';

export const useUserStore = create((set, get) => ({
  // État
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    role: 'all',
    status: 'all'
  },
  pagination: {
    page: 1,
    perPage: 10,
    total: 0
  },

  // Actions
  setUsers: (users) => set({ users }),
  
  setSelectedUser: (user) => set({ selectedUser: user }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  // Filtres
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: () => set({
    filters: {
      search: '',
      role: 'all',
      status: 'all'
    }
  }),
  
  // Pagination
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  
  setPage: (page) => set((state) => ({
    pagination: { ...state.pagination, page }
  })),
  
  setPerPage: (perPage) => set((state) => ({
    pagination: { ...state.pagination, perPage, page: 1 }
  })),
  
  // Utilisateurs filtrés
  getFilteredUsers: () => {
    const { users, filters } = get();
    
    return users.filter(user => {
      // Filtre de recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          user.nom?.toLowerCase().includes(searchLower) ||
          user.prenom?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Filtre par rôle
      if (filters.role !== 'all' && user.role !== filters.role) {
        return false;
      }
      
      // Filtre par statut (si applicable)
      if (filters.status !== 'all') {
        // Vous pouvez ajouter une logique de statut (actif/inactif)
        // basée sur votre modèle
      }
      
      return true;
    });
  },
  
  // Utilisateurs paginés
  getPaginatedUsers: () => {
    const { pagination } = get();
    const filtered = get().getFilteredUsers();
    
    const start = (pagination.page - 1) * pagination.perPage;
    const end = start + pagination.perPage;
    
    return {
      users: filtered.slice(start, end),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / pagination.perPage)
    };
  },
  
  // Ajouter un utilisateur
  addUser: (user) => set((state) => ({
    users: [...state.users, user]
  })),
  
  // Mettre à jour un utilisateur
  updateUser: (userId, updates) => set((state) => ({
    users: state.users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ),
    selectedUser: state.selectedUser?.id === userId 
      ? { ...state.selectedUser, ...updates }
      : state.selectedUser
  })),
  
  // Supprimer un utilisateur
  deleteUser: (userId) => set((state) => ({
    users: state.users.filter(user => user.id !== userId),
    selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser
  })),
  
  // Trouver un utilisateur par ID
  findUserById: (userId) => {
    const { users } = get();
    return users.find(user => user.id === userId);
  },
  
  // Obtenir les statistiques des utilisateurs
  getUserStats: () => {
    const { users } = get();
    
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      responsables: users.filter(u => u.role === 'responsable').length,
      users: users.filter(u => u.role === 'user').length
    };
  },
  
  // Réinitialiser le store
  reset: () => set({
    users: [],
    selectedUser: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      role: 'all',
      status: 'all'
    },
    pagination: {
      page: 1,
      perPage: 10,
      total: 0
    }
  })
}));
