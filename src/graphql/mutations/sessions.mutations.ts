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

export const PRE_GENERER_MATRICULE = gql`
  mutation PreGenererMatricule($sessionId: ID!) {
    preGenererMatricule(sessionId: $sessionId) {
      id
      matricule
      numeroCarteMembre
      statut
    }
  }
`;
