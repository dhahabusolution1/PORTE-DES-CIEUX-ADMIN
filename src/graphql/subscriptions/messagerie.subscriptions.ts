import { gql } from '@apollo/client';

export const NOUVEAU_MESSAGE_SUB = gql`
  subscription NouveauMessage($conversationId: ID!) {
    nouveauMessage(conversationId: $conversationId) {
      id
      conversationId
      expediteur { id nom role photoUrl }
      contenu
      statut
      createdAt
    }
  }
`;
