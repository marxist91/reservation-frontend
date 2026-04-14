import { Link } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon, SentimentDissatisfied as SadIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const NotFound: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha('#0a2463', 0.03)} 0%, ${alpha('#1565c0', 0.06)} 100%)`,
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 4, sm: 6 },
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <SadIcon sx={{ fontSize: 72, color: alpha('#0a2463', 0.15), mb: 2 }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '5rem', sm: '6rem' },
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            mb: 1,
          }}
        >
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Page non trouvée
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Button
          component={Link}
          to="/dashboard"
          variant="contained"
          startIcon={<HomeIcon />}
          size="large"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.2,
            background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
            boxShadow: `0 4px 14px ${alpha('#0a2463', 0.3)}`,
            '&:hover': {
              background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
              boxShadow: `0 6px 20px ${alpha('#0a2463', 0.4)}`,
            },
          }}
        >
          Retour à l'accueil
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
