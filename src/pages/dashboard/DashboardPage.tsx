import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import {
  Church,
  Users2,
  Network,
  RotateCw,
  PlayCircle,
  HandHeart,
  CalendarCheck,
  MessageSquare,
  Plus,
  BookOpen,
  UserPlus,
  Pencil,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GET_DASHBOARD } from '@/graphql/queries/dashboard.queries';
import { GET_VERSET_ACTIF } from '@/graphql/queries/contenu.queries';
import type { Dashboard, Evenement, VersetJour, InteractionStat } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface DashboardData { getDashboard: Dashboard; }
interface VersetData { getVersetDuJour: VersetJour | null; }

const INTERACTION_COLORS = [
  '#5B21B6', '#4C1D95', '#F59E0B', '#A78BFA', '#C026D3', '#EA580C',
];

const QUICK_ACTIONS = [
  { label: 'Nouvel événement', icon: Plus, to: '/contenus/evenements', color: 'text-primary-600 bg-primary-50' },
  { label: 'Nouveau sermon', icon: PlayCircle, to: '/contenus/sermons', color: 'text-[#5B21B6] bg-[#5B21B6]/10' },
  { label: 'Verset du jour', icon: BookOpen, to: '/contenus/versets', color: 'text-[#F59E0B] bg-[#F59E0B]/10' },
  { label: 'Demandes prière', icon: HandHeart, to: '/interactions/prieres', color: 'text-[#C026D3] bg-[#C026D3]/10' },
  { label: 'Rendez-vous', icon: CalendarCheck, to: '/interactions/rendezvous', color: 'text-primary-600 bg-primary-50' },
  { label: 'Intégrations', icon: UserPlus, to: '/interactions/integration', color: 'text-accent-600 bg-accent-100' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<DashboardData>(GET_DASHBOARD, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: versetData, loading: versetLoading } = useQuery<VersetData>(GET_VERSET_ACTIF, {
    fetchPolicy: 'cache-and-network',
  });

  const dashboard = data?.getDashboard;
  const verset = versetData?.getVersetDuJour;

  // Redirection automatique si non authentifié
  useEffect(() => {
    if (error?.message.includes('Authentification requise')) {
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      navigate('/login');
    }
  }, [error, navigate]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const interactionData: InteractionStat[] = dashboard?.distributionInteractions ?? [];

  if (error && !error.message.includes('Authentification requise')) {
    return (
      <div className="p-6 text-sm text-danger border border-danger/20 bg-danger/5 rounded-md">
        Erreur lors du chargement du tableau de bord : {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-accent-900 tracking-tight">
            Bienvenue, <span className="text-primary-600">{user?.prenom ?? 'Administrateur'}</span>
          </h1>
          <p className="text-sm text-accent-400 mt-1 font-medium italic">
            Tableau de bord — <span className="text-accent-600 font-bold">{today}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => void window.location.reload()}
            className="inline-flex items-center gap-2 p-2 bg-surface border border-accent-200 rounded-md text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RotateCw className="w-5 h-5" /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Colonne Principale */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Églises" value={loading ? '—' : (dashboard?.totalEglises ?? 0)}
              icon={<Church />} variant="primary" description="Implantations actives" />
            <StatCard title="Cellules" value={loading ? '—' : (dashboard?.totalCellules ?? 0)}
              icon={<Users2 />} variant="primary" description="Groupes de maison" />
            <StatCard title="Sermons" value={loading ? '—' : (dashboard?.totalSermons ?? 0)}
              icon={<PlayCircle />} variant="info" description="Vidéos indexées" />
            <StatCard title="Membres" value={loading ? '—' : (dashboard?.totalUtilisateurs ?? 0)}
              icon={<Network />} variant="accent" description="Comptes actifs" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-surface border border-accent-200 rounded-lg p-5">
              <h3 className="text-xs font-bold text-accent-900 uppercase tracking-widest mb-6 border-b border-accent-100 pb-3">Interactions mobiles</h3>
              {loading ? (
                <div className="h-52 flex items-center justify-center text-xs text-accent-300">Chargement…</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:flex-1 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={interactionData} innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="total" nameKey="type">
                          {interactionData.map((_, i) => (
                            <Cell key={i} fill={INTERACTION_COLORS[i % INTERACTION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #c4b5fd', background: 'var(--color-surface)', color: 'var(--color-accent-900)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 w-full sm:w-32">
                    {interactionData.slice(0, 4).map((item, i) => (
                      <div key={item.type} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: INTERACTION_COLORS[i % INTERACTION_COLORS.length] }} />
                        <span className="text-[10px] font-bold text-accent-600 uppercase truncate">{item.type}</span>
                        <span className="text-[10px] font-black text-accent-900 ml-auto">{item.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Rapides */}
            <div className="bg-surface border border-accent-200 rounded-lg p-5">
              <h3 className="text-xs font-bold text-accent-900 uppercase tracking-widest mb-4 border-b border-accent-100 pb-3">Raccourcis</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(({ label, icon: Icon, to, color }) => (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className="flex items-center gap-3 p-3 border border-accent-100 rounded-md hover:bg-accent-50 transition-colors text-left cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-accent-800">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Événements */}
          <section className="bg-surface border border-accent-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-accent-100 flex items-center justify-between bg-accent-50/50">
              <h3 className="text-xs font-bold text-accent-900 uppercase tracking-widest">Agenda</h3>
              <button onClick={() => navigate('/contenus/evenements')} className="text-[10px] font-bold text-primary-600 hover:underline">Voir tout</button>
            </div>
            <div className="divide-y divide-accent-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-accent-300">Chargement…</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {dashboard?.prochainEvenements?.slice(0, 4).map((evt: Evenement) => {
                    const d = new Date(evt.dateDebut);
                    return (
                      <div key={evt.id} className="p-4 flex items-center justify-between hover:bg-accent-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border border-accent-200 rounded flex flex-col items-center justify-center bg-surface">
                            <span className="text-[8px] font-bold text-primary-600 uppercase leading-none">{d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '')}</span>
                            <span className="text-sm font-black text-accent-900">{d.getDate()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-accent-800">{evt.titre}</p>
                            <p className="text-[10px] text-accent-400 font-medium">{evt.heure ?? '00:00'} • {evt.lieu ?? 'Temple'}</p>
                          </div>
                        </div>
                        <StatusBadge value={evt.statut} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Barre Latérale Droite */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Verset du Jour — Style Épuré */}
          <section className="bg-primary-900 rounded-lg p-6 text-white border-l-4 border-[#F59E0B]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FBBF24]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FBBF24]/90">Édification</span>
              </div>
              <button onClick={() => navigate('/contenus/versets')} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer text-white/80">
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {versetLoading ? (
              <div className="py-6 text-center text-xs text-white/50">Chargement…</div>
            ) : !verset ? (
              <p className="py-4 text-xs italic text-white/50">Aucun verset programmé.</p>
            ) : (
              <div className="space-y-4">
                <blockquote className="text-base font-bold leading-relaxed italic border-l-2 border-[#F59E0B] pl-4 text-white">
                  &ldquo;{verset.texte}&rdquo;
                </blockquote>
                <div>
                  <p className="text-sm font-bold text-white">{verset.reference}</p>
                  <p className="text-[10px] text-[#FBBF24]/80 font-bold uppercase tracking-widest mt-1">{verset.versionBiblique}</p>
                </div>
                {verset.meditation && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-[11px] leading-relaxed text-white/60 italic">
                      {verset.meditation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Urgences */}
          <section className="bg-surface border border-accent-200 rounded-lg p-5">
            <h3 className="text-xs font-bold text-accent-900 uppercase tracking-widest mb-4 border-b border-accent-100 pb-3">En attente</h3>
            <div className="space-y-2">
              {[
                { label: 'Requêtes prière', count: dashboard?.totalRequetesEnAttente, to: '/interactions/prieres', icon: HandHeart, color: 'bg-[#F59E0B]/15 text-[#F59E0B]' },
                { label: 'Rendez-vous', count: dashboard?.totalRendezVousEnAttente, to: '/interactions/rendezvous', icon: CalendarCheck, color: 'bg-primary-50 text-primary-700' },
                { label: 'Messages non lus', count: dashboard?.totalMessagesNonLus, to: '/interactions/messagerie', icon: MessageSquare, color: 'bg-[#C026D3]/15 text-[#C026D3]' },
              ].map((item) => (
                <div key={item.to} onClick={() => navigate(item.to)} className="flex items-center justify-between p-3 rounded-md border border-accent-100 hover:bg-accent-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-accent-400" />
                    <span className="text-xs font-bold text-accent-700">{item.label}</span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${item.color}`}>{item.count ?? 0}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
