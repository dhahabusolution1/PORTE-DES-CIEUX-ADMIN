import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string, publicId?: string) => void;
  folder?: string;
}

const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL ?? '/api/upload';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

function getAccessToken(): string {
  try {
    const raw = localStorage.getItem('auth-storage');
    return raw
      ? ((JSON.parse(raw) as { state?: { accessToken?: string } }).state?.accessToken ?? '')
      : '';
  } catch {
    return '';
  }
}

export function ImageUploader({ value, onChange, folder }: ImageUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Fichier invalide — sélectionnez une image (jpg, png, webp…)');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);

      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: { authorization: `Bearer ${getAccessToken()}` },
      });

      if (!res.ok) {
        let msg = `Erreur serveur (${res.status})`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      const json = (await res.json()) as { url?: string; secure_url?: string; publicId?: string };
      const url = json.url ?? json.secure_url ?? '';

      if (!url) throw new Error("L'image a été envoyée mais aucune URL n'a été retournée");

      onChange(url, json.publicId ?? '');
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  function reset(e?: React.MouseEvent) {
    e?.stopPropagation();
    onChange('');
    setStatus('idle');
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const isClickable = status !== 'uploading';

  return (
    <div className="space-y-2">
      {/* Zone de drop */}
      <div
        className={[
          'relative rounded-lg transition-all',
          value
            ? 'border border-accent-200'
            : status === 'error'
              ? 'border-2 border-dashed border-red-300 bg-red-50/40'
              : status === 'success'
                ? 'border-2 border-dashed border-emerald-300 bg-emerald-50/40'
                : 'border-2 border-dashed border-accent-200 hover:border-primary-400',
          isClickable ? 'cursor-pointer' : 'pointer-events-none opacity-60',
        ].join(' ')}
        onClick={() => isClickable && inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {/* État : image uploadée */}
        {value ? (
          <div className="relative p-2">
            <img src={value} alt="Aperçu" className="h-32 w-full object-contain rounded" />
            <button
              type="button"
              onClick={reset}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 cursor-pointer hover:bg-red-600 transition-colors"
              title="Supprimer l'image"
            >
              <X className="w-3 h-3" />
            </button>
            {/* Bandeau succès en bas */}
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium truncate flex-1">{value.split('/').pop()}</span>
              <span className="text-[10px] text-emerald-500 shrink-0">Uploadée</span>
            </div>
          </div>
        ) : status === 'uploading' ? (
          /* État : en cours */
          <div className="p-6 flex flex-col items-center gap-2 text-primary-500">
            <Upload className="w-6 h-6 animate-bounce" />
            <span className="text-xs font-medium">Upload en cours…</span>
            <div className="w-full max-w-30 h-1 bg-primary-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary-400 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : status === 'error' ? (
          /* État : erreur */
          <div className="p-5 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-xs font-semibold text-red-600 text-center">{errorMsg}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setStatus('idle'); setErrorMsg(''); }}
              className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 mt-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Réessayer
            </button>
          </div>
        ) : (
          /* État : idle */
          <div className="p-6 flex flex-col items-center gap-2 text-accent-400">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Cliquer ou glisser une image</span>
            <span className="text-[10px] text-accent-300">JPG, PNG, WEBP — max 5 Mo</span>
          </div>
        )}
      </div>
    </div>
  );
}
