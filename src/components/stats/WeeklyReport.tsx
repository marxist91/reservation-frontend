import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EventAvailable,
  CheckCircle,
  Pending,
  Cancel,
  MeetingRoom,
  Business,
  CalendarMonth,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { statsAPI, type WeeklyReportData } from '@/api/stats';

const WeeklyReport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const { data: report, isLoading, error, refetch } = useQuery<WeeklyReportData>({
    queryKey: ['weekly-report'],
    queryFn: () => statsAPI.getWeeklyReport(),
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatDayName = (jour: string) => {
    const days: Record<string, string> = {
      'Monday': 'Lundi',
      'Tuesday': 'Mardi',
      'Wednesday': 'Mercredi',
      'Thursday': 'Jeudi',
      'Friday': 'Vendredi',
      'Saturday': 'Samedi',
      'Sunday': 'Dimanche',
    };
    return days[jour] || jour;
  };

  const getEvolutionIcon = (evolution: string) => {
    const value = parseFloat(evolution);
    if (value > 0) return <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />;
    if (value < 0) return <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />;
    return <TrendingFlat sx={{ color: 'text.secondary', fontSize: 20 }} />;
  };

  const getEvolutionColor = (evolution: string) => {
    const value = parseFloat(evolution);
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  const getStatutChip = (statut: string) => {
    const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
      'confirmee': { label: 'Confirmée', color: 'success' },
      'validee': { label: 'Validée', color: 'success' },
      'en_attente': { label: 'En attente', color: 'warning' },
      'rejetee': { label: 'Rejetée', color: 'error' },
      'refusee': { label: 'Refusée', color: 'error' },
      'annulee': { label: 'Annulée', color: 'error' },
    };
    const config = statusMap[statut] || { label: statut, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleExportExcel = () => {
    if (!report) return;

    setIsExporting(true);

    try {
      // Créer le workbook
      const wb = XLSX.utils.book_new();

      // Feuille 1: Résumé
      const resumeData = [
        ['RAPPORT HEBDOMADAIRE DES RÉSERVATIONS'],
        ['Port Autonome de Lomé'],
        [''],
        ['Période:', `${formatDate(report.periode.debut)} au ${formatDate(report.periode.fin)}`],
        ['Généré le:', format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })],
        [''],
        ['RÉSUMÉ'],
        ['Indicateur', 'Valeur', 'Évolution vs semaine précédente'],
        ['Total réservations', report.resume.total, `${report.evolution.total}%`],
        ['Confirmées', report.resume.confirmees, `${report.evolution.confirmees}%`],
        ['En attente', report.resume.en_attente, ''],
        ['Rejetées', report.resume.rejetees, ''],
        ['Taux de validation', `${report.resume.tauxValidation}%`, ''],
      ];
      const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
      wsResume['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

      // Feuille 2: Top Salles
      const sallesData = [
        ['TOP 5 SALLES LES PLUS RÉSERVÉES'],
        [''],
        ['Rang', 'Salle', 'Total', 'Confirmées', 'En attente', 'Rejetées'],
        ...report.topSalles.map((s, i) => [
          i + 1,
          s.nom,
          s.reservations,
          s.confirmees,
          s.en_attente,
          s.rejetees,
        ]),
      ];
      const wsSalles = XLSX.utils.aoa_to_sheet(sallesData);
      wsSalles['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsSalles, 'Top Salles');

      // Feuille 3: Top Départements
      const deptData = [
        ['TOP 5 DÉPARTEMENTS LES PLUS ACTIFS'],
        [''],
        ['Rang', 'Département', 'Total réservations', 'Confirmées'],
        ...report.topDepartments.map((d, i) => [
          i + 1,
          d.name,
          d.reservations,
          d.confirmees,
        ]),
      ];
      const wsDept = XLSX.utils.aoa_to_sheet(deptData);
      wsDept['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 18 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsDept, 'Top Départements');

      // Feuille 4: Évolution journalière
      const dailyData = [
        ['ÉVOLUTION JOURNALIÈRE'],
        [''],
        ['Date', 'Jour', 'Total', 'Confirmées', 'En attente', 'Rejetées'],
        ...report.dailyStats.map((d) => [
          d.date,
          formatDayName(d.jour),
          d.total,
          d.confirmees,
          d.en_attente,
          d.rejetees,
        ]),
      ];
      const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
      wsDaily['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Évolution Journalière');

      // Feuille 5: Liste détaillée des réservations
      const reservationsData = [
        ['LISTE DÉTAILLÉE DES RÉSERVATIONS'],
        [''],
        ['ID', 'Date demande', 'Date réservation', 'Horaire', 'Salle', 'Demandeur', 'Département', 'Motif', 'Statut'],
        ...report.reservations.map((r) => [
          r.id,
          r.date_demande,
          r.date,
          `${r.heure_debut} - ${r.heure_fin}`,
          r.salle,
          r.demandeur,
          r.departement || 'Non renseigné',
          r.motif || '',
          r.statut,
        ]),
      ];
      const wsReservations = XLSX.utils.aoa_to_sheet(reservationsData);
      wsReservations['!cols'] = [
        { wch: 6 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, 
        { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 35 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, wsReservations, 'Réservations');

      // Générer le fichier
      const fileName = `Rapport_Hebdo_Reservations_${report.periode.debut}_${report.periode.fin}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (err) {
      console.error('Erreur export Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !report) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Erreur lors du chargement du rapport hebdomadaire.
        <Button onClick={() => refetch()} sx={{ ml: 2 }}>Réessayer</Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              📊 Rapport Hebdomadaire des Réservations
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Semaine du {formatDate(report.periode.debut)} au {formatDate(report.periode.fin)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Généré le {format(parseISO(report.generatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleExportExcel}
              disabled={isExporting}
              sx={{ bgcolor: '#f9a825', '&:hover': { bgcolor: '#f57f17' } }}
            >
              Exporter Excel
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <EventAvailable sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">{report.resume.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Total réservations</Typography>
                </Box>
                <Box textAlign="right">
                  {getEvolutionIcon(report.evolution.total)}
                  <Typography variant="caption" sx={{ color: getEvolutionColor(report.evolution.total) }}>
                    {report.evolution.total}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{report.resume.confirmees}</Typography>
                  <Typography variant="body2" color="text.secondary">Confirmées</Typography>
                </Box>
                <Box textAlign="right">
                  {getEvolutionIcon(report.evolution.confirmees)}
                  <Typography variant="caption" sx={{ color: getEvolutionColor(report.evolution.confirmees) }}>
                    {report.evolution.confirmees}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Pending sx={{ color: 'warning.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{report.resume.en_attente}</Typography>
                  <Typography variant="body2" color="text.secondary">En attente</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Cancel sx={{ color: 'error.main', fontSize: 32 }} />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">{report.resume.rejetees}</Typography>
                  <Typography variant="body2" color="text.secondary">Rejetées</Typography>
                </Box>
                <Chip 
                  label={`${report.resume.tauxValidation}% validation`} 
                  color="primary" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques et classements */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Évolution journalière */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <CalendarMonth sx={{ mr: 1, verticalAlign: 'middle' }} />
              Évolution journalière
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.dailyStats.map(d => ({ ...d, jour: formatDayName(d.jour) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="confirmees" name="Confirmées" fill="#2e7d32" stackId="a" />
                <Bar dataKey="en_attente" name="En attente" fill="#ed6c02" stackId="a" />
                <Bar dataKey="rejetees" name="Rejetées" fill="#d32f2f" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Répartition par statut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Répartition par statut
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Confirmées', value: report.resume.confirmees },
                    { name: 'En attente', value: report.resume.en_attente },
                    { name: 'Rejetées', value: report.resume.rejetees },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#2e7d32" />
                  <Cell fill="#ed6c02" />
                  <Cell fill="#d32f2f" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Salles et Départements */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Salles */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <MeetingRoom sx={{ mr: 1, verticalAlign: 'middle' }} />
              🏆 Top 5 Salles les plus réservées
            </Typography>
            <List>
              {report.topSalles.map((salle, index) => (
                <ListItem key={salle.id} divider={index < report.topSalles.length - 1}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'grey.300',
                      color: index < 3 ? 'black' : 'white',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={salle.nom}
                    secondary={`${salle.confirmees} confirmées sur ${salle.reservations} demandes`}
                  />
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {salle.reservations}
                  </Typography>
                </ListItem>
              ))}
              {report.topSalles.length === 0 && (
                <ListItem>
                  <ListItemText primary="Aucune réservation cette semaine" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Top Départements */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              🏆 Top 5 Départements les plus actifs
            </Typography>
            <List>
              {report.topDepartments.map((dept, index) => (
                <ListItem key={dept.id || index} divider={index < report.topDepartments.length - 1}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'grey.300',
                      color: index < 3 ? 'black' : 'white',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={dept.name}
                    secondary={`${dept.confirmees} réservations confirmées`}
                  />
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {dept.reservations}
                  </Typography>
                </ListItem>
              ))}
              {report.topDepartments.length === 0 && (
                <ListItem>
                  <ListItemText primary="Aucune réservation cette semaine" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Tableau détaillé des réservations */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          📋 Liste détaillée des réservations ({report.reservations.length})
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>ID</TableCell>
                <TableCell>Date demande</TableCell>
                <TableCell>Date réservation</TableCell>
                <TableCell>Horaire</TableCell>
                <TableCell>Salle</TableCell>
                <TableCell>Demandeur</TableCell>
                <TableCell>Département</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.reservations.slice(0, 20).map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.date_demande}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.heure_debut} - {r.heure_fin}</TableCell>
                  <TableCell>{r.salle}</TableCell>
                  <TableCell>{r.demandeur}</TableCell>
                  <TableCell>{r.departement || '-'}</TableCell>
                  <TableCell>{getStatutChip(r.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {report.reservations.length > 20 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              ... et {report.reservations.length - 20} autres réservations (voir l'export Excel pour la liste complète)
            </Typography>
          )}
          {report.reservations.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              Aucune réservation cette semaine
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default WeeklyReport;
