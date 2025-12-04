import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../api/users';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

/**
 * Hook pour la gestion des utilisateurs
 * Utilisable par les admins pour gérer tous les utilisateurs
 * et par les utilisateurs pour leur propre profil
 */
export const useUsers = (options = {}) => {
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
    staleTime: 0, // Les données deviennent périmées immédiatement
    refetchOnMount: true, // Toujours recharger au montage
    refetchOnWindowFocus: true, // Recharger quand on revient sur l'onglet
    select: (data) => {
      // Si data est déjà un tableau (retourné par usersAPI.getAll)
      if (Array.isArray(data)) return data;
      // Sinon on cherche dans les propriétés habituelles
      return data.utilisateurs || data.data || [];
    },
  });

  // Récupérer un utilisateur par ID
  const useUserById = (userId) => {
    return useQuery({
      queryKey: ['user', userId],
      queryFn: () => usersAPI.getById(userId),
      enabled: !!userId && isAdmin,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      select: (data) => data.data,
    });
  };

  // Mettre à jour un utilisateur (admin)
  const updateUser = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      toast.success('Utilisateur mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Changer le rôle d'un utilisateur (admin)
  const changeUserRole = useMutation({
    mutationFn: ({ id, role }) => usersAPI.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Rôle modifié avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de rôle');
    },
  });

  // Activer/Désactiver un utilisateur (admin)
  const toggleUserStatus = useMutation({
    mutationFn: ({ id, actif }) => usersAPI.update(id, { actif }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['users']);
      toast.success(variables.actif ? 'Utilisateur activé' : 'Utilisateur désactivé');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    },
  });

  // Mettre à jour son propre profil
  const updateProfile = useMutation({
    mutationFn: usersAPI.updateProfile,
    onSuccess: (data) => {
      // Mettre à jour le store auth avec les nouvelles données
      const updatedUser = data.data || data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      queryClient.invalidateQueries(['profile']);
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    },
  });

  // Changer son mot de passe
  const changePassword = useMutation({
    mutationFn: usersAPI.changePassword,
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    },
  });

  // Stats utilisateurs (admin)
  const getUserStats = () => {
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
  const filterUsers = (filters = {}) => {
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
    deleteUser: { isPending: false, mutate: () => toast.error("Suppression non implémentée") }, // Placeholder pour éviter le crash
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
