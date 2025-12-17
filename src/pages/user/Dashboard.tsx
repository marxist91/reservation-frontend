import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRooms } from '../../hooks/useRooms';
import { useReservations } from '../../hooks/useReservations';
import ReservationForm from '@/components/reservations/ReservationForm';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  EventNote as ReservationIcon,
  MeetingRoom as RoomIcon,
  Pending as PendingIcon,
  CheckCircle as ConfirmedIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface DashboardStat {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  onClick?: () => void;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { reservations, isLoading: reservationsLoading, createReservation } = useReservations();
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const isLoading = roomsLoading || reservationsLoading;

  // Calculer les statistiques
  const myReservations = reservations?.filter(r => {
    const userId = r.user_id;
    return userId == user?.id;
  }) || [];
  
  console.log('👤 User ID:', user?.id);
  console.log('📊 Total reservations:', reservations?.length);
  console.log('📋 My reservations:', myReservations.length);
  
  const pendingReservations = myReservations.filter(r => r.statut === 'en_attente');
  const confirmedReservations = myReservations.filter(r => r.statut === 'validee' || r.statut === 'confirmee');
  const availableRooms = rooms?.filter(r => r.statut === 'disponible') || [];

  const stats: DashboardStat[] = [
    {
      title: 'Mes Réservations',
      value: myReservations.length,
      icon: <ReservationIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      onClick: () => navigate('/reservations'),
    },
    {
      title: 'Salles Disponibles',
      value: availableRooms.length,
      icon: <RoomIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      onClick: () => navigate('/rooms'),
    },
    {
      title: 'En Attente',
      value: pendingReservations.length,
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Confirmées',
      value: confirmedReservations.length,
      icon: <ConfirmedIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
  ];

  const getStatusColor = (statut: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (statut) {
      case 'confirmee': return 'success';
      case 'en_attente': return 'warning';
      case 'annulee': return 'error';
      case 'rejetee': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut: string): string => {
    switch (statut) {
      case 'confirmee': return 'Confirmée';
      case 'en_attente': return 'En attente';
      case 'annulee': return 'Annulée';
      case 'rejetee': return 'Refusée';
      default: return statut;
    }
  };

  const handleCreateReservation = (formData: any): void => {
    createReservation.mutate(formData, {
      onSuccess: () => {
        setDialogOpen(false);
        navigate('/reservations');
      },
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Tableau de Bord
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Bienvenue, {user?.prenom} {user?.nom} !
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nouvelle Réservation
        </Button>
      </Box>

      {/* Statistiques */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        {stats.map((stat, index) => (
          <Paper
            key={index}
            sx={{
              p: 4,
              flex: '1 1 0',
              minWidth: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: stat.onClick ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s',
              minHeight: 180,
              '&:hover': stat.onClick ? {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              } : {},
            }}
            onClick={stat.onClick}
          >
            <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
            <Typography variant="h3" fontWeight="bold">
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.title}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Réservations récentes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Mes Réservations Récentes</Typography>
              <Button size="small" onClick={() => navigate('/reservations')}>
                Voir tout
              </Button>
            </Box>
            {myReservations.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Aucune réservation pour le moment
              </Typography>
            ) : (
              myReservations.slice(0, 5).map((reservation) => (
                <Card 
                  key={reservation.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1,
                    ...(reservation.statut === 'rejetee' || reservation.statut === 'refusee' ? {
                      bgcolor: 'rgba(211, 47, 47, 0.05)', // Fond rouge très léger
                      borderLeftColor: '#d32f2f',
                      borderLeftWidth: 4
                    } : {})
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">
                          {reservation.salle?.nom || reservation.Room?.nom || 'Salle'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reservation.date || 'Date non définie'} • {reservation.heure_debut || ''} - {reservation.heure_fin || ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(reservation.statut)}
                        color={getStatusColor(reservation.statut)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        {/* Salles disponibles */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Salles Disponibles</Typography>
              <Button size="small" onClick={() => navigate('/rooms')}>
                Voir tout
              </Button>
            </Box>
            {availableRooms.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Aucune salle disponible
              </Typography>
            ) : (
              availableRooms.slice(0, 5).map((room) => (
                <Card key={room.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">{room.nom}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Capacité: {room.capacite} personnes
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        Réserver
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de création de réservation */}
      <ReservationForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        rooms={rooms || []}
        onSubmit={handleCreateReservation}
        isLoading={createReservation.isPending}
      />
    </Box>
  );
};

export default Dashboard;
