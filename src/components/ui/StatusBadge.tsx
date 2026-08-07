type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'dark';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger:  'bg-red-50 text-red-700 border-red-100',
  info:    'bg-[#F59E0B]/15 text-[#B45309] border-[#F59E0B]/30',
  neutral: 'bg-accent-50 text-accent-600 border-accent-100',
  dark:    'bg-primary-900 text-white border-primary-800',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-[#F59E0B]',
  neutral: 'bg-accent-400',
  dark:    'bg-white',
};

// ─── Mappages statuts → variantes ─────────────────────────────────────────────

const STATUT_EVENEMENT: Record<string, BadgeVariant> = {
  BROUILLON: 'neutral',
  PUBLIE:    'success',
  ANNULE:    'danger',
  TERMINE:   'dark',
};

const STATUT_CULTE: Record<string, BadgeVariant> = {
  PLANIFIE:    'info',
  EN_DIRECT:   'danger',
  REDIFFUSION: 'neutral',
};

const STATUT_REQUETE: Record<string, BadgeVariant> = {
  EN_ATTENTE: 'warning',
  LU:         'info',
  REPONDU:    'primary',
  EN_PRIERE:  'primary',
  TERMINE:    'success',
  CONTACTE:   'info',
  INTEGRE:    'success',
  ABANDONNE:  'danger',
  CONFIRME:   'success',
  REALISE:    'dark',
  ANNULE:     'danger',
};

const STATUT_RDV: Record<string, BadgeVariant> = {
  EN_ATTENTE: 'warning',
  CONFIRME:   'success',
  ANNULE:     'danger',
  REPORTE:    'info',
};

const STATUT_DON: Record<string, BadgeVariant> = {
  EN_ATTENTE: 'neutral',
  EN_COURS:   'info',
  REUSSI:     'success',
  ECHEC:      'danger',
  ANNULE:     'warning',
};

const ROLE_MAP: Record<string, BadgeVariant> = {
  SUPER_ADMIN: 'dark',
  ADMIN:       'primary',
  PASTEUR:     'info',
  MEMBRE:      'success',
  VISITEUR:    'neutral',
};

function resolveVariant(value: string): BadgeVariant {
  return (
    STATUT_EVENEMENT[value] ??
    STATUT_CULTE[value] ??
    STATUT_REQUETE[value] ??
    STATUT_RDV[value] ??
    STATUT_DON[value] ??
    ROLE_MAP[value] ??
    'neutral'
  );
}

const LABELS: Record<string, string> = {
  BROUILLON:   'Brouillon',
  PUBLIE:      'Publié',
  ANNULE:      'Annulé',
  TERMINE:     'Terminé',
  PLANIFIE:    'Planifié',
  EN_DIRECT:   'En direct',
  REDIFFUSION: 'Rediffusion',
  EN_ATTENTE:  'En attente',
  LU:          'Lu',
  REPONDU:     'Répondu',
  EN_PRIERE:   'En prière',
  CONTACTE:    'Contacté',
  INTEGRE:     'Intégré',
  ABANDONNE:   'Abandonné',
  CONFIRME:    'Confirmé',
  REALISE:     'Réalisé',
  REPORTE:     'Reporté',
  EN_COURS:    'En cours',
  REUSSI:      'Réussi',
  ECHEC:       'Échec',
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Admin',
  PASTEUR:     'Pasteur',
  MEMBRE:      'Membre',
  VISITEUR:    'Visiteur',
  EMISSION_TV:    'TV',
  EMISSION_RADIO: 'Radio',
  EVENEMENT:       'Événement',
  PROGRAMME_CULTE: 'Programme',
  PRIERE:          'Prière',
  PRIERE_SALUT:    'Prière du Salut',
  RENOUVELLEMENT:  'Renouvellement',
  INTEGRATION:     'Intégration',
  DEMANDE_INFO:    'Info',
  BAPTEME:         'Baptême',
};

interface StatusBadgeProps {
  value: string;
  variant?: BadgeVariant;
  className?: string;
}

export function StatusBadge({ value, variant, className = '' }: StatusBadgeProps) {
  const v = variant ?? resolveVariant(value);
  const label = LABELS[value] ?? value;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight border shadow-sm ${VARIANT_CLASSES[v]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASSES[v]}`} />
      {label}
    </span>
  );
}
