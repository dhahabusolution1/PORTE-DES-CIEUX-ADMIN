import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, CheckCircle, BookOpen, Quote } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';
import { GET_VERSETS } from '@/graphql/queries/contenu.queries';
import {
  CREER_VERSET,
  MODIFIER_VERSET,
  SUPPRIMER_VERSET,
  ACTIVER_VERSET,
} from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { VersetJour } from '@/types';

const LIMIT = 10;

const versetSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  texte: z.string().min(1, 'Texte requis'),
  meditation: z.string().optional(),
  versionBiblique: z.string().min(1, 'Version requise'),
  datePublication: z.string().min(1, 'Date requise'),
});

type FormValues = z.infer<typeof versetSchema>;

interface VersetsData {
  getVersets: {
    items: VersetJour[];
    totalCount: number;
  }
}

export function VersetsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [toDelete, setToDelete] = useState<VersetJour | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VersetJour | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<VersetsData>(GET_VERSETS, {
    variables: { search: debouncedSearch || undefined, limit: LIMIT, offset },
    fetchPolicy: 'cache-and-network',
  });

  const [creerVerset] = useMutation(CREER_VERSET);
  const [modifierVerset] = useMutation(MODIFIER_VERSET);
  const [supprimerVerset] = useMutation(SUPPRIMER_VERSET);
  const [activerVerset] = useMutation(ACTIVER_VERSET);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(versetSchema),
    defaultValues: {
      versionBiblique: 'LSG',
    },
  });

  const openForm = (v?: VersetJour) => {
    if (v) {
      setEditing(v);
      reset({
        reference: v.reference,
        texte: v.texte,
        meditation: v.meditation || '',
        versionBiblique: v.versionBiblique,
        datePublication: v.datePublication.split('T')[0],
      });
    } else {
      setEditing(null);
      reset({
        reference: '',
        texte: '',
        meditation: '',
        versionBiblique: 'LSG',
        datePublication: new Date().toISOString().split('T')[0],
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    await run('Enregistrement du verset...', async () => {
      try {
        const input = {
          ...values,
          datePublication: new Date(values.datePublication).toISOString(),
        };

        if (editing) {
          await modifierVerset({ variables: { id: editing.id, ...input } });
          toast.success('Verset modifié');
        } else {
          await creerVerset({ variables: { ...input } });
          toast.success('Verset créé');
        }
        closeForm();
        refetch();
      } catch {
        toast.error('Erreur lors de l\'enregistrement');
      }
    });
  };

  const handleActiver = async (id: string) => {
    await run(async () => {
      try {
        await activerVerset({ variables: { id } });
        toast.success('Verset activé');
        refetch();
      } catch {
        toast.error('Erreur lors de l\'activation');
      }
    });
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run(async () => {
      try {
        await supprimerVerset({ variables: { id: toDelete.id } });
        toast.success('Verset supprimé');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<VersetJour>[] = [
    {
      accessorKey: 'reference',
      header: 'Référence & Version',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${row.original.estActif ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-50 text-primary-500'}`}>
            <BookOpen size={16} />
          </div>
          <div>
            <div className="font-black text-accent-900 tracking-tight">{row.original.reference}</div>
            <div className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">
              {row.original.versionBiblique}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'texte',
      header: 'Contenu',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="text-xs text-accent-700 line-clamp-2 italic leading-relaxed">
            « {row.original.texte} »
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'datePublication',
      header: 'Publication',
      cell: ({ row }) => (
        <div className="text-xs font-bold text-accent-600">
          {formatDate(row.original.datePublication)}
        </div>
      ),
    },
    {
      accessorKey: 'estActif',
      header: 'État',
      cell: ({ row }) => (
        row.original.estActif ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Actif</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-100 text-accent-600 rounded-full border border-accent-200">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Inactif</span>
          </div>
        )
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          {!row.original.estActif && (
            <Button 
              variant="outline" 
              size="sm" 
              iconOnly 
              title="Activer comme verset du jour"
              onClick={() => handleActiver(row.original.id)}
            >
              <CheckCircle size={14} className="text-emerald-500" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            iconOnly 
            title="Modifier"
            onClick={() => openForm(row.original)}
          >
            <Pencil size={14} />
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            iconOnly 
            title="Supprimer"
            onClick={() => setToDelete(row.original)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Versets du Jour</h1>
          <p className="text-sm text-accent-500 font-medium">Gérez la parole quotidienne diffusée sur tous les supports</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Nouveau verset
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setOffset(0); }}
        placeholder="Rechercher par référence ou texte…"
      />

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getVersets.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getVersets.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucun verset enregistré dans la bibliothèque."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer ce verset"
        message={`Voulez-vous supprimer le verset « ${toDelete?.reference} » ? Cette action est définitive.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier le verset" : 'Ajouter un verset biblique'}
        maxWidth="2xl"
        footer={(
          <>
            <Button variant="ghost" onClick={closeForm} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit(onSubmit)} 
              isLoading={isSubmitting}
            >
              {editing ? 'Enregistrer les modifications' : 'Créer le verset'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={10} /> Référence Biblique <span className="text-danger">*</span>
              </label>
              <input
                {...register('reference')}
                placeholder="Ex: Jean 3:16"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.reference && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.reference.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Version Biblique</label>
              <input
                {...register('versionBiblique')}
                placeholder="Ex: LSG, NEG, Bible du Semeur"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
              <Quote size={10} /> Texte biblique <span className="text-danger">*</span>
            </label>
            <textarea
              {...register('texte')}
              rows={4}
              placeholder="Saisissez le texte sacré..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans italic"
            />
            {errors.texte && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.texte.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Méditation / Commentaire</label>
            <textarea
              {...register('meditation')}
              rows={3}
              placeholder="Une courte pensée pour accompagner le verset..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
              <Plus size={10} /> Date de publication prévue <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              {...register('datePublication')}
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
            />
            {errors.datePublication && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.datePublication.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
