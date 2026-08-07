import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  /** Champ texte optionnel (ex. raison d'annulation). */
  input?: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
  };
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = true,
  input,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const inputInvalid = Boolean(input?.required && !input.value.trim());

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-accent-900/50 backdrop-blur-sm">
      <div className="bg-surface rounded-lg p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${danger ? 'text-danger' : 'text-warning'}`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-accent-900 mb-1">{title}</h3>
            <p className="text-xs text-accent-500">{message}</p>
            {input && (
              <div className="mt-3">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-accent-500 mb-1">
                  {input.label}
                  {input.required && <span className="text-danger"> *</span>}
                </label>
                <textarea
                  value={input.value}
                  onChange={(e) => input.onChange(e.target.value)}
                  placeholder={input.placeholder}
                  maxLength={input.maxLength ?? 500}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-accent-200 rounded outline-none resize-none focus:border-primary-400 bg-surface text-accent-800"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs border border-accent-200 rounded text-accent-700 hover:bg-accent-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={inputInvalid}
            className={`px-3 py-1.5 text-xs rounded text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              danger ? 'bg-danger hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
