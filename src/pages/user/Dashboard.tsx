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
  Skeleton,
  alpha,
} from '@mui/material';
import {
  EventNote as ReservationIcon,
  MeetingRoom as RoomIcon,
  Pending as PendingIcon,
  CheckCircle as ConfirmedIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface DashboardStat {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  bg: string;
  onClick?: () => void;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { reservations, isLoading: reservationsLoading, createReservation } = useReservations();

  const [dialogOpen, setDialogOpen] = useState(false);

  const isLoading = roomsLoading || reservationsLoading;

  const myReservations = reservations?.filter(r => {
    const userId = r.user_id;
    return userId == user?.id;
  }) || [];

  const pendingReservations = myReservations.filter(r => r.statut === 'en_attente');
  const confirmedReservations = myReservations.filter(r => r.statut === 'validee' || r.statut === 'confirmee');
  const availableRooms = rooms?.filter(r => r.statut === 'disponible') || [];

  const stats: DashboardStat[] = [
    {
      title: 'Mes Réservations',
      value: myReservations.length,
      icon: <ReservationIcon sx={{ fontSize: 32 }} />,
      color: '#1565c0',
      bg: '#e3f2fd',
      onClick: () => navigate('/reservations'),
    },
    {
      title: 'Salles Disponibles',
      value: availableRooms.length,
      icon: <RoomIcon sx={{ fontSize: 32 }} />,
      color: '#2e7d32',
      bg: '#e8f5e9',
      onClick: () => navigate('/rooms'),
    },
    {
      title: 'En Attente',
      value: pendingReservations.length,
      icon: <PendingIcon sx={{ fontSize: 32 }} />,
      color: '#e65100',
      bg: '#fff3e0',
    },
    {
      title: 'Confirmées',
      value: confirmedReservations.length,
      icon: <ConfirmedIcon sx={{ fontSize: 32 }} />,
      color: '#1b5e20',
      bg: '#e8f5e9',
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
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Skeleton variant="rounded" width={300} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={200} sx={{ mb: 4 }} />
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          {[0,1,2,3].map(i => (
            <Skeleton key={i} variant="rounded" sx={{ flex: '1 1 0', minWidth: 200, height: 140, borderRadius: 3 }} />
          ))}
        </Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
          >
            Tableau de Bord
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Bienvenue, {user?.prenom} {user?.nom}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
            boxShadow: '0 4px 14px rgba(10,36,99,0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0d2f7a 0%, #1976d2 100%)',
              boxShadow: '0 6px 20px rgba(10,36,99,0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Nouvelle Réservation
        </Button>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
        {stats.map((stat, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 3,
              flex: '1 1 0',
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              cursor: stat.onClick ? 'pointer' : 'default',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.25s ease',
              '&:hover': stat.onClick ? {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 25px ${alpha(stat.color, 0.15)}`,
                borderColor: alpha(stat.color, 0.3),
              } : {},
            }}
            onClick={stat.onClick}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: stat.bg,
                color: stat.color,
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1.1 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                {stat.title}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Recent Reservations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Réservations Récentes
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/reservations')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Voir tout
              </Button>
            </Box>
            {myReservations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  Aucune réservation pour le moment
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {myReservations.slice(0, 5).map((reservation) => (
                  <Card
                    key={reservation.id}
                    elevation={0}
                    sx={{
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      ...(reservation.statut === 'rejetee' || reservation.statut === 'refusee' ? {
                        bgcolor: 'rgba(211, 47, 47, 0.04)',
                        borderLeft: '4px solid #d32f2f',
                      } : {
                        '&:hover': {
                          borderColor: alpha('#1565c0', 0.3),
                          bgcolor: alpha('#1565c0', 0.02),
                        },
                      }),
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                            {reservation.salle?.nom || reservation.Room?.nom || 'Salle'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">
                              {reservation.date || 'Date non définie'}
                            </Typography>
                            <TimeIcon sx={{ fontSize: 14, color: 'text.disabled', ml: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                              {reservation.heure_debut || ''} - {reservation.heure_fin || ''}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={getStatusLabel(reservation.statut)}
                          color={getStatusColor(reservation.statut)}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Available Rooms */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Salles Disponibles
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/rooms')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Voir tout
              </Button>
            </Box>
            {availableRooms.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <RoomIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  Aucune salle disponible
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {availableRooms.slice(0, 5).map((room) => (
                  <Card
                    key={room.id}
                    elevation={0}
                    sx={{
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: alpha('#2e7d32', 0.3),
                        bgcolor: alpha('#2e7d32', 0.02),
                      },
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {room.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Capacité: {room.capacite} personnes
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/rooms/${room.id}`)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: alpha('#1565c0', 0.4),
                            color: '#1565c0',
                            '&:hover': {
                              bgcolor: alpha('#1565c0', 0.06),
                              borderColor: '#1565c0',
                            },
                          }}
                        >
                          Réserver
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
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
