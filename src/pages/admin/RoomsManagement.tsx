import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RoomCard, RoomForm } from '@/components/rooms';
import toast from 'react-hot-toast';
import { roomsAPI } from '@/api/rooms';
import type { Room } from '@/types';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  Grid,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MeetingRoom as RoomIcon,
  People as PeopleIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';

interface RoomFormData {
  nom: string;
  capacite: number;
  equipements: string[];
  description?: string;
  statut: string;
  batiment?: string | null;
  etage?: string | null;
  superficie?: number | null;
  responsable_id?: number | null;
}

interface UpdateRoomParams {
  id: number;
  data: RoomFormData;
}

type ViewMode = 'table' | 'grid';

// Helper pour parser les équipements (peuvent être JSON string ou array)
const parseEquipements = (equipements: string | string[] | null | undefined): string[] => {
  if (!equipements) return [];
  if (Array.isArray(equipements)) return equipements;
  try {
    const parsed = JSON.parse(equipements);
    return Array.isArray(parsed) ? parsed : [equipements];
  } catch {
    return equipements.split(',').map(e => e.trim());
  }
};

const RoomsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Récupérer toutes les salles
  const { data: rooms = [], isLoading, error } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Mutation pour créer une salle
  const createMutation = useMutation({
    mutationFn: roomsAPI.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      await queryClient.refetchQueries({ queryKey: ['rooms'] });
      toast.success('Salle créée avec succès');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Mutation pour mettre à jour une salle
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: UpdateRoomParams) => roomsAPI.update(id, data),
    onSuccess: async (response: any) => {
      handleCloseDialog();
      
      if (response.updated) {
        const currentRooms = queryClient.getQueryData<Room[]>(['rooms']) || [];
        const updatedRooms = [...currentRooms].map(room => 
          room.id === response.updated.id ? { ...response.updated } : { ...room }
        );
        queryClient.setQueryData(['rooms'], updatedRooms);
      }
      
      toast.success('Salle mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Mutation pour supprimer une salle
  const deleteMutation = useMutation({
    mutationFn: roomsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Salle supprimée avec succès');
      setOpenDeleteDialog(false);
      setSelectedRoom(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const handleOpenDialog = (room: Room | null = null): void => {
    setSelectedRoom(room);
    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
    setSelectedRoom(null);
  };

  const handleSubmit = (formData: any): void => {
    console.log('📝 Données reçues du formulaire:', formData);
    
    const submitData: any = {
      nom: formData.nom,
      capacite: parseInt(formData.capacite, 10),
      equipements: formData.equipements,
      description: formData.description,
      statut: formData.statut,
      disponible: formData.statut === 'disponible',
      batiment: formData.batiment || null,
      etage: formData.etage || null,
      superficie: formData.superficie ? parseFloat(formData.superficie) : null,
      responsable_id: formData.responsable_id || null,
    };

    if (selectedRoom) {
      updateMutation.mutate({ id: selectedRoom.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (room: Room): void => {
    setSelectedRoom(room);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = (): void => {
    if (selectedRoom) {
      deleteMutation.mutate(selectedRoom.id);
    }
  };

  // Filtrer les salles
  const filteredRooms = rooms.filter((room) =>
    `${room.nom} ${room.equipements || ''} ${room.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Pagination
  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRooms = filteredRooms.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Alert severity="error">Erreur lors du chargement des salles</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestion des Salles</Typography>
        <Box display="flex" gap={2}>
          <Tooltip title={viewMode === 'table' ? 'Vue grille' : 'Vue tableau'}>
            <IconButton onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
              {viewMode === 'table' ? <GridIcon /> : <ListIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nouvelle Salle
          </Button>
        </Box>
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une salle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Vue Tableau */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Capacité</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Équipements</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucune salle trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>{room.id}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <RoomIcon color="primary" />
                        {room.nom}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PeopleIcon fontSize="small" />
                        {room.capacite} personnes
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {parseEquipements(room.equipements).map((eq, index) => (
                          <Chip key={index} label={eq} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={room.statut === 'disponible' ? 'Disponible' : 'Indisponible'}
                        color={room.statut === 'disponible' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Modifier">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(room)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(room)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[6, 12, 24, 50]}
            component="div"
            count={filteredRooms.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </TableContainer>
      ) : (
        /* Vue Grille avec RoomCard */
        <Grid container spacing={2}>
          {filteredRooms.length === 0 ? (
            <>
              {/* @ts-expect-error - MUI Grid item prop compatibility */}
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">Aucune salle trouvée</Typography>
                </Paper>
              </Grid>
            </>
          ) : (
            paginatedRooms.map((room) => (
              <>
                {/* @ts-expect-error - MUI Grid item prop compatibility */}
                <Grid item xs={12} sm={6} key={room.id}>
                  <Box sx={{ position: 'relative' }}>
                    <RoomCard
                      room={room}
                      onView={() => handleOpenDialog(room)}
                    />
                    {/* Boutons d'action overlay */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(room)}
                        fullWidth
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(room)}
                        fullWidth
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </>
            ))
          )}
        </Grid>
      )}

      {/* Pagination pour le mode grille */}
      {viewMode === 'grid' && (
        <TablePagination
          component="div"
          count={filteredRooms.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[6, 12, 24, 50]}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      )}

      {/* Dialog Créer/Modifier avec RoomForm */}
      <RoomForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        room={selectedRoom}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Dialog Confirmation Suppression */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la salle <strong>{selectedRoom?.nom}</strong> ?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également toutes les réservations associées.
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

export default RoomsManagement;
