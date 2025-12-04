import { useState, useMemo } from 'react';
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
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  MeetingRoom,
  EventAvailable,
  CheckCircle,
  Cancel,
  Pending,
  CalendarMonth,
  Schedule,
  Star,
  AccessTime,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
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
import { reservationsAPI } from '../../api/reservations';
import { roomsAPI } from '../../api/rooms';
import { usersAPI } from '../../api/users';
import { format, startOfMonth, eachDayOfInterval, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#00897b'];

function Statistics() {
  const [periodFilter, setPeriodFilter] = useState('month'); // month, quarter, year

  // Récupération des données
  const { data: reservationsData, isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations', 'admin'],
    queryFn: () => reservationsAPI.getAll(),
  });

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsAPI.getAll,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    select: (data) => Array.isArray(data) ? data : (data.utilisateurs || []),
  });

  const reservations = useMemo(() => 
    Array.isArray(reservationsData?.data) 
      ? reservationsData.data 
      : (Array.isArray(reservationsData) ? reservationsData : []),
    [reservationsData]
  );

  const rooms = useMemo(() => 
    Array.isArray(roomsData) ? roomsData : [],
    [roomsData]
  );

  const users = useMemo(() => 
    Array.isArray(usersData) ? usersData : [],
    [usersData]
  );

  const isLoading = reservationsLoading || roomsLoading || usersLoading;

  // Calcul des statistiques
  const stats = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (periodFilter) {
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = startOfMonth(now);
    }

    const filteredReservations = reservations.filter(r => {
      const resDate = parseISO(r.createdAt || r.date);
      return resDate >= startDate;
    });

    const confirmed = filteredReservations.filter(r => ['confirmee', 'validee'].includes(r.statut)).length;
    const pending = filteredReservations.filter(r => r.statut === 'en_attente').length;
    const rejected = filteredReservations.filter(r => ['rejetee', 'refusee', 'annulee'].includes(r.statut)).length;
    const total = filteredReservations.length;

    const tauxValidation = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0;
    const tauxRejet = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;

    // Réservations par salle
    const reservationsBySalle = {};
    filteredReservations.forEach(r => {
      const salleName = r.salle?.nom || r.Room?.nom || 'Non définie';
      reservationsBySalle[salleName] = (reservationsBySalle[salleName] || 0) + 1;
    });

    // Salles les plus demandées
    const topSalles = Object.entries(reservationsBySalle)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nom, count]) => ({ nom, count }));

    // Évolution par jour (30 derniers jours)
    const last30Days = eachDayOfInterval({
      start: subMonths(now, 1),
      end: now,
    });

    const evolutionData = last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReservations = reservations.filter(r => {
        const resDate = r.date || r.createdAt;
        return resDate?.startsWith(dayStr);
      });

      return {
        date: format(day, 'dd MMM', { locale: fr }),
        total: dayReservations.length,
        confirmees: dayReservations.filter(r => ['confirmee', 'validee'].includes(r.statut)).length,
        enAttente: dayReservations.filter(r => r.statut === 'en_attente').length,
        rejetees: dayReservations.filter(r => ['rejetee', 'refusee', 'annulee'].includes(r.statut)).length,
      };
    });

    // Répartition par statut
    const statutData = [
      { name: 'Confirmées', value: reservations.filter(r => ['confirmee', 'validee'].includes(r.statut)).length },
      { name: 'En attente', value: reservations.filter(r => r.statut === 'en_attente').length },
      { name: 'Rejetées', value: reservations.filter(r => ['rejetee', 'refusee', 'annulee'].includes(r.statut)).length },
    ].filter(s => s.value > 0);

    // Utilisateurs les plus actifs
    const userActivity = {};
    reservations.forEach(r => {
      const userName = `${r.utilisateur?.prenom || ''} ${r.utilisateur?.nom || 'Inconnu'}`.trim();
      userActivity[userName] = (userActivity[userName] || 0) + 1;
    });

    const topUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Taux d'occupation des salles
    const roomOccupancy = rooms.map(room => {
      const roomReservations = reservations.filter(r => 
        r.room_id === room.id && ['confirmee', 'validee'].includes(r.statut)
      ).length;
      
      return {
        nom: room.nom,
        reservations: roomReservations,
        capacite: room.capacite,
        taux: roomReservations > 0 ? ((roomReservations / (total || 1)) * 100).toFixed(1) : 0,
      };
    }).sort((a, b) => b.reservations - a.reservations);

    return {
      total,
      confirmed,
      pending,
      rejected,
      tauxValidation,
      tauxRejet,
      topSalles,
      evolutionData,
      statutData,
      topUsers,
      roomOccupancy,
    };
  }, [reservations, rooms, periodFilter]);

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
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <MenuItem value="month">Ce mois</MenuItem>
            <MenuItem value="quarter">3 derniers mois</MenuItem>
            <MenuItem value="year">12 derniers mois</MenuItem>
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top salles et utilisateurs */}
      <Grid container spacing={3} mb={3}>
        {/* Salles les plus réservées */}
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

        {/* Utilisateurs les plus actifs */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Top 5 - Utilisateurs les plus actifs
            </Typography>
            <List>
              {stats.topUsers.map((user, index) => (
                <Box key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={`${user.count} réservation${user.count > 1 ? 's' : ''}`}
                    />
                    <Chip 
                      label={user.count} 
                      color="primary" 
                      size="small"
                      icon={<Star />}
                    />
                  </ListItem>
                  {index < stats.topUsers.length - 1 && <Divider />}
                </Box>
              ))}
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
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
}

export default Statistics;
