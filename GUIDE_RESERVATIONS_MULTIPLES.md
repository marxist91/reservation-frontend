# Système de Réservations Multiples - Guide Complet

## ✅ Fonctionnalités Implémentées

### 1. **Créneaux Multiples dans la Même Journée**
- Permet d'ajouter plusieurs créneaux horaires pour une même journée
- Exemple : Formation matin (9h-12h) + après-midi (14h-17h)
- Validation automatique : empêche les chevauchements de créneaux

### 2. **Réservations sur Plusieurs Jours Consécutifs**
- Option "Réservation sur plusieurs jours" avec switch
- Sélection de date de début et date de fin
- Affichage du nombre de jours calculé automatiquement
- Exemple : Formation de 3 jours (10-12 décembre)

### 3. **Affichage Visuel des Groupes**
- Badge numérique circulaire dans le calendrier (ex: "3" pour 3 créneaux groupés)
- Bordure renforcée pour distinguer visuellement les réservations groupées
- Chip "Groupe (X créneaux)" dans les détails
- Chip "Réservation groupée" dans les cartes de réservation
- Tooltip informatif au survol

## 🎨 Interface Utilisateur

### ReservationForm
```
┌─────────────────────────────────────┐
│  Nouvelle Réservation                │
├─────────────────────────────────────┤
│  Salle: [Sélection]                  │
│                                      │
│  ☐ Réservation sur plusieurs jours  │
│                                      │
│  Date: [10/12/2025]  Date fin: [...] │
│  ℹ️ 3 jour(s) de réservation         │
│                                      │
│  ───── Créneaux horaires ─────      │
│                                      │
│  Créneau 1                           │
│  Début: [09:00]  Fin: [12:00]  [X]  │
│                                      │
│  Créneau 2                           │
│  Début: [14:00]  Fin: [17:00]  [X]  │
│                                      │
│  [+ Ajouter un créneau horaire]      │
│                                      │
│  💡 Exemple: Formation matin + PM    │
│                                      │
│  ─────────────────────────────       │
│                                      │
│  Motif: [Formation Excel]            │
│  Description: [...]                  │
│                                      │
│  [Annuler]  [Réserver]               │
└─────────────────────────────────────┘
```

### Calendrier - Vue Mois
```
┌────────────────────────────────┐
│ 10 Décembre            [3]     │
│                                │
│  ⓷ 09:00 • Salle A             │  <- Badge "3" = groupe
│  ⓷ 14:00 • Salle A             │  <- Bordure renforcée
│  ⓷ 09:00 • Salle A             │
└────────────────────────────────┘
```

### Panneau Détails
```
┌─────────────────────────────────────┐
│  Salle A                             │
│  ● Confirmée  [Groupe (6 créneaux)] │
│                                      │
│  🕐 09:00 - 12:00                    │
│  Formation Excel avancée             │
└─────────────────────────────────────┘
```

## 📡 Flux de Données

### Frontend → Backend

**Format envoyé pour réservations multiples :**
```javascript
{
  room_id: 5,
  motif: "Formation Excel",
  description: "Formation sur 3 jours",
  isMultiDay: true,
  date_debut: "2025-12-10",
  date_fin: "2025-12-12",
  days: 3,
  timeSlots: [
    { heure_debut: "09:00:00", heure_fin: "12:00:00" },
    { heure_debut: "14:00:00", heure_fin: "17:00:00" }
  ]
}
```

**Endpoint utilisé :**
- `/api/reservations/create-multiple` (POST)

**Résultat :**
- 6 réservations créées (3 jours × 2 créneaux)
- Toutes ont le même `groupe_id`
- Exemple : `GRP-1733247890123-42`

## 🔧 Validations Frontend

1. **Validation des créneaux :**
   - Heure de fin > heure de début ✅
   - Aucun chevauchement entre créneaux ✅
   - Tous les champs remplis ✅

2. **Validation des dates :**
   - Date de fin ≥ date de début ✅
   - Date de début pas dans le passé ✅
   - Motif obligatoire ✅

3. **Messages d'erreur clairs :**
   - "Les créneaux 1 et 2 se chevauchent"
   - "L'heure de fin doit être après l'heure de début (créneau 2)"
   - "La date de fin doit être après la date de début"

## 🎯 Exemples d'Utilisation

### Exemple 1 : Réunion matin + après-midi
```
- Date: 10/12/2025
- Multi-jours: NON
- Créneaux:
  • 09:00 - 12:00
  • 14:00 - 17:00
- Résultat: 2 réservations créées
```

### Exemple 2 : Formation 3 jours
```
- Date début: 10/12/2025
- Date fin: 12/12/2025
- Multi-jours: OUI
- Créneaux:
  • 09:00 - 17:00
- Résultat: 3 réservations créées
```

### Exemple 3 : Séminaire complet (3 jours, matin + après-midi)
```
- Date début: 10/12/2025
- Date fin: 12/12/2025
- Multi-jours: OUI
- Créneaux:
  • 09:00 - 12:00
  • 14:00 - 17:00
- Résultat: 6 réservations créées
- groupe_id: GRP-1733247890123-42
```

