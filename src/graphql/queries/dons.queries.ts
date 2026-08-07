import { gql } from '@apollo/client';

export const GET_DONS_ADMIN = gql`
  query GetDonsAdmin($statut: StatutDon, $limit: Int, $offset: Int) {
    getDonsAdmin(statut: $statut, limit: $limit, offset: $offset) {
      totalCount
      items {
        id
        montant
        devise
        reference
        statut
        message
        telephonePayeur
        logId
        maxicashTransactionId
        createdAt
        updatedAt
        user {
          id
          nom
          prenom
          numeroWhatsapp
        }
      }
    }
  }
`;

export const GET_DON_BY_ID = gql`
  query GetDon($id: ID!) {
    getDon(id: $id) {
      id
      montant
      devise
      reference
      statut
      message
      telephonePayeur
      logId
      maxicashTransactionId
      createdAt
      updatedAt
      user {
        id
        nom
        prenom
        numeroWhatsapp
      }
    }
  }
`;
