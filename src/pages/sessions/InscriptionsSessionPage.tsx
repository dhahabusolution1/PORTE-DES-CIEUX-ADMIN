import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Check, X, User, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

import { GET_INSCRIPTIONS, GET_SESSIONS } from '@/graphql/queries/sessions.queries';
import { MODIFIER_STATUT_INSCRIPTION, PRE_GENERER_MATRICULE } from '@/graphql/mutations/sessions.mutations';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  REFUSE: 'Refusé',
};

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-warning/10 text-warning',
  VALIDE: 'bg-success/10 text-success',
  REFUSE: 'bg-danger/10 text-danger',
};

const SEXE_LABELS: Record<string, string> = {
  MASCULIN: 'Masculin',
  FEMININ: 'Féminin',
};

const ETAT_CIVIL_LABELS: Record<string, string> = {
  CELIBATAIRE: 'Célibataire',
  MARIE: 'Marié(e)',
  DIVORCE: 'Divorcé(e)',
  VEUF: 'Veuf(ve)',
};

interface Inscription {
  id: string;
  nom: string;
  postnom?: string | null;
  prenom: string;
  telephone: string;
  telephone2?: string | null;
  email?: string | null;
  adresse?: string | null;
  adressePhysique?: string | null;
  ville?: string | null;
  commune?: string | null;
  quartier?: string | null;
  sexe?: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  etatCivil?: string | null;
  dateBapteme?: string | null;
  lieuBapteme?: string | null;
  dateAdhesion?: string | null;
  niveauEtudes?: string | null;
  profession?: string | null;
  formationEglise?: string | null;
  autresSavoirFaire?: string | null;
  nomConjoint?: string | null;
  nombreEnfants?: number | null;
  matricule?: string | null;
  numeroCarteMembre?: string | null;
  captureFicheUrl?: string | null;
  egliseNom?: string | null;
  eglise?: { id: string; nom: string } | null;
  departements?: {
    fonction: string;
    depuis: string;
    ordre: number;
    departement?: { nom: string } | null;
  }[];
  sessionFormulaire?: { type: string; titre: string };
  statut: string;
  createdAt: string;
}

interface InscriptionsData {
  getInscriptions: Inscription[];
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">{label}</dt>
      <dd className="text-sm text-accent-900 font-medium mt-0.5">{value}</dd>
    </div>
  );
}

