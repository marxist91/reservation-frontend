import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  AccessTime as TimeIcon,
  MeetingRoom as RoomIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { formatDate, formatTimeRange } from '../../utils/formatters';
import { RESERVATION_STATUS_COLORS, RESERVATION_STATUS_LABELS } from '../../utils/constants';

const getStatusColor = (statut) => {
  return RESERVATION_STATUS_COLORS[statut] || 'default';
};

const getStatusLabel = (statut) => {
  return RESERVATION_STATUS_LABELS[statut] || statut;
};

// Fonction pour obtenir la couleur de fond selon le statut (avec rouge pour rejetée)
const getStatusBgColor = (statut) => {
  if (statut === 'rejetee' || statut === 'refusee') {
    return '#d32f2f'; // Rouge
  }
  if (statut === 'annulee') {
    return '#ed6c02'; // Orange
  }
  if (statut === 'validee' || statut === 'confirmee') {
    return '#2e7d32'; // Vert
  }
  if (statut === 'en_attente') {
    return '#ed6c02'; // Orange
  }
  return '#1976d2'; // Bleu par défaut
};

function ReservationCard({ 
  reservation, 
  onCancel, 
  onView, 
  onValidate,
  onReject,
  showActions = true,
  isAdmin = false,
}) {
  const room = reservation.salle || reservation.room;
  const user = reservation.utilisateur || reservation.user;
  
  // Détecter si c'est une réservation multiple (même group_id)
  const isGroupReservation = !!reservation.group_id;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: 4,
        borderColor: getStatusBgColor(reservation.statut),
        ...(reservation.statut === 'rejetee' || reservation.statut === 'refusee' ? {
          bgcolor: 'rgba(211, 47, 47, 0.05)' // Fond rouge très léger
        } : {})
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" component="h2" gutterBottom>
              {reservation.motif || 'Réservation'}
            </Typography>
            {isGroupReservation && (
              <Chip
                label="Réservation multiple"
                size="small"
                color="info"
                variant="outlined"
                sx={{ mb: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          <Chip
            label={getStatusLabel(reservation.statut)}
            color={getStatusColor(reservation.statut)}
            size="small"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <RoomIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {room?.nom || 'Salle non définie'}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <EventIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {reservation.date ? formatDate(reservation.date) : 'Date non définie'}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <TimeIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={isGroupReservation ? 'bold' : 'normal'}>
            {reservation.heure_debut || ''} - {reservation.heure_fin || ''}
            {isGroupReservation && ' (créneau)'}
          </Typography>
        </Box>

        {isAdmin && user && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {user.prenom} {user.nom}
            </Typography>
          </Box>
        )}

        {reservation.description && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {reservation.description}
            </Typography>
          </>
        )}
      </CardContent>

      {showActions && (
        <CardActions sx={{ p: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
          {onView && (
            <Button size="small" onClick={() => onView(reservation)}>
              Détails
            </Button>
          )}
          
          {isAdmin && reservation.statut === 'en_attente' && (
            <>
              {onValidate && (
                <Button 
                  size="small" 
                  color="success"
                  variant="contained"
                  onClick={() => onValidate(reservation)}
                >
                  Valider
                </Button>
              )}
              {onReject && (
                <Button 
                  size="small" 
                  color="error"
                  variant="outlined"
                  onClick={() => onReject(reservation)}
                >
                  Rejeter
                </Button>
              )}
            </>
          )}

          {!isAdmin && reservation.statut === 'en_attente' && onCancel && (
            <Button 
              size="small" 
              color="error"
              onClick={() => onCancel(reservation)}
            >
              Annuler
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
}

export default ReservationCard;
