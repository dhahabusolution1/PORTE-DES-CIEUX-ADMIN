import { gql } from '@apollo/client';

export const GET_EGLISES = gql`
  query GetEglises {
    getEglises {
      id
      nom
      adresse
      ville
      telephone
      lienFacebook
      photoUrl
      pasteurNom
      pasteurPhotoUrl
      createdAt
    }
  }
`;

export const GET_CELLULES = gql`
  query GetCellules($egliseId: ID) {
    getCellules(egliseId: $egliseId) {
      id
      nom
      quartiersCouvertes
      adresseReunion
      reference
      telephone1
      telephone2
      eglise { id nom }
      createdAt
    }
  }
`;

export const GET_DEPARTEMENTS = gql`
  query GetDepartements {
    getDepartements {
      id
      nom
      responsable
      mission
      historique
      createdAt
    }
  }
`;
