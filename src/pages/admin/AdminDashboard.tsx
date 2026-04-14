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
  Skeleton,
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
  alpha,
  Avatar,
} from '@mui/material';
import { formatDateTime, formatFullName } from '@/utils/formatters';
import {
  People as PeopleIcon,
  MeetingRoom as RoomIcon,
  EventAvailable as ReservationIcon,
  Pending as PendingIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  bg: string;
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
  const { data: users, isLoading: usersLoading } = useQuery<{ utilisateurs: User[]; total: number }>({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await usersAPI.getAll();
      return data as { utilisateurs: User[]; total: number };
    },
    enabled: isAdmin,
  });

  const isLoading = roomsLoading || reservationsLoading || usersLoading;

  const pendingReservations = reservations?.filter(r => r.statut === 'en_attente') || [];

  const stats: StatCard[] = [];
  if (isAdmin) {
    stats.push({
      title: 'Utilisateurs',
      value: users?.total || 0,
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      color: '#1565c0',
      bg: '#e3f2fd',
      onClick: () => navigate('/admin/users'),
    });
  }

  const sallesCard: StatCard = {
    title: 'Salles',
    value: rooms?.length || 0,
    icon: <RoomIcon sx={{ fontSize: 32 }} />,
    color: '#2e7d32',
    bg: '#e8f5e9',
  };
  if (isAdmin) {
    sallesCard.onClick = () => navigate('/admin/rooms');
  }
  stats.push(sallesCard);

  stats.push({
    title: 'Réservations',
    value: reservations?.length || 0,
    icon: <ReservationIcon sx={{ fontSize: 32 }} />,
    color: '#e65100',
    bg: '#fff3e0',
    onClick: () => navigate('/admin/reservations'),
  });

  stats.push({
    title: 'En Attente',
    value: pendingReservations.length,
    icon: <PendingIcon sx={{ fontSize: 32 }} />,
    color: '#c62828',
    bg: '#ffebee',
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
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Skeleton variant="rounded" width={300} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={220} sx={{ mb: 4 }} />
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {[0,1,2,3].map(i => (
            <Skeleton key={i} variant="rounded" sx={{ flex: '1 1 0', minWidth: 200, height: 100, borderRadius: 3 }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={250} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={250} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
        >
          Administration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Bienvenue, {user?.prenom} {user?.nom}
        </Typography>
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

      {/* Pending Reservations Table */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Réservations en Attente
            </Typography>
            {pendingReservations.length > 0 && (
              <Chip
                label={pendingReservations.length}
                size="small"
                sx={{
                  bgcolor: '#ffebee',
                  color: '#c62828',
                  fontWeight: 700,
                  height: 24,
                }}
              />
            )}
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/admin/reservations')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Voir tout
          </Button>
        </Box>

        {pendingReservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CheckIcon sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
            <Typography color="text.secondary">
              Aucune réservation en attente
            </Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ '& .MuiTableCell-head': { fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
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
                        variant="outlined"
                        startIcon={<CheckIcon />}
                        onClick={() => validateReservation.mutate(reservation.id)}
                        disabled={validateReservation.isPending}
                        sx={{ mr: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Valider
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(reservation)}
                        disabled={rejectReservation.isPending}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        {isAdmin && (
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
                  Derniers Utilisateurs
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/admin/users')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Gérer
                </Button>
              </Box>
              {users?.utilisateurs?.slice(0, 5).map((u: User) => (
                <Box
                  key={u.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha('#1565c0', 0.1),
                        color: '#1565c0',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {(u.prenom?.[0] || '').toUpperCase()}{(u.nom?.[0] || '').toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {u.prenom} {u.nom}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={u.role}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      ...(u.role === 'admin' ? {
                        bgcolor: '#e3f2fd',
                        color: '#1565c0',
                      } : u.role === 'responsable' ? {
                        bgcolor: '#fff3e0',
                        color: '#e65100',
                      } : {}),
                    }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>
        )}

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
                Salles
              </Typography>
              {isAdmin && (
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/admin/rooms')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Gérer
                </Button>
              )}
            </Box>
            {rooms?.slice(0, 5).map((room) => {
              const isOccupiedNow = occupiedRooms.has(room.id);
              return (
                <Box
                  key={room.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isOccupiedNow ? '#ffebee' : '#e8f5e9',
                        color: isOccupiedNow ? '#c62828' : '#2e7d32',
                      }}
                    >
                      <RoomIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{room.nom}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Capacité: {room.capacite}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={isOccupiedNow ? 'Occupée' : 'Disponible'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      ...(isOccupiedNow ? {
                        bgcolor: '#ffebee',
                        color: '#c62828',
                      } : {
                        bgcolor: '#e8f5e9',
                        color: '#2e7d32',
                      }),
                    }}
                  />
                </Box>
              );
            })}
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
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Refuser la réservation</DialogTitle>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenRejectDialog(false);
              setRejectionReason('');
            }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmReject}
            disabled={rejectReservation.isPending || !rejectionReason.trim()}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {rejectReservation.isPending ? 'Refus en cours...' : 'Confirmer le refus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
