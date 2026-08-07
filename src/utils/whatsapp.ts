export function whatsappUrl(numero: string, message = ''): string {
  const clean = numero.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}${encoded ? `?text=${encoded}` : ''}`;
}
