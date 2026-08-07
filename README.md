# Porte des Cieux — Dashboard Administrateur Web

Interface d'administration complète pour la gestion de l'**Église Porte des Cieux** (EPDC / JFT — Kinshasa, Paris, Bruxelles). Construite en React 19 + TypeScript, elle consomme l'API GraphQL du backend via Apollo Client v4.

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 19.2.5 | UI |
| TypeScript | 6.0.3 | Typage statique |
| Vite | 8.0.10 | Bundler / Dev server |
| Tailwind CSS | 4.2.4 | Styles (via `@tailwindcss/vite`) |
| React Router | 7.14.2 | Routing SPA |
| Apollo Client | 4.1.9 | GraphQL HTTP + WebSocket |
| graphql-ws | latest | Subscriptions temps réel |
| Zustand | 5.0.12 | État global (auth + UI) |
| Zod | 4.4.1 | Validation des formulaires |
| React Hook Form | 7.74.0 | Gestion des formulaires |
| @tanstack/react-table | 8.21.3 | Tableaux de données |
| Recharts | 3.8.1 | Graphiques dashboard |
| Lucide React | 1.14.0 | Icônes |
| React Hot Toast | 2.6.0 | Notifications toast |
| date-fns | 4.1.0 | Formatage des dates |

---

## Prérequis

- Node.js >= 20
- Backend `app/backend` démarré sur le port **4000**
- PostgreSQL + Redis opérationnels (via le backend)

---

## Installation et démarrage

```bash
# Dans app/frontend/
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## Variables d'environnement

Créer un fichier `.env` à la racine de `app/frontend/` :

```env
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
VITE_UPLOAD_URL=http://localhost:4000/api/upload/image
```

En production, remplacer `localhost:4000` par l'URL publique du backend.

---

## Scripts disponibles

```bash
npm run dev       # Serveur de développement avec HMR
npm run build     # Build de production (dist/)
npm run preview   # Prévisualiser le build de production
npm run lint      # Linter ESLint
```

---

## Architecture du projet

```
src/
├── components/
│   ├── layout/           # AppLayout, Sidebar, Header, ProtectedRoute
│   └── ui/               # Composants réutilisables
│       ├── DataTable.tsx         # Tableau paginé (@tanstack/react-table)
│       ├── ProcessingModal.tsx   # Modal de chargement pour toutes les mutations
│       ├── ConfirmModal.tsx      # Modal de confirmation pour les suppressions
│       ├── StatusBadge.tsx       # Badge coloré auto-résolu par valeur
│       ├── ImageUploader.tsx     # Upload drag & drop vers Cloudinary (REST)
│       ├── WhatsAppButton.tsx    # Bouton de redirection WhatsApp
│       └── StatCard.tsx          # Carte KPI pour le dashboard
│
├── graphql/
│   ├── client.ts                 # Config Apollo Client (HTTP + WebSocket split)
│   ├── queries/                  # Toutes les queries GQL
│   └── mutations/                # Toutes les mutations GQL
│   └── subscriptions/            # Subscriptions WebSocket
│
├── hooks/
│   ├── useAuth.ts                # Accès au store d'authentification
│   └── useProcessing.ts          # Wrapper useProcessing().run() pour les mutations
│
├── pages/
│   ├── auth/                     # LoginPage
│   ├── dashboard/                # DashboardPage (KPIs + graphiques)
│   ├── contenus/                 # Versets, Événements, Programmes, Sermons,
│   │                             # Émissions, Shorts, Cultes, Citations, Bookshop
│   ├── interactions/             # Messagerie, RendezVous, Requêtes (×6)
│   ├── referentiels/             # Églises, Cellules, Départements
│   └── configuration/            # Utilisateurs, Config Accueil, Dons, Notifications
│
├── stores/
│   ├── authStore.ts              # Zustand persist — user, accessToken
│   └── uiStore.ts                # État global UI (ProcessingModal)
│
└── types/
    └── index.ts                  # Tous les types TypeScript alignés sur le schema Prisma
