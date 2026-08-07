import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Save, X, CalendarDays, ImageIcon, Smartphone, ChevronLeft, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

import { GET_ACCUEIL } from '@/graphql/queries/configuration.queries';
import { MODIFIER_CONFIG_ACCUEIL } from '@/graphql/mutations/configuration.mutations';
import { useProcessing } from '@/hooks/useProcessing';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Switch } from '@/components/ui/Switch';
import type { ImageAccueil } from '@/types';

const schema = z.object({
  programmeHebdomadaire: z.string().optional(),
  programmeDimanche: z.string().optional(),
  imagesAccueil: z.array(z.object({
    id: z.string().optional(),
    imageUrl: z.string(),
    cloudinaryPublicId: z.string().optional(),
    ordre: z.number(),
    estActif: z.boolean()
  })),
});
type AccueilForm = z.infer<typeof schema>;

interface AccueilData {
  getAccueil: {
    programmeHebdomadaire?: string;
    programmeDimanche?: string;
    imagesAccueil: ImageAccueil[];
  };
}

export function ConfigAccueilPage() {
  const { run } = useProcessing();
  const [previewIdx, setPreviewIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewIdx(prev => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { data: accueilData, loading, refetch } = useQuery<AccueilData>(GET_ACCUEIL, { fetchPolicy: 'cache-and-network' });
  const [modifierConfigAccueil] = useMutation(MODIFIER_CONFIG_ACCUEIL);

  const { register, handleSubmit, reset, control, setValue, watch, formState: { isDirty } } = useForm<AccueilForm>({
    resolver: zodResolver(schema),
    defaultValues: { programmeHebdomadaire: '', programmeDimanche: '', imagesAccueil: [] },
  });

  const images = useWatch({ control, name: 'imagesAccueil' }) || [];
  const programme = watch('programmeHebdomadaire') || '';
  const programmeDimanche = watch('programmeDimanche') || '';
  const hasChanges = isDirty;

  useEffect(() => {
    if (accueilData) {
      reset({
        programmeHebdomadaire: accueilData.getAccueil.programmeHebdomadaire ?? '',
        programmeDimanche: accueilData.getAccueil.programmeDimanche ?? '',
        imagesAccueil: accueilData.getAccueil.imagesAccueil.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          cloudinaryPublicId: img.cloudinaryPublicId,
          ordre: img.ordre,
          estActif: img.estActif
        })).sort((a, b) => a.ordre - b.ordre) ?? [],
      });
    }
  }, [accueilData, reset]);

  const onSubmit = async (values: AccueilForm) => {
    await run('Sauvegarde de la configuration…', async () => {
      await modifierConfigAccueil({
        variables: {
          programmeHebdomadaire: values.programmeHebdomadaire || null,
          programmeDimanche: values.programmeDimanche || null,
          imagesAccueil: values.imagesAccueil.map((img, index) => ({
            imageUrl: img.imageUrl,
            cloudinaryPublicId: img.cloudinaryPublicId || '',
            ordre: index,
            estActif: img.estActif
          })),
        },
      });
      toast.success("Configuration de l'accueil sauvegardée");
      const fresh = await refetch();
      if (fresh.data) {
        reset({
          programmeHebdomadaire: fresh.data.getAccueil.programmeHebdomadaire ?? '',
          programmeDimanche: fresh.data.getAccueil.programmeDimanche ?? '',
          imagesAccueil: fresh.data.getAccueil.imagesAccueil.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            cloudinaryPublicId: img.cloudinaryPublicId,
            ordre: img.ordre,
            estActif: img.estActif
          })).sort((a, b) => a.ordre - b.ordre) ?? [],
        });
      }
    });
  };

  function addImage(url: string, publicId?: string) {
    if (!url) return;
    setValue('imagesAccueil', [...images, {
      imageUrl: url,
      cloudinaryPublicId: publicId,
      ordre: images.length,
      estActif: true
    }], { shouldDirty: true });
  }

  function removeImage(idx: number) {
    setValue('imagesAccueil', images.filter((_, i) => i !== idx), { shouldDirty: true });
  }

  function toggleActive(idx: number) {
    const newImages = [...images];
    newImages[idx].estActif = !newImages[idx].estActif;
    setValue('imagesAccueil', newImages, { shouldDirty: true });
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const newImages = [...images];
    const temp = newImages[idx - 1];
    newImages[idx - 1] = newImages[idx];
    newImages[idx] = temp;
    setValue('imagesAccueil', newImages, { shouldDirty: true });
  }

  function moveDown(idx: number) {
    if (idx === images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[idx + 1];
    newImages[idx + 1] = newImages[idx];
    newImages[idx] = temp;
    setValue('imagesAccueil', newImages, { shouldDirty: true });
  }

  if (loading && !accueilData) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-accent-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const lineCount = programme.split('\n').filter(Boolean).length;
  const programmeLines = programme.split('\n').filter(Boolean);
  const dimancheLineCount = programmeDimanche.split('\n').filter(Boolean).length;
  const dimancheLines = programmeDimanche.split('\n').filter(Boolean);
  
  const activeImages = images.filter(img => img.estActif);
  const safeIdx = activeImages.length > 0 ? previewIdx % activeImages.length : 0;

  return (
    <form onSubmit={handleSubmit((v) => void onSubmit(v))} className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">Configuration de l'Accueil</h1>
          <p className="text-sm text-accent-400 font-medium italic mt-0.5">
            Contenu affiché sur l'écran d'accueil de l'application mobile
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 space-y-5">

          <div className="bg-white border border-accent-200 rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-accent-900">Programme hebdomadaire</h2>
                <p className="text-xs text-accent-400">Affiché dans l'onglet "Agenda" de l'app mobile</p>
              </div>
              {lineCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full shrink-0">
                  {lineCount} ligne{lineCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <textarea
              {...register('programmeHebdomadaire')}
              rows={6}
              placeholder={"Lundi — Étude biblique 18h\nMercredi — Culte de prière 18h30\nVendredi — Louange 19h\nDimanche — Culte principal 9h"}
              className="w-full text-sm px-3.5 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-primary-400 resize-none font-mono transition-colors"
            />
            <p className="text-[11px] text-accent-400 mt-1.5">
              Une activité par ligne — ex: <code className="bg-accent-100 px-1 rounded">Mercredi — Culte de prière 18h30</code>
            </p>
          </div>

          <div className="bg-white border border-accent-200 rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-accent-900">Programme du dimanche</h2>
                <p className="text-xs text-accent-400">Ordre du culte dominical affiché sur l'écran d'accueil mobile</p>
              </div>
              {dimancheLineCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
                  {dimancheLineCount} étape{dimancheLineCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <textarea
              {...register('programmeDimanche')}
              rows={7}
              placeholder={"08h30 — Accueil et intercession\n09h00 — Louange & adoration\n09h45 — Lecture biblique\n10h00 — Sermon\n11h00 — Sainte Cène\n11h30 — Annonces & bénédictions"}
              className="w-full text-sm px-3.5 py-2.5 bg-accent-50 border border-accent-200 rounded-lg outline-none focus:border-amber-400 resize-none font-mono transition-colors"
            />
            <p className="text-[11px] text-accent-400 mt-1.5">
              Une étape par ligne — horaire puis description, ex: <code className="bg-accent-100 px-1 rounded">10h00 — Sermon</code>
            </p>
          </div>

          <div className="bg-white border border-accent-200 rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-accent-900">Images de bienvenue</h2>
                <p className="text-xs text-accent-400">Images affichées en carrousel sur l'écran d'accueil</p>
              </div>
              {images.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full shrink-0">
                  {images.length} image{images.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {images.length === 0 ? (
              <div className="text-center py-8 bg-accent-50 rounded-lg border border-dashed border-accent-200 mb-5">
                <ImageIcon className="w-6 h-6 text-accent-300 mx-auto mb-2" />
                <p className="text-xs text-accent-400 font-medium">Aucune image de bienvenue configurée</p>
                <p className="text-[11px] text-accent-300 mt-0.5">Ajoutez une image ci-dessous</p>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-accent-50 border border-accent-100 rounded-lg group">
                    <div className="flex flex-col items-center gap-1 shrink-0 px-1 text-accent-300">
                      <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="hover:text-accent-600 disabled:opacity-30 cursor-pointer">
                        <ChevronLeft className="w-4 h-4 rotate-90" />
                      </button>
                      <button type="button" onClick={() => moveDown(idx)} disabled={idx === images.length - 1} className="hover:text-accent-600 disabled:opacity-30 cursor-pointer">
                        <ChevronLeft className="w-4 h-4 -rotate-90" />
                      </button>
                    </div>
                    
                    <img src={img.imageUrl} alt="Accueil" className="w-20 h-12 object-cover rounded-md bg-accent-200" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={img.estActif}
                          onChange={() => toggleActive(idx)}
                        />
                        <span className="text-xs font-medium text-accent-700">
                          {img.estActif ? 'Visible' : 'Masqué'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-accent-300 hover:text-red-500 cursor-pointer transition-colors px-2"
                      title="Supprimer l'image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-accent-100">
              <h3 className="text-xs font-semibold text-accent-800 mb-3">Ajouter une nouvelle image</h3>
              <div className="max-w-xs">
                <ImageUploader 
                  onChange={(url, publicId) => {
                    if (url) addImage(url, publicId);
                  }} 
                  folder="accueil" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-surface border border-accent-200 rounded-xl p-5 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-accent-400" />
              <span className="text-xs font-bold text-accent-500 uppercase tracking-widest">Aperçu</span>
            </div>

            <div className="bg-epdc-phone rounded-2xl p-3.5 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-white/40 text-[9px] font-mono">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-1.5 bg-white/30 rounded-sm" />
                  <div className="w-2 h-1.5 bg-white/30 rounded-sm" />
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 px-0.5">
                <span className="text-[11px] font-black text-white tracking-tight">Porte des Cieux</span>
                <div className="w-5 h-5 rounded-full bg-primary-500/30 border border-primary-400/30" />
              </div>

              <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-epdc-phone-media flex items-center justify-center">
                {activeImages.length > 0 ? (
                  <img 
                    src={activeImages[safeIdx].imageUrl} 
                    alt="Bannière d'accueil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6 text-white/20" />
                    <p className="text-[10px] text-white/40">Aucune image</p>
                  </div>
                )}
                
                {activeImages.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    {activeImages.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full shadow-sm transition-all ${
                          i === safeIdx ? 'w-3 h-1 bg-[#ffffff]' : 'w-1 h-1 bg-[#ffffff]/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 mb-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Programme du dimanche</span>
                </div>
                {dimancheLines.length > 0 ? (
                  <div className="space-y-1">
                    {dimancheLines.slice(0, 4).map((line, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-amber-400/70 mt-1.5 shrink-0" />
                        <p className="text-[9px] text-white/70 leading-tight font-medium">{line}</p>
                      </div>
                    ))}
                    {dimancheLines.length > 4 && (
                      <p className="text-[9px] text-white/30 italic pl-2.5">
                        +{dimancheLines.length - 4} autre{dimancheLines.length - 4 > 1 ? 's' : ''}…
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[80, 65].map((w, i) => (
                      <div key={i} className="h-1.5 bg-white/10 rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <CalendarDays className="w-3 h-3 text-primary-400" />
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Semaine</span>
                </div>
                {programmeLines.length > 0 ? (
                  <div className="space-y-1">
                    {programmeLines.slice(0, 5).map((line, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-primary-400/60 mt-1.5 shrink-0" />
                        <p className="text-[9px] text-white/60 leading-tight">{line}</p>
                      </div>
                    ))}
                    {programmeLines.length > 5 && (
                      <p className="text-[9px] text-white/30 italic pl-2.5">
                        +{programmeLines.length - 5} autre{programmeLines.length - 5 > 1 ? 's' : ''}…
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[70, 55, 65].map((w, i) => (
                      <div key={i} className="h-1.5 bg-white/10 rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-accent-400 text-center mt-2.5 leading-snug">
              Aperçu approximatif<br />Android / iOS
            </p>
          </div>
        </div>
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-surface border-t border-accent-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm text-accent-600 font-medium">Modifications non sauvegardées</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => reset()}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={14} />}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
