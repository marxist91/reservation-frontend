# 🔔 Système de Notifications et Historique

## Vue d'ensemble

Ce système permet de gérer les notifications en temps réel et l'historique complet des actions pour tous les rôles (utilisateur, responsable, admin).

## Architecture

### Stores Zustand

#### 1. NotificationStore (`src/store/notificationStore.js`)
- Gère toutes les notifications de l'application
- Persiste dans le localStorage
- Compteur de notifications non lues
- Types de notifications :
  - `reservation_validated` - Réservation validée
  - `reservation_rejected` - Réservation refusée
  - `new_reservation` - Nouvelle demande (admin/responsable)
  - `reservation_cancelled` - Réservation annulée
  - `reminder` - Rappel de réservation à venir

**Méthodes principales :**
```javascript
const {
  notifications,
  unreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  notifyReservationValidated,
  notifyReservationRejected,
  notifyNewReservationRequest,
  notifyReservationCancelled,
} = useNotificationStore();
```

#### 2. HistoryStore (`src/store/historyStore.js`)
- Enregistre toutes les actions importantes
- Audit trail complet
- Filtrage avancé par type, utilisateur, date
- Limite à 1000 entrées (500 en cache)

**Types d'actions enregistrées :**
- Actions sur réservations : création, validation, refus, annulation, suppression, modification
- Actions utilisateurs : connexion, déconnexion, création
- Actions salles : création, modification

**Méthodes principales :**
```javascript
const {
  history,
  filters,
  addHistoryEntry,
  setFilters,
  getFilteredHistory,
  getStats,
  logReservationCreated,
  logReservationValidated,
  logReservationRejected,
} = useHistoryStore();
```

### Composants

#### NotificationBell (`src/components/common/NotificationBell.jsx`)
- Icône de notification dans la navbar
- Badge avec compteur de notifications non lues
- Menu déroulant avec aperçu des dernières notifications
- Actions : marquer comme lu, supprimer, tout marquer comme lu

**Utilisation :**
```jsx
import NotificationBell from './components/common/NotificationBell';

<NotificationBell />
```

#### Page Notifications (`src/pages/common/Notifications.jsx`)
- Page complète dédiée aux notifications
- Filtrage par type et statut (lues/non lues)
- Actions groupées : tout marquer comme lu, effacer les lues
- Affichage détaillé avec timestamps

**Route :** `/notifications`

#### Page Historique (`src/pages/common/History.jsx`)
- Vue d'ensemble de toutes les actions
- Statistiques en cartes (total, créations, validations, refus)
- Filtres avancés : type d'action, période, recherche textuelle
- Export CSV pour audit
- Table détaillée avec timestamps précis

**Route :** `/history`

**Rôles requis :** Tous (chaque utilisateur voit son propre historique, admin voit tout)

### Hook d'intégration

#### useNotificationHistory (`src/hooks/useNotificationHistory.js`)
Hook utilitaire pour automatiser la création de notifications et logs d'historique.

**Utilisation dans les mutations :**
```javascript
import { useNotificationHistory } from '../hooks/useNotificationHistory';

const { onReservationCreated, onReservationValidated } = useNotificationHistory();

// Dans une mutation de création
createReservation.mutate(data, {
  onSuccess: (reservation) => {
    onReservationCreated(reservation);
    toast.success('Réservation créée !');
  },
});

// Dans une mutation de validation
validateReservation.mutate(id, {
  onSuccess: (reservation) => {
    onReservationValidated(reservation);
    toast.success('Réservation validée !');
  },
});
```

**Callbacks disponibles :**
- `onReservationCreated(reservation)`
- `onReservationValidated(reservation)`
- `onReservationRejected(reservation, reason)`
- `onReservationCancelled(reservation)`
- `onReservationDeleted(reservation)`
- `onReservationUpdated(reservation, changes)`

## Fonctionnalités par Rôle

### Utilisateur
- **Notifications :**
  - Validation de ses réservations
  - Refus de ses réservations
  - Rappels de réservations à venir
- **Historique :**
  - Ses propres actions (créations, annulations)
  - Actions des admins sur ses réservations

### Responsable
- **Notifications :**
  - Nouvelles demandes de réservation
  - Toutes les notifications utilisateur
- **Historique :**
  - Actions de validation/refus
  - Créations de réservations
  - Vue complète (comme admin)

### Admin
- **Notifications :**
  - Nouvelles demandes de réservation
  - Toutes les activités du système
