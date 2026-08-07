import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { GET_DEPARTEMENTS } from '@/graphql/queries/referentiels.queries';
import { CREER_DEPARTEMENT, MODIFIER_DEPARTEMENT, SUPPRIMER_DEPARTEMENT } from '@/graphql/mutations/referentiels.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useProcessing } from '@/hooks/useProcessing';
import type { Departement } from '@/types';

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  responsable: z.string().optional(),
  mission: z.string().optional(),
  historique: z.string().optional(),
});
type DepartementForm = z.infer<typeof schema>;

interface DepartementsData { getDepartements: Departement[] }

export function DepartementsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Departement | null>(null);
  const [toDelete, setToDelete] = useState<Departement | null>(null);
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<DepartementsData>(GET_DEPARTEMENTS, { fetchPolicy: 'cache-and-network' });
  const [creerDepartement] = useMutation(CREER_DEPARTEMENT);
  const [modifierDepartement] = useMutation(MODIFIER_DEPARTEMENT);
  const [supprimerDepartement] = useMutation(SUPPRIMER_DEPARTEMENT);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DepartementForm>({
    resolver: zodResolver(schema),
  });

  const departements = data?.getDepartements ?? [];

  function openAdd() {
    setEditing(null);
    reset();
    setShowForm(true);
  }

  function openEdit(d: Departement) {
    setEditing(d);
    setValue('nom', d.nom);
    setValue('responsable', d.responsable ?? '');
    setValue('mission', d.mission ?? '');
    setValue('historique', d.historique ?? '');
    setShowForm(true);
  }

  const onSubmit = async (values: DepartementForm) => {
    const vars = {
      nom: values.nom,
      responsable: values.responsable || null,
      mission: values.mission || null,
      historique: values.historique || null,
    };
    if (editing) {
      await run('Modification du département…', async () => {
        await modifierDepartement({ variables: { id: editing.id, ...vars } });
        toast.success('Département modifié avec succès');
        setShowForm(false);
        void refetch();
      });
    } else {
      await run('Création du département…', async () => {
        await creerDepartement({ variables: vars });
        toast.success('Département créé avec succès');
        setShowForm(false);
        void refetch();
      });
    }
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run('Suppression du département…', async () => {
      await supprimerDepartement({ variables: { id: toDelete.id } });
      toast.success('Département supprimé');
      setToDelete(null);
      void refetch();
    });
  };

  const columns: ColumnDef<Departement>[] = [
    {
      header: 'Nom',
      accessorKey: 'nom',
      cell: ({ row }) => (
        <p className="font-medium text-accent-800 text-sm">{row.original.nom}</p>
      ),
    },
    {
      header: 'Responsable',
      accessorKey: 'responsable',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">{row.original.responsable ?? '—'}</span>
      ),
    },
    {
      header: 'Mission',
      accessorKey: 'mission',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">
          {row.original.mission
            ? row.original.mission.length > 80
              ? row.original.mission.substring(0, 80) + '…'
              : row.original.mission
            : '—'}
        </span>
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
          <h2 className="text-base font-semibold text-accent-900">Départements</h2>
          <p className="text-xs text-accent-400 mt-0.5">Départements ministériels de l'église</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700"
        >
          <Plus size={14} />
          Ajouter un département
        </button>
      </div>

      <DataTable columns={columns} data={departements} isLoading={loading} />

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer ce département"
        message={`Voulez-vous supprimer le département « ${toDelete?.nom} » ?`}
        confirmLabel="Supprimer ce département"
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
                {editing ? 'Modifier le département' : 'Ajouter un département'}
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
                  placeholder="Ex: Département Louange et Adoration"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
                {errors.nom && <p className="text-xs text-red-500 mt-0.5">{errors.nom.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Responsable</label>
                <input
                  {...register('responsable')}
                  placeholder="Nom du responsable"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Mission</label>
                <textarea
                  {...register('mission')}
                  rows={2}
                  placeholder="Mission et vision du département"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Historique</label>
                <textarea
                  {...register('historique')}
                  rows={2}
                  placeholder="Historique du département (optionnel)"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400 resize-none"
                />
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
                  {editing ? 'Enregistrer les modifications' : 'Créer le département'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
