import { Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':                       'Tableau de bord',
  '/contenus/versets':                'Versets du Jour',
  '/contenus/evenements':             'Événements',
  '/contenus/programmes':             'Programmes Culte',
  '/contenus/sermons':                'Sermons & Playlists',
  '/contenus/emissions':              'Émissions TV / Radio',
  '/contenus/shorts':                 'Short Videos',
  '/contenus/cultes':                 'Cultes',
  '/contenus/citations':              'Citations',
  '/contenus/bookshop':               'Bookshop',
  '/interactions/messagerie':         'Messagerie',
  '/interactions/rendezvous':         'Rendez-vous Pasteur',
  '/interactions/dons':               'Suivi des Dons',
  '/sessions':                        'Sessions & Formulaires',
  '/interactions/info':               'Demandes d\'information',
  '/interactions/integration':        'Demandes d\'intégration',
  '/interactions/prieres':            'Demandes de prière',
  '/interactions/salut':              'Prières du Salut',
  '/interactions/renouvellements':    'Renouvellements de Pacte',
  '/referentiels/eglises':            'Gestion des Églises',
  '/referentiels/cellules':           'Cellules de Maison',
  '/referentiels/departements':       'Départements',
  '/configuration/utilisateurs':      'Gestion des Utilisateurs',
  '/configuration/accueil':           'Configuration Accueil',
  '/configuration/dons':              'Configuration Dons',
  '/configuration/whatsapp':          'Configuration WhatsApp',
  '/configuration/notifications':     'Notifications Push',
};

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? 'Administration';
  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'A';

  return (
    <header className="h-20 bg-surface border-b border-accent-200 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-accent-50 rounded-lg text-accent-600 cursor-pointer transition-colors"
          title="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-accent-900 tracking-tight">{title}</h1>
          <p className="hidden sm:block text-[10px] text-accent-500 font-medium uppercase tracking-wider">Administration Centrale</p>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <div className="text-right hidden sm:block">
            <span className="text-sm font-bold text-accent-800 block leading-tight">
              {user.prenom} {user.nom}
            </span>
            <span className="text-[10px] text-accent-400 font-medium block uppercase">{user.email}</span>
          </div>
          <div className="relative group">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={initials}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-50 ring-offset-2"
              />
            ) : (
              <div className="w-10 h-10 bg-[#F59E0B] rounded-full text-[#0B0618] flex items-center justify-center text-sm font-bold shadow-md">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white"></div>
          </div>
          <StatusBadge value={user.role} />
        </div>
      )}
    </header>
  );
}
