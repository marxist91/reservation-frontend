import { useState, useEffect } from 'react';
import { useReservations } from '../../hooks/useReservations';
import ReservationCard from '@/components/reservations/ReservationCard';
import AlternativeProposals from '@/components/alternatives/AlternativeProposals';
import type { Reservation } from '@/types';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
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
  alpha,
} from '@mui/material';
import {
  ViewList as ListIcon,
  ViewModule as GridIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatDateTime } from '@/utils/formatters';
import { useQuery } from '@tanstack/react-query';
import { departmentsAPI } from '@/api/departments';
import { usersAPI } from '@/api/users';

const MyReservations: React.FC = () => {
  const { myReservations: reservations, isLoading, cancelReservation } = useReservations();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
    const [fetchedUser, setFetchedUser] = useState<any | null>(null);

    const { data: departments = [] } = useQuery({
      queryKey: ['departments'],
      queryFn: departmentsAPI.getAll,
      staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
      let mounted = true;
      const loadUser = async () => {
        if (dialogOpen && selectedReservation?.utilisateur?.id) {
          try {
            const u = await usersAPI.getById(selectedReservation.utilisateur.id);
            if (mounted) setFetchedUser(u ?? null);
          } catch (e) {
            if (mounted) setFetchedUser(null);
          }
        } else {
          setFetchedUser(null);
        }
      };
      loadUser();
      return () => { mounted = false; };
    }, [dialogOpen, selectedReservation]);
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
    let filtered: Reservation[];
    switch (tabValue) {
      case 1: filtered = myReservations.filter(r => r.statut === 'en_attente'); break;
      case 2: filtered = myReservations.filter(r => ['confirmee', 'validee'].includes(r.statut || '')); break;
      case 3: filtered = myReservations.filter(r => ['annulee', 'refusee', 'rejetee'].includes(r.statut || '')); break;
      default: filtered = myReservations;
    }
    
    // Tri intelligent pour les réservations validées/confirmées
    return filtered.sort((a, b) => {
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
      
      // Pour les autres statuts, tri par date (plus récentes en premier)
      return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
    });
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
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Skeleton variant="rounded" width={280} height={40} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[0,1,2,3,4,5].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Section Propositions Alternatives */}
      <AlternativeProposals />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Mes Réservations
        </Typography>
        <Box>
          <Tooltip title="Vue grille">
            <IconButton
              onClick={() => setViewMode('grid')}
              sx={{
                bgcolor: viewMode === 'grid' ? alpha('#1565c0', 0.1) : 'transparent',
                color: viewMode === 'grid' ? '#1565c0' : 'text.secondary',
                borderRadius: 2,
                mr: 0.5,
              }}
            >
              <GridIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vue liste">
            <IconButton
              onClick={() => setViewMode('list')}
              sx={{
                bgcolor: viewMode === 'list' ? alpha('#1565c0', 0.1) : 'transparent',
                color: viewMode === 'list' ? '#1565c0' : 'text.secondary',
                borderRadius: 2,
              }}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48,
            },
            '& .Mui-selected': { color: '#1565c0' },
            '& .MuiTabs-indicator': { bgcolor: '#1565c0', height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab label={`Toutes (${myReservations.length})`} />
          <Tab label={`En attente (${myReservations.filter(r => r.statut === 'en_attente').length})`} />
          <Tab label={`Confirmées (${myReservations.filter(r => ['confirmee', 'validee'].includes(r.statut || '')).length})`} />
          <Tab label={`Annulées/Refusées`} />
        </Tabs>
      </Paper>

      {filteredReservations().length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <EventIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography color="text.secondary" variant="body1">
            Aucune réservation {tabValue === 1 ? 'en attente' : tabValue === 2 ? 'confirmée' : ''} pour le moment.
          </Typography>
        </Paper>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {paginatedReservations.map((reservation) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={reservation.id}>
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
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#0a2463', 0.04) }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salle</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horaires</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="center">Actions</TableCell>
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
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                      >
                        Détails
                      </Button>
                      {reservation.statut === 'en_attente' && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleCancel(reservation)}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
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
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Détails de la Réservation</DialogTitle>
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

              <Typography variant="body2" gutterBottom>
                <strong>Département:</strong> {(() => {
                  const resAny: any = selectedReservation as any;
                  const userAny = resAny.utilisateur as any;
                  const deptId = resAny.department_id ?? resAny.departmentId ?? userAny?.department_id ?? userAny?.departmentId ?? null;
                  const deptNameFromList = deptId && Array.isArray(departments) ? (departments.find((d: any) => d.id === deptId)?.name) : null;
                  const deptName = resAny.department?.name || resAny.departement || userAny?.department?.name || userAny?.departement || fetchedUser?.department?.name || fetchedUser?.departement || deptNameFromList || null;
                  return deptName || 'Non renseigné';
                })()}
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
                <strong>Créée le:</strong> {(() => {
                  const r: any = selectedReservation as any;
                  const candidates = [
                    r.createdAt,
                    r.created_at,
                    r.created,
                    r.date_created,
                    r.updatedAt,
                    r.dateCreation,
                  ];
                  const found = candidates.find(c => c !== undefined && c !== null);
                  if (found) return formatDateTime(found);
                  // fallback to reservation date + heure_debut
                  const datePart = r.date || r.date_debut || null;
                  const timePart = r.heure_debut || null;
                  if (datePart) return `${format(new Date(datePart), 'dd MMMM yyyy', { locale: fr })}${timePart ? ' à ' + timePart : ''}`;
                  return 'N/A';
                })()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmation annulation */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmer l'annulation</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir annuler cette réservation ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Non
          </Button>
          <Button
            onClick={handleCancelReservation}
            color="error"
            variant="contained"
            disabled={cancelReservation.isPending}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {cancelReservation.isPending ? 'Annulation...' : 'Oui, annuler'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyReservations;
