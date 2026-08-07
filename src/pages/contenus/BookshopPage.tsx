import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Pencil, Trash2, Package, Tag, User, Phone, CheckCircle2, XCircle, ImageIcon, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/ui/SearchInput';
import { GET_ARTICLES_ADMIN } from '@/graphql/queries/contenu.queries';
import { CREER_ARTICLE, MODIFIER_ARTICLE, SUPPRIMER_ARTICLE, SIGNALER_VENTE } from '@/graphql/mutations/contenu.mutations';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useProcessing } from '@/hooks/useProcessing';
import type { ArticleBookshop } from '@/types';

const LIMIT = 10;

const articleSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  auteur: z.string().optional(),
  prix: z.number().min(0, 'Prix requis'),
  devise: z.enum(['USD', 'CDF']),
  description: z.string().optional(),
  estDisponible: z.boolean(),
  stock: z.number().min(0),
  categorie: z.enum(['EGLISE', 'PARTENAIRE']),
  typeArticle: z.enum(['LIVRE', 'VETEMENT', 'ACCESSOIRE', 'AUTRE']),
  numeroWhatsappAchat: z.string().optional(),
});

type FormValues = z.infer<typeof articleSchema>;

interface ArticlesData {
  getArticlesAdmin: {
    items: ArticleBookshop[];
    totalCount: number;
  }
}

