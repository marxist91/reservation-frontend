import { useState } from 'react';
import type { ExtendedNotification } from '@/types';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNotificationStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState('all');

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearRead,
  } = useNotificationStore();
  
  // Filtrer uniquement les notifications personnelles (pas les notifications globales admin)
  const personalNotifications = notifications.filter(n => 
    n.type !== 'new_reservation' && // Exclure les nouvelles demandes (admin only)
    n.actionUrl !== '/admin/reservations' // Exclure les notifications admin
  );
  
  const personalUnreadCount = personalNotifications.filter(n => !n.read).length;

  const getIcon = (_type: string, severity: string): React.ReactElement => {
    const iconProps = { fontSize: 'medium' as const };
    
    if (severity === 'success') return <CheckCircleIcon {...iconProps} sx={{ color: 'success.main' }} />;
    if (severity === 'error') return <CancelIcon {...iconProps} sx={{ color: 'error.main' }} />;
    if (severity === 'warning') return <WarningIcon {...iconProps} sx={{ color: 'warning.main' }} />;
    return <InfoIcon {...iconProps} sx={{ color: 'info.main' }} />;
  };

  const getTimeAgo = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: fr });
    } catch {
      return 'À l\'instant';
    }
  };

  const getFormattedDate = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return timestamp;
    }
  };

  const handleNotificationClick = (notification: ExtendedNotification): void => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getFilteredNotifications = (): ExtendedNotification[] => {
    let filtered = personalNotifications;

    // Filtrer par onglet (tout / non lues)
    if (tabValue === 1) {
      filtered = filtered.filter(n => !n.read);
    }

    // Filtrer par type
    if (filter !== 'all') {
      filtered = filtered.filter((n) => n.type === filter);
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const notificationTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'reservation_validated', label: 'Validées' },
    { value: 'reservation_rejected', label: 'Refusées' },
    { value: 'reservation_pending', label: 'En attente' },
    { value: 'reservation_cancelled', label: 'Annulées' },
    { value: 'reminder', label: 'Rappels' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Mes Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {personalUnreadCount > 0 ? `${personalUnreadCount} notification${personalUnreadCount > 1 ? 's' : ''} non lue${personalUnreadCount > 1 ? 's' : ''}` : 'Toutes vos notifications sont lues'}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {personalUnreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
          {personalNotifications.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={clearRead}
            >
              Effacer les lues
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        {/* Onglets */}
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Toutes
                <Chip label={personalNotifications.length} size="small" />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Non lues
                {personalUnreadCount > 0 && <Chip label={personalUnreadCount} size="small" color="primary" />}
              </Box>
            }
          />
        </Tabs>

        {/* Filtres */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Type de notification</InputLabel>
            <Select
              value={filter}
              label="Type de notification"
              onChange={(e) => setFilter(e.target.value)}
            >
              {notificationTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Liste des notifications */}
        {filteredNotifications.length === 0 ? (
          <Box
            sx={{
              p: 8,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <NotificationsIcon sx={{ fontSize: 100, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Aucune notification
            </Typography>
            <Typography variant="body2">
              {tabValue === 1 ? 'Vous n\'avez aucune notification non lue' : 'Vous n\'avez aucune notification'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  component="div"
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 2.5,
                    px: 3,
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: notification.read ? 'action.hover' : 'action.selected',
                    },
                    borderLeft: notification.read ? 'none' : '5px solid',
                    borderLeftColor: 'primary.main',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 50 }}>
                    {getIcon(notification.type, notification.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={notification.read ? 'normal' : 'bold'}
                        >
                          {notification.titre}
                        </Typography>
                        {!notification.read && (
                          <Chip
                            label="Nouveau"
                            size="small"
                            color="primary"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                          {notification.message}
                        </Typography>
                        <Box display="flex" gap={2}>
                          <Typography variant="caption" color="text.secondary">
                            {getTimeAgo(notification.created_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {getFormattedDate(notification.created_at)}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                  <Box display="flex" flexDirection="column" gap={1}>
                    {!notification.read && (
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        Marquer comme lu
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      sx={{ alignSelf: 'flex-end' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* Actions globales */}
      {notifications.length > 0 && (
        <Box display="flex" justifyContent="center" gap={2}>
          <Button
            variant="contained"
            color="error"
            onClick={clearAll}
            startIcon={<DeleteIcon />}
          >
            Supprimer toutes les notifications
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Notifications;
