import { gql } from '@apollo/client';

export const INSCRIPTION_FIELDS = gql`
  fragment InscriptionFields on InscriptionSession {
    id
    nom
    postnom
    prenom
    telephone
    telephone2
    email
    adresse
    adressePhysique
    ville
    commune
    quartier
    sexe
    dateNaissance
    lieuNaissance
    etatCivil
    dateBapteme
    lieuBapteme
    dateAdhesion
    niveauEtudes
    profession
    formationEglise
    autresSavoirFaire
    nomConjoint
    nombreEnfants
    captureFicheUrl
    captureFichePublicId
    matricule
    numeroCarteMembre
    egliseNom
    eglise {
      id
      nom
    }
    departements {
      id
      fonction
      depuis
      ordre
      departement {
        id
        nom
      }
    }
    sessionFormulaire {
      id
      titre
      type
    }
    statut
    createdAt
    updatedAt
  }
`;

export const GET_SESSIONS = gql`
  query GetSessions($type: TypeSession) {
    getSessions(type: $type) {
      id
      titre
      description
      type
      dateDebut
      dateFin
      estActif
      createdAt
      updatedAt
    }
  }
`;

export const GET_INSCRIPTIONS = gql`
  query GetInscriptions($sessionId: ID!, $search: String) {
    getInscriptions(sessionId: $sessionId, search: $search) {
      ...InscriptionFields
    }
  }
  ${INSCRIPTION_FIELDS}
`;

export const GET_INSCRIPTION_BY_ID = gql`
  query GetInscriptionById($id: ID!) {
    getInscriptionById(id: $id) {
      ...InscriptionFields
    }
  }
  ${INSCRIPTION_FIELDS}
`;
