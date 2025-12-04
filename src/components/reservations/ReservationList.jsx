import { Grid, Box, Typography, CircularProgress, Alert } from '@mui/material';
import ReservationCard from './ReservationCard';

function ReservationList({ 
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
}) {
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
        <Grid item xs={12} sm={6} md={4} key={reservation.id}>
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
}

export default ReservationList;
