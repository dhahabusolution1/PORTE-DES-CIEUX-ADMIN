import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Eye, Download, Gift, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

import { GET_DONS_ADMIN, GET_DON_BY_ID } from '@/graphql/queries/dons.queries';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { formatDate } from '@/utils/formatDate';
import type { DonTransaction, StatutDon } from '@/types';

const LIMIT = 20;

const STATUTS: { value: StatutDon; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'REUSSI', label: 'Réussi' },
  { value: 'ECHEC', label: 'Échec' },
  { value: 'ANNULE', label: 'Annulé' },
];

function formatMontant(montant: number, devise: string) {
  return `${Number(montant).toLocaleString('fr-CD')} ${devise}`;
}

function donateurNom(don: DonTransaction) {
  if (don.user) {
    return [don.user.prenom, don.user.nom].filter(Boolean).join(' ') || don.user.nom;
  }
  return '—';
}

interface DonDetailModalProps {
  donId: string;
  onClose: () => void;
}

function DonDetailModal({ donId, onClose }: DonDetailModalProps) {
  const { data } = useQuery<{ getDon: DonTransaction }>(GET_DON_BY_ID, {
    variables: { id: donId },
  });
  const don = data?.getDon;
  if (!don) return null;

  const whatsapp = don.user?.numeroWhatsapp ?? don.telephonePayeur;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-accent-200 sticky top-0 bg-surface">
          <h3 className="text-sm font-semibold text-accent-900">Détail du don</h3>
          <button onClick={onClose} className="text-accent-400 cursor-pointer hover:text-accent-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Montant</p>
              <p className="text-xl font-black text-primary-700">{formatMontant(don.montant, don.devise)}</p>
            </div>
            <StatusBadge value={don.statut} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Donateur</p>
              <p className="text-sm font-medium text-accent-800">{donateurNom(don)}</p>
            </div>
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Contact</p>
              {whatsapp ? (
                <WhatsAppButton numero={whatsapp} label="Contacter" />
              ) : (
                <span className="text-xs text-accent-400">Non fourni</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Référence</p>
            <p className="text-xs font-mono text-accent-700 bg-accent-50 px-2 py-1 rounded">{don.reference}</p>
          </div>

          {don.message && (
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Message / intention</p>
              <p className="text-sm text-accent-700 whitespace-pre-wrap">{don.message}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Initié le</p>
              <p className="text-accent-700">{formatDate(don.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Mis à jour</p>
              <p className="text-accent-700">{formatDate(don.updatedAt)}</p>
            </div>
            {don.logId && (
              <div>
                <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Log MaxiCash</p>
                <p className="font-mono text-accent-600">{don.logId}</p>
              </div>
            )}
            {don.maxicashTransactionId && (
              <div>
                <p className="text-[10px] text-accent-400 uppercase tracking-wide mb-0.5">Transaction MaxiCash</p>
                <p className="font-mono text-accent-600">{don.maxicashTransactionId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DonsData {
  getDonsAdmin: { items: DonTransaction[]; totalCount: number };
}

export function DonsPage() {
  const [offset, setOffset] = useState(0);
  const [filterStatut, setFilterStatut] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data, loading } = useQuery<DonsData>(GET_DONS_ADMIN, {
    variables: {
      statut: filterStatut || undefined,
      limit: LIMIT,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  const dons = useMemo(() => data?.getDonsAdmin.items ?? [], [data]);
  const total = data?.getDonsAdmin.totalCount ?? 0;

  const stats = useMemo(() => {
    const reussis = dons.filter((d) => d.statut === 'REUSSI');
    const totalPage = reussis.reduce((sum, d) => sum + Number(d.montant), 0);
    return { reussisPage: reussis.length, totalPage };
  }, [dons]);

  const exportExcel = () => {
    const selectedIndexes = Object.keys(rowSelection).map(Number);
    if (selectedIndexes.length === 0) {
      toast.error('Veuillez sélectionner au moins une ligne à exporter.');
      return;
    }
    const selectedRows = selectedIndexes.map((idx) => dons[idx]).filter(Boolean);

    const exportData = selectedRows.map((d) => ({
      Date: formatDate(d.createdAt),
      Statut: d.statut,
      Montant: Number(d.montant),
      Devise: d.devise,
      Donateur: donateurNom(d),
      Téléphone: d.user?.numeroWhatsapp ?? d.telephonePayeur ?? '',
      Référence: d.reference,
      Message: d.message ?? '',
      'Log MaxiCash': d.logId ?? '',
      'Transaction MaxiCash': d.maxicashTransactionId ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dons');
    XLSX.writeFile(workbook, `Export_Dons_${Date.now()}.xlsx`);
  };

  const columns = useMemo<ColumnDef<DonTransaction>[]>(() => [
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
      header: 'Donateur',
      id: 'donateur',
      cell: ({ row }) => {
        const d = row.original;
        const nom = donateurNom(d);
        const tel = d.user?.numeroWhatsapp ?? d.telephonePayeur;
        return (
          <div>
            <p className="text-sm font-medium text-accent-800">{nom}</p>
            {tel && <p className="text-xs text-accent-400">{tel}</p>}
          </div>
        );
      },
    },
    {
      header: 'Montant',
      id: 'montant',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-accent-800">
          {formatMontant(row.original.montant, row.original.devise)}
        </span>
      ),
    },
    {
      header: 'Message',
      id: 'message',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">
          {row.original.message
            ? row.original.message.length > 50
              ? `${row.original.message.substring(0, 50)}…`
              : row.original.message
            : <span className="italic text-accent-300">—</span>}
        </span>
      ),
    },
    {
      header: 'Date',
      id: 'date',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      header: 'Statut',
      id: 'statut',
      cell: ({ row }) => <StatusBadge value={row.original.statut} />,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const whatsapp = row.original.user?.numeroWhatsapp ?? row.original.telephonePayeur;
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
              </a>
            )}
          </div>
        );
      },
    },
  ], []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-accent-900">Suivi des dons</h2>
          <p className="text-xs text-accent-400 mt-0.5">
            Transactions MaxiCash initiées depuis l'application mobile
          </p>
        </div>
        {Object.keys(rowSelection).length > 0 && (
          <Button variant="outline" size="sm" onClick={exportExcel} leftIcon={<Download size={14} />}>
            Exporter ({Object.keys(rowSelection).length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-accent-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-accent-400 mb-1">
            <Gift size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Total enregistré</span>
          </div>
          <p className="text-2xl font-black text-accent-900">{total}</p>
        </div>
        <div className="bg-surface border border-emerald-200 rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-1">Réussis (page)</p>
          <p className="text-2xl font-black text-emerald-700">{stats.reussisPage}</p>
        </div>
        <div className="bg-surface border border-primary-200 rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-600 mb-1">Montant réussi (page)</p>
          <p className="text-lg font-black text-primary-700">
            {stats.totalPage.toLocaleString('fr-CD')}
            <span className="text-xs font-medium text-accent-400 ml-1">mixte</span>
          </p>
        </div>
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
        <button
          type="button"
          onClick={() => { setFilterStatut('REUSSI'); setOffset(0); }}
          className="text-xs px-3 py-1.5 border border-emerald-200 rounded cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        >
          Voir uniquement les réussis
        </button>
      </div>

      <DataTable
        columns={columns}
        data={dons}
        isLoading={loading}
        limit={LIMIT}
        offset={offset}
        total={total}
        onPageChange={setOffset}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        emptyMessage="Aucun don enregistré pour le moment."
      />

      {detailId && (
        <DonDetailModal donId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
