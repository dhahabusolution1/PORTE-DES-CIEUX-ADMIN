import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import { Toaster } from 'react-hot-toast';
import { apolloClient } from '@/graphql/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { VersetsPage } from '@/pages/contenus/VersetsPage';
import { EvenementsPage } from '@/pages/contenus/EvenementsPage';
import { ProgrammesCultePage } from '@/pages/contenus/ProgrammesCultePage';
import { SermonsPage } from '@/pages/contenus/SermonsPage';
import { PlaylistsPage } from '@/pages/contenus/PlaylistsPage';
import { EmissionsPage } from '@/pages/contenus/EmissionsPage';
import { ShortsPage } from '@/pages/contenus/ShortsPage';
import { CultesPage } from '@/pages/contenus/CultesPage';
import { CitationsPage } from '@/pages/contenus/CitationsPage';
import { BookshopPage } from '@/pages/contenus/BookshopPage';
import { RendezVousPage } from '@/pages/interactions/RendezVousPage';
import { RequetesPage } from '@/pages/interactions/RequetesPage';
import { DonsPage } from '@/pages/interactions/DonsPage';
import { EglisesPage } from '@/pages/referentiels/EglisesPage';
import { CellulesPage } from '@/pages/referentiels/CellulesPage';
import { DepartementsPage } from '@/pages/referentiels/DepartementsPage';
import { UtilisateursPage } from '@/pages/configuration/UtilisateursPage';
import { ConfigAccueilPage } from '@/pages/configuration/ConfigAccueilPage';
import { ConfigDonsPage } from '@/pages/configuration/ConfigDonsPage';
import { ConfigWhatsAppPage } from '@/pages/configuration/ConfigWhatsAppPage';
import { NotificationsPage } from '@/pages/configuration/NotificationsPage';
import { SessionsPage } from '@/pages/sessions/SessionsPage';
import { InscriptionsSessionPage } from '@/pages/sessions/InscriptionsSessionPage';


const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },

          // Contenus
          { path: 'contenus/versets',    element: <VersetsPage /> },
          { path: 'contenus/evenements', element: <EvenementsPage /> },
          { path: 'contenus/programmes', element: <ProgrammesCultePage /> },
          { path: 'contenus/sermons',    element: <SermonsPage /> },
          { path: 'contenus/playlists',  element: <PlaylistsPage /> },
          { path: 'contenus/emissions',  element: <EmissionsPage /> },
          { path: 'contenus/shorts',     element: <ShortsPage /> },
          { path: 'contenus/cultes',     element: <CultesPage /> },
          { path: 'contenus/citations',  element: <CitationsPage /> },
          { path: 'contenus/bookshop',   element: <BookshopPage /> },

          // Interactions
          { path: 'interactions/rendezvous',     element: <RendezVousPage /> },
          { path: 'interactions/dons',           element: <DonsPage /> },
          { path: 'interactions/info',           element: <RequetesPage type="DEMANDE_INFO" title="Demandes d'information" description="Questions et demandes d'information" /> },
          { path: 'interactions/integration',    element: <RequetesPage type="INTEGRATION" title="Demandes d'intégration" description="Demandes d'intégration à l'église" /> },
          { path: 'interactions/prieres',        element: <RequetesPage type="PRIERE" title="Demandes de prière" description="Demandes de prière des fidèles" /> },
          { path: 'interactions/salut',          element: <RequetesPage type="PRIERE_SALUT" title="Prières du Salut" description="Prières de salut soumises par des visiteurs" /> },
          { path: 'interactions/renouvellements',element: <RequetesPage type="RENOUVELLEMENT" title="Renouvellements de Pacte" description="Engagements de renouvellement spirituel" /> },

          // Sessions
          { path: 'sessions',                    element: <SessionsPage /> },
          { path: 'sessions/:sessionId/inscriptions', element: <InscriptionsSessionPage /> },

          // Référentiels
          {
            element: <ProtectedRoute requiredRole="SUPER_ADMIN" />,
            children: [
              { path: 'referentiels/eglises',      element: <EglisesPage /> },
              { path: 'referentiels/cellules',      element: <CellulesPage /> },
              { path: 'referentiels/departements',  element: <DepartementsPage /> },
            ],
          },

          // Configuration
          { path: 'configuration/utilisateurs',  element: <UtilisateursPage /> },
          { path: 'configuration/accueil',        element: <ConfigAccueilPage /> },
          { path: 'configuration/dons',           element: <ConfigDonsPage /> },
          { path: 'configuration/whatsapp',       element: <ConfigWhatsAppPage /> },
          { path: 'configuration/notifications',  element: <NotificationsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '0.75rem',
            borderRadius: '6px',
            padding: '10px 14px',
          },
        }}
      />
    </ApolloProvider>
  );
}

export default App;
