# 🔍 GUIDE DE DIAGNOSTIC FRONTEND-BACKEND

## ✅ Comment vérifier que le backend est bien relié au frontend

### 1. Accéder à la page de test
Une fois le frontend démarré, visitez : **http://localhost:5173/test-connection**

Cette page va automatiquement tester :
- ✅ Si le backend est accessible
- ✅ Si CORS est bien configuré
- ✅ Si la base de données répond
- ✅ Possibilité de tester une connexion avec vos identifiants

### 2. Vérifications manuelles

#### A. Backend démarré ?
```powershell
# Vérifier que XAMPP Apache et MySQL sont démarrés
# Ouvrir dans un navigateur:
http://localhost:3000/api
# Vous devriez voir un message du backend
```

#### B. Frontend démarré ?
```powershell
cd c:\xampp\htdocs\reservation-frontend
npm run dev
# Devrait ouvrir sur http://localhost:5173
```

#### C. Vérifier la console du navigateur
1. Ouvrir la page de login : http://localhost:5173/login
2. Ouvrir les DevTools (F12)
3. Aller dans l'onglet **Console**
4. Essayer de se connecter
5. Regarder les messages d'erreur détaillés

#### D. Vérifier les requêtes réseau
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet **Network** (Réseau)
3. Essayer de se connecter
4. Regarder la requête vers `/api/login`
5. Cliquer dessus pour voir :
   - **Headers** : vérifier l'URL appelée
   - **Payload** : vérifier les données envoyées
   - **Response** : voir la réponse du serveur

### 3. Problèmes courants

#### ❌ Erreur: "Network Error" ou "ERR_CONNECTION_REFUSED"
**Problème:** Le backend n'est pas démarré

**Solution:**
```powershell
cd c:\xampp\htdocs\reservation-backend
.\start-xampp.bat
# Attendre que Apache et MySQL démarrent
```

#### ❌ Erreur: "CORS policy"
**Problème:** Le backend n'autorise pas les requêtes du frontend

**Solution:** Vérifier dans `backend/index.php` :
```php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

#### ❌ Erreur: "Invalid credentials" ou "Utilisateur non trouvé"
**Problème:** Les identifiants sont incorrects ou l'utilisateur n'existe pas

**Solution:** Vérifier dans phpMyAdmin :
1. Aller sur http://localhost/phpmyadmin
2. Sélectionner la base `reservation_salles`
3. Ouvrir la table `users`
4. Vérifier qu'un utilisateur existe avec cet email
5. Vérifier que le mot de passe est bien hashé avec `password_hash()`

#### ❌ Le mot de passe ne correspond pas
**Problème:** Le mot de passe en base de données n'est pas correctement hashé

**Solution:** Créer un utilisateur via le endpoint `/register` :
```javascript
// Dans la console du navigateur sur http://localhost:5173/register
// Ou utiliser la page d'inscription
```

### 4. Tester avec un nouvel utilisateur

1. Aller sur http://localhost:5173/register
2. Créer un nouveau compte :
   - Nom: Test
   - Prénom: User
   - Email: test@example.com
   - Téléphone: 0612345678
   - Mot de passe: password123
3. Si la création réussit, vous serez redirigé vers le dashboard
4. Sinon, vérifier la console pour voir l'erreur exacte

### 5. Vérifier les données en base

```sql
-- Ouvrir phpMyAdmin : http://localhost/phpmyadmin
-- Sélectionner la base reservation_salles
-- Exécuter :

SELECT id, nom, prenom, email, role, created_at FROM users;

-- Vérifier qu'il y a au moins un utilisateur
```

### 6. Logs détaillés

Quand vous essayez de vous connecter, regardez la console du navigateur (F12). Vous verrez :
- L'URL appelée
- Les données envoyées
- La réponse complète du serveur
- Le message d'erreur exact

### 7. Test rapide Backend

Dans un terminal PowerShell :
```powershell
# Tester si le backend répond
curl http://localhost:3000/api

# Tester l'endpoint users
curl http://localhost:3000/api/users

# Tester un login (remplacer par vos identifiants)
curl -X POST http://localhost:3000/api/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'
```

---

## 🎯 Checklist de vérification rapide

- [ ] XAMPP Apache démarré ✅
- [ ] XAMPP MySQL démarré ✅
- [ ] Backend accessible sur http://localhost:3000/api ✅
- [ ] Frontend démarré sur http://localhost:5173 ✅
- [ ] Base de données `reservation_salles` existe ✅
- [ ] Table `users` existe avec des données ✅
- [ ] CORS configuré dans le backend ✅
- [ ] Fichier .env existe avec `VITE_API_URL=http://localhost:3000/api` ✅

---

**Si tout est vert ✅ et que ça ne marche toujours pas, utilisez la page de test : http://localhost:5173/test-connection**
