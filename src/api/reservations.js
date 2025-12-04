import apiClient from './client';

export const reservationsAPI = {
  // Récupérer toutes les réservations (admin)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/reservations/all', { params });
    console.log('📡 API Response /reservations/all:', response.data);
    // L'API retourne { value: [...], Count: n } - on extrait le tableau
    // Si response.data est directement le tableau, on l'utilise
    const rawData = response.data.value || response.data;
    const data = Array.isArray(rawData) ? rawData : [];
    console.log('📊 Extracted data:', data.length, 'items');
    return { data };
  },

  // Récupérer une réservation par ID
  getById: async (id) => {
    const response = await apiClient.get('/reservations');
    const data = response.data.value || response.data || [];
    const reservation = data.find(r => r.id === id);
    return { data: reservation };
  },

  // Créer une nouvelle réservation
  create: async (reservationData) => {
    // Le backend attend: room_id, date, heure_debut, heure_fin, motif, nombre_participants
    // Assurons-nous que les heures ont les secondes pour le format SQL TIME
    const formatTime = (time) => {
      if (!time) return null;
      return time.length === 5 ? `${time}:00` : time;
    };

    // Si c'est une réservation multiple (créneaux multiples OU multi-jours)
    // IMPORTANT: Vérifier que timeSlots a PLUS d'un créneau ou isMultiDay est true avec plusieurs jours
    const hasMultipleSlots = reservationData.timeSlots && reservationData.timeSlots.length > 1;
    const isReallyMultiDay = reservationData.isMultiDay && reservationData.date_debut !== reservationData.date_fin;
    
    if (hasMultipleSlots || isReallyMultiDay) {
      const backendData = {
        room_id: parseInt(reservationData.room_id),
        motif: reservationData.motif || '',
        description: reservationData.description || '',
        isMultiDay: reservationData.isMultiDay || false,
        date_debut: reservationData.date_debut,
        date_fin: reservationData.date_fin,
        days: reservationData.days || 1,
        timeSlots: reservationData.timeSlots.map(slot => ({
          heure_debut: formatTime(slot.heure_debut),
          heure_fin: formatTime(slot.heure_fin),
        })),
      };
      
      console.log('Sending multi-reservation data:', backendData);
      const response = await apiClient.post('/reservations/create-multiple', backendData);
      return response.data;
    } else {
      // Réservation simple (ancien format pour compatibilité)
      // Extraire le premier créneau si timeSlots existe
      const firstSlot = reservationData.timeSlots?.[0];
      
      const backendData = {
        room_id: parseInt(reservationData.room_id),
        date: reservationData.date || reservationData.date_debut,
        heure_debut: formatTime(firstSlot?.heure_debut || reservationData.heure_debut),
        heure_fin: formatTime(firstSlot?.heure_fin || reservationData.heure_fin),
        motif: reservationData.motif || '',
        description: reservationData.description || '',
        nombre_participants: reservationData.nombre_participants || 1,
        equipements_supplementaires: reservationData.equipements_supplementaires || null,
      };
      
      console.log('Sending reservation data:', backendData);
      const response = await apiClient.post('/reservations/create', backendData);
      return response.data;
    }
  },

  // Mettre à jour une réservation
  update: async (id, reservationData) => {
    const response = await apiClient.put(`/reservations/update/${id}`, reservationData);
    return response.data;
  },

  // Annuler une réservation
  cancel: async (id) => {
    const response = await apiClient.put(`/reservations/update/${id}`, { statut: 'annulee' });
    return response.data;
  },

  // Supprimer une réservation (admin)
  delete: async (id) => {
    const response = await apiClient.delete(`/reservations/delete/${id}`);
    return response.data;
  },

  // Récupérer mes réservations (utilise la route principale avec filtre)
  getMine: async () => {
    const response = await apiClient.get('/reservations/all');
    // L'API retourne { value: [...], Count: n } - on extrait le tableau
    const rawData = response.data.value || response.data;
    return Array.isArray(rawData) ? rawData : [];
  },

  // Valider une réservation (admin)
  validate: async (id) => {
    console.log(`📡 Appel validate pour ID: ${id}`);
    try {
      const response = await apiClient.put(`/reservations/validate/${id}`, { action: 'valider' });
      console.log(`✅ Réponse validate reçue:`, response);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur dans reservationsAPI.validate:`, error);
      throw error;
    }
  },

  // Refuser une réservation (admin)
  reject: async (id, rejection_reason) => {
    const response = await apiClient.put(`/reservations/validate/${id}`, { 
      action: 'refuser',
      rejection_reason 
    });
    return response.data;
  },
};
