import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Plus, Trash2, Pencil, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { GET_CITATIONS } from '@/graphql/queries/contenu.queries';
import {
  AJOUTER_CITATION,
  MODIFIER_CITATION,
  SUPPRIMER_CITATION,
} from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';
import type { Citation } from '@/types';

const LIMIT = 12;

interface CitationsData {
  getCitations: {
    items: Citation[];
    totalCount: number;
  };
}

export function CitationsPage() {
  const [offset, setOffset] = useState(0);
  const [toDelete, setToDelete] = useState<Citation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Citation | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<CitationsData>(GET_CITATIONS, {
    variables: { limit: LIMIT, offset },
    fetchPolicy: 'cache-and-network',
  });

  const [ajouterCitation] = useMutation(AJOUTER_CITATION);
  const [modifierCitation] = useMutation(MODIFIER_CITATION);
  const [supprimerCitation] = useMutation(SUPPRIMER_CITATION);

  const openForm = () => {
    setEditTarget(null);
    setImageUrl(null);
    setCloudinaryPublicId(null);
    setShowForm(true);
  };

  const openEdit = (citation: Citation) => {
    setEditTarget(citation);
    setImageUrl(citation.imageUrl);
    setCloudinaryPublicId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const onImageUploaded = (url: string, publicId?: string) => {
    setImageUrl(url);
    if (publicId) setCloudinaryPublicId(publicId);
  };

  const onSubmit = async () => {
    if (!imageUrl) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setIsSaving(true);
    await run(editTarget ? 'Mise à jour de la citation…' : 'Enregistrement de la citation…', async () => {
      try {
        if (editTarget) {
          await modifierCitation({
            variables: {
              id: editTarget.id,
              imageUrl,
              ...(cloudinaryPublicId ? { cloudinaryPublicId } : {}),
            },
          });
          toast.success('Citation modifiée');
        } else {
          if (!cloudinaryPublicId) {
            toast.error('Veuillez uploader une image');
            return;
          }
          await ajouterCitation({
            variables: {
              imageUrl,
              cloudinaryPublicId,
            },
          });
          toast.success('Citation ajoutée');
        }
        closeForm();
        void refetch();
      } catch {
        toast.error('Erreur lors de l\'enregistrement');
      }
    });
    setIsSaving(false);
  };

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run(async () => {
      try {
        await supprimerCitation({ variables: { id: toDelete.id } });
        toast.success('Citation supprimée');
        setToDelete(null);
        void refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<Citation>[] = [
    {
      accessorKey: 'imageUrl',
      header: 'Image',
      cell: ({ row }) => (
        <button
          type="button"
          className="w-28 h-28 rounded-lg bg-accent-100 overflow-hidden border border-accent-200 cursor-zoom-in"
          onClick={() => window.open(row.original.imageUrl, '_blank')}
          title="Ouvrir en grand"
        >
          <img
            src={row.original.imageUrl}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
            alt="Citation"
          />
        </button>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date d\'ajout',
      cell: ({ row }) => (
        <div className="text-[11px] font-bold text-accent-500">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            title="Modifier l'image"
            onClick={() => openEdit(row.original)}
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Citations Spirituelles</h1>
          <p className="text-sm text-accent-400 font-medium italic">Galerie d'images partagées sur l'application mobile</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={openForm}
        >
          Nouvelle citation
        </Button>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getCitations.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getCitations.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucune citation trouvée."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette citation"
        message="Voulez-vous supprimer cette citation ? L'image sera retirée de la galerie."
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? 'Modifier l\'image' : 'Ajouter une citation'}
        maxWidth="lg"
        footer={(
          <>
            <Button variant="ghost" onClick={closeForm} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => void onSubmit()}
              isLoading={isSaving}
            >
              {editTarget ? 'Enregistrer' : 'Publier'}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
              <ImageIcon size={10} /> Image de la citation <span className="text-danger">*</span>
            </label>
            <ImageUploader
              value={imageUrl ?? undefined}
              onChange={onImageUploaded}
              folder="citations"
            />
            <p className="text-[11px] text-accent-400">
              Le texte et l'auteur sont intégrés directement dans l'image. Formats recommandés : JPG ou PNG, format carré ou paysage.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
