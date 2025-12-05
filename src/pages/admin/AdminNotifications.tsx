import { useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  TablePagination,
  SelectChangeEvent,
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

type FilterType = 'all' | 'new_reservation' | 'reservation_validated' | 'reservation_rejected' | 'reservation_cancelled' | 'reservation_pending';

const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    clearAll,
  } = useNotificationStore();

  const allNotifications = notifications;
  const unreadNotifications = allNotifications.filter(n => !n.read);
  const displayNotifications = tabValue === 0 ? allNotifications : unreadNotifications;

  const filteredNotifications = filter === 'all' 
    ? displayNotifications 
    : displayNotifications.filter(n => n.type === filter);

  const paginatedNotifications = filteredNotifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'reservation_validated':
        return <CheckCircleIcon color="success" />;
      case 'reservation_rejected':
        return <CancelIcon color="error" />;
      case 'reservation_cancelled':
        return <WarningIcon color="warning" />;
      case 'new_reservation':
        return <InfoIcon color="info" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const handleNavigate = (url: string | undefined): void => {
    if (url) navigate(url);
  };

  const handleFilterChange = (event: SelectChangeEvent<FilterType>): void => {
    setFilter(event.target.value as FilterType);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Notifications Globales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toutes les notifications du système
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Tout marquer comme lu
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={clearRead}
          >
            Effacer les lues
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={clearAll}
          >
            Tout supprimer
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab label={`Toutes (${allNotifications.length})`} />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Non lues
                {unreadCount > 0 && (
                  <Chip 
                    label={unreadCount} 
                    size="small" 
                    color="error" 
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Filtrer par type</InputLabel>
          <Select<FilterType>
            value={filter}
            label="Filtrer par type"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">Tous les types</MenuItem>
            <MenuItem value="new_reservation">Nouvelles demandes</MenuItem>
            <MenuItem value="reservation_validated">Validations</MenuItem>
            <MenuItem value="reservation_rejected">Refus</MenuItem>
            <MenuItem value="reservation_cancelled">Annulations</MenuItem>
            <MenuItem value="reservation_pending">En attente</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Paper>
        {paginatedNotifications.length === 0 ? (
          <Box textAlign="center" py={8}>
            <NotificationsIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune notification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 1 ? 'Toutes vos notifications ont été lues' : 'Vous n\'avez aucune notification'}
            </Typography>
          </Box>
        ) : (
          <List>
            {paginatedNotifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  sx={{
                    py: 2,
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 'none' : '5px solid',
                    borderLeftColor: 'primary.main',
                    cursor: notification.actionUrl ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    handleNavigate(notification.actionUrl);
                  }}
                >
                  <ListItemIcon>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                          {notification.titre}
                        </Typography>
                        {!notification.read && (
                          <Chip label="Nouveau" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                          {' • '}
                          {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box display="flex" gap={1}>
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Marquer comme lu"
                      >
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Supprimer"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < paginatedNotifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      <TablePagination
        component="div"
        count={filteredNotifications.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />
    </Box>
  );
};

export default AdminNotifications;