## 🛠️ Backend - À Implémenter

### Fichier de référence
Consultez `BACKEND_MULTI_RESERVATIONS.md` pour :
- Code complet de l'endpoint `/create-multiple`
- Modification du modèle Reservation (ajout `groupe_id`)
- Migration SQL
- Gestion des transactions
- Détection des conflits horaires
- Endpoints bonus (validation/annulation groupée)

### Points clés backend
1. **Transaction** : Utiliser une transaction pour créer toutes les réservations atomiquement
2. **Détection conflits** : Vérifier pour chaque jour + créneau qu'il n'y a pas de conflit
3. **groupe_id** : Générer un ID unique pour lier toutes les réservations
4. **Rollback** : Si un seul créneau est en conflit, annuler toute la création

## 📊 Affichage Visuel

### Indicateurs visuels
1. **Badge circulaire** : Nombre de créneaux dans le groupe
2. **Bordure renforcée** : 2px au lieu de 1px, semi-transparente
3. **Chip info** : "Groupe (X créneaux)" dans les détails
4. **Tooltip** : Information au survol dans le calendrier
5. **Chip outlined** : "Réservation groupée" dans les cartes

### Couleurs et styles
- Badge : fond blanc semi-transparent (rgba(255,255,255,0.3))
- Bordure : blanc semi-transparent (rgba(255,255,255,0.5))
- Chip groupe : couleur "info" (bleu)
- Taille badge : 14×14px, police 0.6rem

## 🧪 Tests Recommandés

### Tests Frontend
1. ✅ Ajouter 2 créneaux → vérifier affichage
2. ✅ Supprimer un créneau → vérifier mise à jour
3. ✅ Créneaux qui se chevauchent → vérifier erreur
4. ✅ Mode multi-jours ON/OFF → vérifier champs
5. ✅ Validation formulaire → tous les cas d'erreur

### Tests Backend (après implémentation)
1. ⏳ Créer groupe 2 créneaux × 1 jour → 2 réservations, même groupe_id
2. ⏳ Créer groupe 2 créneaux × 3 jours → 6 réservations
3. ⏳ Conflit détecté → rollback, aucune réservation créée
4. ⏳ Validation groupe → toutes réservations validées
5. ⏳ Annulation groupe → toutes réservations annulées

### Tests Intégration
1. ⏳ Créer groupe → vérifier affichage calendrier
2. ⏳ Créer groupe → vérifier notifications/historique
3. ⏳ Valider groupe → vérifier tous statuts changés
4. ⏳ Annuler groupe → vérifier affichage mis à jour

## 🚀 Prochaines Étapes

### Priorité 1 (Backend)
1. Créer route `/create-multiple` selon documentation
2. Ajouter colonne `groupe_id` au modèle Reservation
3. Tester création de groupes avec Postman

### Priorité 2 (Features)
1. Validation groupée (admin valide tout le groupe en 1 clic)
2. Annulation groupée (utilisateur annule toutes ses réservations d'un groupe)
3. Modification groupe (modifier toutes les réservations liées)

### Priorité 3 (UX)
1. Filtre "Réservations groupées" dans la liste
2. Vue dédiée "Mes groupes de réservations"
3. Export PDF du groupe complet
4. Email récapitulatif du groupe créé

## 📝 Notes Techniques

### État du frontend
- ✅ Formulaire 100% fonctionnel
- ✅ Validation complète
- ✅ Affichage visuel des groupes
- ✅ API configurée pour envoyer au bon endpoint
- ⏳ En attente de l'implémentation backend

### Compatibilité
- Compatible avec réservations simples existantes (ancien format)
- Détection automatique : `isMultiDay` ou `timeSlots.length > 0` → mode multiple
- Sinon → ancien endpoint `/create` utilisé

### Performance
- Groupes affichés via `useMemo` (pas de calcul à chaque render)
- Tooltip seulement sur les réservations groupées (optimisation)
- Badge conditionnel (n'affiche que si groupe > 1)

## 💡 Conseils d'Utilisation

### Pour les utilisateurs
1. Utilisez le mode multi-jours pour les formations/séminaires
2. Ajoutez plusieurs créneaux pour les journées avec pause midi
3. La description est optionnelle mais utile pour détailler le programme
4. Toutes les réservations du groupe auront le même statut

### Pour les administrateurs
1. Validez/refusez un groupe entier via l'endpoint dédié (futur)
2. Le `groupe_id` permet de tracer toutes les réservations liées
3. En cas de conflit, aucune réservation du groupe n'est créée

### Pour les développeurs
1. Consultez `BACKEND_MULTI_RESERVATIONS.md` pour l'implémentation
2. Les validations frontend évitent la majorité des erreurs
3. Le backend doit vérifier les conflits pour chaque combinaison jour×créneau
4. Utilisez une transaction pour garantir l'atomicité
