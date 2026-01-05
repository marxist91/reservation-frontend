import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as RoomIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import apiClient from '@/api/client';

interface Room {
  id: number;
  nom: string;
  etage?: string;
}

interface Department {
  id: number;
  name: string;
}

interface RecurringMeeting {
  id: number;
  name: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  room_id: number;
  room?: { id: number; nom: string; etage?: string };
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  auto_validate: boolean;
  color: string;
}

const DAYS = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

const COLORS = [
  '#1976d2', // Bleu
  '#388e3c', // Vert
  '#f57c00', // Orange
  '#d32f2f', // Rouge
  '#7b1fa2', // Violet
  '#0097a7', // Cyan
  '#5d4037', // Marron
];

const RecurringMeetingsManager: React.FC = () => {
  const [meetings, setMeetings] = useState<RecurringMeeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<RecurringMeeting | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '11:00',
    room_id: '',
    department_id: '',
    description: '',
    color: '#1976d2',
    auto_validate: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, roomsRes, departmentsRes] = await Promise.all([
        apiClient.get('/recurring-meetings'),
        apiClient.get('/rooms'),
        apiClient.get('/departments'),
      ]);
      setMeetings(Array.isArray(meetingsRes.data) ? meetingsRes.data : []);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.room_id) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post('/recurring-meetings', {
        ...formData,
        room_id: parseInt(formData.room_id as string),
        department_id: formData.department_id ? parseInt(formData.department_id as string) : null,
        start_date: new Date().toISOString().split('T')[0],
      });

      setSuccess(response.data.message || 'Réunion récurrente créée avec succès');
      setDialogOpen(false);
      resetForm();
      await fetchData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Erreur création:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;

    try {
      await apiClient.delete(`/recurring-meetings/${meetingToDelete.id}?delete_future_reservations=true`);
      setSuccess('Réunion récurrente supprimée');
      setDeleteConfirmOpen(false);
      setMeetingToDelete(null);
      await fetchData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const handleRegenerate = async (meeting: RecurringMeeting) => {
    try {
      const response = await apiClient.post(`/recurring-meetings/${meeting.id}/generate`, { months: 12 });
      setSuccess(response.data.message || 'Réservations régénérées');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Erreur régénération:', err);
      setError('Erreur lors de la régénération');
    }
  };

  const handleToggleActive = async (meeting: RecurringMeeting) => {
    try {
      await apiClient.put(`/recurring-meetings/${meeting.id}`, {
        is_active: !meeting.is_active,
      });
      await fetchData();
    } catch (err: any) {
      console.error('Erreur modification:', err);
      setError('Erreur lors de la modification');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '11:00',
      room_id: '',
      department_id: '',
      description: '',
      color: '#1976d2',
      auto_validate: true,
    });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RepeatIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Réunions Récurrentes
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Nouvelle réunion
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Définissez des réunions hebdomadaires qui seront automatiquement réservées pour toute l'année.
          Idéal pour les réunions de direction, comités réguliers, etc.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              Aucune réunion récurrente définie
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliquez sur "Nouvelle réunion" pour en créer une
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Réunion</TableCell>
                  <TableCell>Jour</TableCell>
                  <TableCell>Horaire</TableCell>
                  <TableCell>Salle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} sx={{ opacity: meeting.is_active ? 1 : 0.5 }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: meeting.color,
                          }}
                        />
                        <Box>
                          <Typography fontWeight="bold">{meeting.name}</Typography>
                          {meeting.description && (
                            <Typography variant="caption" color="text.secondary">
                              {meeting.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={meeting.day_name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        {meeting.start_time?.substring(0, 5)} - {meeting.end_time?.substring(0, 5)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <RoomIcon fontSize="small" color="action" />
                        {meeting.room?.nom || `Salle #${meeting.room_id}`}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={meeting.is_active}
                        onChange={() => handleToggleActive(meeting)}
                        size="small"
                      />
                      <Typography variant="caption" color={meeting.is_active ? 'success.main' : 'text.disabled'}>
                        {meeting.is_active ? 'Actif' : 'Inactif'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Régénérer les réservations">
                        <IconButton
                          size="small"
                          onClick={() => handleRegenerate(meeting)}
                          color="primary"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setMeetingToDelete(meeting);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Dialog de création */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RepeatIcon color="primary" />
          Nouvelle réunion récurrente
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de la réunion *"
              placeholder="Ex: Réunion des directeurs"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />

            <TextField
              label="Description"
              placeholder="Description optionnelle"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel>Jour de la semaine *</InputLabel>
              <Select
                value={formData.day_of_week}
                label="Jour de la semaine *"
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as number })}
              >
                {DAYS.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Heure de début *"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Heure de fin *"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Salle *</InputLabel>
              <Select
                value={formData.room_id}
                label="Salle *"
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value as string })}
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.nom} {room.etage && `(${room.etage})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Département</InputLabel>
              <Select
                value={formData.department_id}
                label="Département"
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value as string })}
              >
                <MenuItem value="">
                  <em>Aucun département</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Couleur dans le calendrier
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: color,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid #000' : '2px solid transparent',
                      '&:hover': { transform: 'scale(1.1)' },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.auto_validate}
                  onChange={(e) => setFormData({ ...formData, auto_validate: e.target.checked })}
                />
              }
              label="Valider automatiquement les réservations"
            />

            <Alert severity="info" sx={{ mt: 1 }}>
              Les réservations seront générées automatiquement pour les 12 prochains mois.
              Elles apparaîtront dans le calendrier de tous les utilisateurs.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {submitting ? 'Création...' : 'Créer la réunion'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la réunion récurrente "{meetingToDelete?.name}" ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Toutes les réservations futures associées seront également supprimées.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RecurringMeetingsManager;
