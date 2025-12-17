import { useState, useMemo } from 'react';
import type { Room } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Chip,
  Autocomplete,
} from '@mui/material';

const EQUIPEMENTS_OPTIONS = [
  'Vidéoprojecteur',
  'Écran',
  'Écran TV',
  'Écran motorisé',
  'Tableau blanc',
  'WiFi',
  'Climatisation',
  'Système audio',
  'Téléphone de conférence',
  'Visioconférence',
  'Machine à café',
  'Tables modulables',
  'Prises électriques multiples',
];

const STATUTS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'maintenance', label: 'En maintenance' },
  { value: 'reserve', label: 'Réservée' },
];

// Helper pour parser les équipements
const parseEquipements = (equipements?: string[] | string | null): string[] => {
  if (!equipements) return [];
  if (Array.isArray(equipements)) return equipements;
  try {
    return JSON.parse(equipements);
  } catch {
    return equipements.split(',').map(e => e.trim());
  }
};

interface RoomFormData {
  nom: string;
  description: string;
  capacite: string;
  equipements: string[];
  batiment: string;
  etage: string;
  superficie: string;
  statut: string;
}

interface RoomFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  room?: Room | null;
  isLoading?: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  room = null, 
  isLoading = false,
}) => {
  // Calculer les valeurs initiales basées sur room
  const initialData = useMemo((): RoomFormData => ({
    nom: room?.nom || '',
    description: room?.description || '',
    capacite: room?.capacite?.toString() || '',
    equipements: parseEquipements(room?.equipements),
    batiment: room?.batiment || '',
    etage: room?.etage || '',
    superficie: room?.superficie?.toString() || '',
    // responsable association removed — managed globally
    statut: room?.statut || 'disponible',
  }), [room]);

  const [formData, setFormData] = useState<RoomFormData>(initialData);

  // Réinitialiser le formulaire quand room change ou quand le dialog s'ouvre
  const handleDialogEnter = (): void => {
    setFormData({
      nom: room?.nom || '',
      description: room?.description || '',
      capacite: room?.capacite?.toString() || '',
      equipements: parseEquipements(room?.equipements),
      batiment: room?.batiment || '',
      etage: room?.etage || '',
      superficie: room?.superficie?.toString() || '',
      statut: room?.statut || 'disponible',
    });
  };

  const handleChange = (field: keyof RoomFormData) => (event: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleEquipementsChange = (_event: React.SyntheticEvent, newValue: string[]): void => {
    setFormData({ ...formData, equipements: newValue });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacite: parseInt(formData.capacite),
      superficie: formData.superficie ? parseFloat(formData.superficie) : null,
      equipements: JSON.stringify(formData.equipements),
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      TransitionProps={{ onEnter: handleDialogEnter }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {room ? 'Modifier la salle' : 'Nouvelle salle'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              fullWidth
              label="Nom de la salle"
              value={formData.nom}
              onChange={handleChange('nom')}
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
            />

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Capacité (personnes)"
                type="number"
                value={formData.capacite}
                onChange={handleChange('capacite')}
                required
                inputProps={{ min: 1 }}
              />

              <TextField
                fullWidth
                label="Superficie (m²)"
                type="number"
                value={formData.superficie}
                onChange={handleChange('superficie')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Bâtiment"
                value={formData.batiment}
                onChange={handleChange('batiment')}
              />

              <TextField
                fullWidth
                label="Étage"
                value={formData.etage}
                onChange={handleChange('etage')}
              />
            </Box>

            <Autocomplete
              multiple
              options={EQUIPEMENTS_OPTIONS}
              value={formData.equipements}
              onChange={handleEquipementsChange}
              freeSolo
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={index}
                  />
                ))
              }
              renderInput={(params) => (
                /* @ts-expect-error MUI Autocomplete params typing incompatible with exactOptionalPropertyTypes */
                <TextField
                  {...params}
                  label="Équipements"
                  placeholder="Ajouter un équipement"
                />
              )}
            />

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                select
                label="Statut"
                value={formData.statut}
                onChange={handleChange('statut')}
              >
                {STATUTS.map((statut) => (
                  <MenuItem key={statut.value} value={statut.value}>
                    {statut.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : (room ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RoomForm;
