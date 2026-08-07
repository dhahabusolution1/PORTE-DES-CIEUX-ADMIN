/** Messages affichés dans le ProcessingModal selon l'opération GraphQL */
export const QUERY_LOADING_LABELS: Record<string, string> = {
  GetDashboard: 'Chargement du tableau de bord…',
  GetVersetDuJour: 'Chargement du verset du jour…',
  GetVersets: 'Chargement des versets…',
  GetEvenements: 'Chargement des événements…',
  GetPlaylists: 'Chargement des playlists…',
  GetSermons: 'Chargement des sermons…',
  GetEmissions: 'Chargement des émissions…',
  GetShortVideos: 'Chargement des vidéos…',
  GetCultes: 'Chargement des cultes…',
  GetCitations: 'Chargement des citations…',
  GetArticlesAdmin: 'Chargement de la boutique…',
  GetRendezVous: 'Chargement des rendez-vous…',
  GetRequetes: 'Chargement des demandes…',
  GetRequeteById: 'Chargement du détail…',
  GetConversations: 'Chargement des conversations…',
  GetMessages: 'Chargement des messages…',
  GetEglises: 'Chargement des églises…',
  GetCellules: 'Chargement des cellules…',
  GetDepartements: 'Chargement des départements…',
  GetUtilisateurs: 'Chargement des utilisateurs…',
  GetConfigurationDons: 'Chargement de la configuration…',
  GetConfigurationAccueil: 'Chargement de la configuration…',
  GetSessions: 'Chargement des sessions…',
  GetInscriptionsSession: 'Chargement des inscriptions…',
  GetDonsAdmin: 'Chargement des dons…',
  GetDon: 'Chargement du don…',
  GetAuditLogs: 'Chargement du journal d\'audit…',
};

export function getQueryLoadingMessage(operationName?: string | null): string {
  if (operationName && QUERY_LOADING_LABELS[operationName]) {
    return QUERY_LOADING_LABELS[operationName];
  }
  return 'Chargement des données…';
}
