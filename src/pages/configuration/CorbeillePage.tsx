import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { GET_CORBEILLE, RESTAURER_CORBEILLE, type TrashType } from '@/graphql/trash';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type TrashItem = { id: string; type: TrashType; label: string; deletedAt: string };
const labels: Record<TrashType, string> = {
  UTILISATEUR: 'Utilisateurs', VERSET: 'Versets', EVENEMENT: 'Événements et programmes',
  PLAYLIST: 'Playlists', SERMON: 'Sermons', EMISSION: 'Émissions', SHORT: 'Vidéos courtes',
  CULTE: 'Cultes', CITATION: 'Citations', EGLISE: 'Églises', CELLULE: 'Cellules',
  DEPARTEMENT: 'Départements', REQUETE: 'Demandes', RENDEZ_VOUS: 'Rendez-vous',
  ARTICLE: 'Articles', SESSION: 'Sessions', DON: 'Dons',
};
const restricted = new Set<TrashType>(['EGLISE', 'CELLULE', 'DEPARTEMENT']);

export function CorbeillePage() {
  const role = useAuthStore((state) => state.user?.role);
  const [type, setType] = useState<TrashType | 'TOUS'>('TOUS');
  const [selected, setSelected] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { data, loading, error, refetch } = useQuery<{ getCorbeille: { items: TrashItem[]; totalCount: number } }>(GET_CORBEILLE, { variables: { type: type === 'TOUS' ? null : type, limit: 100, offset }, fetchPolicy: 'network-only' });
  const [restore] = useMutation(RESTAURER_CORBEILLE);
  const items = useMemo(() => data?.getCorbeille.items ?? [], [data]);
  const totalCount = data?.getCorbeille.totalCount ?? 0;
  const visibleTypes = Object.entries(labels).filter(([key]) => role === 'SUPER_ADMIN' || !restricted.has(key as TrashType));
  const itemKey = (item: TrashItem) => `${item.type}:${item.id}`;

  const confirmRestore = async () => {
    if (selected.length === 0 || restoring) return;
    const chosen = items.filter((item) => selected.includes(itemKey(item)));
    const groups = new Map<TrashType, string[]>();
    for (const item of chosen) groups.set(item.type, [...(groups.get(item.type) ?? []), item.id]);
    setRestoring(true);
    try {
      for (const [category, ids] of groups) await restore({ variables: { type: category, ids } });
      toast.success(`${chosen.length} élément(s) restauré(s)`);
      if (offset > 0 && chosen.length >= items.length) {
        setOffset(Math.max(0, offset - 100));
      } else {
        await refetch();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'La restauration a échoué');
      await refetch();
    } finally {
      setSelected([]);
      setConfirm(false);
      setRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary-50 p-3 text-primary-600"><Trash2 size={22} /></div>
        <div>
          <h1 className="text-2xl font-black text-accent-900">Corbeille</h1>
          <p className="text-sm text-accent-500">Retrouvez et restaurez les éléments retirés des listes.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-200 bg-white p-4">
        <label className="text-xs font-semibold text-accent-700">Catégorie
          <select className="ml-3 rounded-lg border border-accent-200 bg-white px-3 py-2 text-sm" value={type} onChange={(event) => { setType(event.target.value as TrashType | 'TOUS'); setOffset(0); setSelected([]); }}>
            <option value="TOUS">Tous les éléments</option>
            {visibleTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>Actualiser</Button>
      </div>
      {selected.length > 0 && <div className="flex items-center justify-between rounded-lg bg-accent-50 p-3 text-xs font-semibold text-accent-700">
        <span>{selected.length} élément(s) sélectionné(s)</span>
        <Button type="button" size="sm" leftIcon={<RotateCcw size={14} />} onClick={() => setConfirm(true)}>Restaurer</Button>
      </div>}
      <div className="overflow-hidden rounded-xl border border-accent-200 bg-white">
        {loading ? <p className="p-6 text-sm text-accent-500">Chargement de la corbeille…</p>
          : error ? <p role="alert" className="p-6 text-sm text-red-600">Impossible de charger la corbeille.</p>
            : items.length === 0 ? <p className="p-6 text-sm text-accent-500">Aucun élément dans la corbeille.</p>
              : <div className="divide-y divide-accent-100">
                <label className="flex items-center gap-3 bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700">
                  <input type="checkbox" aria-label="Tout sélectionner" checked={selected.length === items.length} onChange={(event) => setSelected(event.target.checked ? items.map(itemKey) : [])} />
                  Tout sélectionner sur cette page
                </label>
                {items.map((item) => <div key={itemKey(item)} className="flex items-center gap-3 px-4 py-3">
                  <input type="checkbox" aria-label={`Sélectionner ${item.label}`} checked={selected.includes(itemKey(item))} onChange={(event) => setSelected((current) => event.target.checked ? [...current, itemKey(item)] : current.filter((key) => key !== itemKey(item)))} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-accent-800">{item.label}</p>
                    <p className="text-xs text-accent-500">{labels[item.type]} · Retiré le {new Date(item.deletedAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <button type="button" className="rounded-lg p-2 text-primary-600 hover:bg-primary-50" title="Restaurer" onClick={() => { setSelected([itemKey(item)]); setConfirm(true); }}><RotateCcw size={16} /></button>
                </div>)}
              </div>}
      </div>
      {totalCount > 100 && <div className="flex items-center justify-between text-xs text-accent-600">
        <span>{offset + 1} à {Math.min(offset + 100, totalCount)} sur {totalCount}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={offset === 0} onClick={() => { setSelected([]); setOffset(Math.max(0, offset - 100)); }}>Précédent</Button>
          <Button type="button" variant="outline" size="sm" disabled={offset + 100 >= totalCount} onClick={() => { setSelected([]); setOffset(offset + 100); }}>Suivant</Button>
        </div>
      </div>}
      <ConfirmModal isOpen={confirm} title="Restaurer la sélection" message={`Restaurer ${selected.length} élément(s) dans les listes actives ?`} confirmLabel={restoring ? 'En cours…' : 'Restaurer'} isProcessing={restoring} danger={false} onConfirm={() => { if (!restoring) void confirmRestore(); }} onCancel={() => setConfirm(false)} />
    </div>
  );
}
