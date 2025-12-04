import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReservationCard } from '../../components/reservations';
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
import TablePagination from '@mui/material/TablePagination';
import { reservationsAPI } from '../../api/reservations';
import { roomsAPI } from '../../api/rooms';
import { usersAPI } from '../../api/users';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNotificationStore } from '../../store/notificationStore';
import { useHistoryStore } from '../../store/historyStore';
import { useAuth } from '../../hooks/useAuth';

function ReservationsManagement() {
  const queryClient = useQueryClient();
  const { fullName } = useAuth();
  // const addNotification = useNotificationStore(state => state.addNotification); // Deprecated
  const addToHistory = useHistoryStore(state => state.addHistoryEntry);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Récupérer toutes les réservations
  const { data: reservationsData, isLoading, error } = useQuery({
    queryKey: ['reservations', 'admin'],
    queryFn: () => reservationsAPI.getAll(),
  });

  if (error) {
    console.error('❌ Error loading reservations:', error);
  }
  
  if (reservationsData) {
    console.log('📦 Reservations Data:', reservationsData);
  }

  // Récupérer les salles pour le filtre
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
  });

  // Récupérer les utilisateurs
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    select: (data) => Array.isArray(data) ? data : (data.utilisateurs || []),
  });

  const reservations = Array.isArray(reservationsData?.data) ? reservationsData.data : (Array.isArray(reservationsData) ? reservationsData : []);
  const rooms = Array.isArray(roomsData) ? roomsData : [];

  // Mutation pour valider une réservation
  const validateMutation = useMutation({
    mutationFn: reservationsAPI.validate,
    onSuccess: (data, reservationId) => {
      // Trouver la réservation dans le cache
      const reservationsData = queryClient.getQueryData(['reservations', 'admin']);
      const reservations = Array.isArray(reservationsData?.data) ? reservationsData.data : [];
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (reservation) {
        // Notification gérée par le backend
        
        // Ajouter à l'historique (utilisateur concerné)
        addToHistory({
          userId: reservation.user_id,
          userName: `${reservation.utilisateur?.prenom || ''} ${reservation.utilisateur?.nom || 'Utilisateur'}`.trim(),
          action: 'reservation_validated',
          description: `Réservation validée par ${fullName}`,
          details: {
            reservationId: reservation.id,
            salle: reservation.salle?.nom || 'N/A',
            date_debut: reservation.date_debut,
            validateur: fullName
          }
        });
        
        // Ajouter à l'historique (admin qui valide)
        addToHistory({
          action: 'reservation_validated',
          description: `Réservation #${reservation.id} validée`,
          details: {
            reservationId: reservation.id,
            salle: reservation.salle?.nom || 'N/A',
            utilisateur: `${reservation.utilisateur?.prenom || ''} ${reservation.utilisateur?.nom || ''}`.trim(),
            date_debut: reservation.date_debut
          }
        });
      }
      
      // Forcer le rafraîchissement immédiat du cache
      queryClient.invalidateQueries(['reservations']);
      queryClient.refetchQueries(['reservations', 'admin']);
      toast.success('Réservation validée avec succès');
    },
    onError: (error) => {
      console.error("❌ Erreur validateMutation:", error);
      console.log("❌ Erreur response:", error.response);
      console.log("❌ Erreur message:", error.message);
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    },
  });

  // Mutation pour refuser une réservation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejection_reason }) => reservationsAPI.reject(id, rejection_reason),
    onSuccess: (data, { id: reservationId }) => {
      // Trouver la réservation dans le cache
      const reservationsData = queryClient.getQueryData(['reservations', 'admin']);
      const reservations = Array.isArray(reservationsData?.data) ? reservationsData.data : [];
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (reservation) {
        // Notification gérée par le backend
        
        // Ajouter à l'historique (utilisateur concerné)
        addToHistory({
          userId: reservation.user_id,
          userName: `${reservation.utilisateur?.prenom || ''} ${reservation.utilisateur?.nom || 'Utilisateur'}`.trim(),
          action: 'reservation_rejected',
          description: `Réservation refusée par ${fullName}`,
          details: {
            reservationId: reservation.id,
            salle: reservation.salle?.nom || 'N/A',
            date_debut: reservation.date_debut,
            validateur: fullName
          }
        });
        
        // Ajouter à l'historique (admin qui refuse)
        addToHistory({
          action: 'reservation_rejected',
          description: `Réservation #${reservation.id} refusée`,
          details: {
            reservationId: reservation.id,
            salle: reservation.salle?.nom || 'N/A',
            utilisateur: `${reservation.utilisateur?.prenom || ''} ${reservation.utilisateur?.nom || ''}`.trim(),
            date_debut: reservation.date_debut
          }
        });
      }
      
      // Forcer le rafraîchissement immédiat du cache
      queryClient.invalidateQueries(['reservations']);
      queryClient.refetchQueries(['reservations', 'admin']);
      toast.success('Réservation refusée');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    },
  });

  // Mutation pour supprimer une réservation
  const deleteMutation = useMutation({
    mutationFn: reservationsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations']);
      queryClient.refetchQueries(['reservations', 'admin']);
      toast.success('Réservation supprimée avec succès');
      setOpenDeleteDialog(false);
      setSelectedReservation(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = (reservation) => {
    setSelectedReservation(reservation);
    setOpenDeleteDialog(true);
  };

  const handleReject = (reservation) => {
    setSelectedReservation(reservation);
    setRejectionReason('');
    setOpenRejectDialog(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Le motif du refus est obligatoire');
      return;
    }
    if (selectedReservation) {
      rejectMutation.mutate({
        id: selectedReservation.id,
        rejection_reason: rejectionReason
      });
      setOpenRejectDialog(false);
      setRejectionReason('');
      setSelectedReservation(null);
    }
  };

  const confirmDelete = () => {
    if (selectedReservation) {
      deleteMutation.mutate(selectedReservation.id);
    }
  };

  const handleView = (reservation) => {
    setSelectedReservation(reservation);
    setOpenViewDialog(true);
  };

  const getStatusColor = (status) => {
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

  const getStatusLabel = (status) => {
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

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.prenom} ${user.nom}` : `Utilisateur #${userId}`;
  };

  const getRoomName = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.nom : `Salle #${roomId}`;
  };

  // Filtrer les réservations par onglet
  const getFilteredByTab = () => {
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
      // Filtre par statut
      if (statusFilter !== 'all' && reservation.statut !== statusFilter) return false;
      // Filtre par salle
      if (roomFilter !== 'all' && reservation.room_id !== parseInt(roomFilter)) return false;
      // Filtre par recherche
      if (searchTerm) {
        const searchString = `${reservation.utilisateur?.prenom || ''} ${reservation.utilisateur?.nom || ''} ${reservation.utilisateur?.email || ''} ${reservation.salle?.nom || ''} ${reservation.motif || ''}`
          .toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
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
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <MenuItem value="all">Toutes les salles</MenuItem>
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
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
                paginatedReservations.map((reservation) => (
                  <TableRow 
                    key={reservation.id} 
                    hover
                    sx={{
                      ...(reservation.statut === 'rejetee' || reservation.statut === 'refusee' ? {
                        bgcolor: 'rgba(211, 47, 47, 0.05)' // Fond rouge très léger
                      } : {})
                    }}
                  >
                    <TableCell>{reservation.id}</TableCell>
                    <TableCell>
                      {reservation.utilisateur 
                        ? `${reservation.utilisateur.prenom} ${reservation.utilisateur.nom}`
                        : getUserName(reservation.user_id)}
                    </TableCell>
                    <TableCell>
                      {reservation.salle?.nom || getRoomName(reservation.room_id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Vue Grille avec ReservationCard */
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

      {/* Pagination pour le mode tableau */}
      {viewMode === 'table' && (
        <TablePagination
          component="div"
          count={filteredReservations.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      )}

      {/* Pagination pour le mode grille */}
      {viewMode === 'grid' && (
        <TablePagination
          component="div"
          count={filteredReservations.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[6, 12, 24, 50]}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      )}

      {/* Dialog Voir Détails */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de la réservation #{selectedReservation?.id}</DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Box sx={{ pt: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Utilisateur</Typography>
                <Typography variant="body1">
                  {selectedReservation.utilisateur 
                    ? `${selectedReservation.utilisateur.prenom} ${selectedReservation.utilisateur.nom}`
                    : getUserName(selectedReservation.user_id)}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Salle</Typography>
                <Typography variant="body1">
                  {selectedReservation.salle?.nom || getRoomName(selectedReservation.room_id)}
                </Typography>
              </Paper>

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
                  {formatDateTime(selectedReservation.createdAt)}
                </Typography>
              </Paper>
            </Box>
          )}
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
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refuser la réservation</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Réservation #{selectedReservation?.id} - {selectedReservation?.utilisateur?.prenom} {selectedReservation?.utilisateur?.nom}
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
            disabled={rejectMutation.isPending || !rejectionReason.trim()}
          >
            {rejectMutation.isPending ? 'Refus en cours...' : 'Confirmer le refus'}
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
}

export default ReservationsManagement;
