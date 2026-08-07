import { gql } from '@apollo/client';

export const LOGIN_ADMIN = gql`
  mutation LoginAdmin($email: String!, $motDePasse: String!) {
    loginAdmin(email: $email, motDePasse: $motDePasse) {
      accessToken
      refreshToken
      user {
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
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        nom
        postnom
        prenom
        email
        photoUrl
        role
      }
    }
  }
`;
