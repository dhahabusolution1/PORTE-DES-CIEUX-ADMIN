import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, ImageIcon, Calendar, Clock, MapPin, PlaySquare } from 'lucide-react';
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

const STATUT_OPTIONS = [
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'PUBLIE', label: 'Publi�' },
  { value: 'ANNULE', label: 'Annul�' },
  { value: 'TERMINE', label: 'Termin�' },
];

const programmeSchema = z.object({
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

type ProgrammeForm = z.infer<typeof programmeSchema>;

interface EvenementsData {
  getEvenements: {
    items: Evenement[];
    totalCount: number;
  }
}

export function ProgrammesCultePage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [toDelete, setToDelete] = useState<Evenement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Evenement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<EvenementsData>(GET_EVENEMENTS, {
    variables: { 
      search: debouncedSearch || undefined,
      type: 'PROGRAMME_CULTE',
      limit: LIMIT,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [creerProgramme] = useMutation(CREER_EVENEMENT);
  const [modifierProgramme] = useMutation(MODIFIER_EVENEMENT);
  const [supprimerProgramme] = useMutation(SUPPRIMER_EVENEMENT);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgrammeForm>({
    resolver: zodResolver(programmeSchema),
    defaultValues: {
      statut: 'BROUILLON',
    },
  });

  const openForm = (prog?: Evenement) => {
    if (prog) {
      setEditing(prog);
      setImageUrl(prog.imageUrl || null);
      reset({
        titre: prog.titre,
        description: prog.description || '',
        dateDebut: prog.dateDebut ? prog.dateDebut.split('T')[0] : '',
        dateFin: prog.dateFin ? prog.dateFin.split('T')[0] : '',
        heure: prog.heure || '',
        lieu: prog.lieu || '',
        imageExterneUrl: prog.imageExterneUrl || '',
        organisateur: prog.organisateur || '',
        lienYoutube: prog.lienYoutube || '',
        statut: prog.statut as ProgrammeForm['statut'],
      });
    } else {
      setEditing(null);
      setImageUrl(null);
      reset({
        titre: '',
        description: '',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        heure: '',
        lieu: '',
        imageExterneUrl: '',
        organisateur: 'Porte des Cieux',
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

  const onSubmit = async (values: ProgrammeForm) => {
    await run('Enregistrement du programme...', async () => {
      try {
        const input = {
          ...values,
          type: 'PROGRAMME_CULTE',
          imageUrl: imageUrl || undefined,
          dateDebut: new Date(values.dateDebut).toISOString(),
          dateFin: values.dateFin ? new Date(values.dateFin).toISOString() : undefined,
        };

        if (editing) {
          await modifierProgramme({ variables: { id: editing.id, input } });
          toast.success('Programme modifi�');
        } else {
          await creerProgramme({ variables: { input } });
          toast.success('Programme cr��');
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
        await supprimerProgramme({ variables: { id: toDelete.id } });
        toast.success('Programme supprim�');
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
      header: 'Culte / Programme',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden border border-primary-100">
            {row.original.imageUrl || row.original.imageExterneUrl ? (
              <img 
                src={row.original.imageUrl || row.original.imageExterneUrl || ''} 
                className="w-full h-full object-cover" 
                alt=""
              />
            ) : (
              <PlaySquare className="w-5 h-5 text-primary-400" />
            )}
          </div>
          <div>
            <div className="font-black text-accent-900 tracking-tight">{row.original.titre}</div>
            <div className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">
              Programmation Culte
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'dateDebut',
      header: 'Date & Horaire',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-700">
            <Calendar size={12} className="text-primary-500" />
            {formatDate(row.original.dateDebut)}
            {row.original.dateFin && ` - ${formatDate(row.original.dateFin)}`}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-accent-400 font-medium uppercase tracking-tight">
            <Clock size={10} />
            {row.original.heure || 'Heure non pr�cis�e'}
          </div>
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Programmes de Culte</h1>
          <p className="text-sm text-accent-400 font-medium italic">G�rez la diffusion et la planification de vos cultes en ligne</p>
        </div>
        <Button 
          variant="dark" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Ajouter un programme
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setOffset(0); }}
        placeholder="Rechercher par titre, lieu, organisateur�"
      />

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getEvenements.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getEvenements.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucun programme de culte planifi�."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer ce programme"
        message={`Voulez-vous supprimer le programme � ${toDelete?.titre} � ? Cette action est irr�versible.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier le programme" : 'Nouveau programme de culte'}
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
              {editing ? 'Enregistrer les modifications' : 'Cr�er le programme'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre du culte <span className="text-danger">*</span></label>
            <input
              {...register('titre')}
              placeholder="Ex: Culte de Dominical - Th�me: La puissance de la foi"
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
            {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Date <span className="text-danger">*</span>
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
                <Clock size={10} /> Heure de d�but
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
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Statut</label>
              <select
                {...register('statut')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 cursor-pointer transition-all"
              >
                {STATUT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={10} /> Lieu
              </label>
              <input
                {...register('lieu')}
                placeholder="Ex: Temple de la Gloire"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
              <PlaySquare size={10} /> Lien PlaySquare (Direct ou Rediffusion)
            </label>
            <input
              {...register('lienYoutube')}
              placeholder="https://youtu.be/..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description / D�tails</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Orateur, programme d�taill�..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>

          <div className="border-t border-accent-100 pt-5 mt-2">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <ImageIcon size={10} /> Visuel du programme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <ImageUploader
                value={imageUrl ?? undefined}
                onChange={setImageUrl}
              />
              <div className="space-y-1.5 text-[10px] text-accent-500 italic">
                <p>L'image sera utilis�e comme miniature sur l'application mobile.</p>
                <p className="mt-2 text-accent-400">Si non pr�cis�e, l'ic�ne par d�faut sera utilis�e.</p>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
