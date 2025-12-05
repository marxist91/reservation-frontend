# 🚀 Guide de Déploiement Production

## ✅ Checklist Pré-Déploiement

### 1. Configuration TypeScript
- [x] TypeScript configuré avec mode strict
- [x] Tous les fichiers API migrés vers .ts
- [x] Types définis dans src/types/index.ts
- [x] `npm run type-check` passe sans erreurs
- [ ] Fichiers utils/, store/, hooks/ à migrer vers .ts/.tsx
- [ ] Composants React à migrer vers .tsx

### 2. Variables d'Environnement

Créer un fichier `.env.production` :

```env
VITE_API_URL=https://votre-backend-production.com/api
VITE_APP_NAME=Système de Réservation de Salles
VITE_APP_VERSION=1.0.0
```

### 3. Build de Production

```bash
# Vérifier les types TypeScript
npm run type-check

# Linter le code
npm run lint

# Build optimisé pour production
npm run build:prod
```

Le build créera un dossier `dist/` optimisé avec:
- Code minifié (Terser)
- Code splitting (chunks séparés pour React, MUI, React Query, Recharts)
- Console.log supprimés
- Source maps pour debugging
- Assets optimisés

### 4. Configuration Serveur

#### Option A: Serveur Apache (.htaccess)

Créer `.htaccess` dans le dossier racine :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compression Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache navigateur
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

#### Option B: Serveur Nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/reservation-frontend/dist;
    index index.html;

    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Option C: Serveur Node.js (Express)

```javascript
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Compression
app.use(compression());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});
```

### 5. Déploiement

#### Via FTP/SFTP
```bash
# Build local
npm run build:prod

# Upload du dossier dist/ vers le serveur
# Utiliser FileZilla, WinSCP ou similaire
```

#### Via Git + CI/CD (GitHub Actions)

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [master, main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build:prod
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Deploy to Server
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: /public_html/
```

#### Via Vercel (Gratuit)

```bash
# Installer Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configurer `vercel.json` :

```json
{
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Via Netlify (Gratuit)

Créer `netlify.toml` :

```toml
[build]
  command = "npm run build:prod"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### 6. Optimisations Post-Déploiement

#### A. Monitoring des Erreurs

Intégrer Sentry :

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
});
```

#### B. Analytics

Intégrer Google Analytics :

```typescript
// src/utils/analytics.ts
export const pageview = (url: string) => {
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
    });
  }
};
```

#### C. Performance Monitoring

Utiliser Web Vitals :

```bash
npm install web-vitals
```

```typescript
// src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 7. Sécurité

#### Headers de Sécurité

Ajouter dans la configuration serveur :

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### HTTPS

- Utiliser Let's Encrypt pour certificat SSL gratuit
- Forcer la redirection HTTP → HTTPS
- Activer HSTS

### 8. Tests Avant Mise en Ligne

```bash
# Build de test
npm run build:prod

# Tester localement le build
npm run preview
# Ouvrir http://localhost:4173

# Vérifier:
# ✓ Toutes les pages accessibles
# ✓ Authentification fonctionne
# ✓ API calls fonctionnent (changer VITE_API_URL)
# ✓ Pas d'erreurs console
# ✓ Images chargent
# ✓ Responsive sur mobile
```

### 9. Performance Checklist

- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Total Bundle Size < 500KB (gzipped)
- [ ] Images optimisées (WebP)
- [ ] Lazy loading des images
- [ ] Code splitting actif

### 10. Monitoring Production

#### Logs à surveiller :
- Erreurs JavaScript (Sentry)
- Requêtes API échouées
- Temps de chargement pages
- Taux de rebond
- Conversions (réservations créées)

#### Outils recommandés :
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Analytics**: Google Analytics, Plausible
- **Performance**: Lighthouse CI, WebPageTest

## 📊 Métriques de Succès

- Disponibilité: > 99.9%
- Temps de réponse API: < 500ms
- Erreurs JavaScript: < 0.1%
- Score Lighthouse: > 90
- Temps de chargement: < 3s

## 🔄 Processus de Mise à Jour

```bash
# 1. Développer et tester localement
git checkout -b feature/nouvelle-fonctionnalite
# ... développement ...
npm run type-check
npm run lint
npm run build

# 2. Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# 3. Merger vers master après review
git checkout master
git merge feature/nouvelle-fonctionnalite

# 4. Build et déployer
npm run build:prod
# Upload vers serveur

# 5. Vérifier en production
# Tester les fonctionnalités critiques
```

## 🆘 Rollback Rapide

En cas de problème :

```bash
# Revenir au commit précédent
git revert HEAD
git push origin master

# Rebuild et redéployer
npm run build:prod
# Upload
```

Ou garder 2-3 versions précédentes sur le serveur :

```
/var/www/
  ├── reservation-frontend-current/ → lien symbolique
  ├── reservation-frontend-v1.2.0/
  ├── reservation-frontend-v1.1.0/
  └── reservation-frontend-v1.0.0/
```

## 📞 Support

En cas de problème en production :
1. Vérifier les logs serveur
2. Vérifier Sentry pour les erreurs JS
3. Tester l'API backend
4. Vérifier les variables d'environnement
5. Rollback si nécessaire

---

**Dernière mise à jour**: 5 décembre 2025  
**Version**: 1.0.0  
**Contact**: support@votre-domaine.com
