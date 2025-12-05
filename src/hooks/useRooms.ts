import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { roomsAPI } from '@/api/rooms';
import toast from 'react-hot-toast';
import type { Room, RoomFormData } from '@/types';

export interface UpdateRoomParams {
  id: number;
  data: Partial<RoomFormData>;
}

export interface UseRoomsReturn {
  rooms: Room[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createRoom: UseMutationResult<any, Error, RoomFormData, unknown>;
  updateRoom: UseMutationResult<any, Error, UpdateRoomParams, unknown>;
  deleteRoom: UseMutationResult<any, Error, number, unknown>;
}

export const useRooms = (): UseRoomsReturn => {
  const queryClient = useQueryClient();

  // Récupérer toutes les salles
  const { data: rooms = [], isLoading, error, refetch } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Créer une salle (admin)
  const createRoom = useMutation({
    mutationFn: roomsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Salle créée avec succès !');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Mettre à jour une salle (admin)
  const updateRoom = useMutation({
    mutationFn: ({ id, data }: UpdateRoomParams) => roomsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Salle mise à jour !');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Supprimer une salle (admin)
  const deleteRoom = useMutation({
    mutationFn: roomsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Salle supprimée');
    },
    onError: (error: any) => {
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
