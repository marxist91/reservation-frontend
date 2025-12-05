/**
 * Store Zustand pour la gestion des utilisateurs
 */
import { create } from 'zustand';
import type { User } from '@/types';
import { UserRole } from '@/types';

interface UserFilters {
  search: string;
  role: UserRole | 'all';
  status: 'all' | 'active' | 'inactive';
}

interface UserPagination {
  page: number;
  perPage: number;
  total: number;
}

interface PaginatedResult {
  users: User[];
  total: number;
  totalPages: number;
}

interface UserStats {
  total: number;
  admins: number;
  responsables: number;
  users: number;
}

interface UserState {
  // État
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
  pagination: UserPagination;
  
  // Actions
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filtres
  setFilters: (filters: Partial<UserFilters>) => void;
  resetFilters: () => void;
  
  // Pagination
  setPagination: (pagination: Partial<UserPagination>) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  
  // Méthodes utilitaires
  getFilteredUsers: () => User[];
  getPaginatedUsers: () => PaginatedResult;
  addUser: (user: User) => void;
  updateUser: (userId: number, updates: Partial<User>) => void;
  deleteUser: (userId: number) => void;
  findUserById: (userId: number) => User | undefined;
  getUserStats: () => UserStats;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
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
  setUsers: (users: User[]): void => set({ users }),
  
  setSelectedUser: (user: User | null): void => set({ selectedUser: user }),
  
  setLoading: (loading: boolean): void => set({ loading }),
  
  setError: (error: string | null): void => set({ error }),
  
  // Filtres
  setFilters: (filters: Partial<UserFilters>): void => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: (): void => set({
    filters: {
      search: '',
      role: 'all',
      status: 'all'
    }
  }),
  
  // Pagination
  setPagination: (pagination: Partial<UserPagination>): void => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  
  setPage: (page: number): void => set((state) => ({
    pagination: { ...state.pagination, page }
  })),
  
  setPerPage: (perPage: number): void => set((state) => ({
    pagination: { ...state.pagination, perPage, page: 1 }
  })),
  
  // Utilisateurs filtrés
  getFilteredUsers: (): User[] => {
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
  getPaginatedUsers: (): PaginatedResult => {
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
  addUser: (user: User): void => set((state) => ({
    users: [...state.users, user]
  })),
  
  // Mettre à jour un utilisateur
  updateUser: (userId: number, updates: Partial<User>): void => set((state) => ({
    users: state.users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ),
    selectedUser: state.selectedUser?.id === userId 
      ? { ...state.selectedUser, ...updates }
      : state.selectedUser
  })),
  
  // Supprimer un utilisateur
  deleteUser: (userId: number): void => set((state) => ({
    users: state.users.filter(user => user.id !== userId),
    selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser
  })),
  
  // Trouver un utilisateur par ID
  findUserById: (userId: number): User | undefined => {
    const { users } = get();
    return users.find(user => user.id === userId);
  },
  
  // Obtenir les statistiques des utilisateurs
  getUserStats: (): UserStats => {
    const { users } = get();
    
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      responsables: users.filter(u => u.role === 'responsable').length,
      users: users.filter(u => u.role === 'user').length
    };
  },
  
  // Réinitialiser le store
  reset: (): void => set({
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
