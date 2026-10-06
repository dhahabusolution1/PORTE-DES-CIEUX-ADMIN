import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  PlayCircle,
  Radio,
  Video,
  Tv,
  Quote,
  ShoppingBag,
  CalendarClock,
  FileQuestion,
  Heart,
  Flame,
  RefreshCw,
  Church,
  Users2,
  Layers,
  UserCog,
  Home,
  Gift,
  Bell,
  MessageCircle,
  LogOut,
  X,
  FileText,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
}

const CONTENUS: NavItem[] = [
  { to: '/contenus/versets',    label: 'Versets du Jour',    icon: <BookOpen className="w-4 h-4" /> },
  { to: '/contenus/evenements', label: 'Événements',         icon: <Calendar className="w-4 h-4" /> },
  { to: '/contenus/programmes', label: 'Programmes Culte',   icon: <Calendar className="w-4 h-4" /> },
  { to: '/contenus/sermons',    label: 'Sermons',            icon: <PlayCircle className="w-4 h-4" /> },
  { to: '/contenus/playlists',  label: 'Séries & Playlists', icon: <Layers className="w-4 h-4" /> },
  { to: '/contenus/emissions',  label: 'Émissions',          icon: <Radio className="w-4 h-4" /> },
  { to: '/contenus/shorts',     label: 'Short Videos',       icon: <Video className="w-4 h-4" /> },
  { to: '/contenus/cultes',     label: 'Cultes',             icon: <Tv className="w-4 h-4" /> },
  { to: '/contenus/citations',  label: 'Citations',          icon: <Quote className="w-4 h-4" /> },
  { to: '/contenus/bookshop',   label: 'Bookshop',           icon: <ShoppingBag className="w-4 h-4" /> },
];

const INTERACTIONS: NavItem[] = [
  { to: '/interactions/rendezvous',    label: 'Rendez-vous Pasteur',   icon: <CalendarClock className="w-4 h-4" /> },
  { to: '/interactions/dons',          label: 'Suivi des Dons',        icon: <Gift className="w-4 h-4" /> },
  { to: '/sessions',                   label: 'Sessions & Formulaires', icon: <FileText className="w-4 h-4" /> },
  { to: '/interactions/info',          label: 'Demandes d\'info',      icon: <FileQuestion className="w-4 h-4" /> },
  { to: '/interactions/integration',   label: 'Intégration',           icon: <Users2 className="w-4 h-4" /> },
  { to: '/interactions/prieres',       label: 'Prières',               icon: <Heart className="w-4 h-4" /> },
  { to: '/interactions/salut',         label: 'Prières du Salut',      icon: <Flame className="w-4 h-4" /> },
  { to: '/interactions/renouvellements', label: 'Renouvellements',     icon: <RefreshCw className="w-4 h-4" /> },
];

const REFERENTIELS: NavItem[] = [
  { to: '/referentiels/eglises',      label: 'Églises',     icon: <Church className="w-4 h-4" />, superAdminOnly: true },
  { to: '/referentiels/cellules',     label: 'Cellules',    icon: <Home className="w-4 h-4" />,   superAdminOnly: true },
  { to: '/referentiels/departements', label: 'Départements',icon: <Layers className="w-4 h-4" />, superAdminOnly: true },
];

const CONFIGURATION: NavItem[] = [
  { to: '/configuration/utilisateurs', label: 'Utilisateurs',    icon: <UserCog className="w-4 h-4" /> },
  { to: '/configuration/accueil',      label: 'Config Accueil',  icon: <Home className="w-4 h-4" /> },
  { to: '/configuration/dons',         label: 'Config Dons',     icon: <Gift className="w-4 h-4" /> },
  { to: '/configuration/whatsapp',     label: 'Config WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
  { to: '/configuration/notifications',label: 'Notifications Push', icon: <Bell className="w-4 h-4" /> },
  { to: '/configuration/mobile-update', label: 'Mise à jour mobile', icon: <RefreshCw className="w-4 h-4" />, superAdminOnly: true },
  { to: '/configuration/corbeille', label: 'Corbeille', icon: <Trash2 className="w-4 h-4" /> },
];

function SidebarSection({ title, items, role }: { title: string; items: NavItem[]; role: string }) {
  const filtered = items.filter((i) => !i.superAdminOnly || role === 'SUPER_ADMIN');
  if (filtered.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
        {title}
      </div>
      {filtered.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-2.5 text-sm transition-all duration-200 ${
              isActive
                ? 'bg-white/15 text-white font-semibold border-l-4 border-[#F59E0B]'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <div className="w-5 flex justify-center">{item.icon}</div>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, clearAuth } = useAuthStore();
  const role = user?.role ?? 'ADMIN';

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-epdc-sidebar flex flex-col z-40 h-screen overflow-hidden transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Logo Area (Fixe) */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <img
            src="/assets/logo-eglise-pour-fond-bleu.png"
            alt="Logo Porte des Cieux"
            className="w-12 h-12 object-contain"
          />
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-tight uppercase">Porte des Cieux</div>
            <div className="text-[10px] text-white/40 font-medium tracking-widest uppercase">EPDC · JFT</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-white/60 hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        <div className="mt-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white font-semibold border-l-4 border-[#F59E0B]'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Tableau de bord</span>
          </NavLink>
        </div>

        <SidebarSection title="Contenus" items={CONTENUS} role={role} />
        <SidebarSection title="Interactions" items={INTERACTIONS} role={role} />
        <SidebarSection title="Référentiels" items={REFERENTIELS} role={role} />
        <SidebarSection title="Configuration" items={CONFIGURATION} role={role} />
      </div>

      {/* Déconnexion (Fixe) */}
      <div className="mt-auto border-t border-white/10 bg-black/10 flex-shrink-0">
        <button
          onClick={clearAuth}
          className="w-full flex items-center gap-3 px-6 py-5 text-sm text-white/60 hover:bg-red-600/10 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
