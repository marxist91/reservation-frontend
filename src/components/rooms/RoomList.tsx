import type { Room } from '@/types';
import { Grid, Box, Typography, CircularProgress, Alert } from '@mui/material';
import RoomCard from './RoomCard';

interface RoomListProps {
  rooms: Room[];
  isLoading: boolean;
  error: Error | null;
  onReserve?: (room: Room) => void;
  onView?: (room: Room) => void;
  emptyMessage?: string;
  showActions?: boolean;
}

const RoomList: React.FC<RoomListProps> = ({ 
  rooms, 
  isLoading, 
  error, 
  onReserve, 
  onView,
  emptyMessage = 'Aucune salle disponible',
  showActions = true,
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des salles
      </Alert>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {rooms.map((room) => (
        /* @ts-expect-error MUI Grid item prop typing issue */
        <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
          <RoomCard
            room={room}
            onReserve={onReserve}
            onView={onView}
            showActions={showActions}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default RoomList;
