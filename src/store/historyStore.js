import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import historyApi from '../api/history';

/**
 * Store pour gérer l'historique des actions
 * Enregistre toutes les actions importantes pour audit et traçabilité
 */
export const useHistoryStore = create(
  persist(
    (set, get) => ({
      // État
      history: [],
      isLoading: false,
      error: null,
      filters: {
        type: 'all',
        dateRange: 'all',
        userId: null,
      },

      // Récupérer l'historique depuis le backend
      fetchHistory: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await historyApi.getAll();
          console.log('📜 Historique brut du backend:', data);
          
          // Vérifier si c'est une erreur d'API
          if (!Array.isArray(data)) {
            console.warn('⚠️ La réponse n\'est pas un tableau:', data);
            set({ history: [], isLoading: false, error: 'Format de données invalide' });
            return;
          }
          
          // Mapper les données backend vers le format frontend
          const mappedHistory = data.map(h => {
            let type = 'info';
            const backendType = h.type?.toUpperCase();
            const action = h.action?.toLowerCase() || '';
            
            // Utiliser l'action pour distinguer validations et refus si type=VALIDATION
            if (backendType === 'VALIDATION') {
              if (action.includes('refus')) {
                type = 'reservation_rejected';
              } else {
                type = 'reservation_validated';
              }
            }
            else if (backendType === 'CREATION') type = 'reservation_created';
            else if (backendType === 'ANNULATION') type = 'reservation_cancelled';
            else if (backendType === 'REFUS') type = 'reservation_rejected';
            else if (backendType === 'MODIFICATION') type = 'reservation_updated';
            else if (backendType === 'SUPPRESSION') type = 'reservation_deleted';
            else type = h.type?.toLowerCase() || 'info';

            return {
              id: h.id,
              timestamp: h.created_at || h.createdAt || new Date().toISOString(),
              type: type,
              action: h.action,
              description: h.description,
              userId: h.user_id,
              userName: h.utilisateur ? h.utilisateur.nom : 'Système',
              details: h.details,
              reservationId: h.reservation_id
            };
          });
          
          console.log('📜 Historique mappé:', mappedHistory);
          set({ history: mappedHistory, isLoading: false });
        } catch (error) {
          console.error("Erreur chargement historique:", error);
          set({ error: error.message, isLoading: false, history: [] });
        }
      },
      
      // Ajouter une entrée d'historique (Local + Backend refresh idéalement)
      addHistoryEntry: (entry) => {

        const newEntry = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...entry,
        };
        
        set((state) => ({
          history: [newEntry, ...state.history].slice(0, 1000), // Garder max 1000 entrées
        }));
      },
      
      // Définir les filtres
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },
      
      // Réinitialiser les filtres
      resetFilters: () => {
        set({
          filters: {
            type: 'all',
            dateRange: 'all',
            userId: null,
          },
        });
      },
      
      // Obtenir l'historique filtré
      getFilteredHistory: () => {
        const { history, filters } = get();
        let filtered = [...history];
        
        // Filtrer par type
        if (filters.type && filters.type !== 'all') {
          filtered = filtered.filter((entry) => entry.type === filters.type);
        }
        
        // Filtrer par utilisateur
        if (filters.userId) {
          filtered = filtered.filter((entry) => entry.userId === filters.userId);
        }
        
        // Filtrer par plage de dates
        if (filters.dateRange && filters.dateRange !== 'all') {
          const now = new Date();
          const ranges = {
            today: new Date(now.setHours(0, 0, 0, 0)),
            week: new Date(now.setDate(now.getDate() - 7)),
            month: new Date(now.setMonth(now.getMonth() - 1)),
            year: new Date(now.setFullYear(now.getFullYear() - 1)),
          };
          
          const startDate = ranges[filters.dateRange];
          if (startDate) {
            filtered = filtered.filter((entry) => new Date(entry.timestamp) >= startDate);
          }
        }
        
        return filtered;
      },
      
      // Obtenir l'historique par réservation
      getHistoryByReservation: (reservationId) => {
        return get().history.filter((entry) => entry.reservationId === reservationId);
      },
      
      // Obtenir l'historique par utilisateur
      getHistoryByUser: (userId) => {
        return get().history.filter((entry) => entry.userId === userId);
      },
      
      // Effacer tout l'historique
      clearHistory: () => {
        set({ history: [] });
      },
      
      // Méthodes spécifiques pour chaque action
      
      // Réservation créée
      logReservationCreated: (userId, userName, reservation) => {
        const salleName = reservation.salle?.nom || reservation.room?.nom || 'Salle inconnue';
        const resDate = reservation.date || 'Date non spécifiée';
        
        get().addHistoryEntry({
          type: 'reservation_created',
          action: 'Création de réservation',
          userId,
          userName,
          reservationId: reservation.id,
          details: {
            salle: salleName,
            date: resDate,
            heureDebut: reservation.heure_debut || 'N/A',
            heureFin: reservation.heure_fin || 'N/A',
          },
          description: `${userName} a créé une réservation pour la salle "${salleName}" le ${resDate}`,
        });
      },
      
      // Réservation validée
      logReservationValidated: (adminId, adminName, reservation) => {
        const salleName = reservation.salle?.nom || reservation.room?.nom || 'Salle inconnue';
        const resDate = reservation.date || 'Date non spécifiée';
        const userPrenom = reservation.utilisateur?.prenom || reservation.user?.prenom || '';
        const userNom = reservation.utilisateur?.nom || reservation.user?.nom || 'Utilisateur';
        
        get().addHistoryEntry({
          type: 'reservation_validated',
          action: 'Validation de réservation',
          userId: adminId,
          userName: adminName,
          reservationId: reservation.id,
          targetUserId: reservation.user_id,
          targetUserName: `${userPrenom} ${userNom}`.trim(),
          details: {
            salle: salleName,
            date: resDate,
            heureDebut: reservation.heure_debut || 'N/A',
            heureFin: reservation.heure_fin || 'N/A',
          },
          description: `${adminName} a validé la réservation de ${userPrenom} ${userNom} pour la salle "${salleName}"`,
        });
      },
      
      // Réservation refusée
      logReservationRejected: (adminId, adminName, reservation, reason) => {
        const salleName = reservation.salle?.nom || reservation.room?.nom || 'Salle inconnue';
        const resDate = reservation.date || 'Date non spécifiée';
        const userPrenom = reservation.utilisateur?.prenom || reservation.user?.prenom || '';
        const userNom = reservation.utilisateur?.nom || reservation.user?.nom || 'Utilisateur';
        
        get().addHistoryEntry({
          type: 'reservation_rejected',
          action: 'Refus de réservation',
          userId: adminId,
          userName: adminName,
          reservationId: reservation.id,
          targetUserId: reservation.user_id,
          targetUserName: `${userPrenom} ${userNom}`.trim(),
          details: {
            salle: salleName,
            date: resDate,
            heureDebut: reservation.heure_debut || 'N/A',
            heureFin: reservation.heure_fin || 'N/A',
            reason: reason || 'Non spécifié',
          },
          description: `${adminName} a refusé la réservation de ${userPrenom} ${userNom} pour la salle "${salleName}"`,
        });
      },
      
      // Réservation annulée
      logReservationCancelled: (userId, userName, reservation) => {
        get().addHistoryEntry({
          type: 'reservation_cancelled',
          action: 'Annulation de réservation',
          userId,
          userName,
          reservationId: reservation.id,
          details: {
            salle: reservation.salle?.nom,
            date: reservation.date,
            heureDebut: reservation.heure_debut,
            heureFin: reservation.heure_fin,
          },
          description: `${userName} a annulé sa réservation pour la salle "${reservation.salle?.nom}" le ${reservation.date}`,
        });
      },
      
      // Réservation supprimée (admin)
      logReservationDeleted: (adminId, adminName, reservation) => {
        get().addHistoryEntry({
          type: 'reservation_deleted',
          action: 'Suppression de réservation',
          userId: adminId,
          userName: adminName,
          reservationId: reservation.id,
          details: {
            salle: reservation.salle?.nom,
            date: reservation.date,
            utilisateur: `${reservation.utilisateur?.prenom} ${reservation.utilisateur?.nom}`,
          },
          description: `${adminName} a supprimé la réservation de ${reservation.utilisateur?.prenom} ${reservation.utilisateur?.nom} pour la salle "${reservation.salle?.nom}"`,
        });
      },
      
      // Réservation modifiée
      logReservationUpdated: (userId, userName, reservation, changes) => {
        get().addHistoryEntry({
          type: 'reservation_updated',
          action: 'Modification de réservation',
          userId,
          userName,
          reservationId: reservation.id,
          details: {
            salle: reservation.salle?.nom,
            date: reservation.date,
            changes,
          },
          description: `${userName} a modifié la réservation pour la salle "${reservation.salle?.nom}"`,
        });
      },
      
      // Connexion utilisateur
      logUserLogin: (userId, userName) => {
        get().addHistoryEntry({
          type: 'user_login',
          action: 'Connexion',
          userId,
          userName,
          description: `${userName} s'est connecté`,
        });
      },
      
      // Déconnexion utilisateur
      logUserLogout: (userId, userName) => {
        get().addHistoryEntry({
          type: 'user_logout',
          action: 'Déconnexion',
          userId,
          userName,
          description: `${userName} s'est déconnecté`,
        });
      },
      
      // Création d'utilisateur
      logUserCreated: (adminId, adminName, newUser) => {
        get().addHistoryEntry({
          type: 'user_created',
          action: 'Création d\'utilisateur',
          userId: adminId,
          userName: adminName,
          targetUserId: newUser.id,
          targetUserName: `${newUser.prenom} ${newUser.nom}`,
          details: {
            email: newUser.email,
            role: newUser.role,
          },
          description: `${adminName} a créé le compte de ${newUser.prenom} ${newUser.nom} (${newUser.role})`,
        });
      },
      
      // Salle créée
      logRoomCreated: (adminId, adminName, room) => {
        get().addHistoryEntry({
          type: 'room_created',
          action: 'Création de salle',
          userId: adminId,
          userName: adminName,
          roomId: room.id,
          details: {
            nom: room.nom,
            capacite: room.capacite,
          },
          description: `${adminName} a créé la salle "${room.nom}" (capacité: ${room.capacite})`,
        });
      },
      
      // Salle modifiée
      logRoomUpdated: (adminId, adminName, room, changes) => {
        get().addHistoryEntry({
          type: 'room_updated',
          action: 'Modification de salle',
          userId: adminId,
          userName: adminName,
          roomId: room.id,
          details: {
            nom: room.nom,
            changes,
          },
          description: `${adminName} a modifié la salle "${room.nom}"`,
        });
      },
      
      // Statistiques
      getStats: () => {
        const history = get().history;
        const types = {};
        
        history.forEach((entry) => {
          types[entry.type] = (types[entry.type] || 0) + 1;
        });
        
        return {
          total: history.length,
          byType: types,
          recent: history.slice(0, 10),
        };
      },
      
      // Charger l'historique des réservations existantes
      loadExistingReservationsHistory: (reservations, currentUserId, currentUserName) => {
        if (!reservations || !Array.isArray(reservations)) return;
        
        const existingReservationIds = get().history
          .filter(h => h.reservationId)
          .map(h => h.reservationId);
        
        reservations.forEach(reservation => {
          // Ne créer des entrées que pour les réservations qui n'ont pas déjà d'historique
          if (!existingReservationIds.includes(reservation.id)) {
            const salleName = reservation.salle?.nom || reservation.room?.nom || 'Salle inconnue';
            const resDate = reservation.date || 'Date non spécifiée';
            const userName = reservation.utilisateur 
              ? `${reservation.utilisateur.prenom || ''} ${reservation.utilisateur.nom || ''}`.trim() || 'Utilisateur'
              : reservation.user
              ? `${reservation.user.prenom || ''} ${reservation.user.nom || ''}`.trim() || 'Utilisateur'
              : 'Utilisateur';
            
            const userId = reservation.user_id || reservation.userId;
            
            // Log de création (toujours)
            get().addHistoryEntry({
              type: 'reservation_created',
              action: 'Réservation créée',
              userId: userId,
              userName: userName,
              reservationId: reservation.id,
              details: {
                salle: salleName,
                date: resDate,
                heure_debut: reservation.heure_debut,
                heure_fin: reservation.heure_fin,
                motif: reservation.motif,
              },
              description: `${userName} a créé une réservation pour la salle "${salleName}" le ${resDate}`,
            });
            
            // Log de validation si la réservation est validée/confirmée
            if (reservation.statut === 'validee' || reservation.statut === 'confirmee') {
              get().addHistoryEntry({
                type: 'reservation_validated',
                action: 'Réservation validée',
                userId: currentUserId, // Admin qui consulte
                userName: currentUserName,
                reservationId: reservation.id,
                details: {
                  salle: salleName,
                  date: resDate,
                  utilisateur: userName,
                },
                description: `Réservation de ${userName} pour la salle "${salleName}" le ${resDate} a été validée`,
              });
            }
            
            // Log de refus si la réservation est refusée
            if (reservation.statut === 'refusee') {
              get().addHistoryEntry({
                type: 'reservation_rejected',
                action: 'Réservation refusée',
                userId: currentUserId,
                userName: currentUserName,
                reservationId: reservation.id,
                details: {
                  salle: salleName,
                  date: resDate,
                  utilisateur: userName,
                  reason: 'Refusée',
                },
                description: `Réservation de ${userName} pour la salle "${salleName}" le ${resDate} a été refusée`,
              });
            }
            
            // Log d'annulation si la réservation est annulée
            if (reservation.statut === 'annulee') {
              get().addHistoryEntry({
                type: 'reservation_cancelled',
                action: 'Réservation annulée',
                userId: userId,
                userName: userName,
                reservationId: reservation.id,
                details: {
                  salle: salleName,
                  date: resDate,
                },
                description: `${userName} a annulé la réservation de la salle "${salleName}" le ${resDate}`,
              });
            }
          }
        });
      },
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
