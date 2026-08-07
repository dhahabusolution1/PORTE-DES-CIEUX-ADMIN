import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Calendar, ChevronDown, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

import { GET_RENDEZVOUS } from '@/graphql/queries/interactions.queries';
import { UPDATE_STATUT_RENDEZVOUS } from '@/graphql/mutations/interactions.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import type { RendezVous, StatutRendezVous } from '@/types';

const LIMIT = 20;

const STATUTS: { value: StatutRendezVous; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CONFIRME', label: 'Confirmé' },
  { value: 'EFFECTUE', label: 'Effectué' },
  { value: 'ANNULE', label: 'Annulé' },
];

interface RdvData { getRendezVous: RendezVous[] }

function StatutDropdown({
  rdv,
  onUpdate,
}: {
  rdv: RendezVous;
  onUpdate: (id: string, statut: StatutRendezVous) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 cursor-pointer"
      >
        <StatusBadge value={rdv.statut} />
        <ChevronDown size={11} className="text-accent-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-accent-200 rounded py-1 min-w-[140px]">
          {STATUTS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setOpen(false); void onUpdate(rdv.id, s.value); }}
              className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-accent-50 ${
                rdv.statut === s.value ? 'font-semibold text-primary-600' : 'text-accent-700'
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

export function RendezVousPage() {
  const [offset, setOffset] = useState(0);
  const [filterStatut, setFilterStatut] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; statut: StatutRendezVous; label: string } | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<RdvData>(GET_RENDEZVOUS, {
    variables: {
      statut: filterStatut || undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      limit: LIMIT,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [updateStatut] = useMutation(UPDATE_STATUT_RENDEZVOUS);

  const rdvs = useMemo(() => data?.getRendezVous ?? [], [data]);

  const handleUpdate = async (id: string, statut: StatutRendezVous) => {
    const label = STATUTS.find((s) => s.value === statut)?.label ?? statut;
    setMotifAnnulation('');
    setConfirmAction({ id, statut, label });
  };

  const confirmUpdate = async () => {
    if (!confirmAction) return;
    if (confirmAction.statut === 'ANNULE' && !motifAnnulation.trim()) {
      toast.error("Veuillez indiquer la raison de l'annulation.");
      return;
    }
    await run(`Mise à jour du statut vers « ${confirmAction.label} »…`, async () => {
      await updateStatut({
        variables: {
          id: confirmAction.id,
          statut: confirmAction.statut,
          ...(confirmAction.statut === 'ANNULE' && {
            motifAnnulation: motifAnnulation.trim(),
          }),
        },
      });
      toast.success(
        confirmAction.statut === 'ANNULE'
          ? 'Rendez-vous annulé — notification envoyée'
          : 'Statut mis à jour'
      );
      setConfirmAction(null);
      setMotifAnnulation('');
      void refetch();
    });
  };

  const exportExcel = () => {
    const selectedIndexes = Object.keys(rowSelection).map(Number);
    if (selectedIndexes.length === 0) {
      toast.error('Veuillez sélectionner au moins une ligne à exporter.');
      return;
    }
    const selectedRows = selectedIndexes.map(idx => rdvs[idx]).filter(Boolean);

    const exportData = selectedRows.map(r => {
      const nom = r.user ? [r.user.prenom, r.user.nom].filter(Boolean).join(' ') : [r.prenomVisiteur, r.nomVisiteur].filter(Boolean).join(' ');
      const whatsapp = r.user?.numeroWhatsapp ?? r.whatsappVisiteur;

      return {
        'Date': r.date,
        'Heure': r.heure,
        'Statut': r.statut,
        'Demandeur': nom || 'Anonyme',
        'WhatsApp': whatsapp || '',
        'Motif': r.motif || '',
        'Raison annulation': r.motifAnnulation || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RendezVous");
    XLSX.writeFile(workbook, `Export_RendezVous_${new Date().getTime()}.xlsx`);
  };

  const columns = useMemo<ColumnDef<RendezVous>[]>(() => [
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
      header: 'Fidèle / Visiteur',
      id: 'fidele',
      cell: ({ row }) => {
        const { user: u, nomVisiteur, prenomVisiteur, whatsappVisiteur } = row.original;
        
        if (u) {
          return (
            <div>
              <p className="text-sm font-medium text-accent-800">
                {[u.prenom, u.nom].filter(Boolean).join(' ')}
              </p>
              <p className="text-xs text-accent-400">{u.numeroWhatsapp}</p>
            </div>
          );
        }

        return (
          <div>
            <p className="text-sm font-medium text-primary-600">
              {[prenomVisiteur, nomVisiteur].filter(Boolean).join(' ')}
              <span className="ml-2 text-[10px] bg-primary-50 text-primary-500 px-1.5 py-0.5 rounded uppercase font-bold">Public</span>
            </p>
            <p className="text-xs text-accent-400">{whatsappVisiteur}</p>
          </div>
        );
      },
    },
    {
      header: 'Date & Heure',
      id: 'datetime',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-accent-400" />
          <span className="text-sm text-accent-700">
            {row.original.date} — {row.original.heure}
          </span>
        </div>
      ),
    },
    {
      header: 'Motif',
      accessorKey: 'motif',
      cell: ({ row }) => (
        <div className="space-y-1">
          <span className="text-xs text-accent-500 block">
            {row.original.motif
              ? row.original.motif.length > 60
                ? row.original.motif.substring(0, 60) + '…'
                : row.original.motif
              : <span className="italic text-accent-300">Non précisé</span>}
          </span>
          {row.original.statut === 'ANNULE' && row.original.motifAnnulation && (
            <span className="text-[10px] text-danger block">
              Annulation : {row.original.motifAnnulation}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'statut',
      cell: ({ row }) => (
        <StatutDropdown rdv={row.original} onUpdate={handleUpdate} />
      ),
    },
  ], []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-accent-900">Rendez-vous Pasteur</h2>
          <p className="text-xs text-accent-400 mt-0.5">Gérez les demandes de rendez-vous</p>
        </div>
        
        {Object.keys(rowSelection).length > 0 && (
          <Button variant="outline" size="sm" onClick={exportExcel} leftIcon={<Download size={14} />}>
            Exporter ({Object.keys(rowSelection).length})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setOffset(0); }}
          className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer bg-white text-accent-700 focus:border-primary-400"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setOffset(0); }}
            className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer focus:border-primary-400"
          />
          <span className="text-xs text-accent-400">→</span>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setOffset(0); }}
            className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer focus:border-primary-400"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rdvs}
        isLoading={loading}
        limit={LIMIT}
        offset={offset}
        total={rdvs.length < LIMIT ? offset + rdvs.length : offset + LIMIT + 1}
        onPageChange={setOffset}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.statut === 'ANNULE' ? 'Annuler le rendez-vous' : 'Mettre à jour le statut'}
        message={
          confirmAction?.statut === 'ANNULE'
            ? 'Le fidèle recevra une notification avec la raison indiquée ci-dessous.'
            : `Confirmer le passage au statut « ${confirmAction?.label} » ?`
        }
        confirmLabel={confirmAction?.statut === 'ANNULE' ? 'Annuler le RDV' : 'Confirmer'}
        cancelLabel="Retour"
        danger={confirmAction?.statut === 'ANNULE'}
        input={
          confirmAction?.statut === 'ANNULE'
            ? {
                label: "Raison de l'annulation",
                value: motifAnnulation,
                onChange: setMotifAnnulation,
                placeholder: 'Ex. : pasteur indisponible, créneau reporté…',
                required: true,
                maxLength: 500,
              }
            : undefined
        }
        onConfirm={() => void confirmUpdate()}
        onCancel={() => {
          setConfirmAction(null);
          setMotifAnnulation('');
        }}
      />
    </div>
  );
}
