import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Save, ShoppingBag, Group } from 'lucide-react';
import toast from 'react-hot-toast';

import { GET_CONFIGURATION_WHATSAPP } from '@/graphql/queries/configuration.queries';
import { MODIFIER_CONFIGURATION_WHATSAPP } from '@/graphql/mutations/configuration.mutations';
import { useProcessing } from '@/hooks/useProcessing';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  lienGroupeWhatsapp: z.string().url('Lien du groupe WhatsApp invalide (doit commencer par https://)').or(z.literal('')),
  numeroWhatsappBookshop: z.string().or(z.literal('')),
});
type WhatsAppForm = z.infer<typeof schema>;

interface WhatsAppConfigData {
  getConfigurationWhatsApp: {
    lienGroupeWhatsapp?: string | null;
    numeroWhatsappBookshop?: string | null;
  };
}

export function ConfigWhatsAppPage() {
  const { run } = useProcessing();

  const { data, loading, refetch } = useQuery<WhatsAppConfigData>(GET_CONFIGURATION_WHATSAPP, {
    fetchPolicy: 'cache-and-network',
  });

  const [modifierConfig] = useMutation(MODIFIER_CONFIGURATION_WHATSAPP);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WhatsAppForm>({
    resolver: zodResolver(schema),
    defaultValues: { lienGroupeWhatsapp: '', numeroWhatsappBookshop: '' },
  });

  useEffect(() => {
    if (data) {
      reset({
        lienGroupeWhatsapp: data.getConfigurationWhatsApp.lienGroupeWhatsapp ?? '',
        numeroWhatsappBookshop: data.getConfigurationWhatsApp.numeroWhatsappBookshop ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: WhatsAppForm) => {
    await run('Sauvegarde de la configuration WhatsApp…', async () => {
      try {
        await modifierConfig({
          variables: {
            lienGroupeWhatsapp: values.lienGroupeWhatsapp || null,
            numeroWhatsappBookshop: values.numeroWhatsappBookshop || null,
          },
        });
        toast.success('Configuration WhatsApp sauvegardée');
        void refetch();
      } catch {
        toast.error('Erreur lors de la sauvegarde');
      }
    });
  };

  if (loading && !data) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-40 bg-accent-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Configuration WhatsApp & Réseau</h1>
          <p className="text-sm text-accent-400 font-medium italic mt-0.5">
            Gérez les coordonnées d'achat du bookshop et le lien du groupe WhatsApp pour l'intégration des fidèles
          </p>
        </div>
        <Button type="submit" variant="primary" leftIcon={<Save size={16} />} disabled={!isDirty}>
          Sauvegarder
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-accent-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Group className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-accent-900">Groupe d'Intégration WhatsApp</h2>
              <p className="text-xs text-accent-400">Lien d'invitation au groupe d'accompagnement envoyé automatiquement lors d'une demande d'intégration</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-accent-500 uppercase tracking-wide">
              Lien d'invitation du groupe WhatsApp
            </label>
            <input
              type="text"
              {...register('lienGroupeWhatsapp')}
              placeholder="https://chat.whatsapp.com/..."
              className="text-xs w-full px-3.5 py-2 border border-accent-200 rounded-lg outline-none focus:border-emerald-400 bg-accent-50 text-accent-800"
            />
            {errors.lienGroupeWhatsapp && (
              <p className="text-xs text-red-500 mt-1">{errors.lienGroupeWhatsapp.message}</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-accent-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-accent-900">Contact WhatsApp Bookshop / Librairie</h2>
              <p className="text-xs text-accent-400">Numéro WhatsApp par défaut vers lequel rediriger les fidèles intéressés par l'achat d'un article</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-accent-500 uppercase tracking-wide">
              Numéro de téléphone WhatsApp (ex: +243...)
            </label>
            <input
              type="text"
              {...register('numeroWhatsappBookshop')}
              placeholder="+243999999999"
              className="text-xs w-full px-3.5 py-2 border border-accent-200 rounded-lg outline-none focus:border-amber-400 bg-accent-50 text-accent-800"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
export default ConfigWhatsAppPage;
