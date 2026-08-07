import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark';

function readTheme(): ThemeMode {
  const saved = localStorage.getItem('epdc-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('epdc-theme', theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      className="p-2 rounded-lg border border-accent-200 text-accent-700 hover:bg-accent-100 hover:text-primary-500 transition-colors"
      title={theme === 'light' ? 'Passer en thème sombre' : 'Passer en thème clair'}
      aria-label="Basculer le thème"
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
