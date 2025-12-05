import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { usersAPI } from '../api/users';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import type { User, UserFormData, PasswordChangeData, UserRole } from '@/types';

export interface UpdateUserParams {
  id: number;
  data: Partial<UserFormData>;
}

export interface ChangeRoleParams {
  id: number;
  role: UserRole;
}

export interface ToggleStatusParams {
  id: number;
  actif: boolean;
}

export interface UserFilters {
  role?: UserRole;
  search?: string;
  actif?: boolean;
}

export interface UserStats {
  total: number;
  admins: number;
  responsables: number;
  users: number;
  actifs: number;
  inactifs: number;
}

export interface UseUsersOptions {
  fetchAll?: boolean;
}

export interface UseUsersReturn {
  // Data
  users: User[];
  isLoading: boolean;
  error: Error | null;
  
  // Queries
  useUserById: (userId: number | null) => UseQueryResult<User, Error>;
  refetchUsers: () => void;
  
  // Mutations (admin)
  updateUser: UseMutationResult<any, Error, UpdateUserParams, unknown>;
  deleteUser: { isPending: boolean; mutate: () => void };
  changeUserRole: UseMutationResult<any, Error, ChangeRoleParams, unknown>;
  toggleUserStatus: UseMutationResult<any, Error, ToggleStatusParams, unknown>;
  
  // Mutations (self)
  updateProfile: UseMutationResult<any, Error, Partial<UserFormData>, unknown>;
  changePassword: UseMutationResult<any, Error, PasswordChangeData, unknown>;
  
  // Helpers
  getUserStats: () => UserStats | null;
  filterUsers: (filters?: UserFilters) => User[];
  isAdmin: boolean;
}

/**
 * Hook pour la gestion des utilisateurs
 * Utilisable par les admins pour gérer tous les utilisateurs
 * et par les utilisateurs pour leur propre profil
 */
export const useUsers = (options: UseUsersOptions = {}): UseUsersReturn => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';

  // Récupérer tous les utilisateurs (admin only)
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    enabled: isAdmin && options.fetchAll !== false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    select: (data): User[] => {
      if (Array.isArray(data)) return data;
      return (data as any).utilisateurs || (data as any).data || [];
    },
  });

  // Récupérer un utilisateur par ID
  const useUserById = (userId: number | null): UseQueryResult<User, Error> => {
    return useQuery({
      queryKey: ['user', userId],
      queryFn: () => usersAPI.getById(userId!),
      enabled: !!userId && isAdmin,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      select: (data): User => (data as any).data,
    });
  };

  // Mettre à jour un utilisateur (admin)
  const updateUser = useMutation({
    mutationFn: ({ id, data }: UpdateUserParams) => usersAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      toast.success('Utilisateur mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Changer le rôle d'un utilisateur (admin)
  const changeUserRole = useMutation({
    mutationFn: ({ id, role }: ChangeRoleParams) => usersAPI.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Rôle modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de rôle');
    },
  });

  // Activer/Désactiver un utilisateur (admin)
  const toggleUserStatus = useMutation({
    mutationFn: ({ id, actif }: ToggleStatusParams) => usersAPI.update(id, { actif } as Partial<UserFormData>),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.actif ? 'Utilisateur activé' : 'Utilisateur désactivé');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    },
  });

  // Mettre à jour son propre profil
  const updateProfile = useMutation({
    mutationFn: usersAPI.updateProfile,
    onSuccess: (data) => {
      const updatedUser = (data as any).data || data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    },
  });

  // Changer son mot de passe
  const changePassword = useMutation<any, Error, PasswordChangeData, unknown>({
    mutationFn: usersAPI.changePassword as any,
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    },
  });

  // Stats utilisateurs (admin)
  const getUserStats = (): UserStats | null => {
    if (!usersData) return null;
    
    const users = usersData;
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      responsables: users.filter(u => u.role === 'responsable').length,
      users: users.filter(u => u.role === 'user').length,
      actifs: users.filter(u => u.actif !== false).length,
      inactifs: users.filter(u => u.actif === false).length,
    };
  };

  // Filtrer les utilisateurs
  const filterUsers = (filters: UserFilters = {}): User[] => {
    if (!usersData) return [];
    
    let filtered = [...usersData];
    
    if (filters.role) {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.nom?.toLowerCase().includes(search) ||
        u.prenom?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    }
    
    if (filters.actif !== undefined) {
      filtered = filtered.filter(u => u.actif === filters.actif);
    }
    
    return filtered;
  };

  return {
    // Data
    users: usersData || [],
    isLoading: isLoadingUsers,
    error: usersError,
    
    // Queries
    useUserById,
    refetchUsers,
    
    // Mutations (admin)
    updateUser,
    deleteUser: { isPending: false, mutate: () => toast.error("Suppression non implémentée") },
    changeUserRole,
    toggleUserStatus,
    
    // Mutations (self)
    updateProfile,
    changePassword,
    
    // Helpers
    getUserStats,
    filterUsers,
    isAdmin,
  };
};

/**
 * Hook pour le profil utilisateur courant
 */
export const useProfile = () => {
  const { user } = useAuthStore();
  const { updateProfile, changePassword } = useUsers({ fetchAll: false });

  return {
    user,
    updateProfile,
    changePassword,
  };
};

export default useUsers;
