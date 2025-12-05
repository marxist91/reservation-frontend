# 🚀 Guide de Migration TypeScript - Production Ready

## ✅ Configuration Complétée

### 1. Dépendances Installées
- ✅ TypeScript 5.9.3
- ✅ @types/react & @types/react-dom
- ✅ @types/node
- ✅ @typescript-eslint/eslint-plugin & parser
- ✅ vite-plugin-checker

### 2. Fichiers de Configuration Créés

#### `tsconfig.json` - Configuration TypeScript STRICTE
- Mode strict activé pour production
- Rules strictes : noUnusedLocals, noImplicitReturns, exactOptionalPropertyTypes
- Path aliases configurés (@/, @/components, @/api, etc.)

#### `tsconfig.node.json` - Configuration pour Vite
- Configuration séparée pour les fichiers de build

#### `vite.config.ts` - Build optimisé
- TypeScript checker en temps réel pendant le dev
- Build optimisé avec code splitting (vendor-react, vendor-mui, vendor-query, vendor-charts)
- Minification terser avec suppression des console.log
- Source maps pour debugging production

#### `eslint.config.mjs` - Linting avec types
- Rules TypeScript strictes (@typescript-eslint/recommended-type-checked)
- Détection des Promises non gérées
- Vérification des types dans les expressions booléennes
- Warnings sur les any explicites

### 3. Types Créés (`src/types/index.ts`)
```typescript
// Enums
- UserRole, ReservationStatus, NotificationType, HistoryActionType

// Models
- User, Room, Reservation, Notification, History

// API Responses
- ApiResponse<T>, PaginatedResponse<T>, LoginResponse, RegisterResponse

// Form Data
- LoginFormData, RegisterFormData, ReservationFormData, RoomFormData, UserFormData

// Filters
- ReservationFilters, RoomFilters, NotificationFilters, HistoryFilters

// Statistics
- ReservationStats, RoomOccupancy, TopRoom, TopUser, EvolutionDataPoint
```

### 4. Scripts NPM Configurés
```json
"dev": "vite"                          // Dev avec type checking en temps réel
"build": "tsc && vite build"           // Build avec vérification TypeScript
"build:prod": "tsc --noEmit && vite build --mode production"  // Build optimisé production
"type-check": "tsc --noEmit"          // Vérifier les types uniquement
"type-check:watch": "tsc --noEmit --watch"  // Watch mode pour les types
"lint": "eslint . --ext ts,tsx"       // Lint avec rules TypeScript
"lint:fix": "eslint . --ext ts,tsx --fix"   // Auto-fix des erreurs
```

## 📋 Prochaines Étapes de Migration

### Phase 1: Migration des fichiers non-React (PRIORITÉ)

#### 1.1 Migrer `src/api/client.ts`
```bash
# Renommer et convertir
mv src/api/client.js src/api/client.ts
```

Exemple de conversion:
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteurs typés
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<never>>) => {
    // Gestion d'erreur typée
    return Promise.reject(error);
  }
);

