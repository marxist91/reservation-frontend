import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRooms } from '../../hooks/useRooms';
import { useReservations } from '../../hooks/useReservations';
import { RoomCard } from '../../components/rooms';
import { ReservationForm } from '../../components/reservations';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Grid,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
} from '@mui/icons-material';
import TablePagination from '@mui/material/TablePagination';

function SearchRooms() {
  const navigate = useNavigate();
  const { rooms, isLoading, error } = useRooms();
  const { createReservation } = useReservations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtrer les salles
  const filteredRooms = rooms?.filter((room) => {
    const matchesSearch = room.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.batiment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCapacity = !capacityFilter || room.capacite >= parseInt(capacityFilter);
    const matchesStatus = statusFilter === 'all' || room.statut === statusFilter;
    return matchesSearch && matchesCapacity && matchesStatus;
  }) || [];

  // Pagination
  const paginatedRooms = filteredRooms.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const availableCount = rooms?.filter(r => r.statut === 'disponible').length || 0;

  const handleViewDetails = (room) => {
    navigate(`/rooms/${room.id}`);
  };

  const handleOpenReservation = (room) => {
    setSelectedRoom(room);
    setDialogOpen(true);
  };

  const handleCreateReservation = (formData) => {
    createReservation.mutate({
      room_id: formData.room_id,
      date: formData.date,
      heure_debut: formData.heure_debut,
      heure_fin: formData.heure_fin,
      motif: formData.motif,
      nombre_participants: formData.nombre_participants,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedRoom(null);
      }
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
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Nos Salles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {availableCount} salle{availableCount > 1 ? 's' : ''} disponible{availableCount > 1 ? 's' : ''} sur {rooms?.length || 0}
        </Typography>
      </Box>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Rechercher une salle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250, flexGrow: 1, maxWidth: 400 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Capacité</InputLabel>
            <Select
              value={capacityFilter}
              label="Capacité"
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <MenuItem value="">Toutes</MenuItem>
              <MenuItem value="5">5+ pers.</MenuItem>
              <MenuItem value="10">10+ pers.</MenuItem>
              <MenuItem value="20">20+ pers.</MenuItem>
              <MenuItem value="30">30+ pers.</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" gap={1}>
            <Chip
              label="Toutes"
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              color={statusFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('all')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Disponibles"
              variant={statusFilter === 'disponible' ? 'filled' : 'outlined'}
              color={statusFilter === 'disponible' ? 'success' : 'default'}
              onClick={() => setStatusFilter('disponible')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Résultats */}
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Erreur lors du chargement des salles
        </Alert>
      ) : filteredRooms.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Aucune salle trouvée avec ces critères.
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedRooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
              <RoomCard
                room={room}
                onView={handleViewDetails}
                onReserve={handleOpenReservation}
                compact
              />
            </Grid>
          ))}
        </Grid>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredRooms.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[6, 12, 24, 50]}
          labelRowsPerPage="Salles par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          sx={{ mt: 2 }}
        />
        </>
      )}

      {/* Dialog de réservation */}
      <ReservationForm
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onSubmit={handleCreateReservation}
        isLoading={createReservation.isPending}
      />
    </Box>
  );
}

export default SearchRooms;
