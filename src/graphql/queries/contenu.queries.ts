import { gql } from '@apollo/client';

export const GET_VERSETS = gql`
  query GetVersets($search: String, $limit: Int, $offset: Int) {
    getVersets(search: $search, limit: $limit, offset: $offset) {
      items {
        id
        reference
        texte
        meditation
        versionBiblique
        datePublication
        estActif
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_VERSET_ACTIF = gql`
  query GetVersetDuJour {
    getVersetDuJour {
      id
      reference
      texte
      meditation
      versionBiblique
      estActif
    }
  }
`;

export const GET_EVENEMENTS = gql`
  query GetEvenements($search: String, $type: TypeEvenement, $statut: StatutEvenement, $limit: Int, $offset: Int) {
    getEvenements(search: $search, type: $type, statut: $statut, limit: $limit, offset: $offset) {
      items {
        id
        type
        titre
        description
        dateDebut
        dateFin
        heure
        lieu
        imageUrl
        imageExterneUrl
        organisateur
        lienYoutube
        statut
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_EVENEMENT_BY_ID = gql`
  query GetEvenementById($id: ID!) {
    getEvenementById(id: $id) {
      id
      type
      titre
      description
      dateDebut
      dateFin
      heure
      lieu
      imageUrl
      imageExterneUrl
      organisateur
      lienYoutube
      statut
    }
  }
`;

export const GET_PLAYLISTS = gql`
  query GetPlaylists($search: String, $limit: Int, $offset: Int) {
    getPlaylists(search: $search, limit: $limit, offset: $offset) {
      items {
        id
        titre
        description
        theme
        imageUrl
        ordre
        sermons {
          id
          titre
          predicateur
          date
          lienYoutube
          miniatureUrl
          ordreInPlaylist
        }
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_SERMONS = gql`
  query GetSermons($search: String, $playlistId: ID, $limit: Int, $offset: Int) {
    getSermons(search: $search, playlistId: $playlistId, limit: $limit, offset: $offset) {
      items {
        id
        titre
        description
        predicateur
        date
        lienYoutube
        miniatureUrl
        ordreInPlaylist
        playlist {
          id
          titre
        }
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_EMISSIONS = gql`
  query GetEmissions($search: String, $type: TypeEmission, $limit: Int, $offset: Int) {
    getEmissions(search: $search, type: $type, limit: $limit, offset: $offset) {
      items {
        id
        titre
        description
        date
        lienYoutube
        miniatureUrl
        type
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_SHORT_VIDEOS = gql`
  query GetShortVideos($search: String, $limit: Int, $offset: Int) {
    getShortVideos(search: $search, limit: $limit, offset: $offset) {
      items {
        id
        titre
        description
        videoUrl
        miniatureUrl
        downloadUrl
        datePublication
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_CULTES = gql`
  query GetCultes($search: String, $type: TypeCulte, $statut: StatutCulte, $limit: Int, $offset: Int) {
    getCultes(search: $search, type: $type, statut: $statut, limit: $limit, offset: $offset) {
      items {
        id
        titre
        description
        type
        date
        lienYoutube
        miniatureUrl
        statut
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_CITATIONS = gql`
  query GetCitations($limit: Int, $offset: Int) {
    getCitations(limit: $limit, offset: $offset) {
      items {
        id
        imageUrl
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_ARTICLES_ADMIN = gql`
  query GetArticlesAdmin($search: String, $categorie: CategorieArticle, $typeArticle: TypeArticle, $limit: Int, $offset: Int) {
    getArticlesAdmin(search: $search, categorie: $categorie, typeArticle: $typeArticle, limit: $limit, offset: $offset) {
      items {
        id
        titre
        auteur
        prix
        devise
        description
        couvertureUrl
        whatsappAchatUrl
        estDisponible
        stock
        ventes
        categorie
        typeArticle
        createdAt
      }
      totalCount
    }
  }
`;
