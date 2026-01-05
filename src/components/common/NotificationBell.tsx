import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { useNotificationStore } from '@/store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ExtendedNotification } from '@/store/notificationStore';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearRead,
  } = useNotificationStore();

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: ExtendedNotification): void => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    handleClose();
  };

  const handleMarkAllRead = (): void => {
    markAllAsRead();
  };

  const handleClearAll = (): void => {
    clearAll();
  };

  const handleClearRead = (): void => {
    clearRead();
  };

  const getIcon = (_type: string, severity: string): React.ReactElement => {
    const iconProps = { fontSize: 'small' as const };
    
    if (severity === 'success') return <CheckCircleIcon {...iconProps} sx={{ color: 'success.main' }} />;
    if (severity === 'error') return <CancelIcon {...iconProps} sx={{ color: 'error.main' }} />;
    if (severity === 'warning') return <WarningIcon {...iconProps} sx={{ color: 'warning.main' }} />;
    return <InfoIcon {...iconProps} sx={{ color: 'info.main' }} />;
  };

  const getTimeAgo = (timestamp: string | undefined): string => {
    try {
      if (!timestamp) {
        return '';
      }
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      const exact = format(date, 'HH:mm', { locale: fr });
      return exact;
    } catch {
      return '';
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* En-tête */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Notifications
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  color="primary"
                  size="small"
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Typography>
            {notifications.length > 0 && (
              <Box display="flex" gap={0.5}>
                <IconButton size="small" onClick={handleMarkAllRead} title="Tout marquer comme lu">
                  <DoneAllIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleClearRead} title="Effacer les lues">
                  <ClearAllIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Liste des notifications */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {notifications.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <NotificationsIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
              <Typography variant="body2">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    component="div"
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 2,
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: notification.read ? 'action.hover' : 'action.selected',
                      },
                      borderLeft: notification.read ? 'none' : '4px solid',
                      borderLeftColor: 'primary.main',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getIcon(notification.type, notification.severity || 'info')}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={notification.read ? 'normal' : 'bold'}
                        >
                          {notification.titre}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                            {getTimeAgo(notification.createdAt || notification.created_at)}
                          </Typography>
                        </>
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Actions */}
        {notifications.length > 0 && [
          <Divider key="actions-divider" />,
          <Box key="actions-box" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              size="small"
              onClick={() => {
                navigate('/notifications');
                handleClose();
              }}
            >
              Voir tout
            </Button>
            <Button
              size="small"
              color="error"
              onClick={handleClearAll}
            >
              Tout effacer
            </Button>
          </Box>
        ]}
      </Menu>
    </>
  );
};

export default NotificationBell;
