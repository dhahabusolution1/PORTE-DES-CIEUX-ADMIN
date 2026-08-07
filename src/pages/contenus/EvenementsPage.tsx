import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, ExternalLink, ImageIcon, Calendar, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';
import { GET_EVENEMENTS } from '@/graphql/queries/contenu.queries';
import {
  CREER_EVENEMENT,
  MODIFIER_EVENEMENT,
  SUPPRIMER_EVENEMENT,
} from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { Evenement } from '@/types';

const LIMIT = 10;

const TYPE_LABELS: Record<string, string> = {
  EVENEMENT: 'Événement',
  PROGRAMME_CULTE: 'Programme Culte',
};

const STATUT_OPTIONS = [
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'PUBLIE', label: 'Publié' },
  { value: 'ANNULE', label: 'Annulé' },
  { value: 'TERMINE', label: 'Terminé' },
];

const evenementSchema = z.object({
  type: z.enum(['EVENEMENT', 'PROGRAMME_CULTE']),
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  dateDebut: z.string().min(1, 'Date requise'),
  dateFin: z.string().optional(),
  heure: z.string().optional(),
  lieu: z.string().optional(),
  imageExterneUrl: z.string().optional(),
  organisateur: z.string().optional(),
  lienYoutube: z.string().optional(),
  statut: z.enum(['BROUILLON', 'PUBLIE', 'ANNULE', 'TERMINE']),
});

type FormValues = z.infer<typeof evenementSchema>;

interface EvenementsData {
  getEvenements: {
    items: Evenement[];
    totalCount: number;
  }
}

