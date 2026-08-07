import { gql } from '@apollo/client';

export const CREER_VERSET = gql`
  mutation CreerVerset(
    $reference: String!
    $texte: String!
    $meditation: String
    $versionBiblique: String
    $datePublication: DateTime!
  ) {
    creerVerset(
      reference: $reference
      texte: $texte
      meditation: $meditation
      versionBiblique: $versionBiblique
      datePublication: $datePublication
    ) {
      id
      reference
      texte
      meditation
      versionBiblique
      datePublication
      estActif
      createdAt
    }
  }
`;

export const MODIFIER_VERSET = gql`
  mutation ModifierVerset(
    $id: ID!
    $reference: String
    $texte: String
    $meditation: String
    $datePublication: DateTime
  ) {
    modifierVerset(
      id: $id
      reference: $reference
      texte: $texte
      meditation: $meditation
      datePublication: $datePublication
    ) {
      id
      reference
      texte
      meditation
      versionBiblique
      datePublication
      estActif
      createdAt
    }
  }
`;

export const SUPPRIMER_VERSET = gql`
  mutation SupprimerVerset($id: ID!) {
    supprimerVerset(id: $id)
  }
`;

export const ACTIVER_VERSET = gql`
  mutation ActiverVerset($id: ID!) {
    activerVerset(id: $id) {
      id
      estActif
      reference
    }
  }
`;

export const CREER_EVENEMENT = gql`
  mutation CreerEvenement($input: EvenementInput!) {
    creerEvenement(input: $input) {
      id
      type
      titre
      dateDebut
      dateFin
      statut
    }
  }
`;

export const MODIFIER_EVENEMENT = gql`
  mutation ModifierEvenement($id: ID!, $input: EvenementInput!) {
    modifierEvenement(id: $id, input: $input) {
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

export const SUPPRIMER_EVENEMENT = gql`
  mutation SupprimerEvenement($id: ID!) {
    supprimerEvenement(id: $id)
  }
`;

export const CREER_PLAYLIST = gql`
  mutation CreerPlaylist($titre: String!, $description: String, $theme: String, $imageUrl: String) {
    creerPlaylist(titre: $titre, description: $description, theme: $theme, imageUrl: $imageUrl) {
      id
      titre
      description
      theme
      imageUrl
      ordre
    }
  }
`;

export const MODIFIER_PLAYLIST = gql`
  mutation ModifierPlaylist($id: ID!, $titre: String, $description: String, $theme: String, $imageUrl: String) {
    modifierPlaylist(id: $id, titre: $titre, description: $description, theme: $theme, imageUrl: $imageUrl) {
      id
      titre
      description
      theme
      imageUrl
    }
  }
`;

export const SUPPRIMER_PLAYLIST = gql`
  mutation SupprimerPlaylist($id: ID!) {
    supprimerPlaylist(id: $id)
  }
`;

export const CREER_SERMON = gql`
  mutation CreerSermon($input: SermonInput!) {
    creerSermon(input: $input) {
      id
      titre
      predicateur
      date
      lienYoutube
      miniatureUrl
      ordreInPlaylist
    }
  }
`;

export const MODIFIER_SERMON = gql`
  mutation ModifierSermon($id: ID!, $input: SermonInput!) {
    modifierSermon(id: $id, input: $input) {
      id
      titre
      predicateur
      date
      lienYoutube
      miniatureUrl
      ordreInPlaylist
    }
  }
`;

export const SUPPRIMER_SERMON = gql`
  mutation SupprimerSermon($id: ID!) {
    supprimerSermon(id: $id)
  }
`;

export const CREER_EMISSION = gql`
  mutation CreerEmission($titre: String!, $description: String, $date: DateTime!, $lienYoutube: String!, $type: TypeEmission!) {
    creerEmission(titre: $titre, description: $description, date: $date, lienYoutube: $lienYoutube, type: $type) {
      id
      titre
      type
      date
      lienYoutube
    }
  }
`;

export const MODIFIER_EMISSION = gql`
  mutation ModifierEmission($id: ID!, $titre: String, $description: String, $date: DateTime, $lienYoutube: String, $type: TypeEmission) {
    modifierEmission(id: $id, titre: $titre, description: $description, date: $date, lienYoutube: $lienYoutube, type: $type) {
      id
      titre
      type
      date
      lienYoutube
      description
    }
  }
`;

export const SUPPRIMER_EMISSION = gql`
  mutation SupprimerEmission($id: ID!) {
    supprimerEmission(id: $id)
  }
`;

export const CREER_CULTE = gql`
  mutation CreerCulte($titre: String!, $description: String, $type: TypeCulte!, $date: DateTime!, $lienYoutube: String) {
    creerCulte(titre: $titre, description: $description, type: $type, date: $date, lienYoutube: $lienYoutube) {
      id
      titre
      type
      date
      statut
    }
  }
