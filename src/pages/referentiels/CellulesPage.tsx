import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, X, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { GET_CELLULES, GET_EGLISES } from '@/graphql/queries/referentiels.queries';
import { CREER_CELLULE, MODIFIER_CELLULE, SUPPRIMER_CELLULE } from '@/graphql/mutations/referentiels.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useProcessing } from '@/hooks/useProcessing';
import type { Cellule, Eglise } from '@/types';

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  egliseId: z.string().optional(),
  quartiersCouvertes: z.string().optional(),
  adresseReunion: z.string().optional(),
  reference: z.string().optional(),
  telephone1: z.string().optional(),
  telephone2: z.string().optional(),
});
type CelluleForm = z.infer<typeof schema>;

interface CellulesData { getCellules: Cellule[] }
interface EglisesData { getEglises: Eglise[] }

export function CellulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cellule | null>(null);
  const [toDelete, setToDelete] = useState<Cellule | null>(null);
  const [filterEglise, setFilterEglise] = useState('');
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<CellulesData>(GET_CELLULES, {
    variables: { egliseId: filterEglise || undefined },
    fetchPolicy: 'cache-and-network',
  });
  const { data: eglisesData } = useQuery<EglisesData>(GET_EGLISES);
  const [creerCellule] = useMutation(CREER_CELLULE);
  const [modifierCellule] = useMutation(MODIFIER_CELLULE);
  const [supprimerCellule] = useMutation(SUPPRIMER_CELLULE);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CelluleForm>({
    resolver: zodResolver(schema),
  });

  const cellules = data?.getCellules ?? [];
  const eglises = eglisesData?.getEglises ?? [];

  function openAdd() {
    setEditing(null);
    reset({ egliseId: filterEglise || '' });
    setShowForm(true);
  }

  function openEdit(c: Cellule) {
    setEditing(c);
    setValue('nom', c.nom);
    setValue('egliseId', c.eglise?.id ?? '');
    setValue('quartiersCouvertes', c.quartiersCouvertes ?? '');
    setValue('adresseReunion', c.adresseReunion ?? '');
    setValue('reference', c.reference ?? '');
    setValue('telephone1', c.telephone1 ?? '');
    setValue('telephone2', c.telephone2 ?? '');
    setShowForm(true);
  }

  const onSubmit = async (values: CelluleForm) => {
    const vars = {
      nom: values.nom,
      egliseId: values.egliseId || null,
      quartiersCouvertes: values.quartiersCouvertes || null,
      adresseReunion: values.adresseReunion || null,
      reference: values.reference || null,
      telephone1: values.telephone1 || null,
      telephone2: values.telephone2 || null,
    };
    if (editing) {
      await run('Modification de la cellule…', async () => {
        await modifierCellule({ variables: { id: editing.id, ...vars } });
        toast.success('Cellule modifiée avec succès');
        setShowForm(false);
        void refetch();
      });
    } else {
      await run('Création de la cellule…', async () => {
        await creerCellule({ variables: vars });
        toast.success('Cellule créée avec succès');
        setShowForm(false);
        void refetch();
      });
    }
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run('Suppression de la cellule…', async () => {
      await supprimerCellule({ variables: { id: toDelete.id } });
      toast.success('Cellule supprimée');
      setToDelete(null);
      void refetch();
    });
  };

  const columns: ColumnDef<Cellule>[] = [
    {
      header: 'Nom',
      accessorKey: 'nom',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-accent-800 text-sm">{row.original.nom}</p>
          {row.original.eglise && (
            <p className="text-xs text-accent-400">{row.original.eglise.nom}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Quartiers',
      accessorKey: 'quartiersCouvertes',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">{row.original.quartiersCouvertes ?? '—'}</span>
      ),
    },
    {
      header: 'Lieu de réunion',
      id: 'lieu',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">
          {[row.original.reference, row.original.adresseReunion].filter(Boolean).join(' — ') || '—'}
        </span>
      ),
    },
    {
      header: 'Contacts',
      id: 'contacts',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-accent-500">
          <Phone size={11} />
          {[row.original.telephone1, row.original.telephone2].filter(Boolean).join(' / ') || '—'}
        </div>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row.original)}
            className="text-xs px-2 py-1 text-accent-600 border border-accent-200 rounded cursor-pointer hover:bg-accent-50 flex items-center gap-1"
          >
            <Pencil size={11} />
            Modifier
          </button>
          <button
            onClick={() => setToDelete(row.original)}
            className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded cursor-pointer hover:bg-red-50 flex items-center gap-1"
          >
            <Trash2 size={11} />
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-accent-900">Cellules de Maison</h2>
          <p className="text-xs text-accent-400 mt-0.5">Groupes de maison des antennes</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700"
        >
          <Plus size={14} />
          Ajouter une cellule
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterEglise}
          onChange={(e) => setFilterEglise(e.target.value)}
          className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer bg-white text-accent-700 focus:border-primary-400"
        >
          <option value="">Toutes les églises</option>
          {eglises.map((e) => (
            <option key={e.id} value={e.id}>{e.nom}</option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={cellules} isLoading={loading} />

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette cellule"
        message={`Voulez-vous supprimer « ${toDelete?.nom} » ?`}
        confirmLabel="Supprimer cette cellule"
        cancelLabel="Annuler"
        danger
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
      />

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-accent-200">
              <h3 className="text-sm font-semibold text-accent-900">
                {editing ? 'Modifier la cellule' : 'Ajouter une cellule'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-accent-400 cursor-pointer hover:text-accent-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('nom')}
                  placeholder="Ex: Cellule Katuba Nord"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
                {errors.nom && <p className="text-xs text-red-500 mt-0.5">{errors.nom.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Église</label>
                <select
                  {...register('egliseId')}
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none cursor-pointer bg-white focus:border-primary-400"
                >
                  <option value="">Aucune église liée</option>
                  {eglises.map((e) => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Quartiers couverts</label>
                <input
                  {...register('quartiersCouvertes')}
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Référence</label>
                  <input
                    {...register('reference')}
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Adresse</label>
                  <input
                    {...register('adresseReunion')}
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Téléphone 1</label>
                  <input
                    {...register('telephone1')}
                    placeholder="+243..."
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Téléphone 2</label>
                  <input
                    {...register('telephone2')}
                    placeholder="+243..."
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm px-3 py-1.5 border border-accent-200 text-accent-600 rounded cursor-pointer hover:bg-accent-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700"
                >
                  {editing ? 'Enregistrer les modifications' : 'Créer la cellule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
