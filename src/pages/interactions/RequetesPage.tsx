import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronDown, Eye, X, MessageSquare, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

import { GET_REQUETES, GET_REQUETE_BY_ID } from '@/graphql/queries/interactions.queries';
import { UPDATE_STATUT_REQUETE, REPONDRE_REQUETE } from '@/graphql/mutations/interactions.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { Button } from '@/components/ui/Button';
import { PriereTypeBadge, formatTypePriere } from '@/components/ui/PriereTypeBadge';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { Requete, StatutRequete, TypeDemandePriere, TypeRequete } from '@/types';

const LIMIT = 20;

const STATUTS_BY_TYPE: Record<TypeRequete, { value: StatutRequete; label: string }[]> = {
  PRIERE: [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'LU', label: 'Lu' },
    { value: 'EN_PRIERE', label: 'En prière' },
    { value: 'REPONDU', label: 'Répondu' },
    { value: 'TERMINE', label: 'Terminé' },
  ],
  PRIERE_SALUT: [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'LU', label: 'Lu' },
    { value: 'CONTACTE', label: 'Contacté' },
    { value: 'TERMINE', label: 'Terminé' },
  ],
  RENOUVELLEMENT: [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'LU', label: 'Lu' },
    { value: 'CONTACTE', label: 'Contacté' },
    { value: 'TERMINE', label: 'Terminé' },
  ],
  INTEGRATION: [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'INTEGRE', label: 'Intégré' },
    { value: 'ABANDONNE', label: 'Abandonné' },
  ],
  DEMANDE_INFO: [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'LU', label: 'Lu' },
    { value: 'REPONDU', label: 'Répondu' },
    { value: 'TERMINE', label: 'Terminé' },
  ],
  BAPTEME: [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'LU', label: 'Lu' },
    { value: 'CONFIRME', label: 'Confirmé' },
    { value: 'REALISE', label: 'Réalisé' },
    { value: 'ANNULE', label: 'Annulé' },
  ],
};

const ALL_STATUTS: { value: StatutRequete; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'LU', label: 'Lu' },
  { value: 'REPONDU', label: 'Répondu' },
  { value: 'EN_PRIERE', label: 'En prière' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'CONTACTE', label: 'Contacté' },
  { value: 'INTEGRE', label: 'Intégré' },
  { value: 'ABANDONNE', label: 'Abandonné' },
  { value: 'CONFIRME', label: 'Confirmé' },
  { value: 'REALISE', label: 'Réalisé' },
  { value: 'ANNULE', label: 'Annulé' },
];

interface RequeteDetailModalProps {
  requeteId: string;
  onClose: () => void;
}