`;

export const MODIFIER_CULTE = gql`
  mutation ModifierCulte($id: ID!, $titre: String, $description: String, $type: TypeCulte, $date: DateTime, $lienYoutube: String, $statut: StatutCulte) {
    modifierCulte(id: $id, titre: $titre, description: $description, type: $type, date: $date, lienYoutube: $lienYoutube, statut: $statut) {
      id
      titre
      type
      date
      statut
      lienYoutube
      description
    }
  }
`;

export const SUPPRIMER_CULTE = gql`
  mutation SupprimerCulte($id: ID!) {
    supprimerCulte(id: $id)
  }
`;

export const AJOUTER_CITATION = gql`
  mutation AjouterCitation($imageUrl: String!, $cloudinaryPublicId: String!) {
    ajouterCitation(imageUrl: $imageUrl, cloudinaryPublicId: $cloudinaryPublicId) {
      id
      imageUrl
      createdAt
    }
  }
`;

export const MODIFIER_CITATION = gql`
  mutation ModifierCitation($id: ID!, $imageUrl: String, $cloudinaryPublicId: String) {
    modifierCitation(id: $id, imageUrl: $imageUrl, cloudinaryPublicId: $cloudinaryPublicId) {
      id
      imageUrl
      createdAt
    }
  }
`;

export const SUPPRIMER_CITATION = gql`
  mutation SupprimerCitation($id: ID!) {
    supprimerCitation(id: $id)
  }
`;

export const CREER_ARTICLE = gql`
  mutation CreerArticle(
    $titre: String!, 
    $auteur: String, 
    $prix: Decimal!, 
    $devise: Devise,
    $description: String, 
    $couvertureUrl: String, 
    $cloudinaryPublicId: String, 
    $numeroWhatsappAchat: String, 
    $estDisponible: Boolean,
    $stock: Int,
    $categorie: CategorieArticle,
    $typeArticle: TypeArticle
  ) {
    creerArticle(
      titre: $titre, 
      auteur: $auteur, 
      prix: $prix, 
      devise: $devise,
      description: $description, 
      couvertureUrl: $couvertureUrl, 
      cloudinaryPublicId: $cloudinaryPublicId, 
      numeroWhatsappAchat: $numeroWhatsappAchat, 
      estDisponible: $estDisponible,
      stock: $stock,
      categorie: $categorie,
      typeArticle: $typeArticle
    ) {
      id
      titre
      estDisponible
    }
  }
`;

export const MODIFIER_ARTICLE = gql`
  mutation ModifierArticle(
    $id: ID!, 
    $titre: String, 
    $auteur: String, 
    $prix: Decimal, 
    $devise: Devise,
    $description: String, 
    $couvertureUrl: String, 
    $cloudinaryPublicId: String, 
    $numeroWhatsappAchat: String, 
    $estDisponible: Boolean,
    $stock: Int,
    $categorie: CategorieArticle,
    $typeArticle: TypeArticle
  ) {
    modifierArticle(
      id: $id, 
      titre: $titre, 
      auteur: $auteur, 
      prix: $prix, 
      devise: $devise,
      description: $description, 
      couvertureUrl: $couvertureUrl, 
      cloudinaryPublicId: $cloudinaryPublicId, 
      numeroWhatsappAchat: $numeroWhatsappAchat, 
      estDisponible: $estDisponible,
      stock: $stock,
      categorie: $categorie,
      typeArticle: $typeArticle
    ) {
      id
      titre
      estDisponible
    }
  }
`;

export const SUPPRIMER_ARTICLE = gql`
  mutation SupprimerArticle($id: ID!) {
    supprimerArticle(id: $id)
  }
`;

export const SIGNALER_VENTE = gql`
  mutation SignalerVente($id: ID!, $quantite: Int) {
    signalerVente(id: $id, quantite: $quantite) {
      id
      stock
      ventes
    }
  }
`;

export const CREER_SHORT_VIDEO = gql`
  mutation CreerShortVideo(
    $titre: String!
    $videoUrl: String!
    $cloudinaryPublicId: String!
    $description: String
    $miniatureUrl: String
  ) {
    creerShortVideo(
      titre: $titre
      videoUrl: $videoUrl
      cloudinaryPublicId: $cloudinaryPublicId
      description: $description
      miniatureUrl: $miniatureUrl
    ) {
      id
      titre
      description
      videoUrl
      miniatureUrl
      downloadUrl
      datePublication
      createdAt
    }
  }
`;

export const SUPPRIMER_SHORT_VIDEO = gql`
  mutation SupprimerShortVideo($id: ID!) {
    supprimerShortVideo(id: $id)
  }
`;
