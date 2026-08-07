// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'FIDELE';

export interface User {
  id: string;
  nom: string;
  postnom?: string;
  prenom?: string;
  email?: string;
  numeroWhatsapp?: string;
  photoUrl?: string;
  role: Role;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
}

export interface Page<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ─── Contenu ──────────────────────────────────────────────────────────────────

export interface VersetJour {
  id: string;
  reference: string;
  texte: string;
  meditation?: string;
  versionBiblique: string;
  datePublication: string;
  estActif: boolean;
  createdAt: string;
}

export type TypeEvenement = 'EVENEMENT' | 'PROGRAMME_CULTE';
export type StatutEvenement = 'BROUILLON' | 'PUBLIE' | 'ANNULE' | 'TERMINE';

export interface Evenement {
  id: string;
  type: TypeEvenement;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin?: string;
  heure?: string;
  lieu?: string;
  imageUrl?: string;
  imageExterneUrl?: string;
  organisateur?: string;
  lienYoutube?: string;
  statut: StatutEvenement;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSermon {
  id: string;
  titre: string;
  description?: string;
  theme?: string;
  imageUrl?: string;
  ordre: number;
  sermons: Sermon[];
  createdAt: string;
  updatedAt: string;
}

export interface Sermon {
  id: string;
  titre: string;
  description?: string;
  predicateur?: string;
  date: string;
  lienYoutube: string;
  miniatureUrl?: string;
  playlist?: PlaylistSermon;
  ordreInPlaylist: number;
  createdAt: string;
  updatedAt: string;
}

export type TypeEmission = 'EMISSION_TV' | 'EMISSION_RADIO';

export interface Emission {
  id: string;
  titre: string;
  description?: string;
  date: string;
  lienYoutube: string;
  miniatureUrl?: string;
  type: TypeEmission;
  createdAt: string;
}

export interface ShortVideo {
  id: string;
  titre: string;
  description?: string;
  videoUrl: string;
  miniatureUrl?: string;
  downloadUrl: string;
  datePublication: string;
  createdAt: string;
}

export type TypeCulte = 'MERCREDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE' | 'SEMINAIRE' | 'CONCERT' | 'AUTRE';
export type StatutCulte = 'PLANIFIE' | 'EN_DIRECT' | 'REDIFFUSION';

export interface Culte {
  id: string;
  titre: string;
  description?: string;
  type: TypeCulte;
  date: string;
  lienYoutube?: string;
  miniatureUrl?: string;
  statut: StatutCulte;
  createdAt: string;
}

export interface Citation {
  id: string;
  imageUrl: string;
  texte?: string;
  auteur?: string;
  description?: string;
  createdAt: string;
}

// ─── Bookshop ─────────────────────────────────────────────────────────────────

export type CategorieArticle = 'EGLISE' | 'PARTENAIRE';
export type TypeArticle = 'LIVRE' | 'VETEMENT' | 'ACCESSOIRE' | 'AUTRE';
export type Devise = 'USD' | 'CDF';

export interface ArticleBookshop {
  id: string;
  titre: string;
  auteur?: string;
  description?: string;
  prix: number | string;
  devise: Devise;
  couvertureUrl?: string;
  whatsappAchatUrl?: string;
  estDisponible: boolean;
  stock: number;
  ventes: number;
  categorie: CategorieArticle;
  typeArticle: TypeArticle;
  createdAt: string;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export type TypeRequete =
  | 'PRIERE'
  | 'PRIERE_SALUT'
  | 'RENOUVELLEMENT'
  | 'INTEGRATION'
  | 'DEMANDE_INFO'
  | 'BAPTEME';

export type StatutRequete =
  | 'EN_ATTENTE'
  | 'LU'
  | 'REPONDU'
  | 'EN_PRIERE'
  | 'TERMINE'
  | 'CONTACTE'
  | 'INTEGRE'
  | 'ABANDONNE'
  | 'CONFIRME'
  | 'REALISE'
  | 'ANNULE';

export type TypeDemandePriere = 'MOI' | 'AUTRE';

export interface Requete {
  id: string;
  type: TypeRequete;
  user?: User;
  nomVisiteur?: string;
  prenomVisiteur?: string;
  whatsappVisiteur?: string;
  emailVisiteur?: string;
  eglise?: Eglise;
  egliseNom?: string;
  message?: string;
  reponseAdmin?: string;
  typePriere?: TypeDemandePriere;
  estMembre?: boolean;
  statut: StatutRequete;
  dateDemande: string;
  createdAt: string;
}

// ─── Rendez-vous ──────────────────────────────────────────────────────────────

export type StatutRendezVous = 'EN_ATTENTE' | 'CONFIRME' | 'EFFECTUE' | 'ANNULE';

export interface RendezVous {
  id: string;
  user?: User;
  nomVisiteur?: string;
  prenomVisiteur?: string;
  whatsappVisiteur?: string;
  date: string;
  heure: string;
  motif: string;
  motifAnnulation?: string | null;
  statut: StatutRendezVous;
  createdAt: string;
}

// ─── Messagerie ───────────────────────────────────────────────────────────────

export type StatutConversation = 'OUVERTE' | 'FERMEE';
export type StatutMessage = 'ENVOYE' | 'LU';

export interface Message {
  id: string;
  conversationId: string;
  expediteur: User;
  contenu: string;
  statut: StatutMessage;
  createdAt: string;
}

export interface Conversation {
  id: string;
  fidele: User;
  admin?: User;
  statut: StatutConversation;
  messages: Message[];
  messagesNonLus: number;
  updatedAt: string;
}

// ─── Référentiels ─────────────────────────────────────────────────────────────

export interface Eglise {
  id: string;
  nom: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  lienFacebook?: string;
  photoUrl?: string;
  pasteurNom?: string;
  createdAt: string;
}

export interface Cellule {
  id: string;
  nom: string;
  quartiersCouvertes?: string;
  adresseReunion?: string;
  reference?: string;
  telephone1?: string;
  telephone2?: string;
  eglise?: Eglise;
  createdAt: string;
}

export interface Departement {
  id: string;
  nom: string;
  responsable?: string;
  mission?: string;
  historique?: string;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  acteur: User;
  action: string;
  entite: string;
  entiteId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface InteractionStat {
  type: string;
  total: number;
}

export interface Dashboard {
  totalUtilisateurs: number;
  totalFideles: number;
  totalAdmins: number;
  totalEvenementsActifs: number;
  totalSermons: number;
  totalEglises: number;
  totalCellules: number;
  totalDepartements: number;
  totalShorts: number;
  totalRequetesEnAttente: number;
  totalRendezVousEnAttente: number;
  totalMessagesNonLus: number;
  distributionInteractions: InteractionStat[];
  activitesRecentes: AuditLog[];
  prochainEvenements: Evenement[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface ImageAccueil {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  ordre: number;
  estActif: boolean;
}

export interface ConfigurationAccueil {
  programmeHebdomadaire?: string;
  programmeDimanche?: string;
  imagesAccueil: ImageAccueil[];
}

// ─── Dons MaxiCash ────────────────────────────────────────────────────────────

export type StatutDon = 'EN_ATTENTE' | 'EN_COURS' | 'REUSSI' | 'ECHEC' | 'ANNULE';

export interface DonateurResume {
  id: string;
  nom: string;
  prenom?: string;
  numeroWhatsapp?: string;
}

export interface DonTransaction {
  id: string;
  montant: number;
  devise: Devise;
  reference: string;
  statut: StatutDon;
  message?: string;
  telephonePayeur?: string;
  logId?: string;
  maxicashTransactionId?: string;
  user?: DonateurResume | null;
  createdAt: string;
  updatedAt: string;
}
