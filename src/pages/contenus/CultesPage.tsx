import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, PlaySquare, Radio, Calendar, ListFilter, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';import { GET_CULTES } from '@/graphql/queries/contenu.queries';
import { CREER_CULTE, MODIFIER_CULTE, SUPPRIMER_CULTE } from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { Culte } from '@/types';

const LIMIT = 10;

const TYPE_OPTIONS = [
  { value: 'MERCREDI', label: 'Mercredi' },
  { value: 'VENDREDI', label: 'Vendredi' },
  { value: 'SAMEDI', label: 'Samedi' },
  { value: 'DIMANCHE', label: 'Dimanche' },
  { value: 'SEMINAIRE', label: 'Séminaire' },
  { value: 'CONCERT', label: 'Concert' },
  { value: 'AUTRE', label: 'Autre' },
];

const STATUT_OPTIONS = [
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'EN_DIRECT', label: 'En direct' },
  { value: 'REDIFFUSION', label: 'Rediffusion' },
];

const culteSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  type: z.enum(['MERCREDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE', 'SEMINAIRE', 'CONCERT', 'AUTRE']),
  date: z.string().min(1, 'Date requise'),
  lienYoutube: z.string().url('Lien YouTube invalide').optional().or(z.literal('')),
  statut: z.enum(['PLANIFIE', 'EN_DIRECT', 'REDIFFUSION']),
});

type CulteForm = z.infer<typeof culteSchema>;

interface CultesData {
  getCultes: {
    items: Culte[];
    totalCount: number;
  }
}

export function CultesPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Culte | null>(null);
  const [toDelete, setToDelete] = useState<Culte | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<CultesData>(GET_CULTES, {
    variables: {
      search: debouncedSearch || undefined,
      type: filterType || undefined,
      statut: filterStatut || undefined,
      limit: LIMIT,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [creerCulte] = useMutation(CREER_CULTE);
  const [modifierCulte] = useMutation(MODIFIER_CULTE);
  const [supprimerCulte] = useMutation(SUPPRIMER_CULTE);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CulteForm>({
    resolver: zodResolver(culteSchema),
    defaultValues: { type: 'DIMANCHE', statut: 'PLANIFIE' },
  });

  const openForm = (c?: Culte) => {
    if (c) {
      setEditing(c);
      reset({
        titre: c.titre,
        description: c.description || '',
        type: c.type as CulteForm['type'],
        date: c.date.substring(0, 10),
        lienYoutube: c.lienYoutube || '',
        statut: c.statut as CulteForm['statut'],
      });
    } else {
      setEditing(null);
      reset({
        titre: '',
        description: '',
        type: 'DIMANCHE',
        date: new Date().toISOString().substring(0, 10),
        lienYoutube: '',
        statut: 'PLANIFIE',
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: CulteForm) => {
    await run('Enregistrement du culte...', async () => {
      try {
        const input = {
          ...values,
          date: new Date(values.date).toISOString(),
          lienYoutube: values.lienYoutube || null,
        };

        if (editing) {
          await modifierCulte({ variables: { id: editing.id, ...input } });
          toast.success('Culte mis à jour');
        } else {
          await creerCulte({ variables: input });
          toast.success('Culte enregistré');
        }
        closeForm();
        refetch();
      } catch {
        toast.error('Erreur lors de l\'enregistrement');
      }
    });
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run(async () => {
      try {
        await supprimerCulte({ variables: { id: toDelete.id } });
        toast.success('Culte supprimé');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<Culte>[] = [
    {
      accessorKey: 'titre',
      header: 'Titre & Support',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
            row.original.statut === 'EN_DIRECT' 
              ? 'bg-red-50 border-red-100 text-red-500' 
              : 'bg-accent-50 border-accent-200 text-accent-400'
          }`}>
            {row.original.statut === 'EN_DIRECT' ? (
              <Radio size={18} className="animate-pulse" />
            ) : (
              <PlaySquare size={18} />
            )}
          </div>
          <div>
            <div className="font-black text-accent-900 tracking-tight leading-tight">{row.original.titre}</div>
            <div className="text-[10px] font-bold text-accent-400 uppercase tracking-widest mt-0.5">
              {TYPE_OPTIONS.find((t) => t.value === row.original.type)?.label || row.original.type}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Diffusion',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent-500">
          <Calendar size={12} className="text-accent-300" />
          {formatDate(row.original.date)}
        </div>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'État',
      cell: ({ row }) => <StatusBadge value={row.original.statut} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          {row.original.lienYoutube && (
            <Button 
              variant="outline" 
              size="sm" 
              iconOnly 
              title="Ouvrir sur YouTube"
              onClick={() => window.open(row.original.lienYoutube!, '_blank')}
            >
              <ExternalLink size={14} className="text-primary-500" />
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Archives des Cultes</h1>
          <p className="text-sm text-accent-400 font-medium italic">Gérez les enregistrements et les directs</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Enregistrer un culte
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-surface p-3 border border-accent-200 rounded-lg">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setOffset(0); }}
          placeholder="Rechercher par titre ou description…"
          className="w-64"
        />
        <div className="flex items-center gap-2">
          <ListFilter size={14} className="text-accent-400" />
          <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type :</label>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setOffset(0); }}
            className="text-xs px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="">Tous les types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-accent-100 pl-4">
          <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Statut :</label>
          <select
            value={filterStatut}
            onChange={(e) => { setFilterStatut(e.target.value); setOffset(0); }}
            className="text-xs px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            {STATUT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getCultes.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getCultes.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucun culte trouvé."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer ce culte"
        message={`Voulez-vous supprimer l'enregistrement « ${toDelete?.titre} » ?`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier le culte" : 'Nouvel enregistrement'}
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
              {editing ? 'Mettre à jour' : 'Enregistrer le culte'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre du culte <span className="text-danger">*</span></label>
            <input
              {...register('titre')}
              placeholder="Ex: Culte de Dominical - Gloire à Dieu"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
            {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type de culte <span className="text-danger">*</span></label>
              <select
                {...register('type')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Statut actuel <span className="text-danger">*</span></label>
              <select
                {...register('statut')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              >
                {STATUT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Date de diffusion <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              />
              {errors.date && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <PlaySquare size={10} /> Lien YouTube
              </label>
              <input
                {...register('lienYoutube')}
                placeholder="https://youtu.be/..."
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.lienYoutube && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.lienYoutube.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description / Détails</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Orateur, thème détaillé..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
