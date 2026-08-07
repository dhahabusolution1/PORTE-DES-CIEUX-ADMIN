import { gql } from '@apollo/client';

export const GET_CONVERSATIONS = gql`
  query GetConversations($statut: StatutConversation, $limit: Int, $offset: Int) {
    getConversations(statut: $statut, limit: $limit, offset: $offset) {
      items {
        id
        fidele { id nom postnom prenom numeroWhatsapp photoUrl }
        admin { id nom }
        statut
        messagesNonLus
        updatedAt
      }
      pagination { total count limit offset hasNextPage }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!, $limit: Int, $offset: Int) {
    getMessages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      conversationId
      expediteur { id nom role photoUrl }
      contenu
      statut
      createdAt
    }
  }
`;

export const GET_RENDEZVOUS = gql`
  query GetRendezVous($search: String, $dateDebut: Date, $dateFin: Date, $statut: StatutRendezVous, $limit: Int, $offset: Int) {
    getRendezVous(search: $search, dateDebut: $dateDebut, dateFin: $dateFin, statut: $statut, limit: $limit, offset: $offset) {
      id
      user { id nom postnom prenom numeroWhatsapp photoUrl }
      nomVisiteur
      prenomVisiteur
      whatsappVisiteur
      date
      heure
      motif
      motifAnnulation
      statut
      createdAt
    }
  }
`;

export const GET_REQUETES = gql`
  query GetRequetes($type: TypeRequete, $statut: StatutRequete, $typePriere: TypeDemandePriere, $search: String, $dateDebut: DateTime, $dateFin: DateTime, $limit: Int, $offset: Int) {
    getRequetes(type: $type, statut: $statut, typePriere: $typePriere, search: $search, dateDebut: $dateDebut, dateFin: $dateFin, limit: $limit, offset: $offset) {
      items {
        id
        type
        user { id nom postnom prenom numeroWhatsapp }
        nomVisiteur
        prenomVisiteur
        whatsappVisiteur
        emailVisiteur
        eglise { id nom }
        egliseNom
        message
        typePriere
        estMembre
        statut
        dateDemande
        createdAt
      }
      pagination { total count limit offset hasNextPage }
    }
  }
`;

export const GET_REQUETE_BY_ID = gql`
  query GetRequeteById($id: ID!) {
    getRequeteById(id: $id) {
      id
      type
      user { id nom postnom prenom numeroWhatsapp email }
      nomVisiteur
      prenomVisiteur
      whatsappVisiteur
      emailVisiteur
      eglise { id nom ville }
      egliseNom
      message
      typePriere
      estMembre
      statut
      dateDemande
      createdAt
    }
  }
`;