function InscriptionDetailModal({
  inscription,
  onClose,
  onValidate,
  onRefuse,
}: {
  inscription: Inscription;
  onClose: () => void;
  onValidate: () => void;
  onRefuse: () => void;
}) {
  const isMembre = inscription.sessionFormulaire?.type === 'ENREGISTREMENT_MEMBRE';
  const fullName = [inscription.nom, inscription.postnom, inscription.prenom].filter(Boolean).join(' ');

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isMembre ? 'Fiche d\'identification membre' : 'Détail de l\'inscription'}
      maxWidth="4xl"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          {inscription.statut === 'EN_ATTENTE' && inscription.nom !== 'PRE_GENERE' && (
            <>
              <Button
                variant="outline"
                className="text-danger border-danger/20 hover:bg-danger/10"
                onClick={onRefuse}
              >
                <X size={14} className="mr-1.5" />
                Refuser
              </Button>
              <Button variant="primary" onClick={onValidate}>
                <Check size={14} className="mr-1.5" />
                Valider
              </Button>
            </>
          )}
        </>
      )}
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-accent-100">
          <div>
            <h2 className="text-lg font-black text-accent-900">{fullName}</h2>
            <p className="text-xs text-accent-500 mt-1">{inscription.telephone}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-md ${STATUT_COLORS[inscription.statut]}`}>
            {STATUT_LABELS[inscription.statut]}
          </span>
        </div>

        {isMembre ? (
          <>
            <section>
              <h3 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-4">
                Identité & contact
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Matricule" value={inscription.matricule} />
                <Field label="N° carte membre" value={inscription.numeroCarteMembre} />
                <Field label="Téléphone 2" value={inscription.telephone2} />
                <Field label="Email" value={inscription.email} />
                <Field label="Sexe" value={inscription.sexe ? SEXE_LABELS[inscription.sexe] : null} />
                <Field label="Date de naissance" value={inscription.dateNaissance ? formatDate(inscription.dateNaissance) : null} />
                <Field label="Lieu de naissance" value={inscription.lieuNaissance} />
                <Field label="État civil" value={inscription.etatCivil ? ETAT_CIVIL_LABELS[inscription.etatCivil] : null} />
                <Field label="Date de baptême" value={inscription.dateBapteme ? formatDate(inscription.dateBapteme) : null} />
                <Field label="Lieu de baptême" value={inscription.lieuBapteme} />
                <Field label="Date d'adhésion" value={inscription.dateAdhesion ? formatDate(inscription.dateAdhesion) : null} />
                <Field label="Niveau d'études" value={inscription.niveauEtudes} />
                <Field label="Profession" value={inscription.profession} />
                <Field label="Adresse physique" value={inscription.adressePhysique} />
                <Field label="Antenne / Église" value={inscription.egliseNom ?? inscription.eglise?.nom} />
              </dl>
            </section>

            {inscription.captureFicheUrl && (
              <section>
                <h3 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-4">
                  Capture
                </h3>
                <a
                  href={inscription.captureFicheUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-accent-200 overflow-hidden max-w-md hover:opacity-90 transition-opacity"
                >
                  <img
                    src={inscription.captureFicheUrl}
                    alt="Capture"
                    className="w-full h-auto object-contain bg-accent-50"
                  />
                </a>
              </section>
            )}

            <section>
              <h3 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-4">
                Vie à l'église & famille
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Formation à l'église" value={inscription.formationEglise} />
                <Field label="Autres savoir-faire" value={inscription.autresSavoirFaire} />
                <Field label="Nom conjoint(e)" value={inscription.nomConjoint} />
                <Field label="Nombre d'enfants" value={inscription.nombreEnfants} />
              </dl>

              {inscription.departements && inscription.departements.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Départements</p>
                  {inscription.departements.map((dep) => (
                    <div key={dep.ordre} className="p-3 bg-accent-50 rounded-lg border border-accent-100 text-sm">
                      <span className="font-bold text-accent-900">
                        {dep.departement?.nom ?? 'Département'}
                      </span>
                      {' — '}
                      <span className="text-accent-700">{dep.fonction}</span>
                      <span className="text-accent-400 text-xs ml-2">
                        (depuis {formatDate(dep.depuis)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Adresse" value={inscription.adresse} />
            <Field label="Antenne / Église" value={inscription.eglise?.nom} />
          </dl>
        )}

        <p className="text-xs text-accent-400 italic">
          Inscrit le {formatDate(inscription.createdAt)}
        </p>
      </div>
    </Modal>
  );
}

function buildExcelRows(inscriptions: Inscription[], isMembre: boolean) {
  if (isMembre) {
    return inscriptions.map((i) => ({
      Matricule: i.matricule ?? '',
      'N° Carte': i.numeroCarteMembre ?? '',
      Nom: i.nom,
      Postnom: i.postnom ?? '',
      Prénom: i.prenom,
      'Téléphone 1': i.telephone,
      'Téléphone 2': i.telephone2 ?? '',
      Email: i.email ?? '',
      Sexe: i.sexe ? SEXE_LABELS[i.sexe] : '',
      'Date naissance': i.dateNaissance ? formatDate(i.dateNaissance) : '',
      'Lieu naissance': i.lieuNaissance ?? '',
      'État civil': i.etatCivil ? ETAT_CIVIL_LABELS[i.etatCivil] : '',
      'Date baptême': i.dateBapteme ? formatDate(i.dateBapteme) : '',
      'Lieu baptême': i.lieuBapteme ?? '',
      'Date adhésion': i.dateAdhesion ? formatDate(i.dateAdhesion) : '',
      'Niveau études': i.niveauEtudes ?? '',
      Profession: i.profession ?? '',
      'Adresse physique': i.adressePhysique ?? '',
      Église: i.egliseNom ?? i.eglise?.nom ?? '',
      'Capture': i.captureFicheUrl ?? '',
      'Département 1': i.departements?.[0]?.departement?.nom ?? '',
      'Fonction 1': i.departements?.[0]?.fonction ?? '',
      'Depuis 1': i.departements?.[0]?.depuis ? formatDate(i.departements[0].depuis) : '',
      'Département 2': i.departements?.[1]?.departement?.nom ?? '',
      'Fonction 2': i.departements?.[1]?.fonction ?? '',
      'Depuis 2': i.departements?.[1]?.depuis ? formatDate(i.departements[1].depuis) : '',
      'Formation église': i.formationEglise ?? '',
      'Autres savoir-faire': i.autresSavoirFaire ?? '',
      'Nom conjoint': i.nomConjoint ?? '',
      'Nombre enfants': i.nombreEnfants ?? '',
      Statut: STATUT_LABELS[i.statut] ?? i.statut,
      'Date inscription': formatDate(i.createdAt),
    }));
  }

  return inscriptions.map((i) => ({
    Nom: i.nom,
    Postnom: i.postnom ?? '',
    Prénom: i.prenom,
    Téléphone: i.telephone,
    Adresse: i.adresse ?? '',
    Église: i.eglise?.nom ?? '',
    Statut: STATUT_LABELS[i.statut] ?? i.statut,
    'Date inscription': formatDate(i.createdAt),
  }));
}

export function InscriptionsSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { run } = useProcessing();
  const [selected, setSelected] = useState<Inscription | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, loading, refetch } = useQuery<InscriptionsData>(GET_INSCRIPTIONS, {
    variables: { sessionId, search: debouncedSearch.trim() || undefined },
    fetchPolicy: 'cache-and-network',
    skip: !sessionId,
  });

  const { data: sessionsData } = useQuery<{ getSessions: { id: string; titre: string; type: string }[] }>(
    GET_SESSIONS,
    { fetchPolicy: 'cache-first' },
  );

  const [modifierStatut] = useMutation(MODIFIER_STATUT_INSCRIPTION);
  const [preGenerer] = useMutation(PRE_GENERER_MATRICULE);

  const inscriptions = data?.getInscriptions ?? [];
  const currentSession = sessionsData?.getSessions.find((s) => s.id === sessionId);
  const sessionType = inscriptions[0]?.sessionFormulaire?.type ?? currentSession?.type ?? 'BAPTEME';
  const isMembre = sessionType === 'ENREGISTREMENT_MEMBRE';
  const sessionTitre = inscriptions[0]?.sessionFormulaire?.titre ?? currentSession?.titre;

  const handlePreGenerer = async () => {
    if (!sessionId) return;
    await run('Génération du numéro matricule à l\'avance…', async () => {
      try {
        const result = await preGenerer({ variables: { sessionId } });
        const matricule = (result.data as any)?.preGenererMatricule?.matricule;
        toast.success(`Matricule généré avec succès : ${matricule}`, { duration: 6000 });
        refetch();
      } catch {
        toast.error('Erreur lors de la pré-génération du matricule');
      }
    });
  };

  const handleStatut = async (id: string, statut: string) => {
    await run(async () => {
      try {
        const result = await modifierStatut({ variables: { id, statut } });
        const updated = (result.data as { modifierStatutInscription?: { matricule?: string } } | undefined)
          ?.modifierStatutInscription;
        toast.success(`Statut mis à jour : ${STATUT_LABELS[statut]}`);
        if (updated?.matricule) {
          toast.success(`Matricule attribué : ${updated.matricule}`, { duration: 5000 });
        }
        setSelected(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    });
  };

  const handleValidateClick = (inscription: Inscription) => {
    handleStatut(inscription.id, 'VALIDE');
  };

  const handleExport = () => {
    if (!inscriptions.length) {
      toast.error('Aucune inscription à exporter');
      return;
    }
    const rows = buildExcelRows(inscriptions, isMembre);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions');
    const filename = `inscriptions-${sessionTitre?.replace(/\s+/g, '-').toLowerCase() ?? sessionId}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('Export Excel téléchargé');
  };

  const columns: ColumnDef<Inscription>[] = useMemo(() => {
    const base: ColumnDef<Inscription>[] = [
      {
        accessorKey: 'nom',
        header: 'Inscrit / Etat',
        cell: ({ row }) => {
          const isPreGen = row.original.nom === 'PRE_GENERE';
          if (isPreGen) {
            return (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-bold text-amber-700 italic">Pre-généré (Disponible)</div>
                  <div className="text-xs text-accent-400">En attente d'utilisation mobile</div>
                </div>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <div className="font-bold text-accent-900">
                  {row.original.nom} {row.original.postnom} {row.original.prenom}
                </div>
                <div className="text-xs text-accent-500">{row.original.telephone}</div>
              </div>
            </div>
          );
        },
      },
    ];

    if (isMembre) {
      base.push(
        {
          accessorKey: 'matricule',
          header: 'Matricule',
          cell: ({ row }) => (
            <span className="text-xs font-mono font-bold text-primary-700">
              {row.original.matricule ?? '—'}
            </span>
          ),
        },
        {
          accessorKey: 'eglise',
          header: 'Église',
          cell: ({ row }) => (
            <span className="text-sm text-accent-700">{row.original.egliseNom ?? row.original.eglise?.nom ?? '—'}</span>
          ),
        },
      );
    }

    base.push(
      {
        accessorKey: 'createdAt',
        header: 'Date d\'inscription',
        cell: ({ row }) => (
          <span className="text-sm text-accent-700">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => (
          <span className={`px-2 py-1 text-xs font-bold rounded-md ${STATUT_COLORS[row.original.statut]}`}>
            {STATUT_LABELS[row.original.statut]}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(row.original)}
            >
              <Eye size={14} className="mr-1.5" />
              {isMembre ? 'Fiche' : 'Détail'}
            </Button>
            {row.original.statut === 'EN_ATTENTE' && row.original.nom !== 'PRE_GENERE' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-success hover:bg-success/10 border-success/20"
                  onClick={() => handleValidateClick(row.original)}
                >
                  <Check size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger hover:bg-danger/10 border-danger/20"
                  onClick={() => handleStatut(row.original.id, 'REFUSE')}
                >
                  <X size={14} />
                </Button>
              </>
            )}
          </div>
        ),
      },
    );

    return base;
  }, [isMembre]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" iconOnly onClick={() => navigate('/sessions')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-accent-900 tracking-tight">
              {isMembre ? 'Fiches d\'identification' : 'Inscrits à la session'}
            </h1>
            <p className="text-sm text-accent-400 font-medium italic">
              {sessionTitre ?? 'Gérez les inscriptions soumises par les fidèles'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isMembre && (
            <Button variant="primary" onClick={handlePreGenerer}>
              Pré-générer un Matricule
            </Button>
          )}
          {inscriptions.length > 0 && (
            <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExport}>
              Exporter Excel
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche intelligente */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone, matricule, ville, profession..."
          className="text-xs px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400 w-full max-w-md bg-white shadow-sm placeholder:text-accent-400 text-accent-800"
        />
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={inscriptions}
          isLoading={loading}
          emptyMessage="Aucune inscription trouvée pour cette session."
        />
      </div>

      {selected && (
        <InscriptionDetailModal
          inscription={selected}
          onClose={() => setSelected(null)}
          onValidate={() => handleValidateClick(selected)}
          onRefuse={() => handleStatut(selected.id, 'REFUSE')}
        />
      )}
    </div>
  );
}
