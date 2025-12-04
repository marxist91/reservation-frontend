# Backend - Guide de Démarrage et Tâches

## ⚠️ IMPORTANT - Avant de démarrer le serveur

### 1. Vérifier que le serveur MySQL est lancé
```bash
# Ouvrir XAMPP et démarrer Apache + MySQL
```

### 2. Redémarrer le serveur backend
```bash
cd c:\xampp\htdocs\reservation-backend
node server.js
```

### 3. Vérifier dans les logs :
- ✅ Connexion MySQL réussie
- ✅ Scheduler d'annulation automatique démarré
- ✅ Serveur écoute sur port 3000

---

## 🔧 Tâches à Implémenter (Par ordre de priorité)

### ✅ TERMINÉ
- [x] Retrait middleware autoAudit des routes reservations.js (lignes 183, 725, 802, 899)
- [x] Route `/validate/:id` gère maintenant `action: 'valider'` et `action: 'refuser'`
- [x] Retour des relations complètes (utilisateur + salle) pour notifications frontend
- [x] Scheduler auto-annulation des réservations expirées (toutes les 5min)
- [x] Notifications/Historique créés côté frontend lors validation/refus

### 🔄 EN COURS
- [ ] **Tester validation complète** :
  1. Valider une réservation en attente
  2. Vérifier : statut change + notification utilisateur + 2 historiques
  3. Se connecter avec compte utilisateur → vérifier notification reçue
  
- [ ] **Tester refus** :
  1. Refuser une réservation
  2. Vérifier notification + historique

### ⏳ À FAIRE (PRIORITÉ HAUTE)

#### 1. Créer table Notifications en base de données
**Problème actuel** : Les notifications sont uniquement dans le store Zustand (disparaissent au refresh)

