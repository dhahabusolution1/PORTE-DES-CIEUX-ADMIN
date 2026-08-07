import { gql } from '@apollo/client';

export const GET_UTILISATEURS = gql`
  query GetUtilisateurs($search: String, $role: Role, $limit: Int, $offset: Int) {
    getUtilisateurs(search: $search, role: $role, limit: $limit, offset: $offset) {
      items {
        id
        nom
        postnom
        prenom
        email
        numeroWhatsapp
        photoUrl
        role
        createdAt
      }
      pagination {
        total
        limit
        offset
        hasNextPage
      }
    }
  }
`;

export const GET_UTILISATEUR_BY_ID = gql`
  query GetUtilisateurById($id: ID!) {
    getUtilisateurById(id: $id) {
      id
      nom
      postnom
      prenom
      email
      numeroWhatsapp
      photoUrl
      role
      createdAt
    }
  }
`;
