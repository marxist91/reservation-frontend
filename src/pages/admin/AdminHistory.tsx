import { useState, useMemo, useEffect } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  TablePagination,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

type ActionColor = 'info' | 'success' | 'error' | 'warning' | 'default';

const AdminHistory: React.FC = () => {
    // Suppression backend
    const [deleting, setDeleting] = useState(false);
    const handleClearBackend = async () => {
      setDeleting(true);
      try {
        await fetch('/admin/history/clear', { method: 'DELETE' });
        await fetchHistory();
      } catch (e) {
        // silent
      } finally {
        setDeleting(false);
      }
    };
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';
  
  const {
    history,
    filters,
    setFilters,
    resetFilters,
    getFilteredHistory,
    getStats,
  } = useHistoryStore();

  const fetchHistory = useHistoryStore((state) => state.fetchHistory);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredHistory = useMemo(() => getFilteredHistory(), [history, filters.type, filters.dateRange, filters.userId]);
  const stats = useMemo(() => getStats(), [history]);

  const displayHistory = useMemo(() => 
    searchTerm
      ? filteredHistory.filter(
          (entry) =>
            entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.userName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filteredHistory,
    [filteredHistory, searchTerm]
  );

  const paginatedHistory = displayHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    // Ensure we fetch the latest history when opening the page or when user changes
    try {
      fetchHistory();
    } catch (e) {
      // silent
    }
  }, [fetchHistory, currentUser?.id]);

  const getActionColor = (type: string | undefined): ActionColor => {
    switch (type) {
      case 'reservation_created':
      case 'room_created':
      case 'user_created':
        return 'info';
      case 'reservation_validated':
        return 'success';
      case 'reservation_rejected':
      case 'reservation_deleted':
        return 'error';
      case 'reservation_cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const exportToCSV = (): void => {
    const headers = ['Date', 'Action', 'Utilisateur', 'Description'];
    const rows = displayHistory.map((entry) => {
      let dateStr = 'Date invalide';
      try {
        if (entry.timestamp) {
          const date = new Date(entry.timestamp);
          if (!isNaN(date.getTime())) {
            dateStr = format(date, 'dd/MM/yyyy HH:mm:ss');
          }
        }
      } catch (e) {
        console.error('CSV date error:', e);
      }
      
      return [
        dateStr,
        entry.action,
        entry.userName || 'Système',
        entry.description,
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_global_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }} gutterBottom>
            Historique Global
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toutes les actions du système
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
          >
            Exporter CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetFilters}
          >
            Réinitialiser
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => useHistoryStore.getState().clearHistory()}
          >
            Supprimer tout l'historique (local)
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleClearBackend}
          >
            Supprimer tout l'historique (backend)
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}><CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <HistoryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total d'actions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}><CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>📝</Avatar>
                <Box>
                  <Typography variant="h4">{stats.byType['reservation_created'] || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Créations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}><CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>✅</Avatar>
                <Box>
                  <Typography variant="h4">{stats.byType['reservation_validated'] || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}><CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'error.main' }}>❌</Avatar>
                <Box>
                  <Typography variant="h4">{stats.byType['reservation_rejected'] || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Refus
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Rechercher"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, action, description..."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Type d'action"
              value={filters.type}
              onChange={(e) => setFilters({ type: e.target.value })}
            >
              <MenuItem value="all">Toutes les actions</MenuItem>
              <MenuItem value="reservation_created">Création réservation</MenuItem>
              <MenuItem value="reservation_validated">Validation réservation</MenuItem>
              <MenuItem value="reservation_rejected">Refus réservation</MenuItem>
              <MenuItem value="reservation_cancelled">Annulation réservation</MenuItem>
              <MenuItem value="reservation_deleted">Suppression réservation</MenuItem>
              <MenuItem value="reservation_updated">Modification réservation</MenuItem>
              <MenuItem value="user_login">Connexion utilisateur</MenuItem>
              <MenuItem value="user_logout">Déconnexion utilisateur</MenuItem>
              <MenuItem value="user_created">Création utilisateur</MenuItem>
              <MenuItem value="room_created">Création salle</MenuItem>
              <MenuItem value="room_updated">Modification salle</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Période"
              value={filters.dateRange}
              onChange={(e) => setFilters({ dateRange: e.target.value })}
            >
              <MenuItem value="all">Toute la période</MenuItem>
              <MenuItem value="today">Aujourd'hui</MenuItem>
              <MenuItem value="week">Cette semaine</MenuItem>
              <MenuItem value="month">Ce mois</MenuItem>
              <MenuItem value="year">Cette année</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {displayHistory.length === 0 ? (
          <Box textAlign="center" py={8}>
            <HistoryIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune entrée d'historique
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aucune action ne correspond à vos filtres
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#0a2463', 0.04) }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</TableCell>
                {isAdmin && (
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détails</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedHistory.map((entry) => {
                let dateFormatted = 'Date invalide';
                let timeFormatted = '';
                
                try {
                  if (entry.timestamp) {
                    const date = new Date(entry.timestamp);
                    if (!isNaN(date.getTime())) {
                      dateFormatted = format(date, 'dd/MM/yyyy', { locale: fr });
                      timeFormatted = format(date, 'HH:mm:ss');
                    }
                  }
                } catch (e) {
                  console.error('Erreur format date:', entry.timestamp, e);
                }

                return (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {dateFormatted}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timeFormatted}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        color={getActionColor(entry.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {entry.userName?.charAt(0) || 'S'}
                        </Avatar>
                        <Typography variant="body2">{entry.userName || 'Système'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.description}</Typography>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {entry.details && typeof entry.details === 'object' && Object.keys(entry.details).length > 0 ? (
                          <Tooltip
                            title={
                              <Box sx={{ p: 0.5 }}>
                                {Object.entries(entry.details).map(([key, value]) => (
                                  <Typography key={key} variant="caption" display="block" sx={{ mb: 0.5 }}>
                                    <strong>{key}:</strong> {String(value)}
                                  </Typography>
                                ))}
                              </Box>
                            }
                            arrow
                          >
                            <Chip 
                              label={`${Object.keys(entry.details).length} détail(s)`}
                              size="small" 
                              variant="outlined" 
                              color="info"
                              sx={{ cursor: 'pointer' }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <TablePagination
        component="div"
        count={displayHistory.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />
    </Box>
  );
};

export default AdminHistory;
