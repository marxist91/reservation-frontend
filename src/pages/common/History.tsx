import { useState, useMemo, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  IconButton,
  alpha,
} from '@mui/material';
import {
  History as HistoryIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useHistoryStore } from '@/store/historyStore';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActionType {
  value: string;
  label: string;
  color?: 'info' | 'success' | 'error' | 'warning' | 'default';
}

interface DateRange {
  value: string;
  label: string;
}

const History: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'admin';

  const {
    myHistory,
    fetchMyHistory,
    filters,
    setFilters,
    resetFilters,
    isLoading,
  } = useHistoryStore();

  const [searchTerm, setSearchTerm] = useState('');

  // Charger l'historique personnel au montage
  useEffect(() => {
    fetchMyHistory();
  }, [fetchMyHistory]);

  const personalHistory = useMemo(() => myHistory, [myHistory]);
  
  console.log('📜 Historique personnel reçu:', myHistory.length, 'entrées');
  console.log('📜 Types présents:', [...new Set(myHistory.map(h => h.type))]);
  
  const filteredHistory = useMemo(() => {
    let filtered = personalHistory;
    
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((entry) => entry.type === filters.type);
    }
    
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const ranges: Record<string, Date> = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week: new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setMonth(now.getMonth() - 1)),
        year: new Date(now.setFullYear(now.getFullYear() - 1)),
      };
      
      const startDate = ranges[filters.dateRange];
      if (startDate) {
        filtered = filtered.filter((entry) => new Date(entry.timestamp) >= startDate);
      }
    }
    
    return filtered;
  }, [personalHistory, filters.type, filters.dateRange]);
  
  const personalStats = useMemo(() => {
    const stats: { total: number; byType: Record<string, number> } = {
      total: personalHistory.length,
      byType: {},
    };
    
    personalHistory.forEach((entry) => {
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
    });
    
    return stats;
  }, [personalHistory]);

  const displayedHistory = filteredHistory.filter((entry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      entry.description?.toLowerCase().includes(search) ||
      entry.userName?.toLowerCase().includes(search) ||
      entry.action?.toLowerCase().includes(search)
    );
  });

  const actionTypes: ActionType[] = [
    { value: 'all', label: 'Toutes mes actions' },
    { value: 'reservation_created', label: 'Mes créations', color: 'info' },
    { value: 'reservation_validated', label: 'Mes validations reçues', color: 'success' },
    { value: 'reservation_rejected', label: 'Mes refus reçus', color: 'error' },
    { value: 'reservation_cancelled', label: 'Mes annulations', color: 'warning' },
    { value: 'reservation_updated', label: 'Mes modifications', color: 'info' },
  ];

  const dateRanges: DateRange[] = [
    { value: 'all', label: 'Tout l\'historique' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
  ];

  const getActionColor = (type: string): 'info' | 'success' | 'error' | 'warning' | 'default' => {
    const actionType = actionTypes.find((a) => a.value === type);
    return actionType?.color || 'default';
  };

  const getActionLabel = (type: string): string => {
    const actionType = actionTypes.find((a) => a.value === type);
    return actionType?.label || type;
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'dd MMM yyyy à HH:mm:ss', { locale: fr });
    } catch {
      return timestamp;
    }
  };

  const handleExport = (): void => {
    const csv = [
      ['Date', 'Action', 'Utilisateur', 'Description'],
      ...displayedHistory.map((entry) => [
        formatTimestamp(entry.timestamp),
        entry.action,
        entry.userName,
        entry.description,
      ]),
    ]
      .map((row) => row.join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Mon Historique
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {displayedHistory.length} action{displayedHistory.length > 1 ? 's' : ''} affichée{displayedHistory.length > 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={displayedHistory.length === 0}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={() => fetchMyHistory()}
              disabled={isLoading}
              sx={{ bgcolor: alpha('#1565c0', 0.08), color: '#1565c0', borderRadius: 2, '&:hover': { bgcolor: alpha('#1565c0', 0.15) } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565c0' }}>
                {personalStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mes actions totales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                {personalStats.byType['reservation_created'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mes réservations créées
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565c0' }}>
                {personalStats.byType['reservation_validated'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mes validations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#c62828' }}>
                {personalStats.byType['reservation_rejected'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mes refus
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterIcon sx={{ color: '#1565c0' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Filtres</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Rechercher"
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type d'action</InputLabel>
              <Select
                value={filters.type}
                label="Type d'action"
                onChange={(e) => setFilters({ type: e.target.value })}
              >
                {actionTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Période</InputLabel>
              <Select
                value={filters.dateRange}
                label="Période"
                onChange={(e) => setFilters({ dateRange: e.target.value })}
              >
                {dateRanges.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={resetFilters}
              startIcon={<ClearIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {displayedHistory.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <HistoryIcon sx={{ fontSize: 64, opacity: 0.15, mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Aucune action trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Aucune action ne correspond à vos critères de recherche
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#0a2463', 0.04) }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Heure</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détails</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedHistory.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatTimestamp(entry.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getActionLabel(entry.type)}
                      color={getActionColor(entry.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {entry.userName?.[0] || '?'}
                      </Avatar>
                      <Typography variant="body2">{entry.userName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.description || '-'}</Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {entry.details && Object.keys(entry.details).length > 0 ? (
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
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default History;
