import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Upload, Trash2, Download, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';
import { GET_SHORT_VIDEOS } from '@/graphql/queries/contenu.queries';
import { CREER_SHORT_VIDEO, SUPPRIMER_SHORT_VIDEO } from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/utils/formatDate';
import type { ShortVideo } from '@/types';

const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL as string;
const LIMIT = 10;

interface ShortVideosData { 
  getShortVideos: {
    items: ShortVideo[];
    totalCount: number;
  }
}

export function ShortsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [toDelete, setToDelete] = useState<ShortVideo | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { run } = useProcessing();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, loading, refetch } = useQuery<ShortVideosData>(GET_SHORT_VIDEOS, {
    variables: { search: debouncedSearch || undefined, limit: LIMIT, offset },
    fetchPolicy: 'cache-and-network',
  });

  const [supprimerShort] = useMutation(SUPPRIMER_SHORT_VIDEO);
  const [creerShortVideo] = useMutation(CREER_SHORT_VIDEO);

  const handleUpload = async () => {
    if (!uploadTitle || !uploadFile) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folder', 'shorts');

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const { url, publicId } = await response.json() as { url: string; publicId: string };

      await creerShortVideo({
        variables: {
          titre: uploadTitle.trim(),
          videoUrl: url,
          cloudinaryPublicId: publicId,
        },
      });

      toast.success('Vidéo uploadée avec succès');
      setShowUpload(false);
      setUploadTitle('');
      setUploadFile(null);
      setOffset(0); // Retour à la première page pour voir le nouvel ajout
      refetch();
    } catch (err) {
      toast.error((err as Error).message || 'Échec de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run('Suppression de la vidéo...', async () => {
      try {
        await supprimerShort({ variables: { id: toDelete.id } });
        toast.success('Vidéo supprimée');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<ShortVideo>[] = [
    {
      id: 'preview',
      header: 'Aperçu',
      cell: ({ row }) => (
        <div className="w-16 h-24 rounded bg-accent-900 overflow-hidden relative group border border-accent-200">
          <video 
            src={row.original.videoUrl} 
            poster={row.original.miniatureUrl || undefined}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            muted
            onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
            onMouseOut={(e) => {
              const v = e.target as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:hidden">
            <Video size={16} className="text-white/50" />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'titre',
      header: 'Titre & Informations',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-black text-accent-900 text-sm tracking-tight">{row.original.titre}</div>
          <div className="text-[10px] text-accent-400 font-bold uppercase tracking-widest">
            ID: {row.original.id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Publication',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-accent-700">{formatDate(row.original.createdAt)}</div>
          <div className="text-[10px] text-accent-400 font-medium">Ajouté par le système</div>
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
            title="Visionner / Télécharger"
            onClick={() => window.open(row.original.videoUrl, '_blank')}
          >
            <Download size={14} />
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            iconOnly 
            title="Supprimer définitivement"
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Vidéos courtes (Shorts)</h1>
          <p className="text-sm text-accent-400 font-medium italic">Gestion des contenus verticaux pour l'application mobile</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Upload size={18} />}
          onClick={() => setShowUpload(true)}
        >
          Nouvelle vidéo
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setOffset(0); }}
        placeholder="Rechercher par titre ou description…"
      />

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={data?.getShortVideos.items ?? []} 
          isLoading={loading}
          total={data?.getShortVideos.totalCount ?? 0}
          limit={LIMIT}
          offset={offset}
          onPageChange={setOffset}
          emptyMessage="Aucune vidéo courte trouvée dans la bibliothèque."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette vidéo"
        message={`Voulez-vous supprimer « ${toDelete?.titre} » ? Cette action supprimera définitivement la vidéo du serveur.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showUpload}
        onClose={() => !isUploading && setShowUpload(false)}
        title="Uploader un Short"
        maxWidth="md"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setShowUpload(false)} disabled={isUploading}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={() => void handleUpload()} 
              isLoading={isUploading}
            >
              Démarrer l'envoi
            </Button>
          </>
        )}
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">
              Titre de la vidéo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Moment de louange incroyable"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">
              Fichier Vidéo (MP4, MOV...) <span className="text-danger">*</span>
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${uploadFile ? 'border-success bg-emerald-50' : 'border-accent-200 bg-accent-50 group-hover:border-primary-300 group-hover:bg-primary-50/30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${uploadFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-accent-400'}`}>
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-accent-800">
                    {uploadFile ? uploadFile.name : 'Cliquez ou glissez une vidéo'}
                  </p>
                  <p className="text-[10px] text-accent-400 mt-1 uppercase font-bold tracking-tight">
                    {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} Mo` : 'Format vertical recommandé'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
