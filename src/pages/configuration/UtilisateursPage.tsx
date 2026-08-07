import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Trash2, ChevronDown, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { GET_UTILISATEURS } from '@/graphql/queries/utilisateurs.queries';
import { CHANGER_ROLE_UTILISATEUR, SUPPRIMER_UTILISATEUR, CREER_COMPTE_ADMIN } from '@/graphql/mutations/configuration.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useProcessing } from '@/hooks/useProcessing';
import type { User as UserType, Role } from '@/types';

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'FIDELE'];
const LIMIT = 20;

const adminSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  postnom: z.string().optional(),
  prenom: z.string().optional(),
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN']),
});
type AdminForm = z.infer<typeof adminSchema>;

interface UsersData {
  getUtilisateurs: {
    items: UserType[];
    pagination: { total: number; limit: number; offset: number };
  };
}

function RoleDropdown({ user, onChanged }: { user: UserType; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const { run } = useProcessing();
  const [changerRole] = useMutation(CHANGER_ROLE_UTILISATEUR);

  const change = async (role: Role) => {
    setOpen(false);
    if (role === user.role) return;
    await run('Modification du rôle…', async () => {
      await changerRole({ variables: { id: user.id, role } });
      toast.success('Rôle modifié avec succès');
      onChanged();
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs cursor-pointer"
      >
        <StatusBadge value={user.role} />
        <ChevronDown size={11} className="text-accent-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-20 bg-white border border-accent-200 rounded min-w-[120px]">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => void change(r)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent-50 cursor-pointer"
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function UtilisateursPage() {
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<UserType | null>(null);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<Role | ''>('');
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<UsersData>(GET_UTILISATEURS, {
    variables: { search: search || undefined, role: filterRole || undefined, limit: LIMIT, offset },
    fetchPolicy: 'cache-and-network',
  });

  const [supprimerUtilisateur] = useMutation(SUPPRIMER_UTILISATEUR);
  const [creerCompteAdmin] = useMutation(CREER_COMPTE_ADMIN);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: { role: 'ADMIN' },
  });

  const users = data?.getUtilisateurs.items ?? [];
  const pagination = data?.getUtilisateurs.pagination;

  const handleSupprimer = async () => {
    if (!toDelete) return;
    await run("Suppression de l'utilisateur…", async () => {
      await supprimerUtilisateur({ variables: { id: toDelete.id } });
      toast.success('Utilisateur supprimé');
      setToDelete(null);
      void refetch();
    });
  };

  const onSubmit = async (values: AdminForm) => {
    await run("Création du compte administrateur…", async () => {
      await creerCompteAdmin({ variables: values });
      toast.success('Compte administrateur créé avec succès');
      setShowForm(false);
      reset();
      void refetch();
    });
  };

  const columns: ColumnDef<UserType>[] = [
    {
      header: 'Utilisateur',
      id: 'user',
      cell: ({ row }) => {
        const u = row.original;
        const fullName = [u.nom, u.postnom, u.prenom].filter(Boolean).join(' ');
        return (
          <div className="flex items-center gap-2">
            {u.photoUrl ? (
              <img src={u.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center">
                <User size={13} className="text-accent-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-accent-800">{fullName}</p>
              {u.email && <p className="text-xs text-accent-400">{u.email}</p>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'WhatsApp',
      accessorKey: 'numeroWhatsapp',
      cell: ({ row }) => (
        <span className="text-xs text-accent-500">{row.original.numeroWhatsapp ?? '—'}</span>
      ),
    },
    {
      header: 'Rôle',
      id: 'role',
      cell: ({ row }) => (
        <RoleDropdown user={row.original} onChanged={() => void refetch()} />
      ),
    },
    {
      header: 'Inscrit le',
      id: 'date',
      cell: ({ row }) => (
        <span className="text-xs text-accent-400">
          {new Date(row.original.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <button
          onClick={() => setToDelete(row.original)}
          className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded cursor-pointer hover:bg-red-50 flex items-center gap-1"
        >
          <Trash2 size={11} />
          Supprimer
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-accent-900">Gestion des Utilisateurs</h2>
          <p className="text-xs text-accent-400 mt-0.5">
            {pagination ? `${pagination.total} utilisateur(s) au total` : 'Comptes de l\'application'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700"
        >
          <Plus size={14} />
          Créer un admin
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          placeholder="Rechercher par nom ou WhatsApp…"
          className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none focus:border-primary-400 w-64"
        />
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value as Role | ''); setOffset(0); }}
          className="text-xs px-3 py-1.5 border border-accent-200 rounded outline-none cursor-pointer bg-white text-accent-700 focus:border-primary-400"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        total={pagination?.total}
        limit={LIMIT}
        offset={offset}
        onPageChange={setOffset}
      />

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cet utilisateur"
        message={`Voulez-vous supprimer ${[toDelete?.nom, toDelete?.postnom].filter(Boolean).join(' ')} ? Cette action est irréversible.`}
        confirmLabel="Supprimer cet utilisateur"
        cancelLabel="Annuler"
        danger
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
      />

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-accent-200">
              <h3 className="text-sm font-semibold text-accent-900">Créer un compte administrateur</h3>
              <button onClick={() => setShowForm(false)} className="text-accent-400 cursor-pointer hover:text-accent-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('nom')}
                    placeholder="Nom de famille"
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                  {errors.nom && <p className="text-xs text-red-500 mt-0.5">{errors.nom.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent-700 mb-1">Postnom</label>
                  <input
                    {...register('postnom')}
                    className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">Prénom</label>
                <input
                  {...register('prenom')}
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@portedescieux.org"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('motDePasse')}
                  type="password"
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none focus:border-primary-400"
                />
                {errors.motDePasse && <p className="text-xs text-red-500 mt-0.5">{errors.motDePasse.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-accent-700 mb-1">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role')}
                  className="w-full text-sm px-3 py-2 border border-accent-200 rounded outline-none cursor-pointer bg-white focus:border-primary-400"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm px-3 py-1.5 border border-accent-200 text-accent-600 rounded cursor-pointer hover:bg-accent-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded cursor-pointer hover:bg-primary-700"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
