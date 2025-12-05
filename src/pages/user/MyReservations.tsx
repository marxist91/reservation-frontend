import { useState } from 'react';
import { useReservations } from '@/hooks';
import { ReservationCard } from '@/components/reservations';
import type { Reservation } from '@/types';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MyReservations: React.FC = () => {
  const { myReservations: reservations, isLoading, cancelReservation } = useReservations();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const myReservations = reservations || [];

  const filteredReservations = (): Reservation[] => {
    switch (tabValue) {
      case 1: return myReservations.filter(r => r.statut === 'en_attente');
      case 2: return myReservations.filter(r => ['confirmee', 'validee'].includes(r.statut || ''));
      case 3: return myReservations.filter(r => ['annulee', 'refusee', 'rejetee'].includes(r.statut || ''));
      default: return myReservations;
    }
  };

  const currentReservations = filteredReservations();
  const paginatedReservations = currentReservations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (statut: string | undefined): 'success' | 'warning' | 'error' | 'default' => {
    switch (statut) {
      case 'confirmee':
      case 'validee':
        return 'success';
      case 'en_attente': return 'warning';
      case 'annulee':
      case 'refusee':
      case 'rejetee':
        return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (statut: string | undefined): string => {
    switch (statut) {
      case 'confirmee': return 'Confirmée';
      case 'validee': return 'Validée';
      case 'en_attente': return 'En attente';
      case 'annulee': return 'Annulée';
      case 'refusee':
      case 'rejetee':
        return 'Refusée';
      default: return statut || '';
    }
  };

  const handleCancelReservation = (): void => {
    if (selectedReservation) {
      cancelReservation.mutate(selectedReservation.id);
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    }
  };

  const handleView = (reservation: Reservation): void => {
    setSelectedReservation(reservation);
    setDialogOpen(true);
  };

  const handleCancel = (reservation: Reservation): void => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Mes Réservations
        </Typography>
        <Box>
          <Tooltip title="Vue grille">
            <IconButton 
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vue liste">
            <IconButton 
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab label={`Toutes (${myReservations.length})`} />
          <Tab label={`En attente (${myReservations.filter(r => r.statut === 'en_attente').length})`} />
          <Tab label={`Confirmées (${myReservations.filter(r => ['confirmee', 'validee'].includes(r.statut || '')).length})`} />
          <Tab label={`Annulées/Refusées`} />
        </Tabs>
      </Paper>

      {filteredReservations().length === 0 ? (
        <Alert severity="info">
          Aucune réservation {tabValue === 1 ? 'en attente' : tabValue === 2 ? 'confirmée' : ''} pour le moment.
        </Alert>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {paginatedReservations.map((reservation) => (
            /* @ts-expect-error MUI Grid item prop */
            <Grid item xs={12} sm={6} md={4} key={reservation.id}>
              <ReservationCard
                reservation={reservation}
                onView={handleView}
                onCancel={reservation.statut === 'en_attente' ? handleCancel : undefined}
                showActions={true}
                isAdmin={false}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salle</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Horaires</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motif</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReservations.map((reservation) => (
                <TableRow 
                  key={reservation.id} 
                  hover
                  sx={{
                    ...(reservation.statut === 'rejetee' || reservation.statut === 'refusee' ? {
                      bgcolor: 'rgba(211, 47, 47, 0.05)'
                    } : {})
                  }}
                >
                  <TableCell>{reservation.salle?.nom || reservation.Room?.nom || 'N/A'}</TableCell>
                  <TableCell>{reservation.date ? formatDate(reservation.date) : 'N/A'}</TableCell>
                  <TableCell>
                    {reservation.heure_debut || ''} - {reservation.heure_fin || ''}
                    {reservation.group_id && (
                      <Chip
                        label="Multiple"
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={reservation.motif || 'Pas de motif'}>
                      <Typography noWrap sx={{ maxWidth: 200 }}>
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
                    <Box display="flex" gap={1} justifyContent="center">
                      <Button 
                        size="small" 
                        onClick={() => handleView(reservation)}
                      >
                        Détails
                      </Button>
                      {reservation.statut === 'en_attente' && (
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => handleCancel(reservation)}
                        >
                          Annuler
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {viewMode === 'list' && currentReservations.length > 0 && (
        <TablePagination
          component="div"
          count={currentReservations.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[6, 12, 24, 48]}
          labelRowsPerPage="Réservations par page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      )}

      {/* Dialog détails */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de la Réservation</DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Box sx={{ pt: 1 }}>
              {selectedReservation.group_id && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Cette réservation fait partie d'une réservation multiple (groupe: {selectedReservation.group_id.substring(0, 8)}...)
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Salle:</strong> {selectedReservation.salle?.nom || selectedReservation.Room?.nom || 'Non définie'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Date:</strong> {selectedReservation.date ? formatDate(selectedReservation.date) : 'Non définie'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Horaires:</strong> {selectedReservation.heure_debut || ''} - {selectedReservation.heure_fin || ''}
              </Typography>
              <Typography variant="body2" component="div" gutterBottom>
                <strong>Statut:</strong>{' '}
                <Chip
                  label={getStatusLabel(selectedReservation.statut)}
                  color={getStatusColor(selectedReservation.statut)}
                  size="small"
                />
              </Typography>
              
              {selectedReservation.motif && (
                <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                  <strong>Motif de la réservation:</strong> {selectedReservation.motif}
                </Typography>
              )}
              
              {(selectedReservation.statut === 'rejetee' || selectedReservation.statut === 'refusee') && selectedReservation.rejection_reason && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Motif du refus:
                  </Typography>
                  <Typography variant="body2">
                    {selectedReservation.rejection_reason}
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" gutterBottom>
                <strong>Créée le:</strong> {selectedReservation.created_at ? formatDate(selectedReservation.created_at) : 'N/A'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmation annulation */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Confirmer l'annulation</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir annuler cette réservation ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Non</Button>
          <Button
            onClick={handleCancelReservation}
            color="error"
            variant="contained"
            disabled={cancelReservation.isPending}
          >
            {cancelReservation.isPending ? 'Annulation...' : 'Oui, annuler'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyReservations;
