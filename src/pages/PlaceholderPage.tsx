interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <p className="text-base font-semibold text-accent-900">{title}</p>
      <p className="text-xs text-accent-400">Cette section est en cours de développement.</p>
    </div>
  );
}