**Solution** : Créer modèle + table SQL

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  reservation_id INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
);
```

**Backend à ajouter** :
- Route POST `/notifications` - Créer notification
- Route GET `/notifications/mine` - Mes notifications
- Route PUT `/notifications/:id/read` - Marquer comme lu
- Route DELETE `/notifications/:id` - Supprimer

#### 2. Créer table Historique en base de données
**Même logique** que notifications pour persister l'historique

```sql
CREATE TABLE historique (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  action VARCHAR(255) NOT NULL,
  description TEXT,
  details JSON,
  reservation_id INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📋 Réservations Multiples (À IMPLÉMENTER)

### Route à créer : POST /api/reservations/create-multiple

Cet endpoint permet de créer plusieurs réservations en une seule requête pour gérer :
1. Plusieurs créneaux horaires dans la même journée (ex: matin + après-midi)
2. Réservations sur plusieurs jours consécutifs (ex: formation de 3 jours)

### Request Body

```json
{
  "room_id": 5,
  "motif": "Formation Excel avancée",
  "description": "Formation sur 3 jours avec pause midi",
  "isMultiDay": true,
  "date_debut": "2025-12-10",
  "date_fin": "2025-12-12",
  "days": 3,
  "timeSlots": [
    {
      "heure_debut": "09:00:00",
      "heure_fin": "12:00:00"
    },
    {
      "heure_debut": "14:00:00",
      "heure_fin": "17:00:00"
    }
  ]
}
```

### Logique Backend (à implémenter dans routes/reservations.js)

```javascript
router.post('/create-multiple', auth, async (req, res) => {
  const {
    room_id,
    motif,
    description,
    isMultiDay,
    date_debut,
    date_fin,
    days,
    timeSlots,
  } = req.body;

  const user_id = req.user.id;
  const transaction = await sequelize.transaction();

  try {
    // Validation
    if (!room_id || !motif || !date_debut || !timeSlots || timeSlots.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Données manquantes (room_id, motif, date_debut, timeSlots requis)'
      });
    }

    // Vérifier que la salle existe et est disponible
    const salle = await Salle.findByPk(room_id);
    if (!salle) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Salle introuvable' });
    }

    if (salle.statut !== 'disponible') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cette salle n\'est pas disponible' });
    }

    const reservations = [];
    const currentDate = new Date(date_debut);
    const endDate = new Date(date_fin || date_debut);

    // Générer un groupe_id unique pour lier toutes les réservations
    const groupe_id = `GRP-${Date.now()}-${user_id}`;

    // Boucle sur chaque jour
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Boucle sur chaque créneau horaire
      for (const slot of timeSlots) {
        const { heure_debut, heure_fin } = slot;

        // Vérifier les conflits pour ce créneau
        const conflits = await Reservation.findAll({
          where: {
            room_id,
            date: dateStr,
            statut: {
              [Op.notIn]: ['annulee', 'refusee']
            },
            [Op.or]: [
              {
                heure_debut: { [Op.lt]: heure_fin },
                heure_fin: { [Op.gt]: heure_debut }
              }
            ]
          },
          transaction
        });

        if (conflits.length > 0) {
          await transaction.rollback();
          return res.status(409).json({
            message: `Conflit détecté le ${dateStr} entre ${heure_debut} et ${heure_fin}`,
            conflit: conflits[0]
          });
        }

        // Créer la réservation
        const reservation = await Reservation.create({
          user_id,
          room_id,
          date: dateStr,
          heure_debut,
          heure_fin,
          motif,
          description: description || null,
          statut: 'en_attente',
          groupe_id, // Identifiant du groupe
          nombre_participants: 1,
        }, { transaction });

        reservations.push(reservation);
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await transaction.commit();

    // Charger les relations pour toutes les réservations
    const fullReservations = await Reservation.findAll({
      where: { groupe_id },
      include: [
        {
          model: Salle,
          as: 'salle',
          attributes: ['id', 'nom', 'capacite', 'batiment']
        },
        {
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'prenom', 'nom', 'email']
        }
      ]
    });

    res.status(201).json({
      message: `${reservations.length} réservation(s) créée(s) avec succès`,
      count: reservations.length,
      groupe_id,
      reservations: fullReservations
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création réservations multiples:', error);
    res.status(500).json({
      message: 'Erreur lors de la création des réservations',
      error: error.message
    });
  }
});
```

### Modifications du modèle Reservation

**ATTENTION** : Ajouter un champ `groupe_id` dans le modèle `Reservation` pour lier les réservations d'un même groupe :

```javascript
// Dans models/Reservation.js
groupe_id: {
  type: DataTypes.STRING(50),
  allowNull: true,
  comment: 'Identifiant de groupe pour les réservations multiples liées'
},
```

### Migration SQL REQUISE

```sql
-- Ajouter la colonne groupe_id
ALTER TABLE reservations 
ADD COLUMN groupe_id VARCHAR(50) NULL 
COMMENT 'Identifiant de groupe pour les réservations multiples liées';

-- Index pour optimiser les recherches par groupe
CREATE INDEX idx_reservations_groupe_id ON reservations(groupe_id);
```

**⚠️ À FAIRE AVANT D'UTILISER /create-multiple** : Exécuter cette migration dans phpMyAdmin

---

## 🐛 Erreurs Connues et Solutions

### Erreur "AuditLog.logAction is not a function"
**Cause** : Middleware autoAudit défectueux  
**Solution** : ✅ Retiré de toutes les routes (validate, delete, assign, update)

### Notifications disparaissent au refresh
**Cause** : Store Zustand uniquement en mémoire  
**Solution** : ⏳ À FAIRE - Créer table notifications en BDD

### Validation réussit mais pas de notification utilisateur
**Cause** : Backend ne retourne pas les relations (utilisateur + salle)  
**Solution** : ✅ CORRIGÉ - Route `/validate/:id` inclut maintenant `utilisateur` et `salle`

---

## 📝 Logs et Debugging

### Vérifier les logs backend :
```bash
# Dans le terminal backend, chercher :
✅ Connexion MySQL réussie
✅ Scheduler activé - vérifie toutes les 5 minutes
⚠️ Toute erreur SQL ou Sequelize
```

### Tester manuellement dans phpMyAdmin :
```sql
-- Voir toutes les réservations en attente
SELECT * FROM reservations WHERE statut = 'en_attente';

-- Voir les réservations expirées
SELECT * FROM reservations 
WHERE statut = 'en_attente' 
AND date_debut < NOW();

-- Voir un groupe de réservations
SELECT * FROM reservations WHERE groupe_id = 'GRP-XXX';
```

---

## 🔄 Workflow de Validation Complet

1. **Admin valide** une réservation
2. **Backend** (`/validate/:id`) :
   - Met à jour `statut = 'validée'`
   - Retourne réservation avec `utilisateur` + `salle`
3. **Frontend** (`ReservationsManagement.jsx`) :
   - Reçoit la réponse
   - Crée notification pour utilisateur (store Zustand)
   - Crée 2 historiques : utilisateur + admin
4. **Utilisateur** voit :
   - Notification dans son interface
   - Historique mis à jour
   - Statut réservation = "Validée"

**⚠️ LIMITES ACTUELLES** :
- Notifications/historique perdus au refresh (pas en BDD)
- Utilisateur doit être connecté pour voir notification

---

## 🚀 Prochaines Étapes

### URGENT (Bugs bloquants)
1. ⏳ Tester validation/refus après redémarrage backend
2. ⏳ Créer table `notifications` en BDD
3. ⏳ Créer table `historique` en BDD

### IMPORTANT (Features)
4. ⏳ Implémenter `/create-multiple` pour réservations groupées
5. ⏳ Ajouter migration `groupe_id` dans table `reservations`
6. ⏳ Endpoints `/validate-group/:groupe_id` et `/cancel-group/:groupe_id`

### BONUS (Améliorations)
7. ⏳ Notifications par email (déjà préparé dans backend avec `sendEmail`)
8. ⏳ WebSocket pour notifications temps réel
9. ⏳ Badge "Groupe" dans calendrier pour réservations liées

---

## 📞 Contact / Support

Si erreur persiste :
1. Vérifier logs terminal backend
2. Vérifier console navigateur (erreurs API)
3. Tester requête dans Postman/Thunder Client
4. Vérifier connexion MySQL dans phpMyAdmin

---

# Documentation Technique - Réservations Multiples



### Validation et Annulation Groupée

Optionnel : Créer des endpoints pour valider/annuler tout un groupe :

```javascript
// Valider toutes les réservations d'un groupe
router.put('/validate-group/:groupe_id', auth, isAdmin, async (req, res) => {
  try {
    const [updated] = await Reservation.update(
      { statut: 'validee' },
      {
        where: {
          groupe_id: req.params.groupe_id,
          statut: 'en_attente'
        }
      }
    );

    res.json({
      message: `${updated} réservation(s) validée(s)`,
      count: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Annuler toutes les réservations d'un groupe
router.delete('/cancel-group/:groupe_id', auth, async (req, res) => {
  try {
    const [updated] = await Reservation.update(
      { statut: 'annulee' },
      {
        where: {
          groupe_id: req.params.groupe_id,
          user_id: req.user.id
        }
      }
    );

    res.json({
      message: `${updated} réservation(s) annulée(s)`,
      count: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

## Utilisation Frontend

Le formulaire envoie automatiquement les bonnes données :

### Exemple 1 : Formation matin + après-midi (même jour)
- **isMultiDay**: false
- **date_debut**: "2025-12-10"
- **date_fin**: "2025-12-10"
- **timeSlots**: [{9h-12h}, {14h-17h}]
- **Résultat**: 2 réservations créées pour le même jour

### Exemple 2 : Formation sur 3 jours
- **isMultiDay**: true
- **date_debut**: "2025-12-10"
- **date_fin**: "2025-12-12"
- **timeSlots**: [{9h-12h}, {14h-17h}]
- **Résultat**: 6 réservations créées (3 jours × 2 créneaux)

### Exemple 3 : Réservation simple journée entière
- **isMultiDay**: false
- **date_debut**: "2025-12-10"
- **date_fin**: "2025-12-10"
- **timeSlots**: [{9h-17h}]
- **Résultat**: 1 réservation créée

## Tests Postman

```bash
POST http://localhost:3000/api/reservations/create-multiple
Authorization: Bearer {token}
Content-Type: application/json

{
  "room_id": 5,
  "motif": "Formation Excel",
  "description": "Formation avancée sur 3 jours",
  "isMultiDay": true,
  "date_debut": "2025-12-10",
  "date_fin": "2025-12-12",
  "days": 3,
  "timeSlots": [
    {
      "heure_debut": "09:00:00",
      "heure_fin": "12:00:00"
    },
    {
      "heure_debut": "14:00:00",
      "heure_fin": "17:00:00"
    }
  ]
}
```

## Affichage dans le Calendrier

Pour afficher visuellement les réservations groupées dans le calendrier, ajouter un indicateur :

```jsx
// Dans Calendar.jsx
const getGroupedReservations = (reservations) => {
  const groups = {};
  reservations.forEach(r => {
    if (r.groupe_id) {
      if (!groups[r.groupe_id]) {
        groups[r.groupe_id] = [];
      }
      groups[r.groupe_id].push(r);
    }
  });
  return groups;
};

// Afficher un badge "Groupe" pour les réservations liées
{reservation.groupe_id && (
  <Chip 
    label={`Groupe (${groupedCount} créneaux)`} 
    size="small" 
    color="info" 
  />
)}
```
