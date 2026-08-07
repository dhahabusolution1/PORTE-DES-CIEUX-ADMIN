import { gql } from '@apollo/client';

export const GET_DASHBOARD = gql`
  query GetDashboard {
    getDashboard {
      totalUtilisateurs
      totalFideles
      totalAdmins
      totalEvenementsActifs
      totalSermons
      totalEglises
      totalCellules
      totalDepartements
      totalShorts
      totalRequetesEnAttente
      totalRendezVousEnAttente
      totalMessagesNonLus
      distributionInteractions {
        type
        total
      }
      prochainEvenements {
        id
        titre
        type
        dateDebut
        dateFin
        heure
        lieu
        statut
      }
    }
  }
`;