export function EvenementsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filterType, setFilterType] = useState<string>('');
  const [toDelete, setToDelete] = useState<Evenement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Evenement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<EvenementsData>(GET_EVENEMENTS, {
    variables: { 
      search: debouncedSearch || undefined,
      limit: LIMIT, 
      offset,
      type: filterType || undefined
    },
    fetchPolicy: 'cache-and-network',
  });

  const [creerEvenement] = useMutation(CREER_EVENEMENT);
  const [modifierEvenement] = useMutation(MODIFIER_EVENEMENT);
  const [supprimerEvenement] = useMutation(SUPPRIMER_EVENEMENT);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(evenementSchema),
    defaultValues: {
      type: 'EVENEMENT',
      statut: 'BROUILLON',
    },
  });

  const openForm = (ev?: Evenement) => {
    if (ev) {
      setEditing(ev);
      setImageUrl(ev.imageUrl || null);
      reset({
        type: ev.type as FormValues['type'],
        titre: ev.titre,
        description: ev.description || '',
        dateDebut: ev.dateDebut ? ev.dateDebut.split('T')[0] : '',
        dateFin: ev.dateFin ? ev.dateFin.split('T')[0] : '',
        heure: ev.heure || '',
        lieu: ev.lieu || '',
        imageExterneUrl: ev.imageExterneUrl || '',
        organisateur: ev.organisateur || '',
        lienYoutube: ev.lienYoutube || '',
        statut: ev.statut as FormValues['statut'],
      });
    } else {
      setEditing(null);
      setImageUrl(null);
      reset({
        type: 'EVENEMENT',
        titre: '',
        description: '',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        heure: '',
        lieu: '',
        imageExterneUrl: '',
        organisateur: '',
        lienYoutube: '',
        statut: 'BROUILLON',
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    await run('Enregistrement de l\'événement...', async () => {
      try {
        const input = {
          ...values,
          imageUrl: imageUrl || undefined,
          dateDebut: new Date(values.dateDebut).toISOString(),
          dateFin: values.dateFin ? new Date(values.dateFin).toISOString() : undefined,
        };

        if (editing) {
          await modifierEvenement({ variables: { id: editing.id, input } });
          toast.success('Événement modifié');
        } else {
          await creerEvenement({ variables: { input } });
          toast.success('Événement créé');
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
        await supprimerEvenement({ variables: { id: toDelete.id } });
        toast.success('Événement supprimé');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<Evenement>[] = [
    {
      accessorKey: 'titre',
      header: 'Événement',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0 overflow-hidden">
            {row.original.imageUrl || row.original.imageExterneUrl ? (
              <img 
                src={row.original.imageUrl || row.original.imageExterneUrl || ''} 
                className="w-full h-full object-cover" 
                alt=""
              />
            ) : (
              <Calendar className="w-5 h-5 text-accent-400" />
            )}
          </div>
          <div>
            <div className="font-black text-accent-900 tracking-tight">{row.original.titre}</div>
            <div className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">
              {TYPE_LABELS[row.original.type]}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'dateDebut',
      header: 'Date & Lieu',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-700">
            <Calendar size={12} className="text-primary-500" />
            {formatDate(row.original.dateDebut)}
            {row.original.dateFin && ` - ${formatDate(row.original.dateFin)}`}
          </div>
          {row.original.lieu && (
            <div className="flex items-center gap-1.5 text-[10px] text-accent-400 font-medium italic">
              <MapPin size={10} />
              {row.original.lieu}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge value={row.original.statut} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1.5">
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Événements & Programmes</h1>
          <p className="text-sm text-accent-400 font-medium italic">Planifiez et gérez les moments forts de l'église</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Nouvel événement
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-surface p-3 border border-accent-200 rounded-lg">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setOffset(0); }}
          placeholder="Rechercher par titre, lieu, organisateur…"
          className="flex-1"
        />
        <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest ml-1 whitespace-nowrap">Type :</label>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setOffset(0);
          }}
          className="text-xs px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-400 cursor-pointer"
        >
          <option value="">Tous les types</option>
          <option value="EVENEMENT">Événements uniquement</option>
          <option value="PROGRAMME_CULTE">Programmes Culte uniquement</option>
        </select>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getEvenements.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getEvenements.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucun événement trouvé."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cet événement"
        message={`Voulez-vous supprimer l'événement « ${toDelete?.titre} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier l'événement" : 'Ajouter un événement'}
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
              {editing ? 'Enregistrer les modifications' : 'Créer l\'événement'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type de contenu</label>
              <select
                {...register('type')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              >
                <option value="EVENEMENT">Événement spécial</option>
                <option value="PROGRAMME_CULTE">Programme de Culte</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Statut de publication</label>
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre de l'événement <span className="text-danger">*</span></label>
            <input
              {...register('titre')}
              placeholder="Ex: Conférence Annuelle des Jeunes"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
            {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description détaillée</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Décrivez l'événement..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Date Début <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                {...register('dateDebut')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              />
              {errors.dateDebut && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.dateDebut.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Date Fin
              </label>
              <input
                type="date"
                {...register('dateFin')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={10} /> Heure de début
              </label>
              <input
                type="time"
                {...register('heure')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={10} /> Lieu
              </label>
              <input
                {...register('lieu')}
                placeholder="Salle, adresse, ville..."
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Organisateur / Responsable</label>
              <input
                {...register('organisateur')}
                placeholder="Département ou responsable"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
              <ExternalLink size={10} /> Lien YouTube (Live ou Replay)
            </label>
            <input
              {...register('lienYoutube')}
              placeholder="https://youtu.be/..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
          </div>

          <div className="border-t border-accent-100 pt-5 mt-2">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <ImageIcon size={10} /> Visuel de l'événement
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <div className="space-y-3">
                <p className="text-[10px] text-accent-500 italic leading-tight">
                  Uploadez une image ou renseignez une URL externe. L'upload Cloudinary est prioritaire.
                </p>
                <ImageUploader
                  value={imageUrl ?? undefined}
                  onChange={setImageUrl}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-accent-300 uppercase tracking-widest">URL Externe alternative</label>
                <input
                  {...register('imageExterneUrl')}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3 py-2 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-500 transition-all font-sans"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
