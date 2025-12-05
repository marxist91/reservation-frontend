import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRooms } from '../../hooks/useRooms';
import { useReservations } from '../../hooks/useReservations';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/api/users';
import toast from 'react-hot-toast';
import type { Reservation, User } from '@/types';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  People as PeopleIcon,
  MeetingRoom as RoomIcon,
  EventAvailable as ReservationIcon,
  Pending as PendingIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  onClick?: () => void;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { reservations, isLoading: reservationsLoading, validateReservation, rejectReservation } = useReservations();
  
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await usersAPI.getAll() as any;
      return Array.isArray(data) ? data : (data.utilisateurs || []);
    },
  });

  const isLoading = roomsLoading || reservationsLoading || usersLoading;

  const pendingReservations = reservations?.filter(r => r.statut === 'en_attente') || [];

  const stats: StatCard[] = [
    {
      title: 'Utilisateurs',
      value: users?.length || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Salles',
      value: rooms?.length || 0,
      icon: <RoomIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      onClick: () => navigate('/admin/rooms'),
    },
    {
      title: 'Réservations',
      value: reservations?.length || 0,
      icon: <ReservationIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      onClick: () => navigate('/admin/reservations'),
    },
    {
      title: 'En Attente',
      value: pendingReservations.length,
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleReject = (reservation: Reservation): void => {
    setSelectedReservation(reservation);
    setRejectionReason('');
    setOpenRejectDialog(true);
  };

  const confirmReject = (): void => {
    if (!rejectionReason.trim()) {
      toast.error('Le motif du refus est obligatoire');
      return;
    }
    if (selectedReservation) {
      rejectReservation.mutate({
        id: selectedReservation.id,
        rejection_reason: rejectionReason
      });
      setOpenRejectDialog(false);
      setRejectionReason('');
      setSelectedReservation(null);
    }
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
      <Typography variant="h4" gutterBottom>
        Tableau de Bord Administrateur
      </Typography>
      <Typography variant="h6" gutterBottom color="text.secondary">
        Bienvenue, {user?.prenom} {user?.nom} !
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
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
              bgcolor: stat.color,
              color: 'white',
              cursor: stat.onClick ? 'pointer' : 'default',
              transition: 'transform 0.2s',
              '&:hover': stat.onClick ? { transform: 'scale(1.02)' } : {},
              minHeight: 180,
            }}
            onClick={stat.onClick}
          >
            <Box sx={{ mb: 1 }}>{stat.icon}</Box>
            <Typography variant="h6">{stat.title}</Typography>
            <Typography variant="h3" fontWeight="bold">
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Réservations en Attente ({pendingReservations.length})
          </Typography>
          <Button size="small" onClick={() => navigate('/admin/reservations')}>
            Voir tout
          </Button>
        </Box>

        {pendingReservations.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={3}>
            Aucune réservation en attente
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Salle</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Motif</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingReservations.slice(0, 5).map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    {reservation.User?.prenom} {reservation.User?.nom}
                  </TableCell>
                  <TableCell>{reservation.Room?.nom}</TableCell>
                  <TableCell>{formatDate(reservation.date_debut)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {reservation.motif || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => validateReservation.mutate(reservation.id)}
                      disabled={validateReservation.isPending}
                      sx={{ mr: 1 }}
                    >
                      Valider
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleReject(reservation)}
                      disabled={rejectReservation.isPending}
                    >
                      Refuser
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Derniers Utilisateurs
            </Typography>
            {users?.slice(0, 5).map((u) => (
              <Box key={u.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom="1px solid #eee">
                <Box>
                  <Typography variant="subtitle2">{u.prenom} {u.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </Box>
                <Chip label={u.role} size="small" color={u.role === 'admin' ? 'primary' : 'default'} />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Salles
            </Typography>
            {rooms?.slice(0, 5).map((room) => (
              <Box key={room.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom="1px solid #eee">
                <Box>
                  <Typography variant="subtitle2">{room.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">Capacité: {room.capacite}</Typography>
                </Box>
                <Chip 
                  label={room.disponible ? 'Disponible' : 'Indisponible'} 
                  size="small" 
                  color={room.disponible ? 'success' : 'error'} 
                />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={openRejectDialog} 
        onClose={() => {
          setOpenRejectDialog(false);
          setRejectionReason('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refuser la réservation</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Réservation #{selectedReservation?.id}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            <strong>Salle:</strong> {selectedReservation?.salle?.nom}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            <strong>Date:</strong> {selectedReservation?.date}
          </Typography>
          <TextField
            autoFocus
            required
            margin="dense"
            label="Motif du refus *"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Veuillez indiquer la raison du refus..."
            error={rejectionReason.trim() === ''}
            helperText="Le motif du refus est obligatoire"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenRejectDialog(false);
            setRejectionReason('');
          }}>
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmReject}
            disabled={rejectReservation.isPending || !rejectionReason.trim()}
          >
            {rejectReservation.isPending ? 'Refus en cours...' : 'Confirmer le refus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
