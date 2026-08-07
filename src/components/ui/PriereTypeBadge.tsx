import { User, HeartHandshake } from 'lucide-react';
import type { TypeDemandePriere } from '@/types';

export function formatTypePriere(typePriere?: TypeDemandePriere | null): string {
  if (typePriere === 'MOI') return 'Pour soi-même';
  if (typePriere === 'AUTRE') return 'Pour autrui';
  return 'Non précisé';
}

interface PriereTypeBadgeProps {
  typePriere?: TypeDemandePriere | null;
  size?: 'sm' | 'md';
}

export function PriereTypeBadge({ typePriere, size = 'sm' }: PriereTypeBadgeProps) {
  const compact = size === 'sm';

  if (typePriere === 'MOI') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-sky-200 bg-sky-50 text-sky-700 ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <User className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Pour soi-même
      </span>
    );
  }

  if (typePriere === 'AUTRE') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-violet-200 bg-violet-50 text-violet-700 ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <HeartHandshake className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Pour autrui
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-accent-200 bg-accent-50 text-accent-400 italic ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      Non précisé
    </span>
  );
}
