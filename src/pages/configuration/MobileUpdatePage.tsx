import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { RefreshCw, Save, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  updateRequired: z.boolean(),
  message: z.string().trim().max(500, 'Le message ne peut pas dépasser 500 caractères.'),
  minVersionAndroid: z.string().trim(),
  minVersionIos: z.string().trim(),
  updateUrlAndroid: z.string().trim(),
  updateUrlIos: z.string().trim(),
}).superRefine((value, context) => {
  if (!value.updateRequired) return;
  if (!value.message) {
    context.addIssue({ code: 'custom', path: ['message'], message: 'Le message est requis pour bloquer l’application.' });
  }
  for (const field of ['minVersionAndroid', 'minVersionIos'] as const) {
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value[field])) {
      context.addIssue({ code: 'custom', path: [field], message: 'Indiquez une version comme 1.2.0.' });
    }
  }
  for (const field of ['updateUrlAndroid', 'updateUrlIos'] as const) {
    try {
      if (new URL(value[field]).protocol !== 'https:') throw new Error();
    } catch {
      context.addIssue({ code: 'custom', path: [field], message: 'Un lien HTTPS valide est requis.' });
    }
  }
});

type MobileUpdateConfig = z.infer<typeof schema>;

const graphqlUrl = import.meta.env.VITE_GRAPHQL_HTTP_URL ?? '/graphql';
const mobileUpdateUrl = import.meta.env.VITE_MOBILE_UPDATE_URL
  ?? new URL(graphqlUrl, window.location.origin).href.replace(/\/graphql\/?$/, '/api/mobile-update');

async function readConfig(): Promise<MobileUpdateConfig> {
  const response = await fetch(mobileUpdateUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error('Impossible de charger la configuration mobile.');
  return schema.parse(await response.json());
}

export function MobileUpdatePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { register, handleSubmit, reset, setValue, control, formState: { errors, isDirty } } = useForm<MobileUpdateConfig>({
    resolver: zodResolver(schema),
    defaultValues: { updateRequired: false, message: '', minVersionAndroid: '', minVersionIos: '', updateUrlAndroid: '', updateUrlIos: '' },
  });
  const updateRequired = useWatch({ control, name: 'updateRequired' });

  const reload = async () => {
    setLoading(true);
    try {
      reset(await readConfig());
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error('Impossible de charger la configuration mobile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void readConfig().then(
      (config) => { if (active) { reset(config); setLoadError(false); setLoading(false); } },
      () => { if (active) { setLoadError(true); setLoading(false); toast.error('Impossible de charger la configuration mobile.'); } },
    );
    return () => { active = false; };
  }, [reset]);

  const save = async (values: MobileUpdateConfig) => {
    setSaving(true);
    try {
      const response = await fetch(mobileUpdateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Votre session ne permet pas de modifier cette configuration.');
        }
        throw new Error('La configuration n’a pas pu être enregistrée.');
      }
      reset(schema.parse(await response.json()));
      toast.success('Configuration de la mise à jour enregistrée.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Mise à jour mobile</h1>
          <p className="text-sm text-accent-400 font-medium mt-1">Contrôlez l’accès à l’application mobile lors d’une mise à jour obligatoire.</p>
        </div>
        <Button type="button" variant="outline" size="sm" leftIcon={<RefreshCw size={15} />} onClick={() => void reload()} disabled={loading || saving}>
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="h-48 bg-accent-100 rounded-xl animate-pulse" />
      ) : loadError ? (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
          La configuration est indisponible. Réessayez avec « Actualiser » avant de la modifier.
        </div>
      ) : (
        <form onSubmit={handleSubmit((values) => void save(values))} className="bg-white border border-accent-200 rounded-xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center"><Smartphone className="w-5 h-5 text-primary-500" /></div>
            <div>
              <h2 className="text-sm font-bold text-accent-900">Blocage de l’application</h2>
              <p className="text-xs text-accent-500">État enregistré : {updateRequired ? 'activé' : 'désactivé'}{isDirty ? ' (modification non enregistrée)' : ''}</p>
            </div>
            <div className="ml-auto">
              <Switch checked={updateRequired} onChange={(checked) => setValue('updateRequired', checked, { shouldDirty: true, shouldValidate: true })} disabled={saving} />
            </div>
          </div>

          <div>
            <label htmlFor="mobile-update-message" className="block text-xs font-bold text-accent-600 uppercase tracking-wide mb-1.5">Message affiché aux utilisateurs</label>
            <textarea id="mobile-update-message" {...register('message')} rows={4} maxLength={500} placeholder="Une nouvelle version est disponible. Veuillez la télécharger."
              className="w-full text-sm px-3 py-2 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-400" />
            {errors.message && <p role="alert" className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {(['Android', 'Ios'] as const).map((platform) => {
              const versionField = platform === 'Android' ? 'minVersionAndroid' : 'minVersionIos';
              const urlField = platform === 'Android' ? 'updateUrlAndroid' : 'updateUrlIos';
              return (
                <div key={platform} className="space-y-4 rounded-lg border border-accent-200 bg-accent-50 p-4">
                  <h3 className="text-sm font-bold text-accent-900">{platform === 'Ios' ? 'iOS' : 'Android'}</h3>
                  <div>
                    <label htmlFor={versionField} className="block text-xs font-bold text-accent-600 mb-1.5">Version minimale</label>
                    <input id={versionField} type="text" inputMode="numeric" {...register(versionField)} placeholder="1.2.0"
                      className="w-full text-sm px-3 py-2 bg-white border border-accent-200 rounded-lg outline-none focus:border-primary-400" />
                    {errors[versionField] && <p role="alert" className="text-xs text-red-600 mt-1">{errors[versionField]?.message}</p>}
                  </div>
                  <div>
                    <label htmlFor={urlField} className="block text-xs font-bold text-accent-600 mb-1.5">Lien de téléchargement</label>
                    <input id={urlField} type="url" {...register(urlField)} placeholder="https://..."
                      className="w-full text-sm px-3 py-2 bg-white border border-accent-200 rounded-lg outline-none focus:border-primary-400" />
                    {errors[urlField] && <p role="alert" className="text-xs text-red-600 mt-1">{errors[urlField]?.message}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-accent-500">Si le blocage est activé, le message, les deux versions minimales et les deux liens HTTPS sont obligatoires. Seules les versions plus anciennes que le minimum de leur plateforme sont bloquées. Une application mise à jour retrouve automatiquement l’accès.</p>
          <div className="flex justify-end">
            <Button type="submit" leftIcon={<Save size={16} />} isLoading={saving} disabled={!isDirty}>Enregistrer</Button>
          </div>
        </form>
      )}
    </div>
  );
}
