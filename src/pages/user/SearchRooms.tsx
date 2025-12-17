import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRooms } from '../../hooks/useRooms';
import { useReservations } from '../../hooks/useReservations';
import RoomCard from '@/components/rooms/RoomCard';
import apiClient from '@/api/client';
import { format } from 'date-fns';
import ReservationForm from '@/components/reservations/ReservationForm';
import type { Room } from '@/types';
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
  Paper,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';

const SearchRooms: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, isLoading, error } = useRooms();
  const { createReservation } = useReservations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState<string>(new Date().getHours().toString().padStart(2, '0') + ':00');
  const [duration, setDuration] = useState<number>(60); // Durée en minutes (défaut 1h)

  // Récupérer la disponibilité des salles via l'endpoint dédié
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery<any>({
    queryKey: ['rooms-availability', selectedDate, selectedHour, duration],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/rooms/availability', {
          params: { date: selectedDate, time: selectedHour, duration }
        });
        console.log('📅 Disponibilité des salles reçue:', response.data);
        return response.data;
      } catch (err) {
        console.error('Erreur récupération disponibilité salles', err);
        return { rooms: [], summary: { total: 0, available: 0, occupied: 0 } };
      }
    },
    enabled: !!selectedDate && !!selectedHour,
  });

  const occupiedMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    (availabilityData?.rooms || []).forEach((room: any) => {
      if (room.occupied || room.partiallyOccupied) {
        map[room.id] = true;
      }
    });
    console.log('🗺️ Occupation map générée:', map);
    return map;
  }, [availabilityData]);

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRooms = rooms?.filter((room) => {
    const matchesSearch = room.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.batiment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCapacity = !capacityFilter || room.capacite >= parseInt(capacityFilter);
    const matchesStatus = statusFilter === 'all' || room.statut === statusFilter;
    return matchesSearch && matchesCapacity && matchesStatus;
  }) || [];

  const paginatedRooms = filteredRooms.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const availableCount = rooms?.filter(r => r.statut === 'disponible').length || 0;

  const handleViewDetails = (room: Room): void => {
    navigate(`/rooms/${room.id}`);
  };

  const handleOpenReservation = (room: Room): void => {
    setSelectedRoom(room);
    setDialogOpen(true);
  };

  const handleCreateReservation = (formData: any): void => {
    createReservation.mutate(formData, {
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
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Nos Salles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {availableCount} salle{availableCount > 1 ? 's' : ''} disponible{availableCount > 1 ? 's' : ''} sur {rooms?.length || 0}
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        {/* Sélecteurs date / heure / durée */}
        <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="Heure de début"
            type="time"
            value={selectedHour}
            onChange={(e) => setSelectedHour(e.target.value)}
            inputProps={{ step: 900 }}
            size="small"
          />
          <TextField
            label="Durée"
            select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value={15}>15 min</MenuItem>
            <MenuItem value={30}>30 min</MenuItem>
            <MenuItem value={60}>1 heure</MenuItem>
            <MenuItem value={90}>1h30</MenuItem>
            <MenuItem value={120}>2 heures</MenuItem>
            <MenuItem value={180}>3 heures</MenuItem>
            <MenuItem value={240}>4 heures</MenuItem>
          </TextField>
          <Box sx={{ ml: 'auto', color: 'text.secondary', fontSize: '0.9rem' }}>
            {availabilityLoading ? 'Chargement...' : (
              availabilityData?.summary ? (
                `🟢 ${availabilityData.summary.available} disponible(s) | 🔴 ${availabilityData.summary.occupied} occupée(s) ${availabilityData.summary.partiallyOccupied > 0 ? `| 🟡 ${availabilityData.summary.partiallyOccupied} partiellement` : ''}`
              ) : ''
            )}
          </Box>
        </Box>

        {/* Filtres de recherche */}
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
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={room.id}>
                <RoomCard
                  room={room}
                  onView={handleViewDetails}
                  onReserve={handleOpenReservation}
                  compact
                  isOccupiedAt={occupiedMap[room.id] ? true : false}
                />
              </Grid>
            ))}
          </Grid>
        
          <TablePagination
            component="div"
            count={filteredRooms.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[6, 12, 24, 48]}
            labelRowsPerPage="Salles par page:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
            sx={{ mt: 3, borderTop: 1, borderColor: 'divider' }}
          />
        </>
      )}

      <ReservationForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        room={selectedRoom}
        rooms={rooms || []}
        onSubmit={handleCreateReservation}
        isLoading={createReservation.isPending}
      />
    </Box>
  );
};

export default SearchRooms;
