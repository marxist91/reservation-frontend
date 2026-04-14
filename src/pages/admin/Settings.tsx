import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  ColorLens as ColorLensIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Repeat as RepeatIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import RecurringMeetingsManager from '../../components/admin/RecurringMeetingsManager';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../api/settings';
import { useThemeStore } from '../../store/themeStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // États pour les paramètres généraux
  const [appName, setAppName] = useState('Système de Réservation de Salles');
  const [appDescription, setAppDescription] = useState('Port Autonome de Lomé');
  const [maxReservationsPerUser, setMaxReservationsPerUser] = useState(5);
  const [maxDaysInAdvance, setMaxDaysInAdvance] = useState(90);
  const [maxBookingDuration, setMaxBookingDuration] = useState(4);

  // États pour les notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notifyOnBooking, setNotifyOnBooking] = useState(true);
  const [notifyOnApproval, setNotifyOnApproval] = useState(true);
  const [notifyOnRejection, setNotifyOnRejection] = useState(true);
  const [notifyOnCancellation, setNotifyOnCancellation] = useState(true);
  const [notifyOnModification, setNotifyOnModification] = useState(true);
  const [reminderBeforeHours, setReminderBeforeHours] = useState(24);
  const [suppressAdminIfResponsableNotified, setSuppressAdminIfResponsableNotified] = useState(true);

  // États pour la sécurité
  const [requireApproval, setRequireApproval] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireUppercase, setRequireUppercase] = useState(true);

  // États pour les horaires
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [breakStartTime, setBreakStartTime] = useState('12:00');
  const [breakEndTime, setBreakEndTime] = useState('13:00');

  // États pour l'apparence
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [secondaryColor, setSecondaryColor] = useState('#dc004e');
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // États pour les emails
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [emailFromName, setEmailFromName] = useState('Système de Réservation');
  const [emailFromAddress, setEmailFromAddress] = useState('noreply@reservation.com');

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getSettings();
      console.log('📊 Settings reçues du backend:', data);
      
      // Général
      setAppName(data.app_name);
      setAppDescription(data.app_description);
      setMaxReservationsPerUser(data.max_reservations_per_user);
      setMaxDaysInAdvance(data.max_days_in_advance);
      setMaxBookingDuration(data.max_booking_duration_hours);
      
      // Notifications
      setEmailNotifications(data.enable_email_notifications);
      setSmsNotifications(data.enable_sms_notifications);
      setNotifyOnBooking(data.notify_on_booking);
      setNotifyOnApproval(data.notify_on_approval);
      setNotifyOnRejection(data.notify_on_rejection);
      setNotifyOnCancellation(data.notify_on_cancellation);
      setNotifyOnModification(data.notify_on_modification);
      setReminderBeforeHours(data.reminder_before_hours);
      // Nouveau réglage: suppression notifications admins
      setSuppressAdminIfResponsableNotified(!!data.suppress_admin_if_responsable_notified);
      
      // Sécurité
      setRequireApproval(data.require_approval);
      setSessionTimeout(data.session_timeout_minutes);
      setPasswordMinLength(data.min_password_length);
      setRequireSpecialChar(data.require_special_char);
      setRequireNumber(data.require_number);
      setRequireUppercase(data.require_uppercase);
      
      // Horaires
      // Parser working_days si c'est une string JSON
      const parsedWorkingDays = typeof data.working_days === 'string' 
        ? JSON.parse(data.working_days) 
        : data.working_days;
      setWorkingDays(parsedWorkingDays);
      setOpeningTime(data.opening_time);
      setClosingTime(data.closing_time);
      setBreakStartTime(data.break_start_time || '12:00');
      setBreakEndTime(data.break_end_time || '13:00');
      
      // Apparence
      setPrimaryColor(data.primary_color);
      setSecondaryColor(data.secondary_color);
      setDarkMode(data.dark_mode);
      setCompactMode(data.compact_mode);
      
      // Email
      setSmtpHost(data.smtp_host || 'smtp.gmail.com');
      setSmtpPort(data.smtp_port);
      setSmtpSecure(data.smtp_secure);
      setSmtpUser(data.smtp_user || '');
      setSmtpPassword(data.smtp_password || '');
      setEmailFromName(data.email_from_name);
      setEmailFromAddress(data.email_from_address || 'noreply@reservation.com');
      
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClearAllReservations = async () => {
    if (confirmText !== 'SUPPRIMER') return;
    setClearLoading(true);
    try {
      const result = await settingsAPI.clearAllReservations();
      toast.success(result.message);
      setClearDialogOpen(false);
      setConfirmText('');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression des réservations');
    } finally {
      setClearLoading(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    try {
      const payload = {
        app_name: appName,
        app_description: appDescription,
        max_reservations_per_user: maxReservationsPerUser,
        max_days_in_advance: maxDaysInAdvance,
        max_booking_duration_hours: maxBookingDuration,
      };
      console.log('💾 Sauvegarde paramètres généraux:', payload);
      const response = await settingsAPI.updateSettings(payload);
      console.log('✅ Réponse backend:', response);
      toast.success('Paramètres généraux sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await settingsAPI.updateSettings({
        enable_email_notifications: emailNotifications,
        enable_sms_notifications: smsNotifications,
        notify_on_booking: notifyOnBooking,
        notify_on_approval: notifyOnApproval,
        notify_on_rejection: notifyOnRejection,
        notify_on_cancellation: notifyOnCancellation,
          notify_on_modification: notifyOnModification,
          suppress_admin_if_responsable_notified: suppressAdminIfResponsableNotified,
        reminder_before_hours: reminderBeforeHours,
      });
      toast.success('Paramètres de notification sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      await settingsAPI.updateSettings({
        require_approval: requireApproval,
        session_timeout_minutes: sessionTimeout,
        min_password_length: passwordMinLength,
        require_special_char: requireSpecialChar,
        require_number: requireNumber,
        require_uppercase: requireUppercase,
      });
      toast.success('Paramètres de sécurité sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleSaveScheduleSettings = async () => {
    try {
      await settingsAPI.updateSettings({
        working_days: workingDays,
        opening_time: openingTime,
        closing_time: closingTime,
        break_start_time: breakStartTime,
        break_end_time: breakEndTime,
      });
      toast.success('Paramètres d\'horaires sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleSaveAppearanceSettings = async () => {
    try {
      await settingsAPI.updateSettings({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        dark_mode: darkMode,
        compact_mode: compactMode,
      });
      // Appliquer immédiatement au thème de l'application
      useThemeStore.getState().applySettings({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        dark_mode: darkMode,
        compact_mode: compactMode,
      });
      toast.success('Paramètres d\'apparence sauvegardés et appliqués');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      await settingsAPI.updateSettings({
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_secure: smtpSecure,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        email_from_name: emailFromName,
        email_from_address: emailFromAddress,
      });
      toast.success('Paramètres d\'email sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleTestEmail = async () => {
    const toastId = toast.loading('Envoi d\'un email de test...');
    try {
      const result = await settingsAPI.sendTestEmail();
      toast.success(result.message, { id: toastId });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erreur lors de l\'envoi de l\'email de test';
      toast.error(message, { id: toastId });
    }
  };

  const toggleWorkingDay = (dayIndex: number) => {
    setWorkingDays(prev => {
      if (!prev || !Array.isArray(prev)) return [dayIndex];
      return prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex];
    });
  };

  const weekDays = [
    { label: 'Lundi', value: 1 },
    { label: 'Mardi', value: 2 },
    { label: 'Mercredi', value: 3 },
    { label: 'Jeudi', value: 4 },
    { label: 'Vendredi', value: 5 },
    { label: 'Samedi', value: 6 },
    { label: 'Dimanche', value: 0 },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={350} height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#1565c0', 0.08),
            mr: 2,
          }}
        >
          <SettingsIcon sx={{ fontSize: 28, color: '#1565c0' }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Paramètres du Système
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configuration et personnalisation de l'application
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{ sx: { bgcolor: '#1565c0', height: 3, borderRadius: '3px 3px 0 0' } }}
          sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}
        >
          <Tab icon={<SettingsIcon />} label="Général" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Sécurité" />
          <Tab icon={<ScheduleIcon />} label="Horaires" />
          <Tab icon={<RepeatIcon />} label="Réunions récurrentes" />
          <Tab icon={<ColorLensIcon />} label="Apparence" />
          <Tab icon={<EmailIcon />} label="Email" />
        </Tabs>

        {/* Onglet Général */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
                    Informations de l'application
                  </Typography>
                  <TextField
                    fullWidth
                    label="Nom de l'application"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    margin="normal"
                    multiline
                    rows={3}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
                    Limites de réservation
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="Nombre max de réservations par utilisateur"
                    value={maxReservationsPerUser}
                    onChange={(e) => setMaxReservationsPerUser(Number(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 1, max: 50 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Jours maximum à l'avance"
                    value={maxDaysInAdvance}
                    onChange={(e) => setMaxDaysInAdvance(Number(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 1, max: 365 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Durée max de réservation (heures)"
                    value={maxBookingDuration}
                    onChange={(e) => setMaxBookingDuration(Number(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 30, step: 30 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Réinitialiser
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveGeneralSettings} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>
                  Sauvegarder
                </Button>
              </Box>
            </Grid>

            {/* Zone de danger */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '2px solid', borderColor: 'error.main', mt: 2, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" color="error" sx={{ fontWeight: 700 }} gutterBottom>
                    Zone de danger
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Cette action est irréversible. Seules les réservations <strong>passées</strong> seront supprimées.
                    Les réservations futures et les réunions récurrentes seront conservées.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setClearDialogOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Vider les réservations passées
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Dialog de confirmation */}
          <Dialog open={clearDialogOpen} onClose={() => { setClearDialogOpen(false); setConfirmText(''); }} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
            <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>🗑️ Confirmer la suppression</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Vous êtes sur le point de supprimer toutes les réservations <strong>passées</strong> de la base de données.
                Les réservations futures et récurrentes ne seront <strong>pas affectées</strong>.
                Cette action est <strong>irréversible</strong>.
              </DialogContentText>
              <DialogContentText sx={{ mb: 2 }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </DialogContentText>
              <TextField
                autoFocus
                fullWidth
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                variant="outlined"
                size="small"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setClearDialogOpen(false); setConfirmText(''); }} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Annuler
              </Button>
              <Button
                onClick={handleClearAllReservations}
                color="error"
                variant="contained"
                disabled={confirmText !== 'SUPPRIMER' || clearLoading}
                startIcon={clearLoading ? <Skeleton variant="circular" width={20} height={20} /> : <DeleteForeverIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {clearLoading ? 'Suppression...' : 'Tout supprimer'}
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>

        {/* Onglet Notifications */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Canaux de notification
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                    }
                    label="Notifications par email"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                      />
                    }
                    label="Notifications par SMS"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Événements à notifier
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifyOnBooking}
                        onChange={(e) => setNotifyOnBooking(e.target.checked)}
                      />
                    }
                    label="Nouvelle réservation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifyOnApproval}
                        onChange={(e) => setNotifyOnApproval(e.target.checked)}
                      />
                    }
                    label="Validation de réservation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifyOnRejection}
                        onChange={(e) => setNotifyOnRejection(e.target.checked)}
                      />
                    }
                    label="Refus de réservation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifyOnCancellation}
                        onChange={(e) => setNotifyOnCancellation(e.target.checked)}
                      />
                    }
                    label="Annulation de réservation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifyOnModification}
                        onChange={(e) => setNotifyOnModification(e.target.checked)}
                      />
                    }
                    label="Modification de réservation"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={suppressAdminIfResponsableNotified}
                        onChange={(e) => setSuppressAdminIfResponsableNotified(e.target.checked)}
                      />
                    }
                    label="Ne pas notifier les admins si le responsable est déjà notifié"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Rappel avant réservation (heures)"
                    value={reminderBeforeHours}
                    onChange={(e) => setReminderBeforeHours(Number(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 0, max: 168 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Réinitialiser
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotificationSettings} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>
                  Sauvegarder
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Sécurité */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contrôle d'accès
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={requireApproval}
                        onChange={(e) => setRequireApproval(e.target.checked)}
                      />
                    }
                    label="Validation obligatoire des réservations"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Timeout de session (minutes)"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 5, max: 480 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Politique de mot de passe
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="Longueur minimale du mot de passe"
                    value={passwordMinLength}
                    onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 6, max: 20 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={requireSpecialChar}
                        onChange={(e) => setRequireSpecialChar(e.target.checked)}
                      />
                    }
                    label="Caractères spéciaux obligatoires"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={requireNumber}
                        onChange={(e) => setRequireNumber(e.target.checked)}
                      />
                    }
                    label="Chiffres obligatoires"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={requireUppercase}
                        onChange={(e) => setRequireUppercase(e.target.checked)}
                      />
                    }
                    label="Majuscules obligatoires"
                  />
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Politique de sécurité pour les nouveaux mots de passe
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Réinitialiser
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSecuritySettings} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>
                  Sauvegarder
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Horaires */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Jours de travail
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} my={2}>
                    {weekDays.map((day) => (
                      <Chip
                        key={day.value}
                        label={day.label}
                        onClick={() => toggleWorkingDay(day.value)}
                        color={workingDays?.includes(day.value) ? 'primary' : 'default'}
                        variant={workingDays?.includes(day.value) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Horaires d'ouverture
                  </Typography>
                  <TextField
                    fullWidth
                    type="time"
                    label="Heure d'ouverture"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    type="time"
                    label="Heure de fermeture"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pause déjeuner
                  </Typography>
                  <TextField
                    fullWidth
                    type="time"
                    label="Début de la pause"
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    type="time"
                    label="Fin de la pause"
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Réinitialiser
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveScheduleSettings} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>
                  Sauvegarder
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Réunions Récurrentes */}
        <TabPanel value={tabValue} index={4}>
          <RecurringMeetingsManager />
        </TabPanel>

        {/* Onglet Apparence */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Couleurs du thème
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} my={2}>
                    <TextField
                      type="color"
                      label="Couleur primaire"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      sx={{ width: 100 }}
                    />
                    <Typography>{primaryColor}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2} my={2}>
                    <TextField
                      type="color"
                      label="Couleur secondaire"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      sx={{ width: 100 }}
                    />
                    <Typography>{secondaryColor}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Options d'affichage
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                      />
                    }
                    label="Mode sombre"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={compactMode}
                        onChange={(e) => setCompactMode(e.target.checked)}
                      />
                    }
                    label="Mode compact"
                  />
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Les changements de thème seront appliqués immédiatement après sauvegarde
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Réinitialiser
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveAppearanceSettings} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>
                  Sauvegarder
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Email */}
        <TabPanel value={tabValue} index={6}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning">
                Ces paramètres permettent de configurer l'envoi d'emails. Assurez-vous d'utiliser des informations correctes.
              </Alert>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration SMTP
                  </Typography>
                  <TextField
                    fullWidth
                    label="Serveur SMTP"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Port SMTP"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    margin="normal"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                      />
                    }
                    label="SSL/TLS"
                  />
                  <TextField
                    fullWidth
                    label="Nom d'utilisateur"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Mot de passe"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    margin="normal"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informations de l'expéditeur
                  </Typography>
                  <TextField
                    fullWidth
                    label="Email de l'expéditeur"
                    value={emailFromAddress}
                    onChange={(e) => setEmailFromAddress(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Nom de l'expéditeur"
                    value={emailFromName}
                    onChange={(e) => setEmailFromName(e.target.value)}
                    margin="normal"
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmailIcon />}
                    onClick={handleTestEmail}
                    sx={{ mt: 2 }}
                  >
                    Envoyer un email de test
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Réinitialiser
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveEmailSettings} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)', '&:hover': { background: 'linear-gradient(135deg, #0a2463 0%, #1565c0 100%)' } }}>
                  Sauvegarder
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
