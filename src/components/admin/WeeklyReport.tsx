import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  TextField,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  CalendarMonth as CalendarIcon,
  MeetingRoom as RoomIcon,
  Business as DepartmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import statsAPI, { type WeeklyReportData, type ReportParams } from '@/api/stats';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type PeriodType = 'week' | 'month' | 'custom';

const WeeklyReport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculer les dates de la période sélectionnée
  const periodDates = useMemo(() => {
    if (periodType === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    
    if (periodType === 'month') {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      };
    }
    
    // Semaine (lundi à dimanche)
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }, [periodType, selectedDate, customStartDate, customEndDate]);

  // Paramètres de l'API
  const apiParams: ReportParams = useMemo(() => ({
    startDate: periodDates.startDate,
    endDate: periodDates.endDate,
    type: periodType === 'month' ? 'month' : 'week',
  }), [periodDates, periodType]);

  // Récupérer le rapport
  const { data: report, isLoading, error, refetch, isFetching } = useQuery<WeeklyReportData>({
    queryKey: ['weekly-report', apiParams],
    queryFn: () => statsAPI.getWeeklyReport(apiParams),
    staleTime: 5 * 60 * 1000,
  });

  // Navigation entre périodes
  const goToPreviousPeriod = () => {
    if (periodType === 'month') {
      setSelectedDate(subMonths(selectedDate, 1));
    } else {
      setSelectedDate(subWeeks(selectedDate, 1));
    }
  };

  const goToNextPeriod = () => {
    if (periodType === 'month') {
      setSelectedDate(addMonths(selectedDate, 1));
    } else {
      setSelectedDate(addWeeks(selectedDate, 1));
    }
  };

  const goToCurrentPeriod = () => {
    setSelectedDate(new Date());
  };

  // Formater le label de la période
  const getPeriodLabel = (): string => {
    if (periodType === 'custom' && customStartDate && customEndDate) {
      return `${formatDisplayDate(customStartDate)} - ${formatDisplayDate(customEndDate)}`;
    }
    if (periodType === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: fr });
    }
    return `Semaine du ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })} au ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}`;
  };

  // Formater les dates d'affichage
  const formatDisplayDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Export Excel avec exceljs
  const handleExportExcel = async () => {
    if (!report) return;
    
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Port Autonome de Lomé';
      workbook.created = new Date();

      // Feuille Résumé
      const sheetTitle = periodType === 'month' ? 'Résumé Mensuel' : 'Résumé Hebdomadaire';
      const summarySheet = workbook.addWorksheet(sheetTitle);
      
      // En-tête
      summarySheet.mergeCells('A1:D1');
      const titleCell = summarySheet.getCell('A1');
      const reportTitle = periodType === 'month' ? 'RAPPORT MENSUEL DES RÉSERVATIONS' : 'RAPPORT HEBDOMADAIRE DES RÉSERVATIONS';
      titleCell.value = reportTitle;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF1976D2' } };
      titleCell.alignment = { horizontal: 'center' };

      summarySheet.mergeCells('A2:D2');
      const periodCell = summarySheet.getCell('A2');
      periodCell.value = `Période: ${formatDisplayDate(report.periode.debut)} - ${formatDisplayDate(report.periode.fin)}`;
      periodCell.font = { italic: true, size: 12 };
      periodCell.alignment = { horizontal: 'center' };

      // Statistiques globales
      summarySheet.getCell('A4').value = 'STATISTIQUES GLOBALES';
      summarySheet.getCell('A4').font = { bold: true, size: 14 };

      const statsData = [
        ['Total Réservations', report.resume.total],
        ['Réservations Confirmées', report.resume.confirmees],
        ['Réservations Rejetées', report.resume.rejetees],
        ['Réservations En Attente', report.resume.en_attente],
        ['Taux de Validation', `${report.resume.tauxValidation}%`],
        ['Évolution vs Semaine Précédente', `${Number(report.evolution.total) >= 0 ? '+' : ''}${report.evolution.total}%`],
      ];

      statsData.forEach((row, index) => {
        summarySheet.getCell(`A${5 + index}`).value = row[0] as string;
        summarySheet.getCell(`B${5 + index}`).value = row[1];
        summarySheet.getCell(`A${5 + index}`).font = { bold: true };
      });

      // Ajuster les colonnes
      summarySheet.columns = [
        { width: 35 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
      ];

      // Feuille Salles Populaires
      const roomsSheet = workbook.addWorksheet('Salles Populaires');
      roomsSheet.addRow(['Rang', 'Salle', 'Réservations', 'Confirmées', 'En Attente', 'Rejetées']);
      roomsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      roomsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      };

      report.topSalles.forEach((salle, index) => {
        roomsSheet.addRow([
          index + 1,
          salle.nom,
          Number(salle.reservations) || 0,
          Number(salle.confirmees) || 0,
          Number(salle.en_attente) || 0,
          Number(salle.rejetees) || 0,
        ]);
      });

      roomsSheet.columns = [
        { width: 10 },
        { width: 40 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];

      // Feuille Départements
      const deptSheet = workbook.addWorksheet('Départements Actifs');
      deptSheet.addRow(['Rang', 'Département', 'Réservations', 'Confirmées']);
      deptSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      deptSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4CAF50' },
      };

      report.topDepartments.forEach((dept, index) => {
        deptSheet.addRow([
          index + 1,
          dept.name,
          Number(dept.reservations) || 0,
          Number(dept.confirmees) || 0,
        ]);
      });

      deptSheet.columns = [
        { width: 10 },
        { width: 45 },
        { width: 15 },
        { width: 15 },
      ];

      // Feuille Statistiques Journalières
      const dailySheet = workbook.addWorksheet('Stats Journalières');
      dailySheet.addRow(['Jour', 'Date', 'Total', 'Confirmées', 'En Attente', 'Rejetées']);
      dailySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      dailySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9C27B0' },
      };

      report.dailyStats.forEach((day) => {
        dailySheet.addRow([
          day.jour,
          day.date,
          day.total,
          day.confirmees,
          day.en_attente,
          day.rejetees,
        ]);
      });

      dailySheet.columns = [
        { width: 15 },
        { width: 15 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
      ];

      // Feuille Détails Réservations
      const detailsSheet = workbook.addWorksheet('Détails Réservations');
      detailsSheet.addRow(['ID', 'Salle', 'Demandeur', 'Département', 'Date', 'Horaire', 'Statut', 'Motif']);
      detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      detailsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF607D8B' },
      };

      report.reservations.forEach((res) => {
        detailsSheet.addRow([
          res.id,
          res.salle,
          res.demandeur,
          res.departement || '-',
          res.date,
          `${res.heure_debut} - ${res.heure_fin}`,
          res.statut,
          res.motif,
        ]);
      });

      detailsSheet.columns = [
        { width: 8 },
        { width: 30 },
        { width: 25 },
        { width: 25 },
        { width: 12 },
        { width: 18 },
        { width: 12 },
        { width: 40 },
      ];

      // Générer le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const reportTypeLabel = periodType === 'month' ? 'mensuel' : 'hebdo';
      const fileName = `rapport_${reportTypeLabel}_${report.periode.debut}_${report.periode.fin}.xlsx`;
      saveAs(blob, fileName);
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

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Erreur lors du chargement du rapport hebdomadaire
      </Alert>
    );
  }

  const evolutionValue = Number(report?.evolution?.total) || 0;

  return (
    <Box>
      {/* Sélecteur de type de période */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            {/* Type de période */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 80 }}>
                Type:
              </Typography>
              <ToggleButtonGroup
                value={periodType}
                exclusive
                onChange={(_, value) => value && setPeriodType(value)}
                size="small"
              >
                <ToggleButton value="week">
                  <CalendarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Semaine
                </ToggleButton>
                <ToggleButton value="month">
                  <DateRangeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Mois
                </ToggleButton>
                <ToggleButton value="custom">
                  Personnalisé
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Navigation ou dates personnalisées */}
            {periodType === 'custom' ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  type="date"
                  size="small"
                  label="Début"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 160 }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="Fin"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 160 }}
                />
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={goToPreviousPeriod} size="small" title="Période précédente">
                  <ChevronLeftIcon />
                </IconButton>
                <Chip 
                  label={getPeriodLabel()} 
                  color="primary" 
                  variant="outlined"
                  sx={{ minWidth: 200, justifyContent: 'center' }}
                />
                <IconButton onClick={goToNextPeriod} size="small" title="Période suivante">
                  <ChevronRightIcon />
                </IconButton>
                <Button size="small" variant="text" onClick={goToCurrentPeriod}>
                  Aujourd'hui
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* En-tête avec période et actions */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {periodType === 'month' ? 'Rapport Mensuel' : 'Rapport Hebdomadaire'}
              </Typography>
              {report && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  <CalendarIcon sx={{ mr: 0.5, fontSize: 16, verticalAlign: 'middle' }} />
                  {formatDisplayDate(report.periode.debut)} - {formatDisplayDate(report.periode.fin)}
                </Typography>
              )}
            </Box>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
                disabled={isFetching}
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' }
                }}
              >
                {isFetching ? 'Chargement...' : 'Actualiser'}
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                onClick={handleExportExcel}
                disabled={!report || isExporting}
              >
                {isExporting ? 'Export...' : 'Exporter Excel'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Cartes de résumé */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #1976d2' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Réservations
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {report.resume.total}
                  </Typography>
                  <Chip
                    size="small"
                    icon={evolutionValue >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={`${evolutionValue >= 0 ? '+' : ''}${report.evolution.total}%`}
                    color={evolutionValue >= 0 ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Confirmées
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {report.resume.confirmees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taux: {report.resume.tauxValidation}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #f44336' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Rejetées
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="error.main">
                    {report.resume.rejetees}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    En Attente
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {report.resume.en_attente}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tableaux détaillés */}
          <Grid container spacing={3}>
            {/* Salles les plus réservées */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <RoomIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Top 5 Salles les Plus Réservées
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salle</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Confirmées</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.topSalles.length > 0 ? (
                          report.topSalles.map((salle, index) => (
                            <TableRow 
                              key={salle.id}
                              sx={{ 
                                bgcolor: index === 0 ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <TableCell>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </TableCell>
                              <TableCell sx={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                {salle.nom}
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={salle.reservations} 
                                  size="small" 
                                  color={index === 0 ? 'primary' : 'default'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={salle.confirmees} 
                                  size="small" 
                                  color="success"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              Aucune réservation cette semaine
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Départements les plus actifs */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <DepartmentIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                    Top 5 Départements les Plus Actifs
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'success.main' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Département</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Confirmées</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.topDepartments.length > 0 ? (
                          report.topDepartments.map((dept, index) => (
                            <TableRow 
                              key={dept.id}
                              sx={{ 
                                bgcolor: index === 0 ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <TableCell>
                                {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </TableCell>
                              <TableCell sx={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                {dept.name}
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={dept.reservations} 
                                  size="small" 
                                  color={index === 0 ? 'success' : 'default'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={dept.confirmees} 
                                  size="small" 
                                  color="success"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              Aucune réservation cette semaine
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Note pour réunion */}
          <Alert severity="info" sx={{ mt: 3 }} icon={<CalendarIcon />}>
            <Typography variant="body2">
              <strong>Réunion des Directeurs (Lundi) :</strong> Ce rapport présente l'évolution des réservations 
              de la semaine du {formatDisplayDate(report.periode.debut)} au {formatDisplayDate(report.periode.fin)}. 
              Cliquez sur "Exporter Excel" pour télécharger le rapport complet avec tous les détails.
            </Typography>
          </Alert>
        </>
      )}
    </Box>
  );
};

export default WeeklyReport;
