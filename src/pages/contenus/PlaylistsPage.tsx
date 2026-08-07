import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, Layers3, Hash, ImageIcon, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { GET_PLAYLISTS } from '@/graphql/queries/contenu.queries';
import {
  CREER_PLAYLIST,
  MODIFIER_PLAYLIST,
  SUPPRIMER_PLAYLIST,
} from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useProcessing } from '@/hooks/useProcessing';
import type { PlaylistSermon } from '@/types';

const LIMIT = 10;

const playlistSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  theme: z.string().optional(),
  ordre: z.number().int(),
});

type FormValues = z.infer<typeof playlistSchema>;

interface PlaylistsData {
  getPlaylists: {
    items: PlaylistSermon[];
    totalCount: number;
  }
}

export function PlaylistsPage() {
  const [offset, setOffset] = useState(0);
  const [toDelete, setToDelete] = useState<PlaylistSermon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlaylistSermon | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<PlaylistsData>(GET_PLAYLISTS, {
    variables: { limit: LIMIT, offset },
    fetchPolicy: 'cache-and-network',
  });

  const [creerPlaylist] = useMutation(CREER_PLAYLIST);
  const [modifierPlaylist] = useMutation(MODIFIER_PLAYLIST);
  const [supprimerPlaylist] = useMutation(SUPPRIMER_PLAYLIST);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      ordre: 0,
    },
  });

  const openForm = (p?: PlaylistSermon) => {
    if (p) {
      setEditing(p);
      setImageUrl(p.imageUrl || null);
      reset({
        titre: p.titre,
        description: p.description || '',
        theme: p.theme || '',
        ordre: p.ordre,
      });
    } else {
      setEditing(null);
      setImageUrl(null);
      reset({
        titre: '',
        description: '',
        theme: '',
        ordre: (data?.getPlaylists.items.length ?? 0) + 1,
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    await run('Enregistrement de la série...', async () => {
      try {
        const input = {
          ...values,
          imageUrl: imageUrl || undefined,
        };

        if (editing) {
          await modifierPlaylist({ variables: { id: editing.id, ...input } });
          toast.success('Série modifiée');
        } else {
          await creerPlaylist({ variables: { ...input } });
          toast.success('Série créée');
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
        await supprimerPlaylist({ variables: { id: toDelete.id } });
        toast.success('Série supprimée');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<PlaylistSermon>[] = [
    {
      accessorKey: 'ordre',
      header: '#',
      cell: ({ row }) => (
        <div className="font-bold text-accent-400 text-[10px] w-4">{row.original.ordre}</div>
      ),
    },
    {
      accessorKey: 'titre',
      header: 'Thématique / Série',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0 overflow-hidden border border-accent-200">
            {row.original.imageUrl ? (
              <img src={row.original.imageUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <Layers3 className="w-5 h-5 text-accent-300" />
            )}
          </div>
          <div>
            <div className="font-black text-accent-900 tracking-tight">{row.original.titre}</div>
            <div className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">
              {row.original.theme || 'Thème non précisé'}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'stats',
      header: 'Contenu',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-50 rounded-md border border-accent-100 w-fit">
          <PlayCircle size={12} className="text-accent-400" />
          <span className="text-[10px] font-bold text-accent-700 uppercase tracking-tight">
            {row.original.sermons.length} Vidéo{row.original.sermons.length > 1 ? 's' : ''}
          </span>
        </div>
      ),
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Séries & Playlists</h1>
          <p className="text-sm text-accent-400 font-medium italic">Organisez vos sermons par thématiques ou séries</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Nouvelle série
        </Button>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getPlaylists.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getPlaylists.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucune playlist trouvée."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette série"
        message={`Voulez-vous supprimer la série « ${toDelete?.titre} » ? Cela ne supprimera pas les vidéos, mais elles ne seront plus regroupées.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier la série" : 'Créer une nouvelle série'}
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
              {editing ? 'Enregistrer les modifications' : 'Créer la série'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre de la série <span className="text-danger">*</span></label>
              <input
                {...register('titre')}
                placeholder="Ex: La Puissance de la Résurrection"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Hash size={10} /> Ordre d'affichage
              </label>
              <input
                type="number"
                {...register('ordre', { valueAsNumber: true })}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Thématique principale</label>
            <input
              {...register('theme')}
              placeholder="Ex: Foi, Guérison, Fin des temps..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="De quoi parle cette série de messages ?"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>

          <div className="border-t border-accent-100 pt-5 mt-2">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <ImageIcon size={10} /> Visuel de la série
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <ImageUploader
                value={imageUrl ?? undefined}
                onChange={setImageUrl}
              />
              <div className="space-y-2 text-[10px] text-accent-500 italic">
                <p>Ce visuel sera utilisé comme couverture de l'album sur l'application mobile.</p>
                <p className="text-accent-400">Une image carrée (1:1) est recommandée pour un rendu optimal.</p>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
