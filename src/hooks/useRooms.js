import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsAPI } from '../api/rooms';
import toast from 'react-hot-toast';

export const useRooms = () => {
  const queryClient = useQueryClient();

  // Récupérer toutes les salles
  const { data: rooms = [], isLoading, error, refetch } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
    retry: 2,
    staleTime: 0, // Les données deviennent périmées immédiatement
    refetchOnMount: true, // Toujours recharger au montage
    refetchOnWindowFocus: true, // Recharger quand on revient sur l'onglet
  });

  // Créer une salle (admin)
  const createRoom = useMutation({
    mutationFn: roomsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Salle créée avec succès !');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Mettre à jour une salle (admin)
  const updateRoom = useMutation({
    mutationFn: ({ id, data }) => roomsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Salle mise à jour !');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Supprimer une salle (admin)
  const deleteRoom = useMutation({
    mutationFn: roomsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      toast.success('Salle supprimée');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  return { 
    rooms, 
    isLoading, 
    error,
    refetch,
    createRoom, 
    updateRoom,
    deleteRoom,
  };
};