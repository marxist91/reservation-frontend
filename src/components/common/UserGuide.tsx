import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import ReportProblemDialog from './ReportProblemDialog';
import {
  Close as CloseIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  EventNote as ReservationIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as RoomIcon,
  Notifications as NotificationIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Lightbulb as TipIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

interface UserGuideProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
    {value === index && children}
  </Box>
);

const UserGuide: React.FC<UserGuideProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => setActiveStep(0);

  // Étapes du guide rapide
  const quickStartSteps = [
    {
      label: 'Rechercher une salle',
      description: 'Utilisez la page "Rechercher une salle" pour trouver une salle disponible selon vos critères : capacité, équipements, date et horaire souhaités.',
      icon: <SearchIcon />,
      tips: ['Filtrez par capacité pour trouver une salle adaptée', 'Vérifiez les équipements disponibles'],
    },
    {
      label: 'Vérifier la disponibilité',
      description: 'Consultez le calendrier de la salle pour voir les créneaux disponibles. Les créneaux occupés sont affichés en couleur.',
      icon: <CalendarIcon />,
      tips: ['Les créneaux verts sont disponibles', 'Cliquez sur un créneau pour voir les détails'],
    },
    {
      label: 'Faire une demande',
      description: 'Remplissez le formulaire de réservation avec la date, l\'horaire, le motif et le nombre de participants. Votre demande sera envoyée pour validation.',
      icon: <ReservationIcon />,
      tips: ['Précisez le motif pour faciliter la validation', 'Indiquez le bon nombre de participants'],
    },
    {
      label: 'Suivre votre demande',
      description: 'Consultez "Mes Réservations" pour suivre l\'état de vos demandes. Vous recevrez une notification lors de la validation ou du rejet.',
      icon: <NotificationIcon />,
      tips: ['Activez les notifications pour être alerté', 'Vous pouvez annuler une demande en attente'],
    },
  ];

  // Sections du guide détaillé
  const guideSections = [
    {
      title: 'Tableau de bord',
      icon: <DashboardIcon />,
      color: '#1976d2',
      content: [
        { icon: <ViewIcon />, text: 'Vue d\'ensemble de vos réservations du jour' },
        { icon: <ScheduleIcon />, text: 'Accès rapide aux prochaines réservations' },
        { icon: <ReservationIcon />, text: 'Statistiques de vos demandes' },
      ],
    },
    {
      title: 'Rechercher une salle',
      icon: <SearchIcon />,
      color: '#2e7d32',
      content: [
        { icon: <RoomIcon />, text: 'Parcourez toutes les salles disponibles' },
        { icon: <CheckIcon />, text: 'Filtrez par capacité et équipements' },
        { icon: <CalendarIcon />, text: 'Vérifiez la disponibilité en temps réel' },
      ],
    },
    {
      title: 'Mes Réservations',
      icon: <ReservationIcon />,
      color: '#ed6c02',
      content: [
        { icon: <ViewIcon />, text: 'Consultez toutes vos réservations' },
        { icon: <EditIcon />, text: 'Modifiez une réservation en attente' },
        { icon: <CancelIcon />, text: 'Annulez une réservation si nécessaire' },
      ],
    },
    {
      title: 'Calendrier',
      icon: <CalendarIcon />,
      color: '#9c27b0',
      content: [
        { icon: <ViewIcon />, text: 'Vue mensuelle de toutes vos réservations' },
        { icon: <ScheduleIcon />, text: 'Visualisez les créneaux disponibles' },
        { icon: <ReservationIcon />, text: 'Créez une réservation directement' },
      ],
    },
    {
      title: 'Notifications',
      icon: <NotificationIcon />,
      color: '#d32f2f',
      content: [
        { icon: <CheckIcon />, text: 'Réception des validations/rejets' },
        { icon: <InfoIcon />, text: 'Rappels avant vos réservations' },
        { icon: <WarningIcon />, text: 'Alertes en cas de modification' },
      ],
    },
    {
      title: 'Mon Historique',
      icon: <HistoryIcon />,
      color: '#0288d1',
      content: [
        { icon: <ViewIcon />, text: 'Consultez l\'historique de vos actions' },
        { icon: <ReservationIcon />, text: 'Retrouvez vos anciennes réservations' },
        { icon: <SearchIcon />, text: 'Recherchez dans votre historique' },
      ],
    },
  ];

  // FAQ
  const faqItems = [
    {
      id: 'faq1',
      question: 'Comment annuler une réservation ?',
      answer: 'Rendez-vous dans "Mes Réservations", trouvez la réservation concernée et cliquez sur le bouton "Annuler". Vous ne pouvez annuler que vos propres réservations et uniquement si elles sont en attente ou validées (avant la date).',
    },
    {
      id: 'faq2',
      question: 'Combien de temps pour obtenir une validation ?',
      answer: 'Les demandes sont généralement traitées dans les 24-48h ouvrées. Vous recevrez une notification dès que votre demande sera validée ou rejetée.',
    },
    {
      id: 'faq3',
      question: 'Puis-je réserver plusieurs créneaux à la fois ?',
      answer: 'Oui ! Lors de la création d\'une réservation, vous pouvez ajouter plusieurs créneaux horaires pour la même journée ou sélectionner une plage de dates pour des réservations récurrentes.',
    },
    {
      id: 'faq4',
      question: 'Que faire si ma demande est rejetée ?',
      answer: 'Si votre demande est rejetée, vous recevrez une notification avec le motif du rejet. Vous pouvez alors soumettre une nouvelle demande avec un autre créneau ou une autre salle.',
    },
    {
      id: 'faq5',
      question: 'Comment modifier une réservation ?',
      answer: 'Seules les réservations en attente peuvent être modifiées. Allez dans "Mes Réservations", cliquez sur la réservation et utilisez le bouton "Modifier".',
    },
    {
      id: 'faq6',
      question: 'Les équipements sont-ils inclus ?',
      answer: 'Les équipements de base de chaque salle sont inclus. Pour des besoins spécifiques, précisez-les dans le champ "Équipements supplémentaires" du formulaire.',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      {/* En-tête */}
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: alpha('#fff', 0.2),
            width: 48,
            height: 48,
          }}
        >
          <HelpIcon fontSize="large" />
        </Avatar>
        <Box flex={1}>
          <Typography variant="h5" fontWeight="bold">
            Guide d'utilisation
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Système de Réservation de Salles - Port Autonome de Lomé
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<PlayIcon />} label="Démarrage rapide" iconPosition="start" />
            <Tab icon={<RoomIcon />} label="Fonctionnalités" iconPosition="start" />
            <Tab icon={<HelpIcon />} label="FAQ" iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab 1: Démarrage rapide */}
          <TabPanel value={tabValue} index={0}>
            <Fade in={tabValue === 0}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <TipIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body1" color="text.secondary">
                    Suivez ces 4 étapes simples pour effectuer votre première réservation
                  </Typography>
                </Box>

                <Stepper activeStep={activeStep} orientation="vertical">
                  {quickStartSteps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: activeStep >= index ? 'primary.main' : 'grey.300',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {step.icon}
                          </Avatar>
                        )}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {step.label}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          {step.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {step.tips.map((tip, tipIndex) => (
                            <Chip
                              key={tipIndex}
                              icon={<TipIcon />}
                              label={tip}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            size="small"
                          >
                            {index === quickStartSteps.length - 1 ? 'Terminer' : 'Suivant'}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            size="small"
                          >
                            Précédent
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>

                {activeStep === quickStartSteps.length && (
                  <Card sx={{ mt: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        Vous êtes prêt !
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Vous connaissez maintenant les étapes essentielles pour réserver une salle.
                      </Typography>
                      <Button variant="outlined" onClick={handleReset}>
                        Revoir le guide
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Fade>
          </TabPanel>

          {/* Tab 2: Fonctionnalités */}
          <TabPanel value={tabValue} index={1}>
            <Fade in={tabValue === 1}>
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Découvrez toutes les fonctionnalités disponibles dans votre espace
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {guideSections.map((section) => (
                    <Card
                      key={section.title}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 4,
                          borderColor: section.color,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ bgcolor: section.color }}>
                            {section.icon}
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {section.title}
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <List dense disablePadding>
                          {section.content.map((item, index) => (
                            <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32, color: section.color }}>
                                {item.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            </Fade>
          </TabPanel>

          {/* Tab 3: FAQ */}
          <TabPanel value={tabValue} index={2}>
            <Fade in={tabValue === 2}>
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Questions fréquemment posées
                </Typography>

                {faqItems.map((faq) => (
                  <Accordion
                    key={faq.id}
                    expanded={expandedFaq === faq.id}
                    onChange={(_, isExpanded) => setExpandedFaq(isExpanded ? faq.id : false)}
                    sx={{
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px !important',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        '&.Mui-expanded': {
                          bgcolor: 'primary.50',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HelpIcon color="primary" fontSize="small" />
                        <Typography fontWeight="medium">{faq.question}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}

                <Card 
                  sx={{ 
                    mt: 3, 
                    bgcolor: 'info.50', 
                    border: '1px solid', 
                    borderColor: 'info.main',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      borderColor: 'primary.main',
                    }
                  }}
                  onClick={() => setReportProblemOpen(true)}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Besoin d'aide supplémentaire ?
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cliquez ici pour signaler un problème ou contacter l'administrateur.
                      </Typography>
                    </Box>
                    <Chip label="Signaler" color="primary" size="small" />
                  </CardContent>
                </Card>

                <ReportProblemDialog 
                  open={reportProblemOpen} 
                  onClose={() => setReportProblemOpen(false)} 
                />
              </Box>
            </Fade>
          </TabPanel>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UserGuide;
