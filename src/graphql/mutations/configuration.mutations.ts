import { gql } from '@apollo/client';

export const CHANGER_ROLE_UTILISATEUR = gql`
  mutation ChangerRoleUtilisateur($id: ID!, $role: Role!) {
    changerRoleUtilisateur(id: $id, role: $role) {
      id
      nom
      role
    }
  }
`;

export const SUPPRIMER_UTILISATEUR = gql`
  mutation SupprimerUtilisateur($id: ID!) {
    supprimerUtilisateur(id: $id)
  }
`;

export const CREER_COMPTE_ADMIN = gql`
  mutation CreerCompteAdmin(
    $email: String!
    $motDePasse: String!
    $nom: String!
    $postnom: String
    $prenom: String
    $role: Role!
  ) {
    creerCompteAdmin(
      email: $email
      motDePasse: $motDePasse
      nom: $nom
      postnom: $postnom
      prenom: $prenom
      role: $role
    ) {
      id
      nom
      email
      role
    }
  }
`;

export const MODIFIER_CONFIG_DONS = gql`
  mutation ModifierConfigurationDons($numeroWhatsappContact: String, $coordonnees: [CoordonneesDonInput!]) {
    modifierConfigurationDons(
      numeroWhatsappContact: $numeroWhatsappContact
      coordonnees: $coordonnees
    ) {
      numeroWhatsappContact
      coordonnees {
        id
        libelle
        valeur
        detail
      }
    }
  }
`;

export const MODIFIER_CONFIG_ACCUEIL = gql`
  mutation ModifierConfigurationAccueil($programmeHebdomadaire: String, $programmeDimanche: String, $imagesAccueil: [ImageAccueilInput!]) {
    modifierConfigurationAccueil(
      programmeHebdomadaire: $programmeHebdomadaire
      programmeDimanche: $programmeDimanche
      imagesAccueil: $imagesAccueil
    ) {
      programmeHebdomadaire
      programmeDimanche
      imagesAccueil {
        id
        imageUrl
        cloudinaryPublicId
        ordre
        estActif
      }
    }
  }
`;

export const MODIFIER_CONFIGURATION_WHATSAPP = gql`
  mutation ModifierConfigurationWhatsApp($lienGroupeWhatsapp: String, $numeroWhatsappBookshop: String) {
    modifierConfigurationWhatsApp(
      lienGroupeWhatsapp: $lienGroupeWhatsapp
      numeroWhatsappBookshop: $numeroWhatsappBookshop
    ) {
      lienGroupeWhatsapp
      numeroWhatsappBookshop
    }
  }
`;

export const ENVOYER_NOTIFICATION = gql`
  mutation EnvoyerNotification($titre: String!, $corps: String!, $cible: CibleNotification!) {
    envoyerNotification(titre: $titre, corps: $corps, cible: $cible)
  }
`;
