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
  Skeleton,
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
import { alpha } from '@mui/material/styles';
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
import type { Room } from '@/types';
import { format, startOfMonth, subMonths, parseISO, endOfMonth } from 'date-fns';
import WeeklyReport from '@/components/admin/WeeklyReport';
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
  const rooms: Room[] = Array.isArray(roomsData) ? roomsData : [];

  // Récupérer tous les utilisateurs (pour le vrai total)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 0, 10000, ''],
    queryFn: () => usersAPI.getAll({ page: 0, perPage: 10000 }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const users = usersData?.utilisateurs || [];
  const totalUsers = usersData?.total ?? users.length;

  

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
      <Box sx={{ width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Skeleton variant="text" width={320} height={48} />
          <Skeleton variant="rounded" width={200} height={40} />
        </Box>
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3,
            background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(10, 36, 99, 0.25)',
          }}>
            <TrendingUp sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Statistiques et Analytiques
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vue d'ensemble des performances et tendances
            </Typography>
          </Box>
        </Box>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: alpha('#0a2463', 0.04), borderRadius: 3, px: 2, py: 1,
          border: '1px solid', borderColor: 'divider',
        }}>
          <FormControl size="small" sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}>
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
          {periodFilter === 'custom' && (
            <>
              <DatePicker
                label="Début"
                value={customStart ? parseISO(customStart) : null}
                onChange={(d: any) => { setCustomStart(d ? format(d, 'yyyy-MM-dd') : ''); setPage(1); }}
                slotProps={{ textField: { size: 'small', sx: { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } } } }}
              />
              <DatePicker
                label="Fin"
                value={customEnd ? parseISO(customEnd) : null}
                onChange={(d: any) => { setCustomEnd(d ? format(d, 'yyyy-MM-dd') : ''); setPage(1); }}
                slotProps={{ textField: { size: 'small', sx: { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } } } }}
              />
            </>
          )}
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        {[
          { label: 'Total Réservations', value: stats.total, sub: 'Période sélectionnée', icon: <EventAvailable />, gradient: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', shadow: 'rgba(10, 36, 99, 0.3)' },
          { label: 'Confirmées', value: stats.confirmed, sub: `${stats.tauxValidation}% taux de validation`, icon: <CheckCircle />, gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', shadow: 'rgba(46, 125, 50, 0.3)' },
          { label: 'En Attente', value: stats.pending, sub: 'Nécessite validation', icon: <Pending />, gradient: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)', shadow: 'rgba(230, 81, 0, 0.3)' },
          { label: 'Rejetées', value: stats.rejected, sub: `${stats.tauxRejet}% taux de rejet`, icon: <Cancel />, gradient: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)', shadow: 'rgba(198, 40, 40, 0.3)' },
        ].map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={kpi.label}>
            <Card elevation={0} sx={{
              background: kpi.gradient,
              color: 'white',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 8px 24px ${kpi.shadow}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${kpi.shadow}` },
            }}>
              {/* Decorative circle */}
              <Box sx={{
                position: 'absolute', top: -20, right: -20,
                width: 100, height: 100, borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)',
              }} />
              <Box sx={{
                position: 'absolute', bottom: -30, right: 30,
                width: 70, height: 70, borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.05)',
              }} />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500, letterSpacing: '0.02em' }}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, lineHeight: 1.1 }}>
                      {kpi.value}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.75, mt: 1, display: 'block' }}>
                      {kpi.sub}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', width: 52, height: 52 }}>
                    {kpi.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats supplémentaires */}
      <Grid container spacing={2.5} mb={4}>
        {[
          { label: 'Utilisateurs actifs', value: totalUsers, icon: <People />, color: '#1565c0', bg: alpha('#1565c0', 0.08) },
          { label: 'Salles disponibles', value: rooms.length, icon: <MeetingRoom />, color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
          { label: 'Réservations par salle', value: (stats.total / (rooms.length || 1)).toFixed(1), icon: <CalendarMonth />, color: '#ed6c02', bg: alpha('#ed6c02', 0.08) },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'border-color 0.2s', '&:hover': { borderColor: item.color } }}>
              <CardContent sx={{ py: 2.5 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: item.bg, color: item.color, width: 48, height: 48 }}>
                    {item.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1, color: item.color }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={2.5} mb={4}>
        {/* Évolution des réservations */}
        {}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #1565c0, #0a2463)' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Évolution des réservations
                </Typography>
              </Box>
              <Chip label="30 derniers jours" size="small" sx={{ bgcolor: alpha('#1565c0', 0.08), color: '#1565c0', fontWeight: 600, borderRadius: 2 }} />
            </Box>
            <Box sx={{ px: 3, pb: 3, pt: 1 }}>
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
            </Box>
          </Paper>
        </Grid>

        {/* Répartition par statut */}
        {}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #9c27b0, #6a1b9a)' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Répartition par statut
              </Typography>
            </Box>
            <Box sx={{ px: 3, pb: 3, pt: 1 }}>
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
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Stat tabs" sx={{
          px: 2, bgcolor: alpha('#0a2463', 0.02),
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 },
          '& .MuiTabs-indicator': { bgcolor: '#1565c0', height: 3, borderRadius: '3px 3px 0 0' },
        }}>
          <Tab label="Général" />
          <Tab label="Par département" />
          <Tab label="Rapport Hebdo" />
        </Tabs>
      </Paper>

      {/* Onglet Rapport Hebdomadaire */}
      {activeTab === 2 && (
        <WeeklyReport />
      )}

      {/* Top salles et utilisateurs */}
      <Grid container spacing={3} mb={3}>
        {/* Show department tab only when selected */}
        {activeTab === 1 && (
          <Grid size={{ xs: 12, md: 12 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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
                  <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3, width: '100%' }} />
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
                        <Button size="small" variant="outlined" onClick={() => exportCSV(((deptStatsData as any)?.data) || [])} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Exporter CSV</Button>
                      </Stack>
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</TableCell>
                          <TableCell sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Département</TableCell>
                          <TableCell align="right" sx={{ bgcolor: alpha('#0a2463', 0.04), fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Réservations</TableCell>
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
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #1565c0, #0a2463)' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Top 5 - Salles les plus réservées
              </Typography>
            </Box>
            <Box sx={{ px: 3, pb: 3, pt: 1 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topSalles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nom" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" name="Réservations" />
              </BarChart>
            </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Départements les plus actifs */}
        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #2e7d32, #1b5e20)' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Top 5 - Départements les plus actifs
              </Typography>
            </Box>
            <List sx={{ px: 1 }}>
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
                      size="small"
                      sx={{ bgcolor: alpha(COLORS[index % COLORS.length], 0.1), color: COLORS[index % COLORS.length], fontWeight: 700, borderRadius: 2 }}
                      icon={<Star sx={{ color: `${COLORS[index % COLORS.length]} !important` }} />}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Taux d'occupation des salles */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #ed6c02, #e65100)' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Taux d'occupation des salles
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {stats.roomOccupancy.map((room, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.nom || index}>
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#0a2463', 0.01), transition: 'border-color 0.2s', '&:hover': { borderColor: parseFloat(room.taux) > 75 ? '#d32f2f' : parseFloat(room.taux) > 50 ? '#ed6c02' : '#2e7d32' } }}>
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
        </Box>
      </Paper>
    </Box>
  );
};

export default Statistics;
