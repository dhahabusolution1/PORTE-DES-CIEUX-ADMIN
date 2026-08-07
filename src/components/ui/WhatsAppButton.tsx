import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/utils/whatsapp';

interface WhatsAppButtonProps {
  numero: string;
  message?: string;
  label?: string;
  compact?: boolean;
}

export function WhatsAppButton({
  numero,
  message = '',
  label = 'WhatsApp',
  compact = false,
}: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappUrl(numero, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded px-2 py-1 transition-colors cursor-pointer ${
        compact ? 'px-1.5 py-0.5' : ''
      }`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {!compact && <span>{label}</span>}
    </a>
  );
}
