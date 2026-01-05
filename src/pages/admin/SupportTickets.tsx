import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  BugReport as BugIcon,
  Lightbulb as SuggestionIcon,
  Help as QuestionIcon,
  MeetingRoom as RoomIcon,
  Search as SearchIcon,
  Reply as ReplyIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import apiClient from '@/api/client';

interface Ticket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  category: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: number;
  admin_name: string;
  message: string;
  created_at: string;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  bug: { icon: <BugIcon />, color: '#d32f2f', label: 'Bug' },
  suggestion: { icon: <SuggestionIcon />, color: '#ff9800', label: 'Suggestion' },
  question: { icon: <QuestionIcon />, color: '#2196f3', label: 'Question' },
  room_issue: { icon: <RoomIcon />, color: '#9c27b0', label: 'Problème salle' },
  general: { icon: <QuestionIcon />, color: '#607d8b', label: 'Général' },
};

const priorityConfig: Record<string, { color: 'error' | 'warning' | 'info' | 'success'; label: string }> = {
  urgent: { color: 'error', label: 'Urgent' },
  high: { color: 'warning', label: 'Haute' },
  normal: { color: 'info', label: 'Normale' },
  low: { color: 'success', label: 'Basse' },
};

const statusConfig: Record<string, { color: 'error' | 'warning' | 'success' | 'default'; label: string; icon: React.ReactNode }> = {
  open: { color: 'warning', label: 'Ouvert', icon: <PendingIcon /> },
  in_progress: { color: 'error', label: 'En cours', icon: <PendingIcon /> },
  resolved: { color: 'success', label: 'Résolu', icon: <ResolvedIcon /> },
  closed: { color: 'default', label: 'Fermé', icon: <CloseIcon /> },
};

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/support/tickets');
      // Le backend renvoie directement un tableau de tickets
      // S'assurer que responses est toujours un tableau
      const rawTickets = Array.isArray(response.data) ? response.data : [];
      const parsedTickets = rawTickets.map((ticket: any) => ({
        ...ticket,
        responses: Array.isArray(ticket.responses) 
          ? ticket.responses 
          : (typeof ticket.responses === 'string' ? JSON.parse(ticket.responses || '[]') : [])
      }));
      setTickets(parsedTickets);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement tickets:', err);
      setError('Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/support/tickets/${selectedTicket.id}/respond`, {
        response: replyMessage,
      });
      
      // Rafraîchir les tickets
      await fetchTickets();
      setReplyDialogOpen(false);
      setReplyMessage('');
      setSelectedTicket(null);
      setSuccessMessage('Réponse envoyée avec succès ! L\'utilisateur a été notifié.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Erreur réponse ticket:', err);
      setError('Impossible d\'envoyer la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await apiClient.put(`/support/tickets/${ticketId}/status`, {
        status: newStatus,
      });
      await fetchTickets();
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err);
      setError('Impossible de mettre à jour le statut');
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatRelativeDate = (dateStr: string): string => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
    } catch {
      return dateStr;
    }
  };

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Signalements & Support
          </Typography>
          <Typography color="text.secondary">
            Gérez les problèmes signalés par les utilisateurs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={<PendingIcon />}
            label={`${openCount} ouvert${openCount > 1 ? 's' : ''}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            icon={<PendingIcon />}
            label={`${inProgressCount} en cours`}
            color="error"
            variant="outlined"
          />
          <Tooltip title="Actualiser">
            <IconButton onClick={fetchTickets}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="open">Ouvert</MenuItem>
              <MenuItem value="in_progress">En cours</MenuItem>
              <MenuItem value="resolved">Résolu</MenuItem>
              <MenuItem value="closed">Fermé</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={categoryFilter}
              label="Catégorie"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">Toutes</MenuItem>
              <MenuItem value="bug">Bug</MenuItem>
              <MenuItem value="suggestion">Suggestion</MenuItem>
              <MenuItem value="question">Question</MenuItem>
              <MenuItem value="room_issue">Problème salle</MenuItem>
              <MenuItem value="general">Général</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Liste des tickets */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BugIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucun signalement trouvé
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Les signalements des utilisateurs apparaîtront ici
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          {filteredTickets.map((ticket, index) => {
            const category = categoryConfig[ticket.category] ?? { icon: <QuestionIcon />, color: '#607d8b', label: 'Général' };
            const priority = priorityConfig[ticket.priority] ?? { color: 'info' as const, label: 'Normale' };
            const status = statusConfig[ticket.status] ?? { color: 'warning' as const, label: 'Ouvert', icon: <PendingIcon /> };

            return (
              <Box key={ticket.id}>
                <ListItem
                  sx={{
                    py: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setReplyDialogOpen(true);
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={status.label}
                        color={status.color}
                        icon={status.icon as React.ReactElement}
                      />
                      <Chip
                        size="small"
                        label={priority.label}
                        color={priority.color}
                        variant="outlined"
                      />
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={Array.isArray(ticket.responses) ? ticket.responses.length : 0}
                      color="primary"
                      invisible={!Array.isArray(ticket.responses) || ticket.responses.length === 0}
                    >
                      <Avatar sx={{ bgcolor: category.color }}>
                        {category.icon}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" fontWeight="bold">{ticket.subject}</Typography>
                        <Chip
                          size="small"
                          label={category.label}
                          sx={{ bgcolor: category.color, color: 'white', height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 500, display: 'block' }}>
                          {ticket.message}
                        </Typography>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {ticket.user_name}
                            </Typography>
                          </Box>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon fontSize="small" color="action" />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {formatRelativeDate(ticket.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
                {index < filteredTickets.length - 1 && <Divider />}
              </Box>
            );
          })}
        </List>
      )}

      {/* Dialogue de détail / réponse */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => {
          setReplyDialogOpen(false);
          setSelectedTicket(null);
          setReplyMessage('');
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{selectedTicket.subject}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Par {selectedTicket.user_name} ({selectedTicket.user_email})
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatDate(selectedTicket.created_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="open">Ouvert</MenuItem>
                      <MenuItem value="in_progress">En cours</MenuItem>
                      <MenuItem value="resolved">Résolu</MenuItem>
                      <MenuItem value="closed">Fermé</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Message original */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1">{selectedTicket.message}</Typography>
              </Paper>

              {/* Réponses existantes */}
              {Array.isArray(selectedTicket.responses) && selectedTicket.responses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReplyIcon fontSize="small" />
                    Réponses ({selectedTicket.responses.length})
                  </Typography>
                  {selectedTicket.responses.map((response) => (
                    <Paper
                      key={response.id}
                      sx={{ p: 2, mb: 1, bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                          {response.admin_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(response.created_at)}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{response.message}</Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Formulaire de réponse */}
              <Typography variant="subtitle2" gutterBottom>
                Ajouter une réponse
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Écrivez votre réponse..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReplyDialogOpen(false)}>Fermer</Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleReply}
                disabled={!replyMessage.trim() || submitting}
              >
                {submitting ? 'Envoi...' : 'Envoyer la réponse'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SupportTickets;
