import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, X, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { GET_EGLISES } from '@/graphql/queries/referentiels.queries';
import { CREER_EGLISE, MODIFIER_EGLISE, SUPPRIMER_EGLISE } from '@/graphql/mutations/referentiels.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useProcessing } from '@/hooks/useProcessing';
import type { Eglise } from '@/types';

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  ville: z.string().optional(),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  pasteurNom: z.string().optional(),
  lienFacebook: z.string().optional(),
});
type EgliseForm = z.infer<typeof schema>;

interface EglisesData { getEglises: Eglise[] }

export function EglisesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Eglise | null>(null);
  const [toDelete, setToDelete] = useState<Eglise | null>(null);
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<EglisesData>(GET_EGLISES, { fetchPolicy: 'cache-and-network' });
  const [creerEglise] = useMutation(CREER_EGLISE);
  const [modifierEglise] = useMutation(MODIFIER_EGLISE);
  const [supprimerEglise] = useMutation(SUPPRIMER_EGLISE);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EgliseForm>({
    resolver: zodResolver(schema),
  });

  const eglises = data?.getEglises ?? [];

  function openAdd() {
    setEditing(null);
    reset();
    setShowForm(true);
  }

  function openEdit(e: Eglise) {
    setEditing(e);
    setValue('nom', e.nom);
    setValue('ville', e.ville ?? '');
    setValue('adresse', e.adresse ?? '');
    setValue('telephone', e.telephone ?? '');
    setValue('pasteurNom', e.pasteurNom ?? '');
    setValue('lienFacebook', e.lienFacebook ?? '');
    setShowForm(true);
  }

  const onSubmit = async (values: EgliseForm) => {
    const vars = {
      nom: values.nom,
      ville: values.ville || null,
      adresse: values.adresse || null,
      telephone: values.telephone || null,
      pasteurNom: values.pasteurNom || null,
      lienFacebook: values.lienFacebook || null,
    };
    if (editing) {
      await run("Modification de l'église…", async () => {
        await modifierEglise({ variables: { id: editing.id, ...vars } });
        toast.success('Église modifiée avec succès');
        setShowForm(false);
        void refetch();
      });
    } else {
      await run("Création de l'église…", async () => {
        await creerEglise({ variables: vars });
        toast.success('Église créée avec succès');
        setShowForm(false);
        void refetch();
      });
    }
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run("Suppression de l'église…", async () => {
      await supprimerEglise({ variables: { id: toDelete.id } });
      toast.success('Église supprimée');
      setToDelete(null);
      void refetch();
    });
  };

  const columns: ColumnDef<Eglise>[] = [
    {
      header: 'Nom',
      accessorKey: 'nom',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-accent-800 text-sm">{row.original.nom}</p>
          {row.original.pasteurNom && (
            <p className="text-xs text-accent-400">Pasteur : {row.original.pasteurNom}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Localisation',
      id: 'localisation',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-accent-500">
          <MapPin size={11} />
          {[row.original.ville, row.original.adresse].filter(Boolean).join(' — ') || '—'}
        </div>
      ),
    },
    {
      header: 'Téléphone',
      id: 'telephone',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-accent-500">
          <Phone size={11} />
          {row.original.telephone ?? '—'}
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
          <h2 className="text-base font-semibold text-accent-900">Gestion des sites & antennes</h2>
          <p className="text-xs text-accent-400 mt-0.5">Sites et extensions de Porte des Cieux (EPDC)</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700"
        >
          <Plus size={14} />
          Ajouter une église
        </button>
      </div>

      <DataTable trashType="EGLISE" columns={columns} data={eglises} isLoading={loading} />

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette église"
        message={`Voulez-vous supprimer « ${toDelete?.nom} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer cette église"
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
                {editing ? "Modifier l'église" : 'Ajouter une église'}
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
                  placeholder="Ex: EPDC Kinshasa – Siège"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
                {errors.nom && <p className="text-xs text-red-500 mt-0.5">{errors.nom.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Ville</label>
                  <input
                    {...register('ville')}
                    placeholder="Ex: Kinshasa"
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Téléphone</label>
                  <input
                    {...register('telephone')}
                    placeholder="+243..."
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Adresse</label>
                <input
                  {...register('adresse')}
                  placeholder="Adresse complète"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Nom du Pasteur</label>
                <input
                  {...register('pasteurNom')}
                  placeholder="Ex: Pasteur Jean Mukendi"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Lien Facebook</label>
                <input
                  {...register('lienFacebook')}
                  placeholder="Ex: https://facebook.com/..."
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
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
                  {editing ? 'Enregistrer les modifications' : "Créer l'église"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
