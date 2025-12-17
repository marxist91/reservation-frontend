import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import {
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { alternativesAPI } from '@/api/alternatives';
import type { ProposedAlternative } from '@/types';

const AlternativeProposals: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAlternative, setSelectedAlternative] = useState<ProposedAlternative | null>(null);
  const [actionDialog, setActionDialog] = useState<'accept' | 'reject' | null>(null);

  // Récupérer les propositions en attente
  const { data: alternatives = [], isLoading, error } = useQuery({
    queryKey: ['alternatives', 'pending'],
    queryFn: alternativesAPI.getPending,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    retry: false, // Ne pas réessayer en cas d'erreur
    staleTime: 30000,
  });

  // Mutation pour accepter
  const acceptMutation = useMutation({
    mutationFn: alternativesAPI.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alternatives'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Alternative acceptée ! Votre nouvelle réservation a été créée.');
      setActionDialog(null);
      setSelectedAlternative(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'acceptation');
    },
  });

  // Mutation pour refuser
  const rejectMutation = useMutation({
    mutationFn: alternativesAPI.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alternatives'] });
      toast.success('Proposition refusée');
      setActionDialog(null);
      setSelectedAlternative(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    },
  });

  const handleAccept = (alternative: ProposedAlternative) => {
    setSelectedAlternative(alternative);
    setActionDialog('accept');
  };

  const handleReject = (alternative: ProposedAlternative) => {
    setSelectedAlternative(alternative);
    setActionDialog('reject');
  };

  const confirmAction = () => {
    if (!selectedAlternative) return;

    if (actionDialog === 'accept') {
      acceptMutation.mutate(selectedAlternative.id);
    } else if (actionDialog === 'reject') {
      rejectMutation.mutate(selectedAlternative.id);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Debug: afficher dans la console
  console.log('🔍 Alternatives - Error:', error);
  console.log('🔍 Alternatives - Data:', alternatives);
  console.log('🔍 Alternatives - Count:', alternatives?.length || 0);

  // Ne rien afficher si pas de propositions
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Propositions Alternatives
      </Typography>

      <Grid container spacing={3}>
        {alternatives.map((alternative: ProposedAlternative) => (
          <Grid size={12} key={alternative.id}>
            <Card 
              elevation={3}
              sx={{ 
                border: '2px solid',
                borderColor: 'warning.main',
                bgcolor: 'warning.50',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="warning.dark">
                    Nouvelle salle proposée
                  </Typography>
                  <Chip label="En attente" color="warning" size="small" />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Réservation originale */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Réservation originale (refusée)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Salle:</strong> {alternative.originalReservation?.salle?.nom || alternative.originalReservation?.Room?.nom || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {alternative.originalReservation?.date_debut 
                      ? format(new Date(alternative.originalReservation.date_debut), 'dd MMMM yyyy à HH:mm', { locale: fr })
                      : 'N/A'}
                  </Typography>
                  {alternative.originalReservation?.rejection_reason && (
                    <Typography variant="body2" color="error">
                      <strong>Motif du refus:</strong> {alternative.originalReservation.rejection_reason}
                    </Typography>
                  )}
                </Box>

                {/* Proposition alternative */}
                <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                  <Typography variant="subtitle2" color="success.dark" gutterBottom sx={{ fontWeight: 600 }}>
                    ✨ Salle alternative proposée
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {alternative.proposedRoom?.nom || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Capacité: {alternative.proposedRoom?.capacite || 'N/A'} personnes
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2">
                        <strong>Date:</strong> {format(new Date(alternative.proposed_date_debut), 'dd MMMM yyyy', { locale: fr })}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Heure:</strong> {format(new Date(alternative.proposed_date_debut), 'HH:mm', { locale: fr })} 
                        {' - '}
                        {format(new Date(alternative.proposed_date_fin), 'HH:mm', { locale: fr })}
                      </Typography>
                    </Grid>
                    {alternative.motif && (
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          <strong>Motif:</strong> {alternative.motif}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {alternative.proposer && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Proposé par: {alternative.proposer.prenom} {alternative.proposer.nom}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'grey.50' }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => handleReject(alternative)}
                  disabled={rejectMutation.isPending}
                >
                  Refuser
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AcceptIcon />}
                  onClick={() => handleAccept(alternative)}
                  disabled={acceptMutation.isPending}
                >
                  Accepter
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de confirmation */}
      <Dialog
        open={actionDialog !== null}
        onClose={() => {
          setActionDialog(null);
          setSelectedAlternative(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog === 'accept' ? 'Accepter la proposition' : 'Refuser la proposition'}
        </DialogTitle>
        <DialogContent>
          {actionDialog === 'accept' ? (
            <Typography>
              Êtes-vous sûr de vouloir accepter cette proposition alternative ?
              <br />
              <strong>Une nouvelle réservation sera automatiquement créée et validée.</strong>
            </Typography>
          ) : (
            <Typography>
              Êtes-vous sûr de vouloir refuser cette proposition alternative ?
              <br />
              L'administrateur sera notifié de votre décision.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setActionDialog(null);
              setSelectedAlternative(null);
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color={actionDialog === 'accept' ? 'success' : 'error'}
            onClick={confirmAction}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            {acceptMutation.isPending || rejectMutation.isPending ? 'En cours...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlternativeProposals;
