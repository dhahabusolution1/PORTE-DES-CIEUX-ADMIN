import { gql } from '@apollo/client';

export const ENVOYER_MESSAGE = gql`
  mutation EnvoyerMessage($conversationId: ID!, $contenu: String!) {
    envoyerMessage(conversationId: $conversationId, contenu: $contenu) {
      id
      conversationId
      expediteur { id nom role photoUrl }
      contenu
      statut
      createdAt
    }
  }
`;

export const MARQUER_MESSAGES_LUS = gql`
  mutation MarquerMessagesLus($conversationId: ID!) {
    marquerMessagesLus(conversationId: $conversationId)
  }
`;

export const FERMER_CONVERSATION = gql`
  mutation FermerConversation($conversationId: ID!) {
    fermerConversation(conversationId: $conversationId) {
      id
      statut
    }
  }
`;

export const ASSIGNER_ADMIN = gql`
  mutation AssignerAdmin($conversationId: ID!, $adminId: ID!) {
    assignerAdmin(conversationId: $conversationId, adminId: $adminId) {
      id
      admin { id nom }
    }
  }
`;

export const UPDATE_STATUT_RENDEZVOUS = gql`
  mutation UpdateStatutRendezVous($id: ID!, $statut: StatutRendezVous!, $motifAnnulation: String) {
    updateStatutRendezVous(id: $id, statut: $statut, motifAnnulation: $motifAnnulation) {
      id
      statut
      motifAnnulation
    }
  }
`;

export const UPDATE_STATUT_REQUETE = gql`
  mutation UpdateStatutRequete($id: ID!, $statut: StatutRequete!) {
    updateStatutRequete(id: $id, statut: $statut) {
      id
      statut
    }
  }
`;

export const REPONDRE_REQUETE = gql`
  mutation RepondreRequete($id: ID!, $reponse: String!) {
    repondreRequete(id: $id, reponse: $reponse) {
      id
      reponseAdmin
      statut
    }
  }
`;

export const SUPPRIMER_RENDEZVOUS = gql`
  mutation SupprimerRendezVous($id: ID!) {
    supprimerRendezVous(id: $id)
  }
`;

export const SUPPRIMER_REQUETE = gql`
  mutation SupprimerRequete($id: ID!) {
    supprimerRequete(id: $id)
  }
`;

export const SUPPRIMER_DON = gql`
  mutation SupprimerDon($id: ID!) {
    supprimerDon(id: $id)
  }
`;
