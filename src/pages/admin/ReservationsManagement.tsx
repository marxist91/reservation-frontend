import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReservationCard from '@/components/reservations/ReservationCard';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Grid,
  TablePagination,
  SelectChangeEvent,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';
import { reservationsAPI } from '@/api/reservations';
import { roomsAPI } from '@/api/rooms';
import { usersAPI } from '@/api/users';
import { alternativesAPI } from '@/api/alternatives';
import apiClient from '@/api/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useHistoryStore } from '@/store/historyStore';
import { useAuth } from '../../hooks/useAuth';
import type { Reservation, Room, User } from '@/types';

type ViewMode = 'table' | 'grid';
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const ReservationsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { fullName } = useAuth();
  const addToHistory = useHistoryStore(state => state.addHistoryEntry);
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [proposeAlternative, setProposeAlternative] = useState(false);
  const [alternativeRoomId, setAlternativeRoomId] = useState<number | ''>('');
  const [alternativeDate, setAlternativeDate] = useState('');
  const [alternativeStartTime, setAlternativeStartTime] = useState('');
  const [alternativeEndTime, setAlternativeEndTime] = useState('');
  const [alternativeMotif, setAlternativeMotif] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Gestionnaires de pagination
  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Récupérer toutes les réservations
  const { data: reservationsData, isLoading, error } = useQuery<any>({
    queryKey: ['reservations', 'admin'],
    queryFn: () => reservationsAPI.getAll(),
  });

  // Récupérer les salles pour le filtre
  const { data: roomsData, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
  });

  // Récupérer les utilisateurs
  const { data: users = [] } = useQuery<any>({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    select: (data) => Array.isArray(data) ? data : (data.utilisateurs || []),
  });

  // Récupérer les départements (fallback si la réservation ne contient pas l'objet department)
  const { data: departments = [] } = useQuery<any>({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/departments');
        return res.data?.data ?? res.data ?? [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Récupérer les salles disponibles pour la proposition alternative
  const { data: availableRooms = [], isLoading: availableRoomsLoading } = useQuery<Room[]>({
    queryKey: ['availableRooms', alternativeDate, alternativeStartTime, alternativeEndTime, selectedReservation?.id],
    queryFn: () => alternativesAPI.getAvailableRooms({
      date: alternativeDate,
      startTime: alternativeStartTime,
      endTime: alternativeEndTime,
      ...(selectedReservation?.id && { excludeReservationId: selectedReservation.id }),
    }),
    enabled: proposeAlternative && !!alternativeDate && !!alternativeStartTime && !!alternativeEndTime,
  });

  const reservations: Reservation[] = Array.isArray(reservationsData?.data) ? reservationsData.data : (Array.isArray(reservationsData) ? reservationsData : []);
  const rooms: Room[] = Array.isArray(roomsData) ? roomsData : [];

  // Mutation pour valider une réservation
  const validateMutation = useMutation({
    mutationFn: reservationsAPI.validate,
    onSuccess: (_data, reservationId) => {
      const reservationsData = queryClient.getQueryData<any>(['reservations', 'admin']);
      const reservations: Reservation[] = Array.isArray(reservationsData?.data) ? reservationsData.data : [];
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (reservation) {
        const resAny = reservation as any;
        addToHistory({
          userId: reservation.user_id,
          userName: `${resAny.utilisateur?.prenom || ''} ${resAny.utilisateur?.nom || 'Utilisateur'}`.trim(),
          action: 'reservation_validated',
          description: `Réservation validée par ${fullName}`,
          details: {
            reservationId: reservation.id,
            salle: resAny.salle?.nom || 'N/A',
            date_debut: reservation.date_debut,
            validateur: fullName
          }
        });
        
        addToHistory({
          action: 'reservation_validated',
          description: `Réservation #${reservation.id} validée`,
          details: {
            reservationId: reservation.id,
            salle: resAny.salle?.nom || 'N/A',
            utilisateur: `${resAny.utilisateur?.prenom || ''} ${resAny.utilisateur?.nom || ''}`.trim(),
            date_debut: reservation.date_debut
          }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.refetchQueries({ queryKey: ['reservations', 'admin'] });
      toast.success('Réservation validée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    },
  });

  // Mutation pour refuser une réservation
  const rejectMutation = useMutation({
    mutationFn: ({ 
      id, 
      rejection_reason, 
      proposed_alternative 
    }: { 
      id: number; 
      rejection_reason: string;
      proposed_alternative?: {
        proposed_room_id: number;
        proposed_date_debut: string;
        proposed_date_fin: string;
        motif?: string;
      };
    }) => reservationsAPI.reject(id, rejection_reason, proposed_alternative),
    onSuccess: (_data, { id: reservationId }) => {
      const reservationsData = queryClient.getQueryData<any>(['reservations', 'admin']);
      const reservations: Reservation[] = Array.isArray(reservationsData?.data) ? reservationsData.data : [];
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (reservation) {
        const resAny = reservation as any;
        addToHistory({
          userId: reservation.user_id,
          userName: `${resAny.utilisateur?.prenom || ''} ${resAny.utilisateur?.nom || 'Utilisateur'}`.trim(),
          action: 'reservation_rejected',
          description: `Réservation refusée par ${fullName}`,
          details: {
            reservationId: reservation.id,
            salle: resAny.salle?.nom || 'N/A',
            date_debut: reservation.date_debut,
            validateur: fullName
          }
        });
        
        addToHistory({
          action: 'reservation_rejected',
          description: `Réservation #${reservation.id} refusée`,
          details: {
            reservationId: reservation.id,
            salle: resAny.salle?.nom || 'N/A',
            utilisateur: `${resAny.utilisateur?.prenom || ''} ${resAny.utilisateur?.nom || ''}`.trim(),
            date_debut: reservation.date_debut
          }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.refetchQueries({ queryKey: ['reservations', 'admin'] });
      toast.success('Réservation refusée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    },
  });

  // Mutation pour supprimer une réservation
  const deleteMutation = useMutation({
    mutationFn: reservationsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.refetchQueries({ queryKey: ['reservations', 'admin'] });
      toast.success('Réservation supprimée avec succès');
      setOpenDeleteDialog(false);
      setSelectedReservation(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = (reservation: Reservation): void => {
    setSelectedReservation(reservation);
    setOpenDeleteDialog(true);
  };

  const handleReject = (reservation: Reservation): void => {
    setSelectedReservation(reservation);
    setRejectionReason('');
    setProposeAlternative(false);
    setAlternativeRoomId('');
    setAlternativeDate(reservation.date || '');
    setAlternativeStartTime(reservation.heure_debut || '');
    setAlternativeEndTime(reservation.heure_fin || '');
    setAlternativeMotif('');
    setOpenRejectDialog(true);
  };

  const confirmReject = (): void => {
    if (!rejectionReason.trim()) {
      toast.error('Le motif du refus est obligatoire');
      return;
    }

    // Validation si alternative proposée
    if (proposeAlternative) {
      if (!alternativeRoomId || !alternativeDate || !alternativeStartTime || !alternativeEndTime) {
        toast.error('Tous les champs de l\'alternative sont obligatoires');
        return;
      }
    }

    if (selectedReservation) {
      const payload: any = {
        id: selectedReservation.id,
        rejection_reason: rejectionReason
      };

      // Ajouter l'alternative si proposée
      if (proposeAlternative && alternativeRoomId) {
        const dateDebut = `${alternativeDate} ${alternativeStartTime}`;
        const dateFin = `${alternativeDate} ${alternativeEndTime}`;
        
        payload.proposed_alternative = {
          proposed_room_id: Number(alternativeRoomId),
          proposed_date_debut: dateDebut,
          proposed_date_fin: dateFin,
          motif: alternativeMotif || undefined
        };
      }

      rejectMutation.mutate(payload);
      setOpenRejectDialog(false);
      setRejectionReason('');
      setProposeAlternative(false);
      setSelectedReservation(null);
    }
  };

  const confirmDelete = (): void => {
    if (selectedReservation) {
      deleteMutation.mutate(selectedReservation.id);
    }
  };

  const handleView = async (reservation: Reservation): Promise<void> => {
    // Récupérer la version enrichie de la réservation depuis l'API
    try {
      const all = await reservationsAPI.getAll();
      const list: Reservation[] = Array.isArray(all.data) ? all.data : [];
      const found = list.find((r) => r.id === reservation.id) as Reservation | undefined;
      const used = found ?? reservation;
      // Garantir que createdAt existe (fallbacks depuis autres clés éventuelles)
      try {
        const anyUsed: any = used;
        anyUsed.createdAt = anyUsed.createdAt ?? anyUsed.created_at ?? anyUsed.created ?? anyUsed.updatedAt ?? anyUsed.date_created ?? null;
      } catch (e) {
        // noop
      }
      console.log('🔍 OPEN RESERVATION DETAIL (fetched)', used);
      setSelectedReservation(used);
    } catch (e) {
      console.warn('⚠️ Impossible de fetch reservation par id, utilisation de l objet local', e);
      setSelectedReservation(reservation);
    }
    setOpenViewDialog(true);
  };

  const getStatusColor = (status: string): ChipColor => {
    switch (status) {
      case 'confirmee':
      case 'validee':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'refusee':
      case 'rejetee':
        return 'error';
      case 'annulee':
        return 'default';
      case 'terminee':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirmee':
        return 'Confirmée';
      case 'validee':
        return 'Validée';
      case 'en_attente':
        return 'En attente';
      case 'refusee':
      case 'rejetee':
        return 'Refusée';
      case 'annulee':
        return 'Annulée';
      case 'terminee':
        return 'Terminée';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getUserName = (userId: number): string => {
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.prenom} ${user.nom}` : `Utilisateur #${userId}`;
  };

  const getRoomName = (roomId: number): string => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.nom : `Salle #${roomId}`;
  };

  // Filtrer les réservations par onglet
  const getFilteredByTab = (): Reservation[] => {
    switch (tabValue) {
      case 1: // En attente
        return reservations.filter((r) => r.statut === 'en_attente');
      case 2: // Confirmées/Validées
        return reservations.filter((r) => r.statut === 'confirmee' || r.statut === 'validee');
      case 3: // Refusées/Annulées
        return reservations.filter((r) => r.statut === 'refusee' || r.statut === 'rejetee' || r.statut === 'annulee');
      default: // Toutes
        return reservations;
    }
  };

  // Appliquer les filtres supplémentaires
  const filteredReservations = getFilteredByTab()
    .filter((reservation) => {
      const resAny = reservation as any;
      if (statusFilter !== 'all' && reservation.statut !== statusFilter) return false;
      if (roomFilter !== 'all' && reservation.room_id !== parseInt(roomFilter)) return false;
      if (searchTerm) {
        const searchString = `${resAny.utilisateur?.prenom || ''} ${resAny.utilisateur?.nom || ''} ${resAny.utilisateur?.email || ''} ${resAny.salle?.nom || ''} ${reservation.motif || ''}`
          .toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      // Tri intelligent pour les réservations validées
      const isValidatedA = a.statut === 'validee' || a.statut === 'confirmee';
      const isValidatedB = b.statut === 'validee' || b.statut === 'confirmee';
      
      if (isValidatedA && isValidatedB) {
        // Les deux sont validées, trier par date
        const dateA = new Date(a.date || '');
        const dateB = new Date(b.date || '');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const isPastA = dateA < now;
        const isPastB = dateB < now;
        
        // Futures en haut (ordre croissant), passées en bas (ordre décroissant)
        if (isPastA && !isPastB) return 1;  // B future avant A passée
        if (!isPastA && isPastB) return -1; // A future avant B passée
        if (!isPastA && !isPastB) return dateA.getTime() - dateB.getTime(); // Futures: plus proche en premier
        return dateB.getTime() - dateA.getTime(); // Passées: plus récente en premier
      }
      
      // Sinon tri par date de création (plus récentes en premier)
      return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
    });

  // Pagination
  const paginatedReservations = filteredReservations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Stats pour les onglets
  const pendingCount = reservations.filter((r) => r.statut === 'en_attente').length;
  const confirmedCount = reservations.filter((r) => r.statut === 'confirmee' || r.statut === 'validee').length;
  const rejectedCount = reservations.filter((r) => r.statut === 'refusee' || r.statut === 'rejetee' || r.statut === 'annulee').length;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Erreur lors du chargement des réservations</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Gestion des Réservations
        </Typography>
        <Tooltip title={viewMode === 'table' ? 'Vue grille' : 'Vue tableau'}>
          <IconButton onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
            {viewMode === 'table' ? <GridIcon /> : <ListIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label={`Toutes (${reservations.length})`} />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                En attente
                {pendingCount > 0 && (
                  <Chip label={pendingCount} color="warning" size="small" />
                )}
              </Box>
            }
          />
          <Tab label={`Confirmées (${confirmedCount})`} />
          <Tab label={`Refusées/Annulées (${rejectedCount})`} />
        </Tabs>
      </Paper>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="en_attente">En attente</MenuItem>
              <MenuItem value="confirmee">Confirmée</MenuItem>
              <MenuItem value="rejetee">Refusée</MenuItem>
              <MenuItem value="annulee">Annulée</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Salle</InputLabel>
            <Select
              value={roomFilter}
              label="Salle"
              onChange={(e: SelectChangeEvent) => setRoomFilter(e.target.value)}
            >
              <MenuItem value="all">Toutes les salles</MenuItem>
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id.toString()}>
                  {room.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Vue Tableau ou Grille selon viewMode */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Utilisateur</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salle</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Heures</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Objet</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Aucune réservation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReservations.map((reservation) => {
                  const resAny = reservation as any;
                  return (
                    <TableRow 
                      key={reservation.id} 
                      hover
                      sx={{
                        ...(reservation.statut === 'rejetee' || reservation.statut === 'refusee' ? {
                          bgcolor: 'rgba(211, 47, 47, 0.05)'
                        } : {}),
                        ...(reservation.statut === 'annulee' ? {
                          bgcolor: 'rgba(253, 216, 53, 0.12)'
                        } : {})
                      }}
                    >
                      <TableCell>{reservation.id}</TableCell>
                      <TableCell>
                        {resAny.utilisateur 
                          ? `${resAny.utilisateur.prenom} ${resAny.utilisateur.nom}`
                          : getUserName(reservation.user_id)}
                      </TableCell>
                      <TableCell>
                        {resAny.salle?.nom || getRoomName(reservation.room_id)}
                      </TableCell>
                      <TableCell>{reservation.date || 'N/A'}</TableCell>
                      <TableCell>{reservation.heure_debut && reservation.heure_fin ? `${reservation.heure_debut} - ${reservation.heure_fin}` : 'N/A'}</TableCell>
                      <TableCell>
                        <Tooltip title={reservation.motif || 'Pas de motif'}>
                          <Typography noWrap sx={{ maxWidth: 150 }}>
                            {reservation.motif || '-'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(reservation.statut)}
                          color={getStatusColor(reservation.statut)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleView(reservation)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {reservation.statut === 'en_attente' && (
                            <>
                              <Tooltip title="Valider">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => validateMutation.mutate(reservation.id)}
                                  disabled={validateMutation.isPending}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Refuser">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(reservation)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(reservation)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={3}>
          {paginatedReservations.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Aucune réservation trouvée</Typography>
              </Paper>
            </Grid>
          ) : (
            paginatedReservations.map((reservation) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={reservation.id}>
                <ReservationCard
                  reservation={reservation}
                  onView={handleView}
                  onValidate={reservation.statut === 'en_attente' ? () => validateMutation.mutate(reservation.id) : undefined}
                  onReject={reservation.statut === 'en_attente' ? () => handleReject(reservation) : undefined}
                  showActions={true}
                  isAdmin={true}
                />
                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(reservation)}
                  >
                    Supprimer
                  </Button>
                </Box>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredReservations.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={viewMode === 'table' ? [5, 10, 25, 50] : [6, 12, 24, 50]}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />

      {/* Dialog Voir Détails */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de la réservation #{selectedReservation?.id}</DialogTitle>
        <DialogContent>
          {selectedReservation && (() => {
            const resAny = selectedReservation as any;
            return (
              <Box sx={{ pt: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Utilisateur</Typography>
                  <Typography variant="body1">
                    {resAny.utilisateur 
                      ? `${resAny.utilisateur.prenom} ${resAny.utilisateur.nom}`
                      : getUserName(selectedReservation.user_id)}
                  </Typography>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Salle</Typography>
                  <Typography variant="body1">
                    {resAny.salle?.nom || getRoomName(selectedReservation.room_id)}
                  </Typography>
                </Paper>

                {(() => {
                  const deptId = resAny.department_id ?? resAny.departmentId ?? resAny.utilisateur?.department_id ?? resAny.utilisateur?.departmentId ?? null;
                  const deptName = resAny.department?.name || resAny.departement || resAny.utilisateur?.department?.name || resAny.utilisateur?.departement ||
                    (departments && departments.length && deptId ? (departments.find((d: any) => d.id === deptId)?.name) : null);
                  return (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Département</Typography>
                      <Typography variant="body1">{deptName || 'Non renseigné'}</Typography>
                    </Paper>
                  );
                })()}

                <Box display="flex" gap={2} mb={2}>
                  <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">
                      {selectedReservation.date || 'N/A'}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Horaires</Typography>
                    <Typography variant="body1">
                      {selectedReservation.heure_debut && selectedReservation.heure_fin ? `${selectedReservation.heure_debut} - ${selectedReservation.heure_fin}` : 'N/A'}
                    </Typography>
                  </Paper>
                </Box>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Motif</Typography>
                  <Typography variant="body1">
                    {selectedReservation.motif || 'Non spécifié'}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                  <Chip
                    label={getStatusLabel(selectedReservation.statut)}
                    color={getStatusColor(selectedReservation.statut)}
                    sx={{ mt: 0.5 }}
                  />
                </Paper>
                {selectedReservation.statut === 'annulee' && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'rgba(255, 235, 59, 0.12)' }}>
                    <Typography variant="body2" color="text.secondary">Cette réservation a été annulée</Typography>
                  </Paper>
                )}

                {(selectedReservation.statut === 'refusee' || selectedReservation.statut === 'rejetee') && selectedReservation.rejection_reason && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
                    <Typography variant="subtitle2" color="error">Motif du refus</Typography>
                    <Typography variant="body1" color="text.primary">
                      {selectedReservation.rejection_reason}
                    </Typography>
                  </Paper>
                )}

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Créée le</Typography>
                  <Typography variant="body1">
                    {(() => {
                      const r = resAny as any;
                      const candidates = [
                        r.createdAt,
                        r.created_at,
                        r.created,
                        r.date_created,
                        r.createdOn,
                        r.created_on,
                        r.timestamp,
                        r.dateCreation,
                        r.date_created_at
                      ];
                      const createdRaw = candidates.find((c) => c !== undefined && c !== null);
                      if (createdRaw) return formatDateTime(createdRaw);
                      // Fallback: utiliser la date + heure de la réservation si pas de createdAt
                      const datePart = r.date || r.date_debut || selectedReservation.date;
                      const timePart = r.heure_debut || selectedReservation.heure_debut || '';
                      if (datePart) return `${datePart}${timePart ? ' ' + timePart : ''}`;
                      return 'N/A';
                    })()}
                  </Typography>
                </Paper>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          {selectedReservation?.statut === 'en_attente' && (
            <>
              <Button
                color="success"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={() => {
                  validateMutation.mutate(selectedReservation.id);
                  setOpenViewDialog(false);
                }}
              >
                Valider
              </Button>
              <Button
                color="error"
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={() => {
                  setOpenViewDialog(false);
                  handleReject(selectedReservation);
                }}
              >
                Refuser
              </Button>
            </>
          )}
          <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmation Refus avec motif */}
      <Dialog 
        open={openRejectDialog} 
        onClose={() => {
          setOpenRejectDialog(false);
          setRejectionReason('');
          setProposeAlternative(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Refuser la réservation</DialogTitle>
        <DialogContent>
          {selectedReservation && (() => {
            const resAny = selectedReservation as any;
            return (
              <>
                <Typography sx={{ mb: 2 }}>
                  Réservation #{selectedReservation.id} - {resAny.utilisateur?.prenom} {resAny.utilisateur?.nom}
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  <strong>Salle:</strong> {resAny.salle?.nom}
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  <strong>Date:</strong> {selectedReservation.date}
                </Typography>
              </>
            );
          })()}
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

          {/* Section Proposition Alternative */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <FormControl fullWidth>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <input
                  type="checkbox"
                  checked={proposeAlternative}
                  onChange={(e) => setProposeAlternative(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Proposer une salle alternative
                </Typography>
              </Box>
            </FormControl>

            {proposeAlternative && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Salle alternative</InputLabel>
                      <Select
                        value={alternativeRoomId}
                        onChange={(e: SelectChangeEvent<number | ''>) => setAlternativeRoomId(e.target.value as number)}
                        label="Salle alternative"
                        disabled={roomsLoading || (!!alternativeDate && !!alternativeStartTime && !!alternativeEndTime && availableRoomsLoading)}
                      >
                        <MenuItem value="">
                          {availableRoomsLoading ? '-- Vérification de la disponibilité... --' : 
                           roomsLoading ? '-- Chargement des salles... --' : 
                           '-- Sélectionner une salle --'}
                        </MenuItem>
                        {!roomsLoading && 
                         (alternativeDate && alternativeStartTime && alternativeEndTime ? availableRooms : roomsData || []).length > 0 ? (
                          (alternativeDate && alternativeStartTime && alternativeEndTime ? availableRooms : roomsData || [])
                            .filter(r => r.id !== selectedReservation?.room_id)
                            .map((room) => (
                              <MenuItem key={room.id} value={room.id}>
                                {room.nom} (Capacité: {room.capacite})
                                {!room.disponible && ' [Inactive]'}
                              </MenuItem>
                            ))
                        ) : (
                          !roomsLoading && !availableRoomsLoading && (
                            <MenuItem disabled value="">
                              {alternativeDate && alternativeStartTime && alternativeEndTime ? 
                                'Aucune salle disponible pour ce créneau' : 
                                'Aucune salle trouvée'}
                            </MenuItem>
                          )
                        )}
                      </Select>
                      {alternativeDate && alternativeStartTime && alternativeEndTime && !availableRoomsLoading && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                          {availableRooms.length} salle(s) disponible(s) pour ce créneau
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="date"
                      label="Date alternative"
                      value={alternativeDate}
                      onChange={(e) => setAlternativeDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="time"
                      label="Heure début"
                      value={alternativeStartTime}
                      onChange={(e) => setAlternativeStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="time"
                      label="Heure fin"
                      value={alternativeEndTime}
                      onChange={(e) => setAlternativeEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Motif de l'alternative (optionnel)"
                      value={alternativeMotif}
                      onChange={(e) => setAlternativeMotif(e.target.value)}
                      placeholder="Ex: Salle avec plus d'espace, meilleur équipement..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenRejectDialog(false);
            setRejectionReason('');
            setProposeAlternative(false);
          }}>
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmReject}
            disabled={rejectMutation.isPending || !rejectionReason.trim()}
          >
            {rejectMutation.isPending ? 'Refus en cours...' : proposeAlternative ? 'Refuser et Proposer' : 'Confirmer le refus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmation Suppression */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la réservation #{selectedReservation?.id} ?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationsManagement;