- **Historique :**
  - Audit complet de toutes les actions
  - Export CSV pour conformité
  - Statistiques détaillées

## Intégration dans l'application

### 1. Navbar
Le `NotificationBell` est intégré dans la navbar pour tous les utilisateurs connectés :

```jsx
// src/components/common/Navbar.jsx
<NotificationBell />
<Tooltip title="Historique">
  <IconButton onClick={() => navigate('/history')}>
    <HistoryIcon />
  </IconButton>
</Tooltip>
```

### 2. Routes
Ajoutées dans `App.jsx` :
```jsx
<Route path="/notifications" element={<Notifications />} />
<Route path="/history" element={<History />} />
```

### 3. Stores exportés
Centralisés dans `src/store/index.js` :
```javascript
export { useNotificationStore } from './notificationStore';
export { useHistoryStore } from './historyStore';
```

## Exemples d'utilisation

### Créer une notification manuelle
```javascript
import { useNotificationStore } from '../store/notificationStore';

const { addNotification } = useNotificationStore();

addNotification({
  type: 'custom',
  title: 'Titre de la notification',
  message: 'Message détaillé',
  severity: 'info', // success, error, warning, info
  actionUrl: '/chemin/vers/action',
});
```

### Logger une action dans l'historique
```javascript
import { useHistoryStore } from '../store/historyStore';

const { addHistoryEntry } = useHistoryStore();

addHistoryEntry({
  type: 'custom_action',
  action: 'Action personnalisée',
  userId: user.id,
  userName: `${user.prenom} ${user.nom}`,
  description: 'Description de l\'action',
  details: {
    cle1: 'valeur1',
    cle2: 'valeur2',
  },
});
```

### Intégrer avec une mutation existante
```javascript
import { useMutation } from '@tanstack/react-query';
import { useNotificationHistory } from '../hooks/useNotificationHistory';

const { onReservationValidated } = useNotificationHistory();

const validateMutation = useMutation({
  mutationFn: reservationsAPI.validate,
  onSuccess: (data) => {
    onReservationValidated(data.reservation);
    // Les notifications et l'historique sont gérés automatiquement
  },
});
```

## Stockage et Persistance

- **Notifications :** Persistées dans `localStorage` sous la clé `notification-storage`
- **Historique :** Persisté dans `localStorage` sous la clé `history-storage`
- **Limite de stockage :**
  - Historique : Max 1000 entrées en mémoire, 500 dans le cache
  - Notifications : Illimitées (recommandé de nettoyer régulièrement)

## Export de données

### Export CSV de l'historique
La page Historique permet d'exporter toutes les actions en CSV :
- Format : Date;Action;Utilisateur;Description
- Nom du fichier : `historique_YYYY-MM-DD.csv`
- Encodage : UTF-8 avec BOM

## Notifications futures (roadmap)

- [ ] Notifications push en temps réel (WebSocket)
- [ ] Envoi d'emails pour événements importants
- [ ] Notifications de rappel 24h avant une réservation
- [ ] Centre de préférences de notifications
- [ ] Regroupement intelligent des notifications similaires
- [ ] Statistiques de lecture des notifications

## Maintenance

### Nettoyage recommandé
```javascript
// Effacer les notifications lues de plus de 30 jours
const { notifications, deleteNotification } = useNotificationStore();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

notifications
  .filter(n => n.read && new Date(n.timestamp) < thirtyDaysAgo)
  .forEach(n => deleteNotification(n.id));
```

### Surveillance des performances
- Vérifier la taille du localStorage régulièrement
- Limiter le nombre d'entrées d'historique si nécessaire
- Optimiser les filtres pour grandes quantités de données

## Sécurité

- ✅ Les notifications ne contiennent pas d'informations sensibles
- ✅ L'historique est filtré selon le rôle de l'utilisateur
- ✅ Les actions sont tracées avec l'ID utilisateur pour audit
- ✅ Les données sont stockées localement (pas de fuite réseau)

## Tests recommandés

1. Créer une réservation → Vérifier notification admin + historique
2. Valider une réservation → Vérifier notification utilisateur + historique
3. Refuser une réservation → Vérifier notification utilisateur + historique
4. Annuler une réservation → Vérifier historique
5. Filtrer l'historique par type/date
6. Exporter l'historique en CSV
7. Marquer notifications comme lues
8. Persistance après rechargement de page
