# Administration web

## Overview

Application React qui permet aux administrateurs de gérer les contenus, les interactions, les sessions et la configuration. Elle consomme l'API du backend par GraphQL et utilise REST pour les envois de fichiers.

## Key files

| File | Owns |
|---|---|
| `src/App.tsx` | Routes et accès aux pages |
| `src/graphql/client.ts` | Client Apollo, authentification HTTP et abonnements WebSocket |
| `src/graphql/queries/`, `src/graphql/mutations/` | Opérations GraphQL par domaine |
| `src/stores/authStore.ts` | Session utilisateur persistée dans le navigateur |
| `src/hooks/useProcessing.ts` | État visuel des mutations et messages de résultat |
| `src/types/index.ts` | Types partagés de l'interface |
| `vite.config.ts` | Alias `@` vers `src` et proxy local vers le backend |

## Commands

Depuis `admin/` : `npm run dev`, `npm run build`, `npm run lint`.

## Conventions

- Les pages sont groupées dans `src/pages/` par domaine. Les composants communs vont dans `src/components/ui/`.
- Utiliser `@/` pour les imports internes. Les hooks React Apollo viennent de `@apollo/client/react`.
- Pour les mutations, vérifier le résultat de `useProcessing().run()` : ce helper affiche l'erreur puis retourne `undefined` en cas d'échec.
- Les suppressions de l'interface passent par `ConfirmModal`. Les formulaires utilisent React Hook Form et Zod selon les pages existantes.
- `ProtectedRoute` contrôle l'affichage des pages, tandis que le backend décide des droits d'accès effectifs.


- Préserver le thème, le logo, les libellés et les aperçus EPDC lors des reports fonctionnels.
## Gotchas

- Sans variables Vite, le client HTTP vise `/graphql`, mais le WebSocket vise `ws://localhost:4000/graphql`. Configurer `VITE_GRAPHQL_WS_URL` pour un autre environnement.
- Le jeton Apollo est lu dans le stockage local `auth-storage`. Un changement de structure du store touche aussi `src/graphql/client.ts`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
