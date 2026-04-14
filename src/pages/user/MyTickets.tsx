import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Paper,
  Alert,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
  alpha,
} from '@mui/material';
import {
  BugReport as BugIcon,
  Lightbulb as SuggestionIcon,
  Help as QuestionIcon,
  MeetingRoom as RoomIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Reply as ReplyIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import apiClient from '@/api/client';

interface TicketResponse {
  id: number;
  admin_name: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: number;
  subject: string;
  category: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  bug: { icon: <BugIcon />, color: '#d32f2f', label: 'Bug' },
  suggestion: { icon: <SuggestionIcon />, color: '#ff9800', label: 'Suggestion' },
  question: { icon: <QuestionIcon />, color: '#2196f3', label: 'Question' },
  room_issue: { icon: <RoomIcon />, color: '#9c27b0', label: 'Problème salle' },
  general: { icon: <QuestionIcon />, color: '#607d8b', label: 'Général' },
};

const statusConfig: Record<string, { color: 'error' | 'warning' | 'success' | 'default'; label: string; icon: React.ReactNode }> = {
  open: { color: 'warning', label: 'Ouvert', icon: <PendingIcon /> },
  in_progress: { color: 'error', label: 'En cours', icon: <PendingIcon /> },
  resolved: { color: 'success', label: 'Résolu', icon: <ResolvedIcon /> },
  closed: { color: 'default', label: 'Fermé', icon: <CloseIcon /> },
};

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/support/tickets');
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
      setError('Impossible de charger vos signalements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
    } catch {
      return dateStr;
    }
  };

  const toggleExpand = (ticketId: number) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Mes Signalements
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Suivez vos demandes de support et les réponses des administrateurs
          </Typography>
        </Box>
        <Tooltip title="Actualiser">
          <IconButton
            onClick={fetchTickets}
            sx={{ bgcolor: alpha('#1565c0', 0.08), color: '#1565c0', borderRadius: 2, '&:hover': { bgcolor: alpha('#1565c0', 0.15) } }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[0,1,2].map(i => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : tickets.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <QuestionIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            Aucun signalement
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Utilisez le bouton "Aide" dans le menu pour signaler un problème.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tickets.map((ticket) => {
            const category = categoryConfig[ticket.category] ?? { icon: <QuestionIcon />, color: '#607d8b', label: 'Général' };
            const status = statusConfig[ticket.status] ?? { color: 'default' as const, label: 'Ouvert', icon: <PendingIcon /> };
            const isExpanded = expandedTicket === ticket.id;
            const responses = Array.isArray(ticket.responses) ? ticket.responses : [];
            const hasResponses = responses.length > 0;

            return (
              <Card
                key={ticket.id}
                elevation={0}
                sx={{ 
                  border: hasResponses ? '2px solid' : '1px solid',
                  borderColor: hasResponses ? alpha('#1565c0', 0.4) : 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: hasResponses ? '#1565c0' : alpha('#1565c0', 0.3) },
                }}
              >                <CardContent>
                  {/* En-tête du ticket */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: category.color }}>
                      {category.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {ticket.subject}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              label={category.label}
                              sx={{ bgcolor: category.color, color: 'white', height: 22 }}
                            />
                            <Chip
                              size="small"
                              icon={status.icon as React.ReactElement}
                              label={status.label}
                              color={status.color}
                              variant="outlined"
                            />
                            {hasResponses && (
                              <Chip
                                size="small"
                                icon={<ReplyIcon />}
                                label={`${responses.length} réponse${responses.length > 1 ? 's' : ''}`}
                                color="primary"
                                variant="filled"
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {formatRelativeDate(ticket.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Message du ticket */}
                      <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">{ticket.message}</Typography>
                      </Paper>

                      {/* Bouton pour voir les réponses */}
                      {hasResponses && (
                        <>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mt: 2, 
                              cursor: 'pointer',
                              '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => toggleExpand(ticket.id)}
                          >
                            <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ReplyIcon fontSize="small" />
                              Voir les réponses ({responses.length})
                            </Typography>
                            {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                          </Box>

                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2 }}>
                              <Divider sx={{ mb: 2 }} />
                              {responses.map((response) => (
                                <Paper
                                  key={response.id}
                                  sx={{ 
                                    p: 2, 
                                    mb: 1, 
                                    bgcolor: 'primary.50', 
                                    borderLeft: '4px solid', 
                                    borderColor: 'primary.main' 
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                      {response.admin_name} (Administrateur)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(response.created_at)}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2">{response.message}</Typography>
                                </Paper>
                              ))}
                            </Box>
                          </Collapse>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default MyTickets;