function RequeteDetailModal({ requeteId, onClose }: RequeteDetailModalProps) {
  const [reponse, setReponse] = useState('');
  const { run } = useProcessing();
  const [repondre] = useMutation(REPONDRE_REQUETE);

  const { data, refetch } = useQuery<{ getRequeteById: Requete }>(GET_REQUETE_BY_ID, {
    variables: { id: requeteId },
  });
  const r: Requete | undefined = data?.getRequeteById;
  if (!r) return null;

  const nom = r.user
    ? [r.user.prenom, r.user.nom].filter(Boolean).join(' ')
    : [r.prenomVisiteur, r.nomVisiteur].filter(Boolean).join(' ') || 'Visiteur anonyme';

  const whatsapp = r.user?.numeroWhatsapp ?? r.whatsappVisiteur;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-accent-200 sticky top-0 bg-surface">
          <h3 className="text-sm font-semibold text-accent-900">Détail de la demande</h3>
          <button onClick={onClose} className="text-accent-400 cursor-pointer hover:text-accent-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {r.type === 'PRIERE' && (
            <div className="flex items-center justify-between pb-3 border-b border-accent-100">
              <div>
                <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-1.5">Pour qui ?</p>
                <PriereTypeBadge typePriere={r.typePriere} size="md" />
              </div>
              {r.estMembre !== undefined && (
                <div className="text-right">
                  <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-1">Membre</p>
                  <p className="text-xs font-medium text-accent-700">{r.estMembre ? 'Oui' : 'Non'}</p>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Demandeur</p>
              <p className="text-sm font-medium text-accent-800">{nom}</p>
              {r.emailVisiteur && <p className="text-xs text-accent-500">{r.emailVisiteur}</p>}
            </div>
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Contact</p>
              {whatsapp ? (
                <WhatsAppButton numero={whatsapp} label="Contacter sur WhatsApp" />
              ) : (
                <span className="text-xs text-accent-400">Non fourni</span>
              )}
            </div>
          </div>
          {(r.egliseNom || r.eglise) && (
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Église</p>
              <p className="text-xs text-accent-700">{r.egliseNom ?? r.eglise?.nom}</p>
            </div>
          )}
          {r.typePriere && r.type !== 'PRIERE' && (
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Type de prière</p>
              <PriereTypeBadge typePriere={r.typePriere} />
            </div>
          )}
          {r.estMembre !== undefined && r.type !== 'PRIERE' && (
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Membre de l'église</p>
              <p className="text-xs text-accent-700">{r.estMembre ? 'Oui' : 'Non'}</p>
            </div>
          )}
          {r.message && (
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Message</p>
              <p className="text-sm text-accent-700 bg-accent-50 rounded p-2.5 leading-relaxed whitespace-pre-wrap">{r.message}</p>
            </div>
          )}

          {r.type === 'DEMANDE_INFO' && (
            <div className="border-t border-accent-100 pt-3 mt-2 space-y-2">
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Réponse (Admin)</p>
              {r.reponseAdmin ? (
                <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                  <p className="text-sm text-primary-800 whitespace-pre-wrap">{r.reponseAdmin}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    placeholder="Saisissez votre réponse ici..."
                    className="w-full text-sm px-3 py-2 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none font-sans"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!reponse.trim()}
                      onClick={() => {
                        run('Enregistrement de la réponse...', async () => {
                          await repondre({ variables: { id: r.id, reponse } });
                          toast.success('Réponse enregistrée');
                          refetch();
                        });
                      }}
                    >
                      Enregistrer la réponse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-[10px] text-accent-400">Soumis le {formatDate(r.dateDemande)}</p>
            </div>
            <StatusBadge value={r.statut} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatutDropdown({
  requete,
  onUpdate,
}: {
  requete: Requete;
  onUpdate: (id: string, statut: StatutRequete) => void;
}) {
  const [open, setOpen] = useState(false);
  const statuts = STATUTS_BY_TYPE[requete.type] ?? ALL_STATUTS;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 cursor-pointer"
      >
        <StatusBadge value={requete.statut} />
        <ChevronDown size={11} className="text-accent-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-accent-200 rounded py-1 min-w-[140px]">
          {statuts.map((s) => (
            <button
              key={s.value}
              onClick={() => { setOpen(false); onUpdate(requete.id, s.value); }}
              className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-accent-50 ${
                requete.statut === s.value ? 'font-semibold text-primary-600' : 'text-accent-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface RequetesPageProps {
  type: TypeRequete;
  title: string;
  description: string;
}

interface RequetesData {
  getRequetes: { items: Requete[]; pagination: { total: number } };
}

export function RequetesPage({ type, title, description }: RequetesPageProps) {
  const [offset, setOffset] = useState(0);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterTypePriere, setFilterTypePriere] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; statut: StatutRequete; label: string } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<RequetesData>(GET_REQUETES, {
    variables: {
      type,
      statut: filterStatut || undefined,
      typePriere: type === 'PRIERE' && filterTypePriere ? (filterTypePriere as TypeDemandePriere) : undefined,
      limit: LIMIT,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [updateStatut] = useMutation(UPDATE_STATUT_REQUETE);

  const requetes = useMemo(() => data?.getRequetes.items ?? [], [data]);
  const total = data?.getRequetes.pagination.total ?? 0;

  const handleUpdateStatut = (id: string, statut: StatutRequete) => {
    const label = ALL_STATUTS.find((s) => s.value === statut)?.label ?? statut;
    setConfirmAction({ id, statut, label });
  };

  const confirmUpdate = async () => {
    if (!confirmAction) return;
    await run(`Mise à jour du statut vers « ${confirmAction.label} »…`, async () => {
      await updateStatut({ variables: { id: confirmAction.id, statut: confirmAction.statut } });
      toast.success('Statut mis à jour');
      setConfirmAction(null);
      void refetch();
    });
  };

  const exportExcel = () => {
    const selectedIndexes = Object.keys(rowSelection).map(Number);
    if (selectedIndexes.length === 0) {
      toast.error('Veuillez sélectionner au moins une ligne à exporter.');
      return;
    }
    const selectedRows = selectedIndexes.map(idx => requetes[idx]).filter(Boolean);

    const exportData = selectedRows.map(r => {
      const nom = r.user ? [r.user.prenom, r.user.nom].filter(Boolean).join(' ') : [r.prenomVisiteur, r.nomVisiteur].filter(Boolean).join(' ');
      const whatsapp = r.user?.numeroWhatsapp ?? r.whatsappVisiteur;
      const email = r.user?.email ?? r.emailVisiteur;

      return {
        'Date': formatDate(r.dateDemande),
        'Type': r.type,
        ...(type === 'PRIERE' ? { 'Pour qui': formatTypePriere(r.typePriere) } : {}),
        'Statut': r.statut,
        'Demandeur': nom || 'Anonyme',
        'WhatsApp': whatsapp || '',
        'Email': email || '',
        'Église': r.egliseNom ?? r.eglise?.nom ?? '',
        'Membre': r.estMembre ? 'Oui' : 'Non',
        'Message': r.message || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requetes");
    XLSX.writeFile(workbook, `Export_Requetes_${new Date().getTime()}.xlsx`);
  };

  const columns = useMemo<ColumnDef<Requete>[]>(() => {
    const base: ColumnDef<Requete>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="cursor-pointer"
        />
      ),
    },
    {
      header: 'Demandeur',
      id: 'demandeur',
      cell: ({ row }) => {
        const r = row.original;
        const nom = r.user
          ? [r.user.prenom, r.user.nom].filter(Boolean).join(' ')
          : [r.prenomVisiteur, r.nomVisiteur].filter(Boolean).join(' ') || 'Visiteur';
        const whatsapp = r.user?.numeroWhatsapp ?? r.whatsappVisiteur;
        return (
          <div>
            <p className="text-sm font-medium text-accent-800">{nom}</p>
            {whatsapp && <p className="text-xs text-accent-400">{whatsapp}</p>}
          </div>
        );
      },
    },
    ];

    if (type === 'PRIERE') {
      base.splice(2, 0, {
        header: 'Pour qui ?',
        id: 'typePriere',
        cell: ({ row }) => <PriereTypeBadge typePriere={row.original.typePriere} />,
      });
    }

    if (type === 'RENOUVELLEMENT') {
      base.splice(2, 0, {
        header: 'Église',
        id: 'eglise',
        cell: ({ row }) => (
          <span className="text-xs text-accent-700">
            {row.original.egliseNom ?? row.original.eglise?.nom ?? '—'}
          </span>
        ),
      });
    }

    base.push(
    {
      header: 'Message',
      id: 'message',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">
          {row.original.message
            ? row.original.message.length > 70
              ? row.original.message.substring(0, 70) + '…'
              : row.original.message
            : <span className="italic text-accent-300">Aucun message</span>}
        </span>
      ),
    },
    {
      header: 'Date',
      id: 'date',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">{formatDate(row.original.dateDemande)}</span>
      ),
    },
    {
      header: 'Statut',
      id: 'statut',
      cell: ({ row }) => (
        <StatutDropdown requete={row.original} onUpdate={handleUpdateStatut} />
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const whatsapp = row.original.user?.numeroWhatsapp ?? row.original.whatsappVisiteur;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailId(row.original.id)}
              className="text-xs px-2 py-1 text-accent-600 border border-accent-200 rounded cursor-pointer hover:bg-accent-50 flex items-center gap-1"
            >
              <Eye size={11} />
              Voir
            </button>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 text-green-600 border border-green-200 rounded cursor-pointer hover:bg-green-50 flex items-center gap-1"
              >
                <MessageSquare size={11} />
                WhatsApp
              </a>
            )}
          </div>
        );
      },
    },
    );

    return base;
  }, [type]);

  const statuts = STATUTS_BY_TYPE[type] ?? ALL_STATUTS;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-accent-900">{title}</h2>
          <p className="text-xs text-accent-400 mt-0.5">
            {total} demande{total > 1 ? 's' : ''} — {description}
          </p>
        </div>
        <div className="flex gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={exportExcel} leftIcon={<Download size={14} />}>
              Exporter ({Object.keys(rowSelection).length})
            </Button>
          )}
          <select
            value={filterStatut}
            onChange={(e) => { setFilterStatut(e.target.value); setOffset(0); }}
            className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer bg-white text-accent-700 focus:border-primary-400"
          >
            <option value="">Tous les statuts</option>
            {statuts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {type === 'PRIERE' && (
            <select
              value={filterTypePriere}
              onChange={(e) => { setFilterTypePriere(e.target.value); setOffset(0); }}
              className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer bg-white text-accent-700 focus:border-primary-400"
            >
              <option value="">Pour qui ? (tous)</option>
              <option value="MOI">Pour moi</option>
              <option value="AUTRE">Pour autrui</option>
            </select>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={requetes}
        isLoading={loading}
        limit={LIMIT}
        offset={offset}
        total={total}
        onPageChange={setOffset}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {detailId && (
        <RequeteDetailModal
          requeteId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmAction}
        title="Mettre à jour le statut"
        message={`Confirmer le passage au statut « ${confirmAction?.label} » ?`}
        confirmLabel="Confirmer la mise à jour"
        cancelLabel="Annuler"
        onConfirm={() => void confirmUpdate()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
