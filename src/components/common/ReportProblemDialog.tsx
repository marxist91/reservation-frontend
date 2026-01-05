import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  ReportProblem as ReportIcon,
  BugReport as BugIcon,
  Lightbulb as FeatureIcon,
  EventNote as ReservationIcon,
  Person as AccountIcon,
  Help as OtherIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import supportAPI, { type CreateTicketData } from '@/api/support';
import toast from 'react-hot-toast';

interface ReportProblemDialogProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { value: 'bug', label: 'Bug / Dysfonctionnement', icon: <BugIcon />, color: '#d32f2f' },
  { value: 'reservation', label: 'Problème de réservation', icon: <ReservationIcon />, color: '#ed6c02' },
  { value: 'account', label: 'Problème de compte', icon: <AccountIcon />, color: '#1976d2' },
  { value: 'feature', label: 'Suggestion d\'amélioration', icon: <FeatureIcon />, color: '#2e7d32' },
  { value: 'other', label: 'Autre', icon: <OtherIcon />, color: '#9c27b0' },
];

const priorities = [
  { value: 'low', label: 'Faible', color: '#4caf50' },
  { value: 'normal', label: 'Normal', color: '#2196f3' },
  { value: 'high', label: 'Élevé', color: '#ff9800' },
  { value: 'urgent', label: 'Urgent', color: '#f44336' },
];

const ReportProblemDialog: React.FC<ReportProblemDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CreateTicketData>({
    subject: '',
    category: '',
    message: '',
    priority: 'normal',
  });
  const [success, setSuccess] = useState(false);

  const createTicketMutation = useMutation({
    mutationFn: supportAPI.createTicket,
    onSuccess: () => {
      setSuccess(true);
      toast.success('Signalement envoyé avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'envoi';
      toast.error(message);
    },
  });

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, category });
    setActiveStep(1);
  };

  const handleSubmit = () => {
    if (!formData.subject.trim()) {
      toast.error('Veuillez entrer un sujet');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Veuillez décrire le problème');
      return;
    }
    createTicketMutation.mutate(formData);
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({ subject: '', category: '', message: '', priority: 'normal' });
    setSuccess(false);
    onClose();
  };

  const selectedCategory = categories.find(c => c.value === formData.category);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
        }}
      >
        <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}>
          <ReportIcon />
        </Avatar>
        <Box flex={1}>
          <Typography variant="h6" fontWeight="bold">
            Signaler un problème
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Notre équipe vous répondra rapidement
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {success ? (
          <Box textAlign="center" py={4}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'success.main',
                mx: 'auto',
                mb: 2,
              }}
            >
              <SuccessIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Signalement envoyé !
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Votre signalement a été transmis à l'équipe d'administration.
              Vous recevrez une notification dès qu'un administrateur aura répondu.
            </Typography>
            <Button variant="contained" onClick={handleClose}>
              Fermer
            </Button>
          </Box>
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Catégorie</StepLabel>
              </Step>
              <Step>
                <StepLabel>Détails</StepLabel>
              </Step>
            </Stepper>

            {activeStep === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sélectionnez le type de problème que vous rencontrez
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {categories.map((cat) => (
                    <Card
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      sx={{
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: formData.category === cat.value ? cat.color : 'divider',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: cat.color,
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(cat.color, 0.1),
                            color: cat.color,
                            mx: 'auto',
                            mb: 1,
                            width: 48,
                            height: 48,
                          }}
                        >
                          {cat.icon}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {cat.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                {selectedCategory && (
                  <Alert
                    severity="info"
                    sx={{ mb: 3 }}
                    action={
                      <Button size="small" onClick={() => setActiveStep(0)}>
                        Changer
                      </Button>
                    }
                  >
                    Catégorie sélectionnée: <strong>{selectedCategory.label}</strong>
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Sujet"
                  placeholder="Décrivez brièvement le problème"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  fullWidth
                  label="Description détaillée"
                  placeholder="Expliquez le problème en détail : que faisiez-vous, qu'attendiez-vous, que s'est-il passé..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  multiline
                  rows={5}
                  sx={{ mb: 2 }}
                  required
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Priorité</InputLabel>
                  <Select
                    value={formData.priority || 'normal'}
                    label="Priorité"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as string })}
                  >
                    {priorities.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            size="small"
                            label={p.label}
                            sx={{
                              bgcolor: alpha(p.color, 0.1),
                              color: p.color,
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Alert severity="info" variant="outlined">
                  <Typography variant="body2">
                    Votre signalement sera traité dans les plus brefs délais.
                    Vous recevrez une notification quand un administrateur y répondra.
                  </Typography>
                </Alert>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      {!success && activeStep === 1 && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setActiveStep(0)}>
            Retour
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={createTicketMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={createTicketMutation.isPending || !formData.subject || !formData.message}
          >
            {createTicketMutation.isPending ? 'Envoi...' : 'Envoyer le signalement'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ReportProblemDialog;
