import { gql } from '@apollo/client';

export const GET_ACCUEIL = gql`
  query GetAccueil {
    getAccueil {
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

export const GET_CONFIGURATION_DONS = gql`
  query GetConfigurationDons {
    getConfigurationDons {
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

export const GET_CONFIGURATION_WHATSAPP = gql`
  query GetConfigurationWhatsApp {
    getConfigurationWhatsApp {
      lienGroupeWhatsapp
      numeroWhatsappBookshop
    }
  }
`;
