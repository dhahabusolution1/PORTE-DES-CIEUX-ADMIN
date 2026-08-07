import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Save, MessageCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

import { GET_CONFIGURATION_DONS } from '@/graphql/queries/configuration.queries';
import { MODIFIER_CONFIG_DONS } from '@/graphql/mutations/configuration.mutations';
import { useProcessing } from '@/hooks/useProcessing';
import { Button } from '@/components/ui/Button';

const coordSchema = z.object({
  libelle: z.string().min(1, 'Libellé requis'),
  valeur: z.string().min(1, 'Valeur requise'),
  detail: z.string().optional(),
});

const schema = z.object({
  numeroWhatsappContact: z.string().optional(),
  coordonnees: z.array(coordSchema),
});
type DonsForm = z.infer<typeof schema>;

interface CoordonneesDon { id: string; libelle: string; valeur: string; detail?: string }
interface ConfigDons { numeroWhatsappContact?: string; coordonnees: CoordonneesDon[] }
interface DonsData { getConfigurationDons: ConfigDons }

export function ConfigDonsPage() {
  const { run } = useProcessing();

  const { data: donsData, loading, refetch } = useQuery<DonsData>(GET_CONFIGURATION_DONS, { fetchPolicy: 'cache-and-network' });
  const [modifierConfigDons] = useMutation(MODIFIER_CONFIG_DONS);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<DonsForm>({
    resolver: zodResolver(schema),
    defaultValues: { numeroWhatsappContact: '', coordonnees: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'coordonnees' });

  useEffect(() => {
    if (donsData) {
      const cfg = donsData.getConfigurationDons;
      reset({
        numeroWhatsappContact: cfg.numeroWhatsappContact ?? '',
        coordonnees: cfg.coordonnees.map((c) => ({
          libelle: c.libelle,
          valeur: c.valeur,
          detail: c.detail ?? '',
        })),
      });
    }
  }, [donsData, reset]);

  const onSubmit = async (values: DonsForm) => {
    await run('Sauvegarde de la configuration des dons…', async () => {
      await modifierConfigDons({
        variables: {
          numeroWhatsappContact: values.numeroWhatsappContact || null,
          coordonnees: values.coordonnees.map((c) => ({
            libelle: c.libelle,
            valeur: c.valeur,
            detail: c.detail || null,
          })),
        },
      });
      toast.success('Configuration des dons sauvegardée');
      void refetch();
    });
  };

  if (loading && !donsData) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-accent-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Configuration des Dons</h1>
          <p className="text-sm text-accent-400 font-medium italic mt-0.5">
            Coordonnées bancaires et mobile money affichées aux fidèles dans l'app
          </p>
        </div>
        <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
          Sauvegarder
        </Button>
      </div>

      {/* Section WhatsApp */}
      <div className="bg-white border border-accent-200 rounded-xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-accent-900">Contact WhatsApp Dons</h2>
            <p className="text-xs text-accent-400">Numéro affiché aux fidèles pour donner via WhatsApp</p>
          </div>
        </div>
        <div className="flex">
          <span className="flex items-center px-3 h-9.5 bg-accent-100 border border-r-0 border-accent-200 rounded-l-lg text-xs text-accent-500 font-bold shrink-0">
            WhatsApp
          </span>
          <input
            {...register('numeroWhatsappContact')}
            placeholder="+243 97X XXX XXX"
            className="flex-1 text-sm px-3 h-9.5 bg-accent-50 border border-accent-200 rounded-r-lg outline-none focus:border-primary-400 font-mono transition-colors"
          />
        </div>
        <p className="text-[11px] text-accent-400 mt-1.5">
          Format international requis — ex: <code className="bg-accent-100 px-1 rounded">+243 97X XXX XXX</code>
        </p>
      </div>

      {/* Section Coordonnées */}
      <div className="bg-white border border-accent-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-accent-900">Coordonnées de paiement</h2>
              <p className="text-xs text-accent-400">Mobile money, virement bancaire, etc.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => append({ libelle: '', valeur: '', detail: '' })}
          >
            Ajouter
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 bg-accent-50 rounded-lg border border-dashed border-accent-200">
            <CreditCard className="w-6 h-6 text-accent-300 mx-auto mb-2" />
            <p className="text-xs text-accent-400 font-medium">Aucune coordonnée de paiement configurée</p>
            <p className="text-[11px] text-accent-300 mt-0.5">Cliquez sur "Ajouter" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="p-4 border border-accent-100 rounded-xl bg-accent-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-[10px] font-black shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">
                    Coordonnée #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="ml-auto text-accent-300 hover:text-red-500 cursor-pointer transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-[10px] font-bold text-accent-400 uppercase tracking-widest mb-1">
                      Libellé <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register(`coordonnees.${idx}.libelle`)}
                      placeholder="Ex: M-Pesa, Airtel Money…"
                      className="w-full text-sm px-3 py-2 bg-white border border-accent-200 rounded-lg outline-none focus:border-primary-400 transition-colors"
                    />
                    {errors.coordonnees?.[idx]?.libelle && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.coordonnees[idx]?.libelle?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-accent-400 uppercase tracking-widest mb-1">
                      Numéro / Référence <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register(`coordonnees.${idx}.valeur`)}
                      placeholder="Ex: 0978 000 000"
                      className="w-full text-sm px-3 py-2 bg-white border border-accent-200 rounded-lg outline-none focus:border-primary-400 transition-colors"
                    />
                    {errors.coordonnees?.[idx]?.valeur && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.coordonnees[idx]?.valeur?.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-accent-400 uppercase tracking-widest mb-1">
                    Détail <span className="normal-case font-normal text-accent-300">(optionnel)</span>
                  </label>
                  <input
                    {...register(`coordonnees.${idx}.detail`)}
                    placeholder="Ex: Au nom de Église Porte des Cieux"
                    className="w-full text-sm px-3 py-2 bg-white border border-accent-200 rounded-lg outline-none focus:border-primary-400 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
