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
import { formatDateTime, formatFullName } from '@/utils/formatters';
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
  
  // Calculer quelles salles sont occupées maintenant (temps réel)
  const occupiedRooms = new Set<number>();
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  (reservations || []).forEach((r) => {
    const resDate = r.date_debut?.split('T')[0] || r.date;
    if (resDate === currentDate && (r.statut === 'confirmee' || r.statut === 'validee')) {
      const parseTime = (t: string | undefined | null) => {
        if (!t) return null;
        const parts = t.split(':').map(p => parseInt(p, 10));
        return (parts[0] || 0) * 60 + (parts[1] || 0);
      };
      const start = parseTime(r.heure_debut);
      const end = parseTime(r.heure_fin);
      if (start !== null && end !== null && currentMinutes >= start && currentMinutes < end) {
        const roomId = r.room_id || r.salle?.id || r.Room?.id;
        if (roomId) occupiedRooms.add(Number(roomId));
      }
    }
  });
  
  const isAdmin = user?.role === 'admin';
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await usersAPI.getAll() as any;
      return Array.isArray(data) ? data : (data.utilisateurs || []);
    },
    enabled: isAdmin,
  });

  const isLoading = roomsLoading || reservationsLoading || usersLoading;

  const pendingReservations = reservations?.filter(r => r.statut === 'en_attente') || [];

  const stats: StatCard[] = [];
  if (isAdmin) {
    stats.push({
      title: 'Utilisateurs',
      value: users?.length || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      onClick: () => navigate('/admin/users'),
    });
  }

  // Construire la carte Salles puis ajouter onClick seulement si admin
  const sallesCard: StatCard = {
    title: 'Salles',
    value: rooms?.length || 0,
    icon: <RoomIcon sx={{ fontSize: 40 }} />,
    color: '#2e7d32',
  };
  if (isAdmin) {
    sallesCard.onClick = () => navigate('/admin/rooms');
  }
  stats.push(sallesCard);

  stats.push({
    title: 'Réservations',
    value: reservations?.length || 0,
    icon: <ReservationIcon sx={{ fontSize: 40 }} />,
    color: '#ed6c02',
    onClick: () => navigate('/admin/reservations'),
  });

  stats.push({
    title: 'En Attente',
    value: pendingReservations.length,
    icon: <PendingIcon sx={{ fontSize: 40 }} />,
    color: '#d32f2f',
  });

  // Utiliser les helpers robustes de formatage
  const formatDate = (dateString?: string | null): string => {
    return formatDateTime(dateString ?? null);
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
        rejection_reason: rejectionReason,
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
        Tableau de Bord
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
              {pendingReservations.slice(0, 5).map((reservation) => {
                const userPrenom = reservation.utilisateur?.prenom ?? reservation.User?.prenom ?? (reservation as any).prenom ?? undefined;
                const userNom = reservation.utilisateur?.nom ?? reservation.User?.nom ?? (reservation as any).nom ?? undefined;
                const userNameFallback = reservation.utilisateur?.nom ?? reservation.User?.nom ?? (reservation as any).userName ?? (reservation as any).user_name;
                const displayUser = (userPrenom || userNom)
                  ? formatFullName(userPrenom, userNom)
                  : (userNameFallback ? String(userNameFallback) : (reservation.user_id ? `#${reservation.user_id}` : '-'));

                const roomName = reservation.salle?.nom ?? reservation.Room?.nom ?? (reservation as any).room?.nom ?? (reservation as any).salle_nom ?? (reservation as any).room_name ?? '-';

                // Préférer une source datetime complète. Si la source n'inclut pas d'heure
                // mais qu'il existe `heure_debut`, on combine `date` + `heure_debut`.
                let dateSource = reservation.date_debut ?? reservation.date ?? reservation.created_at ?? (reservation as any).createdAt ?? null;
                let displayDate = 'N/A';
                try {
                  const hasTime = typeof dateSource === 'string' && dateSource.includes('T');
                  if (!hasTime && reservation.heure_debut) {
                    // combine date (YYYY-MM-DD) and heure_debut (HH:mm or HH:mm:ss)
                    const d = reservation.date ?? (reservation as any).date_debut ?? null;
                    if (d) {
                      dateSource = `${d}T${reservation.heure_debut}`;
                    }
                  }
                  displayDate = formatDate(dateSource as any);
                } catch (e) {
                  displayDate = formatDate(dateSource as any);
                }

                return (
                  <TableRow key={reservation.id}>
                    <TableCell>{displayUser}</TableCell>
                    <TableCell>{roomName}</TableCell>
                    <TableCell>{displayDate}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {isAdmin && (
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
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Salles
            </Typography>
            {rooms?.slice(0, 5).map((room) => {
              const isOccupiedNow = occupiedRooms.has(room.id);
              return (
              <Box key={room.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom="1px solid #eee">
                <Box>
                  <Typography variant="subtitle2">{room.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">Capacité: {room.capacite}</Typography>
                </Box>
                <Chip 
                  label={isOccupiedNow ? 'Occupée' : 'Disponible'} 
                  size="small" 
                  color={isOccupiedNow ? 'error' : 'success'} 
                />
              </Box>
            );})}
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
