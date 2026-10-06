import { gql } from '@apollo/client';

export const CREER_SESSION = gql`
  mutation CreerSession($input: SessionFormulaireInput!) {
    creerSession(input: $input) {
      id
      titre
      type
      dateDebut
      dateFin
      estActif
      codeAcces
    }
  }
`;

export const MODIFIER_SESSION = gql`
  mutation ModifierSession($id: ID!, $input: SessionFormulaireInput!) {
    modifierSession(id: $id, input: $input) {
      id
      titre
      type
      dateDebut
      dateFin
      estActif
      codeAcces
    }
  }
`;

export const SUPPRIMER_SESSION = gql`
  mutation SupprimerSession($id: ID!) {
    supprimerSession(id: $id)
  }
`;

export const MODIFIER_STATUT_INSCRIPTION = gql`
  mutation ModifierStatutInscription(
    $id: ID!
    $statut: StatutInscription!
    $matricule: String
    $numeroCarteMembre: String
  ) {
    modifierStatutInscription(
      id: $id
      statut: $statut
      matricule: $matricule
      numeroCarteMembre: $numeroCarteMembre
    ) {
      id
      statut
      matricule
    }
  }
`;

export const GENERER_CODE_ACCES = gql`
  mutation GenererCodeAcces($sessionId: ID!) {
    genererCodeAcces(sessionId: $sessionId) {
      id
      codeAcces
      titre
    }
  }
`;
