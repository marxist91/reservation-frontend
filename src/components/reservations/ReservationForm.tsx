import { useState, useMemo, useEffect } from 'react';
import type { Room, Reservation } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  Alert,
  IconButton,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import apiClient from '@/api/client';
import { format, addHours, differenceInDays } from 'date-fns';

interface TimeSlot {
  heure_debut: string;
  heure_fin: string;
}

interface ReservationFormData {
  room_id: string;
  date: string;
  date_fin: string;
  motif: string;
  description: string;
}

const DEFAULT_DEPARTMENTS = [
  'Direction générale',
  'Secrétariat général',
  'Direction des affaires juridiques',
  "Direction des ressources humaines",
  'Direction commerciale',
  "Direction de l'exploitation",
  'Direction technique',
  'Direction financière et comptable',
  'Direction de la capitainerie',
  'Direction du centre médico social',
  "Direction des systèmes d'information",
  'PRMP',
];

// Helper pour obtenir les dates initiales
const getInitialDates = (): { date: string; heure_debut: string; heure_fin: string } => {
  const now = new Date();
  const startTime = new Date(now.setMinutes(0, 0, 0));
  startTime.setHours(startTime.getHours() + 1);
  const endTime = addHours(startTime, 1);
  return {
    date: format(startTime, "yyyy-MM-dd"),
    heure_debut: format(startTime, "HH:mm"),
    heure_fin: format(endTime, "HH:mm"),
  };
};

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  room?: Room | null;
  reservation?: Reservation | null;
  isLoading?: boolean;
  rooms?: Room[];
}

