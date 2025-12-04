import { useState } from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as ViewIcon,
  EventAvailable as ReserveIcon,
  SquareFoot as SquareIcon,
  Wifi as WifiIcon,
  Tv as TvIcon,
  AcUnit as AcIcon,
} from '@mui/icons-material';

// Images de salles par défaut
const defaultImages = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=400&h=300&fit=crop',
];

// Obtenir une image basée sur l'ID de la salle
const getRoomImage = (room) => {
  if (room.image_url && !room.image_url.startsWith('/images/')) {
    return room.image_url;
  }
  return defaultImages[(room.id || 0) % defaultImages.length];
};

// Couleurs et labels des statuts
const statusConfig = {
  disponible: { color: '#22c55e', bg: '#dcfce7', label: 'Disponible' },
  occupe: { color: '#ef4444', bg: '#fee2e2', label: 'Occupée' },
  reserve: { color: '#f59e0b', bg: '#fef3c7', label: 'Réservée' },
  maintenance: { color: '#6b7280', bg: '#f3f4f6', label: 'Maintenance' },
  indisponible: { color: '#6b7280', bg: '#f3f4f6', label: 'Indisponible' },
};

// Parser les équipements
const parseEquipements = (equipements) => {
  if (!equipements) return [];
  if (Array.isArray(equipements)) return equipements;
  try {
    return JSON.parse(equipements);
  } catch {
    return [];
  }
};

// Vérifier si un équipement existe
const hasEquipement = (equipements, keywords) => {
  const list = parseEquipements(equipements);
  return list.some(e => keywords.some(k => e.toLowerCase().includes(k.toLowerCase())));
};

function RoomCard({ room, onReserve, onView, compact = false }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const status = statusConfig[room.statut] || statusConfig.disponible;
  const isAvailable = room.statut === 'disponible';

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleReserveClick = (e) => {
    e.stopPropagation();
    if (onReserve && isAvailable) onReserve(room);
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    if (onView) onView(room);
  };

  return (
    <Card
      onClick={() => onView && onView(room)}
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        },
        '&:hover .room-overlay': {
          opacity: 1,
        },
        height: compact ? 260 : 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image de couverture */}
      <Box sx={{ position: 'relative', height: compact ? 140 : 160 }}>
        <CardMedia
          component="img"
          image={getRoomImage(room)}
          alt={room.nom}
          sx={{
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        {/* Overlay gradient */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
          }}
        />

        {/* Badge statut */}
        <Chip
          label={status.label}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: status.bg,
            color: status.color,
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 22,
            '& .MuiChip-label': { px: 1 },
          }}
        />

        {/* Bouton favori */}
        <IconButton
          onClick={handleFavoriteClick}
          size="small"
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: 'white' },
            width: 28,
            height: 28,
          }}
        >
          {isFavorite ? (
            <FavoriteIcon sx={{ color: '#ef4444', fontSize: 16 }} />
          ) : (
            <FavoriteBorderIcon sx={{ color: '#666', fontSize: 16 }} />
          )}
        </IconButton>

        {/* Infos en bas de l'image */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            right: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box display="flex" alignItems="center" gap={0.5} sx={{ color: 'white' }}>
            <PeopleIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
              {room.capacite} pers.
            </Typography>
          </Box>
          {room.superficie && (
            <Box display="flex" alignItems="center" gap={0.5} sx={{ color: 'white' }}>
              <SquareIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                {room.superficie}m²
              </Typography>
            </Box>
          )}
        </Box>

        {/* Overlay avec boutons au hover */}
        <Box
          className="room-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <IconButton
            onClick={handleViewClick}
            size="small"
            sx={{
              bgcolor: 'white',
              '&:hover': { bgcolor: '#f5f5f5', transform: 'scale(1.1)' },
              transition: 'transform 0.2s',
            }}
          >
            <ViewIcon sx={{ color: '#333', fontSize: 20 }} />
          </IconButton>
          {isAvailable && onReserve && (
            <IconButton
              onClick={handleReserveClick}
              size="small"
              sx={{
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0', transform: 'scale(1.1)' },
                transition: 'transform 0.2s',
              }}
            >
              <ReserveIcon sx={{ color: 'white', fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Contenu */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Nom */}
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5,
            fontSize: '0.9rem',
          }}
        >
          {room.nom}
        </Typography>

        {/* Localisation */}
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap fontSize="0.7rem">
            {room.batiment || 'Non spécifié'}{room.etage ? ` • ${room.etage}` : ''}
          </Typography>
        </Box>

        {/* Équipements icônes */}
        <Box display="flex" gap={0.5} mt="auto" pt={1}>
          {hasEquipement(room.equipements, ['wifi', 'internet']) && (
            <Box sx={{ p: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <WifiIcon sx={{ fontSize: 14, color: '#666' }} />
            </Box>
          )}
          {hasEquipement(room.equipements, ['tv', 'écran', 'video', 'projecteur']) && (
            <Box sx={{ p: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <TvIcon sx={{ fontSize: 14, color: '#666' }} />
            </Box>
          )}
          {hasEquipement(room.equipements, ['clim', 'climatisation']) && (
            <Box sx={{ p: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <AcIcon sx={{ fontSize: 14, color: '#666' }} />
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export default RoomCard;
