import type { Reservation } from '@/types';
import { Grid, Box, Typography, CircularProgress, Alert } from '@mui/material';
import ReservationCard from './ReservationCard';

interface ReservationListProps {
  reservations: Reservation[];
  isLoading: boolean;
  error: Error | null;
  onCancel?: (reservation: Reservation) => void;
  onView?: (reservation: Reservation) => void;
  onValidate?: (reservation: Reservation) => void;
  onReject?: (reservation: Reservation) => void;
  emptyMessage?: string;
  showActions?: boolean;
  isAdmin?: boolean;
}

const ReservationList: React.FC<ReservationListProps> = ({ 
  reservations, 
  isLoading, 
  error, 
  onCancel, 
  onView,
  onValidate,
  onReject,
  emptyMessage = 'Aucune réservation',
  showActions = true,
  isAdmin = false,
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
        Erreur lors du chargement des réservations
      </Alert>
    );
  }

  if (!reservations || reservations.length === 0) {
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
      {reservations.map((reservation) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={reservation.id}>
          <ReservationCard
            reservation={reservation}
            onCancel={onCancel}
            onView={onView}
            onValidate={onValidate}
            onReject={onReject}
            showActions={showActions}
            isAdmin={isAdmin}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ReservationList;