const ReservationForm: React.FC<ReservationFormProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  room = null,
  reservation = null,
  isLoading = false,
  rooms = [],
}) => {
  const initialDates = useMemo(() => getInitialDates(), []);
  
  const [formData, setFormData] = useState<ReservationFormData>({
    room_id: room?.id?.toString() || '',
    date: initialDates.date,
    date_fin: initialDates.date,
    motif: '',
    description: '',
    // departement sera stocké séparément (string)
  });
  
  // Créneaux horaires multiples
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      heure_debut: initialDates.heure_debut,
      heure_fin: initialDates.heure_fin,
    }
  ]);
  
  // Mode multi-jours
  const [isMultiDay, setIsMultiDay] = useState(false);
  
  const [error, setError] = useState('');
  // Liste des départements (modifiable par l'utilisateur)
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Charger les départements depuis l'API au montage
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get('/departments');
        const data = resp.data?.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          // par défaut sélectionner le premier si non choisi
          if (!selectedDepartmentId && data.length > 0) setSelectedDepartmentId(data[0].id ?? null);
        }
      } catch (e) {
        // ignore: on garde les valeurs par défaut
        console.warn('Impossible de charger les départements', e);
        // Utiliser la liste par défaut si l'API est indisponible
        const fallback = DEFAULT_DEPARTMENTS.map((name, i) => ({ id: -(i + 1), name }));
        setDepartments(fallback);
        if (!selectedDepartmentId && fallback.length > 0) {
          const first = fallback[0];
          const id = first && typeof first.id === 'number' ? first.id : null;
          setSelectedDepartmentId(id);
        }
      }
    })();
  }, []);

  // Réinitialiser le formulaire quand le dialog s'ouvre
  const handleDialogEnter = (): void => {
    const dates = getInitialDates();
    
    if (reservation) {
      // Mode édition : on ne supporte pas encore les multi-créneaux en édition
      const start = new Date(reservation.date_debut);
      const end = new Date(reservation.date_fin);
      
      setFormData({
        room_id: reservation.room_id?.toString() || '',
        date: format(start, "yyyy-MM-dd"),
        date_fin: format(start, "yyyy-MM-dd"),
        motif: reservation.motif || '',
        description: reservation.remarques || '',
      });
      setTimeSlots([{
        heure_debut: format(start, "HH:mm"),
        heure_fin: format(end, "HH:mm"),
      }]);
      setIsMultiDay(false);
    } else if (room) {
      setFormData({
        room_id: room.id.toString(),
        date: dates.date,
        date_fin: dates.date,
        motif: '',
        description: '',
      });
      setTimeSlots([{
        heure_debut: dates.heure_debut,
        heure_fin: dates.heure_fin,
      }]);
      setIsMultiDay(false);
    } else {
      setFormData({
        room_id: '',
        date: dates.date,
        date_fin: dates.date,
        motif: '',
        description: '',
      });
      setTimeSlots([{
        heure_debut: dates.heure_debut,
        heure_fin: dates.heure_fin,
      }]);
      setIsMultiDay(false);
    }
    setError('');
  };

  const handleChange = (field: keyof ReservationFormData) => (event: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleDepartmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === '' || raw === null || raw === undefined) {
      setSelectedDepartmentId(null);
      setError('');
      return;
    }
    const parsed = Number(raw);
    setSelectedDepartmentId(Number.isFinite(parsed) ? parsed : null);
    setError('');
  };

  const openAddDept = () => {
    setNewDeptName('');
    setAddDeptOpen(true);
  };

  const confirmAddDept = () => {
    const name = newDeptName.trim();
    if (!name) return;
    (async () => {
      try {
        // Appeler l'API pour créer le département
        const resp = await apiClient.post('/departments', { name });
        const dep = resp.data?.data ?? { id: null, name };
        const depName = dep.name || name;
        // Mettre à jour la liste locale
        setDepartments(prev => [dep, ...prev.filter(d => d.name?.toLowerCase() !== depName.toLowerCase())]);
        setSelectedDepartmentId(dep.id ?? null);
      } catch (e) {
        console.warn('Erreur création département:', e);
        // Fallback local
        if (!departments.some(d => d.name?.toLowerCase() === name.toLowerCase())) {
          setDepartments(prev => [{ id: null, name }, ...prev]);
        }
        setSelectedDepartmentId(null);
      } finally {
        setAddDeptOpen(false);
      }
    })();
  };
  
  const handleTimeSlotChange = (index: number, field: keyof TimeSlot) => (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newSlots = [...timeSlots];
    const slot = newSlots[index];
    if (slot) {
      slot[field] = event.target.value;
    }
    setTimeSlots(newSlots);
    setError('');
  };
  
  const addTimeSlot = (): void => {
    setTimeSlots([
      ...timeSlots,
      {
        heure_debut: '14:00',
        heure_fin: '17:00',
      }
    ]);
  };
  
  const removeTimeSlot = (index: number): void => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };
  
  const handleMultiDayToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setIsMultiDay(event.target.checked);
    if (!event.target.checked) {
      setFormData({ ...formData, date_fin: formData.date });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.room_id) {
      setError('Veuillez sélectionner une salle');
      return false;
    }
    if (!formData.date) {
      setError('Veuillez renseigner la date de début');
      return false;
    }
    
    if (isMultiDay && !formData.date_fin) {
      setError('Veuillez renseigner la date de fin');
      return false;
    }
    
    if (isMultiDay && formData.date_fin < formData.date) {
      setError('La date de fin doit être après la date de début');
      return false;
    }
    
    // Validation des créneaux horaires
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      if (!slot || !slot.heure_debut || !slot.heure_fin) {
        setError(`Veuillez renseigner les heures pour le créneau ${i + 1}`);
        return false;
      }
      
      if (slot.heure_debut >= slot.heure_fin) {
        setError(`L'heure de fin doit être après l'heure de début (créneau ${i + 1})`);
        return false;
      }
      
      // Vérifier que les créneaux ne se chevauchent pas
      for (let j = i + 1; j < timeSlots.length; j++) {
        const other = timeSlots[j];
        if (
          other &&
          ((slot.heure_debut >= other.heure_debut && slot.heure_debut < other.heure_fin) ||
          (slot.heure_fin > other.heure_debut && slot.heure_fin <= other.heure_fin) ||
          (slot.heure_debut <= other.heure_debut && slot.heure_fin >= other.heure_fin))
        ) {
          setError(`Les créneaux ${i + 1} et ${j + 1} se chevauchent`);
          return false;
        }
      }
    }
    
    // Validation date passée (uniquement pour le premier jour)
    const now = new Date();
    const firstSlot = timeSlots[0];
    if (!firstSlot) {
      setError('Veuillez ajouter au moins un créneau horaire');
      return false;
    }
    const selectedDate = new Date(formData.date + 'T' + firstSlot.heure_debut);
    
    if (selectedDate < now) {
      setError('La date de début ne peut pas être dans le passé');
      return false;
    }
    
    if (!formData.motif.trim()) {
      setError('Veuillez indiquer le motif de la réservation');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validateForm()) return;

    // Calculer le nombre de jours
    const startDate = new Date(formData.date);
    const endDate = new Date(isMultiDay ? formData.date_fin : formData.date);
    const days = differenceInDays(endDate, startDate) + 1;

    onSubmit({
      room_id: parseInt(formData.room_id),
      motif: formData.motif,
      description: formData.description,
      isMultiDay,
      days,
      date_debut: formData.date,
      date_fin: isMultiDay ? formData.date_fin : formData.date,
      timeSlots: timeSlots.map(slot => ({
        heure_debut: slot.heure_debut,
        heure_fin: slot.heure_fin,
      })),
      department_id: selectedDepartmentId,
    });
  };

  const selectedRoom = room || rooms.find(r => r.id === parseInt(formData.room_id));

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      TransitionProps={{ onEnter: handleDialogEnter }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {reservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            {!room && rooms.length > 0 && (
              <TextField
                fullWidth
                select
                label="Salle"
                value={formData.room_id}
                onChange={handleChange('room_id')}
                required
              >
                {rooms.filter(r => r.statut === 'disponible').map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.nom} (Capacité: {r.capacite})
                  </MenuItem>
                ))}
              </TextField>
            )}

            {selectedRoom && (
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  {selectedRoom.nom}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacité: {selectedRoom.capacite} personnes
                  {selectedRoom.batiment && ` • ${selectedRoom.batiment}`}
                </Typography>
              </Box>
            )}

            {/* Département */}
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                fullWidth
                select
                label="Département"
                value={selectedDepartmentId ?? ''}
                onChange={handleDepartmentChange}
                helperText="Sélectionnez le département du demandeur"
              >
                {departments.map((d: any) => (
                  <MenuItem key={d.id ?? d.name} value={d.id ?? ''}>
                    {d.name ?? d}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="outlined" size="small" onClick={openAddDept} sx={{ whiteSpace: 'nowrap' }}>
                Ajouter
              </Button>
            </Box>

            {/* Mode multi-jours */}
            <FormControlLabel
              control={
                <Switch
                  checked={isMultiDay}
                  onChange={handleMultiDayToggle}
                  color="primary"
                />
              }
              label="Réservation sur plusieurs jours (formation, événement...)"
            />

            {/* Dates */}
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label={isMultiDay ? "Date de début" : "Date"}
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
                InputLabelProps={{ shrink: true }}
                required
              />
              
              {isMultiDay && (
                <TextField
                  fullWidth
                  label="Date de fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={handleChange('date_fin')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: formData.date }}
                  required
                />
              )}
            </Box>

            {/* Afficher le nombre de jours */}
            {isMultiDay && formData.date && formData.date_fin && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                {differenceInDays(new Date(formData.date_fin), new Date(formData.date)) + 1} jour(s) de réservation
              </Alert>
            )}

            <Divider sx={{ my: 1 }}>
              <Chip label="Créneaux horaires" size="small" />
            </Divider>

            {/* Créneaux horaires */}
            {timeSlots.map((slot, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                    Créneau {index + 1}
                  </Typography>
                  
                  <TextField
                    label="Heure de début"
                    type="time"
                    value={slot.heure_debut}
                    onChange={handleTimeSlotChange(index, 'heure_debut')}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    required
                    sx={{ flex: 1 }}
                  />

                  <TextField
                    label="Heure de fin"
                    type="time"
                    value={slot.heure_fin}
                    onChange={handleTimeSlotChange(index, 'heure_fin')}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    required
                    sx={{ flex: 1 }}
                  />

                  {timeSlots.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => removeTimeSlot(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Paper>
            ))}

            {/* Bouton ajouter créneau */}
            <Button
              startIcon={<AddIcon />}
              onClick={addTimeSlot}
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Ajouter un créneau horaire
            </Button>

            <Typography variant="caption" color="text.secondary">
              💡 Exemple: Formation matin (9h-12h) + après-midi (14h-17h)
            </Typography>

            <Divider sx={{ my: 1 }} />

            <TextField
              fullWidth
              label="Motif de la réservation"
              value={formData.motif}
              onChange={handleChange('motif')}
              required
              placeholder="Ex: Formation, Réunion d'équipe, Présentation..."
            />

            {/* Dialog pour ajouter un département */}
            <Dialog open={addDeptOpen} onClose={() => setAddDeptOpen(false)}>
              <DialogTitle>Ajouter un département</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Nom du département"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Ex: Direction marketing"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setAddDeptOpen(false)}>Annuler</Button>
                <Button onClick={confirmAddDept} variant="contained">Ajouter</Button>
              </DialogActions>
            </Dialog>

            <TextField
              fullWidth
              label="Description (optionnel)"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              placeholder="Détails supplémentaires..."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : (reservation ? 'Modifier' : 'Réserver')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReservationForm;