export function BookshopPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [toDelete, setToDelete] = useState<ArticleBookshop | null>(null);
  const [toSell, setToSell] = useState<ArticleBookshop | null>(null);
  const [quantiteVente, setQuantiteVente] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ArticleBookshop | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPublicId, setCoverPublicId] = useState<string | null>(null);

  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<ArticlesData>(GET_ARTICLES_ADMIN, {
    variables: { search: debouncedSearch || undefined, limit: LIMIT, offset },
    fetchPolicy: 'cache-and-network',
  });

  const [creerArticle] = useMutation(CREER_ARTICLE);
  const [modifierArticle] = useMutation(MODIFIER_ARTICLE);
  const [supprimerArticle] = useMutation(SUPPRIMER_ARTICLE);
  const [signalerVente] = useMutation(SIGNALER_VENTE);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      estDisponible: true,
      prix: 0,
      devise: 'USD',
      stock: 0,
      categorie: 'EGLISE',
      typeArticle: 'LIVRE',
    },
  });

  const openForm = (article?: ArticleBookshop) => {
    if (article) {
      setEditing(article);
      setCoverUrl(article.couvertureUrl || null);
      setCoverPublicId(null);
      reset({
        titre: article.titre,
        auteur: article.auteur || '',
        prix: typeof article.prix === 'string' ? parseFloat(article.prix) : Number(article.prix),
        devise: article.devise,
        description: article.description || '',
        estDisponible: article.estDisponible,
        stock: article.stock,
        categorie: article.categorie,
        typeArticle: article.typeArticle,
      });

      try {
        const rawUrl = article.whatsappAchatUrl;
        if (rawUrl) {
          const url = new URL(rawUrl);
          const phone = url.searchParams.get('phone') ?? '';
          setValue('numeroWhatsappAchat', phone);
        }
      } catch {
        setValue('numeroWhatsappAchat', '');
      }
    } else {
      setEditing(null);
      setCoverUrl(null);
      setCoverPublicId(null);
      reset({
        titre: '',
        auteur: '',
        prix: 0,
        devise: 'USD',
        description: '',
        estDisponible: true,
        stock: 0,
        categorie: 'EGLISE',
        typeArticle: 'LIVRE',
        numeroWhatsappAchat: '',
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = async (values: FormValues) => {
    await run('Enregistrement de l\'article...', async () => {
      try {
        const input = {
          ...values,
          numeroWhatsappAchat: values.numeroWhatsappAchat || undefined,
          couvertureUrl: coverUrl || undefined,
          cloudinaryPublicId: coverPublicId || undefined,
        };

        if (editing) {
          await modifierArticle({ variables: { id: editing.id, ...input } });
          toast.success('Article modifié');
        } else {
          await creerArticle({ variables: input });
          toast.success('Article ajouté');
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
        await supprimerArticle({ variables: { id: toDelete.id } });
        toast.success('Article supprimé');
        setToDelete(null);
        refetch();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const handleSignalerVente = async () => {
    if (!toSell) return;
    await run('Enregistrement de la vente...', async () => {
      try {
        await signalerVente({ variables: { id: toSell.id, quantite: quantiteVente } });
        toast.success('Vente enregistrée avec succès');
        setToSell(null);
        setQuantiteVente(1);
        refetch();
      } catch (e: any) {
        toast.error(e.message || 'Erreur lors de la vente');
      }
    });
  };

  const columns: ColumnDef<ArticleBookshop>[] = [
    {
      accessorKey: 'titre',
      header: 'Article / Auteur',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 rounded bg-accent-100 flex items-center justify-center shrink-0 overflow-hidden border border-accent-200 shadow-sm">
            {row.original.couvertureUrl ? (
              <img src={row.original.couvertureUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <Package className="w-5 h-5 text-accent-300" />
            )}
          </div>
          <div>
            <div className="font-black text-accent-900 tracking-tight leading-tight">{row.original.titre}</div>
            <div className="text-[10px] font-bold text-accent-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              {row.original.typeArticle === 'LIVRE' ? <User size={10} /> : <Tag size={10} />}
              {row.original.auteur || row.original.typeArticle}
            </div>
            <div className="text-[9px] font-bold text-primary-500 uppercase mt-0.5 border border-primary-200 bg-primary-50 px-1 inline-block rounded">
              {row.original.categorie}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'prix',
      header: 'Prix',
      cell: ({ row }) => (
        <div className="font-bold text-primary-600 font-sans">
          {Number(row.original.prix).toLocaleString('fr-CD')} <span className="text-[10px] text-accent-400">{row.original.devise}</span>
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock / Ventes',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-accent-800 text-sm">{row.original.stock} <span className="text-[10px] font-normal text-accent-400 uppercase">en stock</span></div>
          <div className="text-xs text-accent-500">{row.original.ventes} <span className="text-[10px] text-accent-400">vendus</span></div>
        </div>
      ),
    },
    {
      accessorKey: 'estDisponible',
      header: 'Disponibilité',
      cell: ({ row }) => (
        row.original.estDisponible ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <CheckCircle2 size={10} />
            <span className="text-[10px] font-bold uppercase tracking-widest">En Ligne</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">
            <XCircle size={10} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Caché</span>
          </div>
        )
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
            title="Signaler une vente"
            onClick={() => setToSell(row.original)}
            disabled={row.original.stock <= 0}
          >
            <ShoppingCart size={14} className={row.original.stock > 0 ? "text-emerald-600" : "text-accent-300"} />
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
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Boutique (Bookshop)</h1>
          <p className="text-sm text-accent-400 font-medium italic">Gérez le catalogue des articles, livres et ouvrages</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => openForm()}
        >
          Ajouter un article
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setOffset(0); }}
        placeholder="Rechercher par titre ou auteur…"
      />

      <div className="bg-surface rounded-lg border border-accent-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.getArticlesAdmin.items ?? []}
          isLoading={loading}
          limit={LIMIT}
          offset={offset}
          total={data?.getArticlesAdmin.totalCount ?? 0}
          onPageChange={setOffset}
          emptyMessage="Aucun article dans la boutique."
        />
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Supprimer cet article"
        message={`Voulez-vous supprimer « ${toDelete?.titre} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={() => void handleSupprimer()}
        onCancel={() => setToDelete(null)}
        danger
      />

      <Modal
        isOpen={!!toSell}
        onClose={() => setToSell(null)}
        title="Signaler une vente"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setToSell(null)}>Annuler</Button>
            <Button variant="primary" onClick={() => void handleSignalerVente()}>Enregistrer</Button>
          </>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-accent-700">Combien d'exemplaires de <strong>{toSell?.titre}</strong> ont été vendus ?</p>
          <div>
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Quantité</label>
            <input 
              type="number" 
              min={1} 
              max={toSell?.stock || 1} 
              value={quantiteVente} 
              onChange={(e) => setQuantiteVente(parseInt(e.target.value) || 1)}
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans font-bold"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? "Modifier l'article" : 'Ajouter un nouvel article'}
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
              {editing ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Titre de l'article <span className="text-danger">*</span></label>
              <input
                {...register('titre')}
                placeholder="Ex: La Puissance de la Prière"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.titre && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.titre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={10} /> Auteur / Écrivain
              </label>
              <input
                {...register('auteur')}
                placeholder="Ex: Pasteur Gael (Laisser vide si vêtement)"
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
              {errors.auteur && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.auteur.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Type d'article <span className="text-danger">*</span></label>
              <select
                {...register('typeArticle')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans font-bold"
              >
                <option value="LIVRE">Livre</option>
                <option value="VETEMENT">Vêtement</option>
                <option value="ACCESSOIRE">Accessoire</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Catégorie <span className="text-danger">*</span></label>
              <select
                {...register('categorie')}
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans font-bold"
              >
                <option value="EGLISE">Église</option>
                <option value="PARTENAIRE">Partenaire</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Stock Initial <span className="text-danger">*</span></label>
              <Controller
                name="stock"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    min={0}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans font-bold"
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                Prix de vente <span className="text-danger">*</span>
              </label>
              <div className="flex rounded-lg overflow-hidden border border-accent-200">
                <Controller
                  name="prix"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-4 py-2.5 bg-accent-50 border-none outline-none focus:ring-0 font-sans font-bold"
                    />
                  )}
                />
                <select
                  {...register('devise')}
                  className="bg-accent-100 border-l border-accent-200 px-3 font-bold text-sm text-accent-700 outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
              {errors.prix && <p className="text-[10px] text-danger font-bold mt-1 uppercase">{errors.prix.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone size={10} /> Num. WhatsApp
              </label>
              <input
                {...register('numeroWhatsappAchat')}
                placeholder="+243..."
                className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Décrivez brièvement l'article..."
              className="w-full text-sm px-4 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-500 resize-none transition-all font-sans"
            />
          </div>

          <div className="border-t border-accent-100 pt-5 mt-2">
            <label className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <ImageIcon size={10} /> Image de l'article
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <ImageUploader
                value={coverUrl ?? undefined}
                onChange={(url, pid) => {
                  setCoverUrl(url);
                  if (pid) setCoverPublicId(pid);
                }}
              />
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-accent-50 p-3 rounded-lg border border-accent-200">
                  <Controller
                    name="estDisponible"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="estDisponible"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-accent-300 rounded cursor-pointer"
                      />
                    )}
                  />
                  <label htmlFor="estDisponible" className="text-xs font-bold text-accent-700 cursor-pointer select-none">
                    Article visible dans l'application
                  </label>
                </div>
                <p className="text-[10px] text-accent-400 italic leading-tight">
                  Un article caché ne sera pas affiché dans le catalogue public de l'application mobile.
                </p>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
