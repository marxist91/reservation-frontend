import { useState, useMemo, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  
  SelectChangeEvent,
  
} from '@mui/material';
import {
  TrendingUp,
  People,
  MeetingRoom,
  EventAvailable,
  CheckCircle,
  Cancel,
  Pending,
  CalendarMonth,
  Star,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Stack from '@mui/material/Stack';
import { statsAPI } from '@/api/stats';
import { roomsAPI } from '@/api/rooms';
import { usersAPI } from '@/api/users';
import type { Room, User } from '@/types';
import { format, startOfMonth, subMonths, parseISO, endOfMonth } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers';
import TablePagination from '@mui/material/TablePagination';
import { fr } from 'date-fns/locale';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#00897b'];

type PeriodFilter = 'month' | 'quarter' | 'year' | 'custom';

interface TopSalle {
  nom: string;
  count: number;
}

interface EvolutionDataPoint {
  date: string;
  total: number;
  confirmees: number;
  enAttente: number;
  rejetees: number;
}

interface StatutDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface TopDepartment {
  name: string;
  count: number;
}

interface RoomOccupancy {
  nom: string;
  reservations: number;
  capacite: number;
  taux: string;
}

interface StatsData {
  total: number;
  confirmed: number;
  pending: number;
  rejected: number;
  tauxValidation: string;
  tauxRejet: string;
  topSalles: TopSalle[];
  evolutionData: EvolutionDataPoint[];
  statutData: StatutDataPoint[];
  topDepartments: TopDepartment[];
  roomOccupancy: RoomOccupancy[];
}

const Statistics: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [deptStatutFilter, setDeptStatutFilter] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalDepartments, setTotalDepartments] = useState<number>(0);

  // Récupération des données

  const { data: roomsData, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<any>({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    select: (data) => Array.isArray(data) ? data : (data.utilisateurs || []),
  });

  // reservations list is available via reservationsData if needed; no local computation required

  const rooms: Room[] = useMemo(() => 
    Array.isArray(roomsData) ? roomsData : [],
    [roomsData]
  );

  const users: User[] = useMemo(() => 
    Array.isArray(usersData) ? usersData : [],
    [usersData]
  );

  

  // Récupération des statistiques par département depuis le backend
  const computeDateRange = (period: PeriodFilter) => {
    const now = new Date();
    let start: Date;
    switch (period) {
      case 'month':
        start = startOfMonth(now);
        break;
      case 'quarter':
        start = subMonths(now, 3);
        break;
      case 'year':
        start = subMonths(now, 12);
        break;
      case 'custom':
        if (customStart && customEnd) {
          return { startStr: customStart, endStr: customEnd };
        }
        // fallback to month if custom values missing
        start = startOfMonth(now);
        break;
      default:
        start = startOfMonth(now);
    }
    const startStr = format(start, 'yyyy-MM-dd');
    // make end of period inclusive to cover reservations later in the month
    const end = endOfMonth(now);
    const endStr = format(end, 'yyyy-MM-dd');
    return { startStr, endStr };
  };

  const { startStr, endStr } = computeDateRange(periodFilter);

  const queryKey = ['stats', 'reservationsByDepartment', periodFilter, deptStatutFilter, customStart, customEnd, page, pageSize];

  const buildParams = () => {
    const p: any = { startDate: startStr, endDate: endStr, page, pageSize };
    if (deptStatutFilter) p.statut = deptStatutFilter;
    return p;
  };

  const { data: deptStatsData, isLoading: deptStatsLoading } = useQuery<{ data: any[]; total?: number } | undefined>({
    queryKey,
    queryFn: () => statsAPI.getReservationsByDepartment(buildParams()),
    enabled: true,
  });

  // update total when data changes
  useEffect(() => {
    const d = deptStatsData as any;
    if (d && typeof d.total !== 'undefined') setTotalDepartments(Number(d.total));
    else setTotalDepartments(Array.isArray(d?.data) ? d.data.length : 0);
  }, [deptStatsData]);

  const exportCSV = (rows: any[]) => {
    if (!rows || !rows.length) return;
    const headers = ['Département', 'Réservations'];
    const csv = [headers.join(',')].concat(rows.map(r => `${JSON.stringify(r.department_name)} , ${r.count}`)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departements_stats_${startStr}_to_${endStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch all statistics from backend overview endpoint
  const { data: overviewData, isLoading: overviewLoading } = useQuery<any>({
    queryKey: ['stats', 'overview', periodFilter, deptStatutFilter, customStart, customEnd],
    queryFn: () => statsAPI.getOverview({ startDate: startStr, endDate: endStr, statut: deptStatutFilter }),
    enabled: true,
  });

  const isLoading = roomsLoading || usersLoading || overviewLoading || deptStatsLoading;

  const stats: StatsData = useMemo(() => {
    const o: any = overviewData || {};
    const total = Number(o.total || 0);
    const confirmed = Number(o.confirmed || 0);
    const pending = Number(o.pending || 0);
    const rejected = Number(o.rejected || 0);

    // Map topSalles to expected shape
    const topSalles: TopSalle[] = (o.topSalles || []).map((s: any) => ({ nom: s.nom || 'N/A', count: Number(s.count || 0) }));

    // evolutionData from backend: convert date to formatted label for the chart
    const evolutionData: EvolutionDataPoint[] = (o.evolutionData || []).map((d: any) => ({
      date: format(new Date(d.day), 'dd MMM', { locale: fr }),
      total: Number(d.total || 0),
      confirmees: Number(d.confirmees || 0),
      enAttente: Number(d.enAttente || 0),
      rejetees: Number(d.rejetees || 0),
    }));

    // Aggregate statut data into friendly groups (Confirmées includes 'confirmee' and 'validee')
    const statutMap: Record<string, number> = {};
    (o.statutData || []).forEach((s: any) => {
      const raw = String(s.name || '').toLowerCase();
      const val = Number(s.value || 0);
      if (['confirmee', 'validee'].includes(raw)) {
        statutMap['Confirmées'] = (statutMap['Confirmées'] || 0) + val;
      } else if (['rejetee', 'refusee', 'annulee'].includes(raw)) {
        statutMap['Rejetées'] = (statutMap['Rejetées'] || 0) + val;
      } else if (raw === 'en_attente' || raw === 'pending') {
        statutMap['En attente'] = (statutMap['En attente'] || 0) + val;
      } else if (raw === 'terminee') {
        statutMap['Terminées'] = (statutMap['Terminées'] || 0) + val;
      } else {
        statutMap['Autres'] = (statutMap['Autres'] || 0) + val;
      }
    });
    const statutData: StatutDataPoint[] = Object.entries(statutMap).map(([name, value]) => ({ name, value }));

    const topDepartments: TopDepartment[] = (o.topDepartments || []).map((d: any) => ({ name: d.department_name || d.name || 'Non renseigné', count: Number(d.count || 0) }));

    const roomOccupancy: RoomOccupancy[] = (o.roomOccupancy || []).map((r: any) => ({
      nom: r.nom || 'N/A',
      reservations: Number(r.reservations || 0),
      capacite: Number(r.capacite || 0),
      taux: ((Number(r.reservations || 0) / (total || 1)) * 100).toFixed(1),
    }));

    return {
      total,
      confirmed,
      pending,
      rejected,
      tauxValidation: o.tauxValidation ?? '0',
      tauxRejet: o.tauxRejet ?? '0',
      topSalles,
      evolutionData,
      statutData,
      topDepartments,
      roomOccupancy,
    };
  }, [overviewData, periodFilter, rooms]);

  const handlePeriodChange = (event: SelectChangeEvent<PeriodFilter>): void => {
    setPeriodFilter(event.target.value as PeriodFilter);
  };

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDeptStatutChange = (e: SelectChangeEvent<string>) => {
    setDeptStatutFilter(e.target.value as string);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          📊 Statistiques et Analytiques
        </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Période</InputLabel>
          <Select
            value={periodFilter}
            label="Période"
            onChange={handlePeriodChange}
          >
            <MenuItem value="month">Ce mois</MenuItem>
            <MenuItem value="quarter">3 derniers mois</MenuItem>
                    <MenuItem value="year">12 derniers mois</MenuItem>
                    <MenuItem value="custom">Plage personnalisée</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Réservations
                  </Typography>
                  <Typography variant="h3" fontWeight={700} mt={1}>
                    {stats.total}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp fontSize="small" />
                    <Typography variant="caption" ml={0.5}>
                      Période sélectionnée
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <EventAvailable />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: 'white',
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Confirmées
                  </Typography>
                  <Typography variant="h3" fontWeight={700} mt={1}>
                    {stats.confirmed}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="caption">
                      {stats.tauxValidation}% taux de validation
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
            color: 'white',
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    En Attente
                  </Typography>
                  <Typography variant="h3" fontWeight={700} mt={1}>
                    {stats.pending}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="caption">
                      Nécessite validation
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Pending />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
            color: 'white',
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Rejetées
                  </Typography>
                  <Typography variant="h3" fontWeight={700} mt={1}>
                    {stats.rejected}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="caption">
                      {stats.tauxRejet}% taux de rejet
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Cancel />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats supplémentaires */}
      <Grid container spacing={3} mb={3}>
        {}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {users.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilisateurs actifs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                  <MeetingRoom />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {rooms.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Salles disponibles
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                  <CalendarMonth />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {(stats.total / (rooms.length || 1)).toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Réservations par salle
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3} mb={3}>
        {/* Évolution des réservations */}
        {}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Évolution des réservations (30 derniers jours)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.evolutionData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConfirm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="total" stroke="#1976d2" fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                <Area type="monotone" dataKey="confirmees" stroke="#2e7d32" fillOpacity={1} fill="url(#colorConfirm)" name="Confirmées" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Répartition par statut */}
        {}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Répartition par statut
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statutData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statutData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="Stat tabs" sx={{ mb: 2 }}>
        <Tab label="Général" />
        <Tab label="Par département" />
      </Tabs>

      {/* Top salles et utilisateurs */}
      <Grid container spacing={3} mb={3}>
        {/* Show department tab only when selected */}
        {activeTab === 1 && (
          <Grid size={{ xs: 12, md: 12 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" gap={2} alignItems="center" mb={2}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Période</InputLabel>
                  <Select value={periodFilter} label="Période" onChange={handlePeriodChange}>
                    <MenuItem value="month">Ce mois</MenuItem>
                    <MenuItem value="quarter">3 derniers mois</MenuItem>
                    <MenuItem value="year">12 derniers mois</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Statut</InputLabel>
                  <Select value={deptStatutFilter} label="Statut" onChange={handleDeptStatutChange}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="en_attente">En attente</MenuItem>
                    <MenuItem value="validee">Validées</MenuItem>
                    <MenuItem value="annulee">Annulée</MenuItem>
                    <MenuItem value="rejetee">Rejetée</MenuItem>
                  </Select>
                </FormControl>
                {periodFilter === 'custom' && (
                  <Box display="flex" gap={2} alignItems="center">
                    <DatePicker
                      label="Date début"
                      value={customStart ? parseISO(customStart) : null}
                      onChange={(d: any) => {
                        const v = d ? format(d, 'yyyy-MM-dd') : '';
                        setCustomStart(v);
                        setPage(1);
                      }}
                      slotProps={{ textField: { size: 'small' } }}
                    />
                    <DatePicker
                      label="Date fin"
                      value={customEnd ? parseISO(customEnd) : null}
                      onChange={(d: any) => {
                        const v = d ? format(d, 'yyyy-MM-dd') : '';
                        setCustomEnd(v);
                        setPage(1);
                      }}
                      slotProps={{ textField: { size: 'small' } }}
                    />
                  </Box>
                )}
              </Box>

              <Typography variant="h6" fontWeight={600} mb={1}>
                Top départements (par nombre de réservations)
              </Typography>

              {deptStatsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
                  <CircularProgress />
                </Box>
                  ) : (
                <Box>
                  {/** Use server data (deptStatsData) or overview topDepartments as fallback. Render departments on X axis and color per department */}
                  {(() => {
                    const serverRows = ((deptStatsData as any)?.data) || [];
                    const hasServer = Array.isArray(serverRows) && serverRows.length > 0;
                    const deptData = hasServer ? serverRows : (overviewData?.topDepartments || stats.topDepartments).map((d: any) => ({ department_name: d.department_name || d.name, count: d.count }));
                    return (
                      <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={deptData} barCategoryGap="5%" barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="department_name" type="category" angle={-20} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Réservations" barSize={14}>
                            {deptData.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                
                    {/* Table + Export buttons */}
                    <Box mt={2} mb={1} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1">Détail départements</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => exportCSV(((deptStatsData as any)?.data) || [])}>Exporter CSV</Button>
                      </Stack>
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Département</TableCell>
                          <TableCell align="right">Réservations</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                          {(((deptStatsData as any)?.data && (deptStatsData as any).data.length > 0) ? (deptStatsData as any).data : stats.topDepartments.map((d: any) => ({ department_name: d.name, count: d.count }))).map((row: any, idx: number) => (
                            <TableRow key={row.department_id || row.department_name || idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>{row.department_name}</TableCell>
                              <TableCell align="right">{row.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                    </Table>

                    {/* Pagination controls (TablePagination provides rowsPerPage + page controls) */}
                    <Box display="flex" alignItems="center" justifyContent="flex-end" mt={2}>
                    <TablePagination
                      component="div"
                      count={totalDepartments || 0}
                      page={Math.max(0, page - 1)}
                      onPageChange={(_, newPage) => setPage(newPage + 1)}
                      rowsPerPage={pageSize}
                      onRowsPerPageChange={(e) => { const v = parseInt((e.target as HTMLInputElement).value, 10); setPageSize(v); setPage(1); }}
                      rowsPerPageOptions={[10, 20, 50, 100]}
                    />
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
        {/* Salles les plus réservées */}
        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Top 5 - Salles les plus réservées
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topSalles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nom" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" name="Réservations" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Départements les plus actifs */}
        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Top 5 - Départements les plus actifs
            </Typography>
            <List>
              {(((deptStatsData as any)?.data) || stats.topDepartments).slice(0, 5).map((dept: any, index: number) => {
                // dept may be either { department_name, count } from server
                // or { name, count } from local stats
                const name = dept.department_name ?? dept.name ?? `Département ${index + 1}`;
                const count = dept.count ?? dept.count ?? 0;
                return (
                  <ListItem key={name || index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={name}
                      secondary={`${count} réservation${count > 1 ? 's' : ''}`}
                    />
                    <Chip 
                      label={count} 
                      color="primary" 
                      size="small"
                      icon={<Star />}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Taux d'occupation des salles */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Taux d'occupation des salles
        </Typography>
        <Grid container spacing={2}>
          {stats.roomOccupancy.map((room, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.nom || index}>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {room.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.reservations} réservations
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(parseFloat(room.taux), 100)} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 5,
                      bgcolor: 'rgba(25, 118, 210, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: parseFloat(room.taux) > 75 ? '#d32f2f' : parseFloat(room.taux) > 50 ? '#ed6c02' : '#2e7d32'
                      }
                    }}
                  />
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Capacité: {room.capacite} pers.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {room.taux}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Statistics;
