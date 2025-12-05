import { useState, useMemo } from 'react';
import { useReservations } from '@/hooks/useReservations';
import { formatTimeRange, formatFullName } from '@/utils/formatters';
import { RESERVATION_STATUS_COLORS, RESERVATION_STATUS_LABELS } from '@/utils/constants';
import type { Reservation } from '@/types';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

const getStatusBgColor = (statut: string | undefined): string => {
  if (statut === 'rejetee' || statut === 'refusee') return '#d32f2f';
  if (statut === 'annulee') return '#ed6c02';
  if (statut === 'validee' || statut === 'confirmee') return '#2e7d32';
  if (statut === 'en_attente') return '#ed6c02';
  return '#1976d2';
};

const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  const firstDay = new Date(year, month, 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
};

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekDays = (monday: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
};

type ViewMode = 'month' | 'week';

const Calendar: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const { reservations = [], isLoading } = useReservations();

  const daysInMonth = useMemo(() => 
    getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const firstDayOffset = useMemo(() => 
    getFirstDayOfMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const reservationsByDate = useMemo(() => {
    const grouped: Record<string, Reservation[]> = {};
    
    reservations.forEach(reservation => {
      const date = reservation.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(reservation);
    });
    
    return grouped;
  }, [reservations]);
  
  const groupedReservations = useMemo(() => {
    const groups: Record<string, Reservation[]> = {};
    reservations.forEach(r => {
      if (r.group_id) {
        if (!groups[r.group_id]) {
          groups[r.group_id] = [];
        }
        groups[r.group_id]!.push(r);
      }
    });
    return groups;
  }, [reservations]);

  const getReservationsForDate = (date: Date): Reservation[] => {
    const dateStr = date.toISOString().split('T')[0];
    return reservationsByDate[dateStr!] || [];
  };

  const goToPreviousMonth = (): void => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = (): void => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = (): void => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setCurrentWeekStart(getMonday(today));
    setSelectedDate(today);
  };

  const goToPreviousWeek = (): void => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = (): void => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate !== null && date.toDateString() === selectedDate.toDateString();
  };

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekPeriod = useMemo(() => {
    const lastDay = new Date(currentWeekStart);
    lastDay.setDate(lastDay.getDate() + 6);
    
    const startMonth = currentWeekStart.toLocaleDateString('fr-FR', { month: 'long' });
    const endMonth = lastDay.toLocaleDateString('fr-FR', { month: 'long' });
    const year = currentWeekStart.getFullYear();
    
    if (startMonth === endMonth) {
      return `${currentWeekStart.getDate()} - ${lastDay.getDate()} ${startMonth} ${year}`;
    } else {
      return `${currentWeekStart.getDate()} ${startMonth} - ${lastDay.getDate()} ${endMonth} ${year}`;
    }
  }, [currentWeekStart]);

  const selectedDayReservations = selectedDate ? getReservationsForDate(selectedDate) : [];

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 7; hour <= 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const getReservationAtTime = (date: Date, timeSlot: string): Reservation[] => {
    const dayReservations = getReservationsForDate(date);
    return dayReservations.filter(res => {
      const resStart = res.heure_debut.substring(0, 5);
      const resEnd = res.heure_fin.substring(0, 5);
      return resStart <= timeSlot && resEnd > timeSlot;
    });
  };

  const handleViewModeChange = (event: SelectChangeEvent<ViewMode>): void => {
    setViewMode(event.target.value as ViewMode);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Chargement du calendrier...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Calendrier des Réservations
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Vue</InputLabel>
            <Select
              value={viewMode}
              label="Vue"
              onChange={handleViewModeChange}
            >
              <MenuItem value="month">Mois</MenuItem>
              <MenuItem value="week">Semaine</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant={isCurrentMonth && selectedDate?.toDateString() === today.toDateString() ? "contained" : "outlined"}
            startIcon={<TodayIcon />}
            onClick={goToToday}
            color={isCurrentMonth ? "success" : "primary"}
          >
            Aujourd'hui
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* @ts-expect-error MUI Grid item prop */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <IconButton onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousWeek}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                {viewMode === 'month' ? monthName : weekPeriod}
              </Typography>
              <IconButton onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            {viewMode === 'month' ? (
              <>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 1, 
                    mb: 1,
                    '& > *': { minWidth: 0 }
                  }}
                >
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <Box 
                      key={day}
                      display="flex" 
                      justifyContent="center" 
                      alignItems="center"
                      py={1.5}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {day}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 1,
                    '& > *': { minWidth: 0 }
                  }}
                >
                  {Array.from({ length: firstDayOffset }).map((_, index) => (
                    <Box key={`offset-${index}`} sx={{ minHeight: 100 }} />
                  ))}

                  {daysInMonth.map((date) => {
                    const dayReservations = getReservationsForDate(date);
                    const hasReservations = dayReservations.length > 0;

                    return (
                      <Paper
                        key={date.toISOString()}
                        elevation={isSelected(date) ? 3 : 1}
                        onClick={() => setSelectedDate(date)}
                        sx={{
                          minHeight: 100,
                          p: 1.5,
                          cursor: 'pointer',
                          border: isToday(date) ? '2px solid' : '1px solid',
                          borderColor: isToday(date) ? 'primary.main' : 'divider',
                          bgcolor: isSelected(date) ? 'primary.50' : 'background.paper',
                          '&:hover': {
                            bgcolor: isSelected(date) ? 'primary.100' : 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                          },
                          transition: 'all 0.2s ease-in-out',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                        }}
                      >
                        <Box 
                          display="flex" 
                          justifyContent="space-between" 
                          alignItems="center"
                          mb={1}
                          sx={{ flexShrink: 0 }}
                        >
                          <Typography 
                            variant="body1" 
                            fontWeight={isToday(date) ? 'bold' : 'medium'}
                            color={isToday(date) ? 'primary.main' : 'text.primary'}
                            sx={{ fontSize: isToday(date) ? '1.1rem' : '0.95rem' }}
                          >
                            {date.getDate()}
                          </Typography>
                          {hasReservations && (
                            <Chip
                              label={dayReservations.length}
                              size="small"
                              color="primary"
                              sx={{ height: 20, minWidth: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
                        
                        {hasReservations && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              gap: 0.5,
                              overflow: 'hidden',
                              flex: 1,
                            }}
                          >
                            {dayReservations.slice(0, 3).map((res, idx) => {
                              const groupData = res.group_id ? groupedReservations[res.group_id] : undefined;
                              const isGrouped = !!(groupData && groupData.length > 1);
                              const groupCount = isGrouped && groupData ? groupData.length : 0;
                              
                              return (
                                <Tooltip 
                                  key={idx}
                                  title={isGrouped ? `Groupe de ${groupCount} créneaux - ${res.motif}` : res.motif || ''}
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      px: 0.75,
                                      py: 0.5,
                                      borderRadius: 1,
                                      bgcolor: getStatusBgColor(res.statut),
                                      color: 'white',
                                      fontSize: '0.7rem',
                                      fontWeight: 'medium',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      border: isGrouped ? '2px solid rgba(255,255,255,0.5)' : 'none',
                                    }}
                                  >
                                    {isGrouped && (
                                      <Box
                                        component="span"
                                        sx={{
                                          fontSize: '0.6rem',
                                          bgcolor: 'rgba(255,255,255,0.3)',
                                          borderRadius: '50%',
                                          width: 14,
                                          height: 14,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 'bold',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {groupCount}
                                      </Box>
                                    )}
                                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {res.heure_debut} • {res.salle?.nom || 'Salle'}
                                    </Box>
                                  </Box>
                                </Tooltip>
                              );
                            })}
                            {dayReservations.length > 3 && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: '0.65rem', textAlign: 'center', fontWeight: 'medium' }}
                              >
                                +{dayReservations.length - 3} autre{dayReservations.length - 3 > 1 ? 's' : ''}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </>
            ) : (
              <Box sx={{ overflow: 'auto' }}>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px repeat(7, 1fr)', 
                    gap: 1,
                    mb: 2,
                    minWidth: '800px',
                  }}
                >
                  <Box />
                  {weekDays.map((day) => (
                    <Box 
                      key={day.toISOString()}
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        bgcolor: isToday(day) ? 'primary.main' : 'grey.100',
                        color: isToday(day) ? 'white' : 'text.primary',
                        borderRadius: 1,
                        border: isSelected(day) ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                      }}
                    >
                      <Typography variant="caption" display="block" fontWeight="medium">
                        {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {day.getDate()}
                      </Typography>
                      <Typography variant="caption" color={isToday(day) ? 'inherit' : 'text.secondary'}>
                        {day.toLocaleDateString('fr-FR', { month: 'short' })}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ minWidth: '800px' }}>
                  {timeSlots.map((timeSlot) => (
                    <Box
                      key={timeSlot}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '80px repeat(7, 1fr)',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="flex-end" pr={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                          {timeSlot}
                        </Typography>
                      </Box>

                      {weekDays.map((day) => {
                        const reservationsAtTime = getReservationAtTime(day, timeSlot);
                        const hasReservation = reservationsAtTime.length > 0;

                        return (
                          <Paper
                            key={`${day.toISOString()}-${timeSlot}`}
                            variant="outlined"
                            onClick={() => setSelectedDate(day)}
                            sx={{
                              minHeight: 60,
                              p: 0.5,
                              cursor: 'pointer',
                              bgcolor: hasReservation ? 'action.hover' : 'background.paper',
                              borderColor: isToday(day) ? 'primary.main' : 'divider',
                              '&:hover': {
                                bgcolor: 'action.selected',
                                borderColor: 'primary.main',
                              },
                              transition: 'all 0.2s',
                              overflow: 'hidden',
                            }}
                          >
                            {hasReservation && reservationsAtTime.map((res) => {
                              const startHour = parseInt(res.heure_debut.split(':')[0] || '0');
                              const startMin = parseInt(res.heure_debut.split(':')[1] || '0');
                              const endHour = parseInt(res.heure_fin.split(':')[0] || '0');
                              const endMin = parseInt(res.heure_fin.split(':')[1] || '0');
                              
                              const slotHour = parseInt(timeSlot.split(':')[0] || '0');
                              
                              if (startHour !== slotHour) return null;

                              const durationInHours = (endHour + endMin/60) - (startHour + startMin/60);
                              const height = durationInHours * 60;

                              return (
                                <Box
                                  key={res.id}
                                  sx={{
                                    p: 1,
                                    height: `${height}px`,
                                    minHeight: 60,
                                    bgcolor: getStatusBgColor(res.statut),
                                    color: 'white',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Typography variant="caption" fontWeight="bold" display="block" noWrap>
                                    {res.salle?.nom}
                                  </Typography>
                                  <Typography variant="caption" display="block" fontSize="0.65rem" noWrap>
                                    {res.heure_debut} - {res.heure_fin}
                                  </Typography>
                                  {res.utilisateur && (
                                    <Typography variant="caption" display="block" fontSize="0.6rem" noWrap sx={{ opacity: 0.9 }}>
                                      {formatFullName(res.utilisateur.prenom, res.utilisateur.nom)}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Paper>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* @ts-expect-error MUI Grid item prop */}
        <Grid item xs={12} lg={4}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              position: 'sticky', 
              top: 16,
              borderRadius: 2,
              maxHeight: 'calc(100vh - 100px)',
              overflow: 'auto',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Box sx={{ width: 4, height: 32, bgcolor: 'primary.main', borderRadius: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {selectedDate 
                  ? selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })
                  : 'Sélectionnez une date'
                }
              </Typography>
            </Box>

            {selectedDate && (
              <Box mt={3}>
                {selectedDayReservations.length === 0 ? (
                  <Box textAlign="center" py={6} sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h2" sx={{ opacity: 0.3, mb: 1 }}>
                      📅
                    </Typography>
                    <Typography color="text.secondary" fontWeight="medium">
                      Aucune réservation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cette journée est libre
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip 
                        label={`${selectedDayReservations.length} réservation${selectedDayReservations.length > 1 ? 's' : ''}`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {selectedDayReservations
                        .sort((a, b) => a.heure_debut.localeCompare(b.heure_fin))
                        .map((reservation) => (
                        <Card 
                          key={reservation.id} 
                          elevation={2}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderLeft: '4px solid',
                            borderLeftColor: `${RESERVATION_STATUS_COLORS[reservation.statut] || 'primary'}.main`,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5}>
                              <Box flex={1}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                  {reservation.salle?.nom || 'Salle inconnue'}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: getStatusBgColor(reservation.statut),
                                      }}
                                    />
                                    <Typography variant="caption" fontWeight="medium">
                                      {RESERVATION_STATUS_LABELS[reservation.statut] || reservation.statut}
                                    </Typography>
                                  </Box>
                                  
                                  {(() => {
                                    const groupData = reservation.group_id ? groupedReservations[reservation.group_id] : undefined;
                                    return groupData && groupData.length > 1 && (
                                      <Chip
                                        label={`Groupe (${groupData.length} créneaux)`}
                                        size="small"
                                        color="info"
                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                      />
                                    );
                                  })()}
                                </Box>
                              </Box>
                            </Box>

                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={1} 
                              mb={1}
                              sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1 }}
                            >
                              <Typography variant="body2" fontWeight="bold" color="primary.main">
                                {formatTimeRange(reservation.heure_debut, reservation.heure_fin)}
                              </Typography>
                            </Box>

                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ mb: 1.5, fontStyle: 'italic' }}
                            >
                              {reservation.motif || 'Aucun motif spécifié'}
                            </Typography>

                            {reservation.utilisateur && (
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                gap={1}
                                sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 28, 
                                    height: 28, 
                                    fontSize: '0.75rem',
                                    bgcolor: 'primary.main',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {reservation.utilisateur.prenom?.[0]}
                                  {reservation.utilisateur.nom?.[0]}
                                </Avatar>
                                <Typography variant="caption" fontWeight="medium">
                                  {formatFullName(reservation.utilisateur.prenom, reservation.utilisateur.nom)}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Calendar;
