import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, PlaySquare, Tv, Radio, Calendar, ListFilter, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';
import { GET_EMISSIONS } from '@/graphql/queries/contenu.queries';
import {
  CREER_EMISSION,
  MODIFIER_EMISSION,
  SUPPRIMER_EMISSION,
} from '@/graphql/mutations/contenu.mutations';
import { useAuthStore } from '@/stores/authStore';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { Emission } from '@/types';

const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL as string;
const LIMIT = 10;

const emissionSchema = z.object({
  type: z.enum(['EMISSION_TV', 'EMISSION_RADIO']),
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date requise'),
  lienYoutube: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof emissionSchema>;

interface EmissionsData {
  getEmissions: {
    items: Emission[];
    totalCount: number;
  }
}

export function EmissionsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filterType, setFilterType] = useState<string>('');
  const [toDelete, setToDelete] = useState<Emission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Emission | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { run } = useProcessing();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, loading, refetch } = useQuery<EmissionsData>(GET_EMISSIONS, {
    variables: { 
      search: debouncedSearch || undefined,
      limit: LIMIT, 
      offset,
      type: filterType || undefined
    },
    fetchPolicy: 'cache-and-network',
  });

  const [creerEmission] = useMutation(CREER_EMISSION);
  const [modifierEmission] = useMutation(MODIFIER_EMISSION);
  const [supprimerEmission] = useMutation(SUPPRIMER_EMISSION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(emissionSchema),
    defaultValues: {
      type: 'EMISSION_TV',
    },
  });


  const openForm = (e?: Emission) => {
    if (e) {
      setEditing(e);
      reset({
        type: e.type as FormValues['type'],
        titre: e.titre,
        description: e.description || '',
        date: e.date.split('T')[0],
        lienYoutube: e.lienYoutube,
      });
    } else {
      setEditing(null);
      reset({
        type: 'EMISSION_TV',
        titre: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        lienYoutube: '',
      });
    }
    setUploadFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    if (!uploadFile && !values.lienYoutube && !editing) {
      toast.error('Veuillez fournir un fichier ou un lien YouTube');
      return;
    }

    await run('Enregistrement de l\'émission...', async () => {
      try {
        let mediaUrl = undefined;
        let cloudinaryPublicId = undefined;

        if (uploadFile) {
          const formData = new FormData();
          formData.append('file', uploadFile);
          formData.append('folder', 'emissions_radio');

          const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Erreur lors de l\'upload du fichier audio/vidéo');
          }

          const uploaded = await response.json() as { url: string; publicId: string };
          mediaUrl = uploaded.url;
          cloudinaryPublicId = uploaded.publicId;
        }

        const input = {
          ...values,
          date: new Date(values.date).toISOString(),
          mediaUrl,
          cloudinaryPublicId,
        };

        if (editing) {
          await modifierEmission({ variables: { id: editing.id, input } });
          toast.success('Émission modifiée');
        } else {
          await creerEmission({ variables: { input } });
          toast.success('Émission créée');
        }
        closeForm();
        refetch();
      } catch (err) {
        toast.error((err as Error).message || 'Erreur lors de l\'enregistrement');
      }
    });
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run(async () => {
      try {
        await supprimerEmission({ variables: { id: toDelete.id } });
        toast.success('Émission supprimée');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<Emission>[] = [
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
      header: 'Émission',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-black text-accent-900 text-sm tracking-tight line-clamp-1">{row.original.titre}</div>
          <div className="flex items-center gap-1.5">
            {row.original.type === 'EMISSION_TV' ? (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">
                <Tv size={10} /> TV
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-widest border border-amber-100">
                <Radio size={10} /> Radio
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date de diffusion',
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Émissions TV & Radio</h1>
          <p className="text-sm text-accent-400 font-medium italic">Gérez vos productions audiovisuelles</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Nouvelle émission
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-accent-200 rounded-lg">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setOffset(0); }}
          placeholder="Rechercher par titre ou description…"
          className="flex-1 min-w-[200px]"
        />
        <ListFilter size={14} className="text-accent-400 ml-1" />
        <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type d'émission :</label>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setOffset(0);
          }}
          className="text-xs px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-400 cursor-pointer"
        >
          <option value="">Tous les supports</option>
          <option value="EMISSION_TV">Émissions TV</option>
          <option value="EMISSION_RADIO">Émissions Radio</option>
        </select>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getEmissions.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getEmissions.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucune émission trouvée."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette émission"
        message={`Voulez-vous supprimer l'émission « ${toDelete?.titre} » ?`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier l'émission" : 'Nouvelle émission'}
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
              {editing ? 'Enregistrer les modifications' : 'Publier l\'émission'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type de support <span className="text-danger">*</span></label>
              <select
                {...register('type')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              >
                <option value="EMISSION_TV">Émission Télévisée</option>
                <option value="EMISSION_RADIO">Émission Radio</option>
              </select>
            </div>
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
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre de l'émission <span className="text-danger">*</span></label>
            <input
              {...register('titre')}
              placeholder="Ex: La Voix de l'Évangile - Édition Spéciale"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
            {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <PlaySquare size={10} /> Lien YouTube (Optionnel si fichier)
              </label>
              <input
                {...register('lienYoutube')}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.lienYoutube && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.lienYoutube.message}</p>}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-accent-200 flex-1"></div>
              <span className="text-xs font-bold text-accent-400 uppercase">OU</span>
              <div className="h-px bg-accent-200 flex-1"></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                Fichier Multimédia (Audio / Vidéo)
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${uploadFile ? 'border-success bg-emerald-50' : 'border-accent-200 bg-accent-50 group-hover:border-primary-300 group-hover:bg-primary-50/30'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${uploadFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-accent-400'}`}>
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-accent-800">
                      {uploadFile ? uploadFile.name : (editing ? 'Modifier le fichier existant (optionnel)' : 'Cliquez ou glissez un fichier audio/vidéo')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description / Thèmes abordés</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Résumé de l'émission, invités, points clés..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