export default client;
```

#### 1.2 Migrer tous les fichiers `src/api/*.js` vers `.ts`
```bash
# Liste des fichiers à migrer:
- src/api/auth.js → auth.ts
- src/api/reservations.js → reservations.ts
- src/api/rooms.js → rooms.ts
- src/api/users.js → users.ts
- src/api/notifications.js → notifications.ts
- src/api/history.js → history.ts
```

Exemple pour `auth.ts`:
```typescript
import client from './client';
import type { LoginFormData, RegisterFormData, LoginResponse, RegisterResponse, ApiResponse } from '@/types';

export const authAPI = {
  login: async (credentials: LoginFormData): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterFormData): Promise<RegisterResponse> => {
    const response = await client.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await client.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },
};
```

#### 1.3 Migrer `src/utils/*.js` vers `.ts`
```bash
- src/utils/constants.js → constants.ts
- src/utils/formatters.js → formatters.ts
- src/utils/validators.js → validators.ts
```

Exemple `formatters.ts`:
```typescript
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: fr });
};

export const formatTime = (time: string): string => {
  return time.slice(0, 5); // "14:30:00" -> "14:30"
};

export const formatReservationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'en_attente': 'En attente',
    'confirmee': 'Confirmée',
    'validee': 'Validée',
    'rejetee': 'Rejetée',
    'refusee': 'Refusée',
    'annulee': 'Annulée',
  };
  return statusMap[status] ?? status;
};
```

### Phase 2: Migration des Stores Zustand

#### 2.1 Migrer `src/store/*.js` vers `.ts`
```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

### Phase 3: Migration des Hooks

#### 3.1 Migrer `src/hooks/*.js` vers `.ts`
```typescript
// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { LoginFormData, RegisterFormData, User } from '@/types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { setUser, setToken, logout: logoutStore } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginFormData) => authAPI.login(credentials),
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterFormData) => authAPI.register(userData),
  });

  const logout = (): void => {
    logoutStore();
    queryClient.clear();
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  };
};
```

### Phase 4: Migration des Composants React

#### 4.1 Migrer progressivement `.jsx` vers `.tsx`

**Ordre recommandé:**
1. Composants simples (cards, buttons) - 10 fichiers
2. Formulaires (LoginForm, RegisterForm) - 5 fichiers
3. Pages simples (NotFound, Profile) - 5 fichiers
4. Pages complexes (Dashboard, Statistics) - 10 fichiers
5. Layouts (Layout, Navbar, Sidebar) - 3 fichiers

**Exemple de conversion:**
```tsx
// src/components/reservations/ReservationCard.tsx
import { FC } from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import type { Reservation } from '@/types';
import { formatDate, formatTime } from '@/utils/formatters';

interface ReservationCardProps {
  reservation: Reservation;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: number) => void;
}

export const ReservationCard: FC<ReservationCardProps> = ({ 
  reservation, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{reservation.salle?.nom}</Typography>
        <Typography variant="body2">
          {formatDate(reservation.date)} - {formatTime(reservation.heure_debut)} à {formatTime(reservation.heure_fin)}
        </Typography>
        <Chip label={reservation.statut} color="primary" />
      </CardContent>
    </Card>
  );
};
```

## 🔧 Commandes Utiles

### Vérifier les erreurs TypeScript
```bash
npm run type-check
```

### Vérifier en mode watch (pendant le dev)
```bash
npm run type-check:watch
```

### Linter le code
```bash
npm run lint
```

### Auto-fix des erreurs de lint
```bash
npm run lint:fix
```

### Build de production
```bash
npm run build:prod
```

### Tester le build localement
```bash
npm run preview
```

## 🎯 Checklist de Production

Avant de déployer en production, vérifiez:

- [ ] ✅ Tous les fichiers .js/.jsx migrés vers .ts/.tsx
- [ ] ✅ `npm run type-check` passe sans erreurs
- [ ] ✅ `npm run lint` passe sans warnings
- [ ] ✅ `npm run build:prod` réussit
- [ ] ✅ Aucun `any` explicite dans le code (sauf cas justifiés)
- [ ] ✅ Tous les composants ont des PropTypes/interfaces
- [ ] ✅ Toutes les fonctions ont des types de retour explicites
- [ ] ✅ Les erreurs async/await sont gérées (no-floating-promises)
- [ ] ✅ Variables d'environnement typées
- [ ] ✅ Tests unitaires passent (si présents)
- [ ] ✅ Build size < 500KB (gzipped)
- [ ] ✅ Source maps générées pour debugging

## 📊 Optimisations de Production Activées

### Vite Build
- ✅ Code splitting automatique (vendor chunks séparés)
- ✅ Minification Terser
- ✅ Suppression des `console.log`
- ✅ Tree shaking
- ✅ CSS minification
- ✅ Asset optimization

### TypeScript
- ✅ Mode strict
- ✅ Dead code elimination
- ✅ Type checking at build time

### ESLint
- ✅ Detection des code smells
- ✅ Best practices React
- ✅ Type-aware linting

## 🚨 Erreurs Courantes et Solutions

### Erreur: "Cannot find module '@/types'"
**Solution:** Redémarrer le serveur Vite après avoir ajouté tsconfig.json

### Erreur: "Property 'X' does not exist on type 'never'"
**Solution:** Typer correctement les responses API avec `ApiResponse<YourType>`

### Erreur: "Unsafe assignment of an any value"
**Solution:** Ajouter des types explicites aux données de l'API

### Erreur: "Promise returned in function argument where a void return was expected"
**Solution:** Wrapper dans une fonction anonyme ou utiliser `void promise()`

## 📚 Ressources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vite TypeScript Guide](https://vitejs.dev/guide/features.html#typescript)
- [Zustand TypeScript Guide](https://docs.pmnd.rs/zustand/guides/typescript)
- [React Query TypeScript](https://tanstack.com/query/latest/docs/react/typescript)

## 🎉 Prochaine Étape

Commencez la migration progressive en suivant l'ordre:
1. **API clients** (src/api/*.js)
2. **Utils** (src/utils/*.js)
3. **Stores** (src/store/*.js)
4. **Hooks** (src/hooks/*.js)
5. **Components** (src/components/**/*.jsx)
6. **Pages** (src/pages/**/*.jsx)

Utilisez `git commit` après chaque section migrée pour faciliter le rollback si nécessaire.

**Bon courage ! 🚀**
