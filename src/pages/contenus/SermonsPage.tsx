import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, PlaySquare, User, Calendar, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';
import { GET_SERMONS, GET_PLAYLISTS } from '@/graphql/queries/contenu.queries';
import {
  CREER_SERMON,
  MODIFIER_SERMON,
  SUPPRIMER_SERMON,
} from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { Sermon, PlaylistSermon } from '@/types';

const LIMIT = 10;

const sermonSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  predicateur: z.string().min(1, 'Prédicateur requis'),
  date: z.string().min(1, 'Date requise'),
  lienYoutube: z.string().url('Lien YouTube invalide'),
  playlistId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof sermonSchema>;

interface SermonsData {
  getSermons: {
    items: Sermon[];
    totalCount: number;
  }
}

interface PlaylistsData {
  getPlaylists: { items: PlaylistSermon[]; totalCount: number };
}

export function SermonsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [toDelete, setToDelete] = useState<Sermon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sermon | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<SermonsData>(GET_SERMONS, {
    variables: { 
      search: debouncedSearch || undefined,
      limit: LIMIT, 
      offset,
      playlistId: selectedPlaylist || undefined
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: playlistsData } = useQuery<PlaylistsData>(GET_PLAYLISTS, {
    variables: { limit: 100 }, // On récupère toutes les playlists pour le filtre
  });

  const [creerSermon] = useMutation(CREER_SERMON);
  const [modifierSermon] = useMutation(MODIFIER_SERMON);
  const [supprimerSermon] = useMutation(SUPPRIMER_SERMON);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(sermonSchema),
  });

  const openForm = (s?: Sermon) => {
    if (s) {
      setEditing(s);
      reset({
        titre: s.titre,
        description: s.description || '',
        predicateur: s.predicateur,
        date: s.date.split('T')[0],
        lienYoutube: s.lienYoutube,
        playlistId: s.playlist?.id || '',
      });
    } else {
      setEditing(null);
      reset({
        titre: '',
        description: '',
        predicateur: '',
        date: new Date().toISOString().split('T')[0],
        lienYoutube: '',
        playlistId: '',
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    await run('Enregistrement du sermon...', async () => {
      try {
        const input = {
          ...values,
          date: new Date(values.date).toISOString(),
          playlistId: values.playlistId || undefined,
        };

        if (editing) {
          await modifierSermon({ variables: { id: editing.id, input } });
          toast.success('Sermon modifié');
        } else {
          await creerSermon({ variables: { input } });
          toast.success('Sermon créé');
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
        await supprimerSermon({ variables: { id: toDelete.id } });
        toast.success('Sermon supprimé');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<Sermon>[] = [
    {
      accessorKey: 'miniatureUrl',
      header: 'Miniature',
      cell: ({ row }) => (
        <div 
          className="w-20 h-12 rounded border border-accent-200 bg-accent-100 overflow-hidden relative group cursor-pointer"
          onClick={() => window.open(row.original.lienYoutube, '_blank')}
        >
          {row.original.miniatureUrl ? (
            <img src={row.original.miniatureUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlaySquare size={16} className="text-accent-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
            <PlaySquare size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'titre',
      header: 'Sermon & Playlist',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-black text-accent-900 text-sm tracking-tight line-clamp-1">{row.original.titre}</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">
              {row.original.playlist?.titre || 'Hors Playlist'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'predicateur',
      header: 'Prédicateur',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-accent-700">
          <User size={12} className="text-accent-400" />
          {row.original.predicateur}
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent-500">
          <Calendar size={12} className="text-accent-300" />
          {formatDate(row.original.date)}
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Sermons & Prédications</h1>
          <p className="text-sm text-accent-400 font-medium italic">Gérez la bibliothèque de vos messages vidéo</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Ajouter un sermon
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-accent-200 rounded-lg">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setOffset(0); }}
          placeholder="Rechercher par titre, prédicateur…"
          className="flex-1 min-w-[200px]"
        />
        <ListFilter size={14} className="text-accent-400 ml-1" />
        <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Série / Playlist :</label>
        <select
          value={selectedPlaylist}
          onChange={(e) => {
            setSelectedPlaylist(e.target.value);
            setOffset(0);
          }}
          className="text-xs px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-400 cursor-pointer"
        >
          <option value="">Toutes les vidéos</option>
          {playlistsData?.getPlaylists.items.map((p) => (
            <option key={p.id} value={p.id}>{p.titre}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getSermons.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getSermons.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucun sermon trouvé dans la bibliothèque."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer ce sermon"
        message={`Voulez-vous supprimer le sermon « ${toDelete?.titre} » ?`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier le sermon" : 'Nouveau sermon'}
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
              {editing ? 'Enregistrer les modifications' : 'Ajouter à la bibliothèque'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre du sermon <span className="text-danger">*</span></label>
            <input
              {...register('titre')}
              placeholder="Ex: Le secret de la victoire"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
            {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={10} /> Prédicateur <span className="text-danger">*</span>
              </label>
              <input
                {...register('predicateur')}
                placeholder="Ex: Pasteur Gael"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.predicateur && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.predicateur.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              />
              {errors.date && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
              <PlaySquare size={10} /> Lien Vidéo YouTube <span className="text-danger">*</span>
            </label>
            <input
              {...register('lienYoutube')}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
            {errors.lienYoutube && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.lienYoutube.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Série / Playlist</label>
              <select
                {...register('playlistId')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              >
                <option value="">Aucune (Vidéos isolées)</option>
                {playlistsData?.getPlaylists.items.map((p) => (
                  <option key={p.id} value={p.id}>{p.titre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 text-[10px] text-accent-400 italic">
              <p className="mt-6">L'ordre dans la playlist peut être géré depuis la page des Playlists.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description / Note</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Résumé de la prédication..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
