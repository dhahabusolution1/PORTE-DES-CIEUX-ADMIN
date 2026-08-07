import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, Calendar, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router';

import { GET_SESSIONS } from '@/graphql/queries/sessions.queries';
import {
  CREER_SESSION,
  MODIFIER_SESSION,
  SUPPRIMER_SESSION,
} from '@/graphql/mutations/sessions.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProcessing } from '@/hooks/useProcessing';
import { formatDate } from '@/utils/formatDate';

const TYPE_LABELS: Record<string, string> = {
  BAPTEME: 'Session de Baptême',
  ENREGISTREMENT_MEMBRE: 'Enregistrement de Membre',
};

const sessionSchema = z.object({
  type: z.enum(['BAPTEME', 'ENREGISTREMENT_MEMBRE']),
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  estActif: z.boolean(),
});

type FormValues = z.infer<typeof sessionSchema>;

interface SessionsData {
  getSessions: any[];
}

export function SessionsPage() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('');
  const [toDelete, setToDelete] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<SessionsData>(GET_SESSIONS, {
    variables: { 
      type: filterType || undefined
    },
    fetchPolicy: 'cache-and-network',
  });

  const [creerSession] = useMutation(CREER_SESSION);
  const [modifierSession] = useMutation(MODIFIER_SESSION);
  const [supprimerSession] = useMutation(SUPPRIMER_SESSION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      type: 'BAPTEME',
      estActif: true,
    },
  });

  const openForm = (session?: any) => {
    if (session) {
      setEditing(session);
      reset({
        type: session.type,
        titre: session.titre,
        description: session.description || '',
        dateDebut: session.dateDebut ? session.dateDebut.split('T')[0] : '',
        dateFin: session.dateFin ? session.dateFin.split('T')[0] : '',
        estActif: session.estActif,
      });
    } else {
      setEditing(null);
      reset({
        type: 'BAPTEME',
        titre: '',
        description: '',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        estActif: true,
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    await run('Enregistrement de la session...', async () => {
      try {
        const input = {
          ...values,
          dateDebut: new Date(values.dateDebut).toISOString(),
          dateFin: new Date(values.dateFin).toISOString(),
        };

        if (editing) {
          await modifierSession({ variables: { id: editing.id, input } });
          toast.success('Session modifiée');
        } else {
          await creerSession({ variables: { input } });
          toast.success('Session créée');
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
        await supprimerSession({ variables: { id: toDelete.id } });
        toast.success('Session supprimée');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'titre',
      header: 'Session',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary-500" />
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
      header: 'Période',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-700">
            <Calendar size={12} className="text-primary-500" />
            {formatDate(row.original.dateDebut)} - {formatDate(row.original.dateFin)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'estActif',
      header: 'Statut',
      cell: ({ row }) => (
        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
          row.original.estActif ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {row.original.estActif ? 'Actif' : 'Inactif'}
        </span>
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
            title="Voir les inscrits"
            onClick={() => navigate(`/sessions/${row.original.id}/inscriptions`)}
          >
            <Users size={14} className="mr-1.5" />
            Inscrits
          </Button>
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Formulaires & Sessions</h1>
          <p className="text-sm text-accent-400 font-medium italic">Gérez l'ouverture des formulaires d'inscriptions</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Nouvelle session
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-surface p-3 border border-accent-200 rounded-lg">
        <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest ml-1 whitespace-nowrap">Filtrer par type :</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-md outline-none focus:border-primary-400 cursor-pointer"
        >
          <option value="">Toutes les sessions</option>
          <option value="BAPTEME">Baptêmes</option>
          <option value="ENREGISTREMENT_MEMBRE">Enregistrement Membres</option>
        </select>
      </div>

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getSessions ?? []}
          isLoading={loading}
          emptyMessage="Aucune session trouvée."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cette session"
        message={`Voulez-vous supprimer la session « ${toDelete?.titre} » ? Toutes les inscriptions associées seront également supprimées.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier la session" : 'Nouvelle session'}
        maxWidth="xl"
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
              {editing ? 'Enregistrer les modifications' : 'Créer la session'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type de session</label>
              <select
                {...register('type')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="BAPTEME">Baptême</option>
                <option value="ENREGISTREMENT_MEMBRE">Enregistrement de membre</option>
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col justify-center pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('estActif')}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-bold text-accent-800">Session active</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre <span className="text-danger">*</span></label>
            <input
              {...register('titre')}
              placeholder="Ex: Campagne d'enregistrement 2026"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500"
            />
            {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Description affichée sur l'application mobile..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Date Début <span className="text-danger">*</span></label>
              <input
                type="date"
                {...register('dateDebut')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500"
              />
              {errors.dateDebut && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.dateDebut.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Date Fin <span className="text-danger">*</span></label>
              <input
                type="date"
                {...register('dateFin')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500"
              />
              {errors.dateFin && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.dateFin.message}</p>}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
