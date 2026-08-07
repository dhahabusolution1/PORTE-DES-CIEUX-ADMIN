import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(dateStr: string, pattern = 'dd/MM/yyyy'): string {
  return format(parseISO(dateStr), pattern, { locale: fr });
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: fr });
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm', { locale: fr });
}