```

---

## Pages et fonctionnalités

### Authentification
| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Connexion email/mot de passe (JWT) |

### Contenus
| Route | Description |
|---|---|
| `/contenus/versets` | Versets du jour — CRUD complet avec date de publication et activation |
| `/contenus/evenements` | Événements — CRUD avec types, statuts, lien YouTube, image |
| `/contenus/programmes` | Programmes de culte — CRUD avec jours et horaires |
| `/contenus/sermons` | Sermons & Playlists — gestion des playlists et affectation des sermons |
| `/contenus/emissions` | Émissions TV/Radio — CRUD avec lien YouTube et type |
| `/contenus/shorts` | Short Videos — upload uniquement (REST), lecture seule |
| `/contenus/cultes` | Cultes — CRUD avec indicateur "En direct" animé |
| `/contenus/citations` | Citations — ajout/suppression avec upload image Cloudinary |
| `/contenus/bookshop` | Bookshop — CRUD livres avec prix CDF et lien WhatsApp achat |

### Interactions
| Route | Description |
|---|---|
| `/interactions/messagerie` | Messagerie temps réel — 2 panneaux, WebSocket, marquer lu, fermer conversation |
| `/interactions/rendezvous` | Rendez-vous pasteur — tableau avec changement de statut inline |
| `/interactions/baptemes` | Inscriptions baptême |
| `/interactions/info` | Demandes d'information |
| `/interactions/integration` | Demandes d'intégration |
| `/interactions/prieres` | Demandes de prière |
| `/interactions/salut` | Prières du salut |
| `/interactions/renouvellements` | Renouvellements de pacte |

### Référentiels *(SUPER_ADMIN uniquement)*
| Route | Description |
|---|---|
| `/referentiels/eglises` | Gestion des antennes/sites de l'église |
| `/referentiels/cellules` | Cellules de maison, filtrables par église |
| `/referentiels/departements` | Départements ministériels |

### Configuration
| Route | Description |
|---|---|
| `/configuration/utilisateurs` | Liste des utilisateurs, changement de rôle, création de comptes admin |
| `/configuration/accueil` | Programme hebdomadaire + messages de bienvenue (slides app mobile) |
| `/configuration/dons` | Coordonnées de paiement (Mobile Money, etc.) |
| `/configuration/notifications` | Envoi de notifications push manuelles (cible : TOUS ou FIDÈLES) |

---

## Conventions de code

### Mutations
Toutes les mutations passent par `useProcessing().run()` :
```tsx
const { run } = useProcessing();

await run("Message affiché dans la modal…", async () => {
  await maQuestion({ variables: { ... } });
  toast.success("Opération réussie");
  void refetch();
});
```

### Suppressions
Toujours précédées d'un `<ConfirmModal danger ... />`.

### Imports Apollo Client v4
```ts
// Hooks → sous-package /react
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';

// Types et utilitaires → package principal
import { ApolloClient, gql, InMemoryCache } from '@apollo/client';
```

### Imports Zod v4
```ts
import { z } from 'zod/v4';
// Ne pas utiliser .default() sur les champs — utiliser defaultValues dans useForm
// z.coerce.number() infer unknown — utiliser z.number() + defaultValues
```

### Upload d'images
```ts
// POST /api/upload/image
// FormData: { file: File, folder: string }
// Réponse: { url: string, publicId: string }
```

### Design system
- Aucun `shadow-*`, aucun `border-l-*`
- `cursor-pointer` sur tous les éléments interactifs
- Style input : `text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400`
- Tokens CSS : `primary-*`, `accent-*`, `surface` définis dans `src/index.css`

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `SUPER_ADMIN` | Accès complet — inclus Référentiels et configuration globale |
| `ADMIN` | Accès à toutes les sections sauf Référentiels |
| `FIDELE` | Aucun accès au dashboard (application mobile uniquement) |

---

## Build de production

```bash
npm run build
```

Le dossier `dist/` généré est un SPA statique. Déploiement possible sur Nginx, Vercel, ou tout CDN. Configurer le serveur pour rediriger toutes les routes vers `index.html`.

Exemple de configuration Nginx :
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```


