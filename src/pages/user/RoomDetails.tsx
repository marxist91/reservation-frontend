import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomsAPI } from '../../api/rooms';
import { useReservations } from '../../hooks/useReservations';
import ReservationForm from '../../components/reservations/ReservationForm';
import type { Room } from '../../types';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Breadcrumbs,
  Link,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocationOn as LocationIcon,
  SquareFoot as SquareIcon,
  Business as BuildingIcon,
  Stairs as StairsIcon,
  ArrowBack as BackIcon,
  EventAvailable as ReserveIcon,
  CheckCircle as CheckIcon,
  Wifi as WifiIcon,
  Tv as TvIcon,
  AcUnit as AcIcon,
  Videocam as VideoIcon,
  Phone as PhoneIcon,
  TableBar as TableIcon,
  Coffee as CoffeeIcon,
  Speaker as SpeakerIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

// Images de salles par défaut
const defaultImages = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&h=600&fit=crop',
];

// Parser les équipements
const parseEquipements = (equipements: string | string[] | null | undefined): string[] => {
  if (!equipements) return [];
  if (Array.isArray(equipements)) return equipements;
  try {
    return JSON.parse(equipements);
  } catch {
    return [];
  }
};

// Icône pour chaque type d'équipement
const getEquipementIcon = (equip: string): React.ReactElement => {
  const lower = equip.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) return <WifiIcon />;
  if (lower.includes('tv') || lower.includes('écran')) return <TvIcon />;
  if (lower.includes('clim')) return <AcIcon />;
  if (lower.includes('vidéo') || lower.includes('projecteur')) return <VideoIcon />;
  if (lower.includes('téléphone') || lower.includes('conférence')) return <PhoneIcon />;
  if (lower.includes('table')) return <TableIcon />;
  if (lower.includes('café') || lower.includes('coffee')) return <CoffeeIcon />;
  if (lower.includes('audio') || lower.includes('son')) return <SpeakerIcon />;
  return <CheckIcon />;
};

// Config des statuts
const statusConfig: Record<string, { color: 'success' | 'error' | 'warning' | 'default'; label: string; bg: string }> = {
  disponible: { color: 'success', label: 'Disponible', bg: '#dcfce7' },
  occupe: { color: 'error', label: 'Occupée', bg: '#fee2e2' },
  reserve: { color: 'warning', label: 'Réservée', bg: '#fef3c7' },
  maintenance: { color: 'default', label: 'Maintenance', bg: '#f3f4f6' },
};

interface ReservationFormData {
  room_id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  nombre_participants: number;
}

const RoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const { createReservation } = useReservations();

  // Récupérer les détails de la salle
  const { data: room, isLoading, error } = useQuery<Room>({
    queryKey: ['room', id],
    queryFn: () => roomsAPI.getById(parseInt(id!, 10)),
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!id,
  });

  const handleReservation = (formData: any): void => {
    if (!room) return;
    const reservationData: ReservationFormData = {
      room_id: room.id,
      date: formData.date,
      heure_debut: formData.heure_debut,
      heure_fin: formData.heure_fin,
      motif: formData.motif,
      nombre_participants: formData.nombre_participants,
    };
    createReservation.mutate(reservationData, {
      onSuccess: () => {
        setReserveDialogOpen(false);
        navigate('/reservations');
      },
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid item prop */}
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={100} />
          </Grid>
          {/* @ts-expect-error MUI Grid item prop */}
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !room) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Salle non trouvée ou erreur de chargement
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Container>
    );
  }

  const statusKey = room.statut || 'disponible';
  const status = (statusConfig[statusKey] ?? statusConfig['disponible'])!;
  const isAvailable = room.statut === 'disponible';
  const equipements = parseEquipements(room.equipements);
  const roomImage = room.image_url && !room.image_url.startsWith('/images/')
    ? room.image_url
    : defaultImages[(room.id || 0) % defaultImages.length];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 4 }}>
      {/* Breadcrumb */}
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/rooms'); }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            Salles
          </Link>
          <Typography color="text.primary">{room.nom}</Typography>
        </Breadcrumbs>
      </Container>

      {/* Image principale */}
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative',
            height: { xs: 250, md: 400 },
            borderRadius: 3,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={roomImage}
            alt={room.nom}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
            }}
          />
          
          {/* Bouton retour */}
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'white',
              '&:hover': { bgcolor: '#f5f5f5' },
            }}
          >
            <BackIcon />
          </IconButton>

          {/* Badge statut */}
          <Chip
            label={status.label}
            color={status.color}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontWeight: 600,
            }}
          />

          {/* Titre sur l'image */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              right: 24,
              color: 'white',
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {room.nom}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">
                  {room.batiment || 'Non spécifié'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon fontSize="small" />
                <Typography variant="body2">
                  {room.capacite} personnes
                </Typography>
              </Box>
              {room.superficie && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <SquareIcon fontSize="small" />
                  <Typography variant="body2">
                    {room.superficie} m²
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Contenu principal */}
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Colonne gauche - Détails */}
          {/* @ts-expect-error MUI Grid item prop */}
          <Grid item xs={12} md={8}>
            {/* Description */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Description
              </Typography>
              <Typography color="text.secondary" lineHeight={1.8}>
                {room.description || 'Aucune description disponible pour cette salle.'}
              </Typography>
            </Paper>

            {/* Équipements */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Équipements disponibles
              </Typography>
              {equipements.length > 0 ? (
                <Grid container spacing={2}>
                  {equipements.map((equip, index) => (
                    /* @ts-expect-error MUI Grid item prop */
                    <Grid item xs={6} sm={4} key={index}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: '#f8fafc',
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ color: 'primary.main' }}>
                          {getEquipementIcon(equip)}
                        </Box>
                        <Typography variant="body2">{equip}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Aucun équipement spécifié
                </Typography>
              )}
            </Paper>

            {/* Informations détaillées */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Informations détaillées
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <BuildingIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Bâtiment"
                    secondary={room.batiment || 'Non spécifié'}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon>
                    <StairsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Étage"
                    secondary={room.etage || 'Non spécifié'}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Capacité maximale"
                    secondary={`${room.capacite} personnes`}
                  />
                </ListItem>
                {room.superficie && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <SquareIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Superficie"
                        secondary={`${room.superficie} m²`}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Colonne droite - Actions */}
          {/* @ts-expect-error MUI Grid item prop */}
          <Grid item xs={12} md={4}>
            {/* Card de réservation */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                position: 'sticky',
                top: 100,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  p: 2,
                  bgcolor: status.bg,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color={status.color === 'success' ? 'success.main' : 'text.secondary'}
                >
                  {status.label}
                </Typography>
              </Box>

              {isAvailable ? (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<ReserveIcon />}
                  onClick={() => setReserveDialogOpen(true)}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  Réserver cette salle
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  disabled
                  sx={{ py: 1.5, borderRadius: 2 }}
                >
                  Non disponible
                </Button>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Responsable */}
              {room.responsable && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Responsable de la salle
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mt={1}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {room.responsable.prenom?.charAt(0)}
                      {room.responsable.nom?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {room.responsable.prenom} {room.responsable.nom}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {room.responsable.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Dialog de réservation */}
      <ReservationForm
        open={reserveDialogOpen}
        onClose={() => setReserveDialogOpen(false)}
        room={room}
        onSubmit={handleReservation}
        isLoading={createReservation.isPending}
      />
    </Box>
  );
};

export default RoomDetails;
