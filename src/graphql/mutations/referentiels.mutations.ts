import { gql } from '@apollo/client';

// Eglises
export const CREER_EGLISE = gql`
  mutation CreerEglise($nom: String!, $adresse: String, $ville: String, $telephone: String, $lienFacebook: String, $photoUrl: String, $pasteurNom: String) {
    creerEglise(nom: $nom, adresse: $adresse, ville: $ville, telephone: $telephone, lienFacebook: $lienFacebook, photoUrl: $photoUrl, pasteurNom: $pasteurNom) {
      id nom adresse ville telephone lienFacebook photoUrl pasteurNom createdAt
    }
  }
`;

export const MODIFIER_EGLISE = gql`
  mutation ModifierEglise($id: ID!, $nom: String, $adresse: String, $ville: String, $telephone: String, $lienFacebook: String, $photoUrl: String, $pasteurNom: String) {
    modifierEglise(id: $id, nom: $nom, adresse: $adresse, ville: $ville, telephone: $telephone, lienFacebook: $lienFacebook, photoUrl: $photoUrl, pasteurNom: $pasteurNom) {
      id nom adresse ville telephone lienFacebook photoUrl pasteurNom
    }
  }
`;

export const SUPPRIMER_EGLISE = gql`
  mutation SupprimerEglise($id: ID!) {
    supprimerEglise(id: $id)
  }
`;

// Cellules
export const CREER_CELLULE = gql`
  mutation CreerCellule($nom: String!, $egliseId: ID, $quartiersCouvertes: String, $adresseReunion: String, $reference: String, $telephone1: String, $telephone2: String) {
    creerCellule(nom: $nom, egliseId: $egliseId, quartiersCouvertes: $quartiersCouvertes, adresseReunion: $adresseReunion, reference: $reference, telephone1: $telephone1, telephone2: $telephone2) {
      id
      nom
    }
  }
`;

export const MODIFIER_CELLULE = gql`
  mutation ModifierCellule($id: ID!, $nom: String, $egliseId: ID, $quartiersCouvertes: String, $adresseReunion: String, $reference: String, $telephone1: String, $telephone2: String) {
    modifierCellule(id: $id, nom: $nom, egliseId: $egliseId, quartiersCouvertes: $quartiersCouvertes, adresseReunion: $adresseReunion, reference: $reference, telephone1: $telephone1, telephone2: $telephone2) {
      id
      nom
    }
  }
`;

export const SUPPRIMER_CELLULE = gql`
  mutation SupprimerCellule($id: ID!) {
    supprimerCellule(id: $id)
  }
`;

// Departements
export const CREER_DEPARTEMENT = gql`
  mutation CreerDepartement($nom: String!, $responsable: String, $mission: String, $historique: String) {
    creerDepartement(nom: $nom, responsable: $responsable, mission: $mission, historique: $historique) {
      id nom responsable mission createdAt
    }
  }
`;

export const MODIFIER_DEPARTEMENT = gql`
  mutation ModifierDepartement($id: ID!, $nom: String, $responsable: String, $mission: String, $historique: String) {
    modifierDepartement(id: $id, nom: $nom, responsable: $responsable, mission: $mission, historique: $historique) {
      id nom responsable mission
    }
  }
`;

export const SUPPRIMER_DEPARTEMENT = gql`
  mutation SupprimerDepartement($id: ID!) {
    supprimerDepartement(id: $id)
  }
`;
