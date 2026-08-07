import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Send, Users, User, Bell, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation } from '@apollo/client/react';

import { ENVOYER_NOTIFICATION } from '@/graphql/mutations/configuration.mutations';
import { useProcessing } from '@/hooks/useProcessing';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  titre: z.string().min(1, 'Titre requis').max(65, 'Maximum 65 caractères'),
  corps: z.string().min(1, 'Corps du message requis').max(240, 'Maximum 240 caractères'),
  cible: z.enum(['TOUS', 'FIDELES']),
});
type NotifForm = z.infer<typeof schema>;

const CIBLE_OPTIONS = [
  {
    value: 'TOUS' as const,
    label: 'Tous les utilisateurs',
    description: 'Comptes ayant activé les notifications',
    icon: Users,
  },
  {
    value: 'FIDELES' as const,
    label: 'Fidèles uniquement',
    description: 'Comptes avec le rôle FIDÈLE',
    icon: User,
  },
];

export function NotificationsPage() {
  const { run } = useProcessing();
  const [envoyerNotification] = useMutation(ENVOYER_NOTIFICATION);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<NotifForm>({
    resolver: zodResolver(schema),
    defaultValues: { titre: '', corps: '', cible: 'TOUS' },
  });

  const { titre, corps, cible } = useWatch({ control });

  const onSubmit = async (values: NotifForm) => {
    await run('Envoi de la notification…', async () => {
      const result = await envoyerNotification({ variables: values });
      const count = (result.data as { envoyerNotification: number }).envoyerNotification;
      toast.success(`Notification envoyée à ${count} appareil(s)`);
      reset({ titre: '', corps: '', cible: values.cible });
    });
  };

  const titreLen = titre?.length ?? 0;
  const corpsLen = corps?.length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-black text-accent-900 tracking-tight">Notifications Push</h1>
        <p className="text-sm text-accent-400 font-medium italic mt-0.5">
          Envoyez des notifications directement sur les téléphones des fidèles
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Formulaire — 2/3 */}
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="col-span-2 space-y-5">
          <div className="bg-white border border-accent-200 rounded-xl p-5 space-y-5">

            {/* Titre */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-accent-700 uppercase tracking-widest">
                  Titre <span className="text-red-400">*</span>
                </label>
                <span className={`text-[10px] font-mono tabular-nums ${titreLen > 55 ? 'text-orange-500 font-bold' : 'text-accent-400'}`}>
                  {titreLen}/65
                </span>
              </div>
              <input
                {...register('titre')}
                placeholder="Ex: Changement d'horaire du culte de dimanche"
                className="w-full text-sm px-3.5 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-400 transition-colors"
              />
              {errors.titre && <p className="text-xs text-red-500 mt-1">{errors.titre.message}</p>}
            </div>

            {/* Corps */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-accent-700 uppercase tracking-widest">
                  Message <span className="text-red-400">*</span>
                </label>
                <span className={`text-[10px] font-mono tabular-nums ${corpsLen > 200 ? 'text-orange-500 font-bold' : 'text-accent-400'}`}>
                  {corpsLen}/240
                </span>
              </div>
              <textarea
                {...register('corps')}
                rows={4}
                placeholder="Rédigez ici le contenu de votre notification push…"
                className="w-full text-sm px-3.5 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-400 resize-none transition-colors"
              />
              {errors.corps && <p className="text-xs text-red-500 mt-1">{errors.corps.message}</p>}
            </div>

            {/* Destinataires */}
            <div>
              <label className="block text-xs font-bold text-accent-700 uppercase tracking-widest mb-2.5">
                Destinataires
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CIBLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = cible === opt.value;
                  return (
                    <label key={opt.value} className="cursor-pointer">
                      <input {...register('cible')} type="radio" value={opt.value} className="sr-only" />
                      <div className={`flex items-center gap-3 p-3.5 border rounded-xl transition-all ${
                        isSelected
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-accent-200 bg-accent-50 hover:border-accent-300'
                      }`}>
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-accent-100 text-accent-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold ${isSelected ? 'text-primary-700' : 'text-accent-800'}`}>
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-accent-400 mt-0.5 leading-tight">{opt.description}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all ${
                          isSelected ? 'bg-primary-500 border-primary-500' : 'border-accent-300'
                        }`} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" leftIcon={<Send size={15} />}>
              Envoyer la notification
            </Button>
          </div>
        </form>

        {/* Aperçu mobile — 1/3 */}
        <div className="col-span-1">
          <div className="bg-surface border border-accent-200 rounded-xl p-5 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-accent-400" />
              <span className="text-xs font-bold text-accent-500 uppercase tracking-widest">Aperçu</span>
            </div>

            {/* Mock écran téléphone — toujours sombre */}
            <div className="bg-epdc-phone rounded-2xl p-3.5 overflow-hidden">
              {/* Barre de statut */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-white/40 text-[9px] font-mono">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-1.5 bg-white/30 rounded-sm" />
                  <div className="w-2 h-1.5 bg-white/30 rounded-sm" />
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                </div>
              </div>

              {/* Carte notification */}
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider truncate">
                        Porte des Cieux
                      </span>
                      <span className="text-[9px] text-white/30 shrink-0">maintenant</span>
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight">
                      {titre?.trim() || <span className="text-white/30 italic">Titre de la notification</span>}
                    </p>
                    <p className="text-[10px] text-white/60 mt-0.5 leading-snug line-clamp-3">
                      {corps?.trim() || <span className="text-white/20 italic">Contenu du message…</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fond écran flou */}
              <div className="mt-3 space-y-1.5 opacity-20">
                {[80, 60, 70].map((w, i) => (
                  <div key={i} className={`h-1.5 bg-white/40 rounded-full`} style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>

            <p className="text-[10px] text-accent-400 text-center mt-2.5 leading-snug">
              Aperçu approximatif<br/>Android / iOS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
