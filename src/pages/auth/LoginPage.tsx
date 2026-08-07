import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useMutation } from '@apollo/client/react';
import { Navigate, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, ShieldCheck, Users, Bell } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { LOGIN_ADMIN } from '@/graphql/mutations/auth.mutations';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

const schema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  motDePasse: z.string().min(1, 'Le mot de passe est requis'),
});

type FormData = z.infer<typeof schema>;

interface LoginAdminData {
  loginAdmin: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

const FEATURES = [
  { icon: <ShieldCheck className="w-4 h-4" />, label: 'Gestion sécurisée des accès et rôles' },
  { icon: <Users className="w-4 h-4" />,      label: 'Suivi des fidèles et interactions' },
  { icon: <Bell className="w-4 h-4" />,        label: 'Notifications push et messagerie' },
];

export function LoginPage() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const [loginAdmin, { loading }] = useMutation<LoginAdminData>(LOGIN_ADMIN, {
    onCompleted: (data: LoginAdminData) => {
      setAuth(data.loginAdmin);
      toast.success('Connexion réussie');
      void navigate('/dashboard');
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? 'Email ou mot de passe incorrect');
    },
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = (data: FormData) => {
    void loginAdmin({ variables: { email: data.email, motDePasse: data.motDePasse } });
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Colonne gauche — Branding (masquée sur mobile) ─────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-epdc-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        {/* Logo + titre */}
        <div className="relative z-10">
          <img
            src="/assets/logo-eglise-pour-fond-bleu.png"
            alt="Logo"
            className="w-16 h-16 object-contain mb-6"
          />
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
            Porte des Cieux
          </h1>
          <p className="text-white/60 text-sm mt-2">Entrez dans la présence, manifestez la gloire !</p>
          <p className="text-white/40 text-xs mt-1">Kinshasa · Paris · Bruxelles — EPDC / JFT</p>
        </div>

        {/* Points forts */}
        <div className="relative z-10 space-y-4">
          <p className="text-white/40 text-xs uppercase tracking-widest font-medium mb-6">
            Plateforme d'administration
          </p>
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 shrink-0">
                {f.icon}
              </div>
              <span className="text-sm text-white/70">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Footer colonne */}
        <p className="relative z-10 text-white/30 text-xs">
          Porte des Cieux — Administration
        </p>
      </div>

      {/* ── Colonne droite — Formulaire ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-accent-50 p-6 sm:p-10">

        {/* Logo mobile uniquement */}
        <div className="flex flex-col items-center mb-8 lg:hidden">
          <img
            src="/assets/logo-eglise-pour-fond-bleu.png"
            alt="Logo"
            className="w-20 h-20 object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-accent-900 uppercase tracking-tight">Porte des Cieux</h1>
          <p className="text-xs text-accent-400 mt-1">Interface d'administration</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-accent-900">Connexion</h2>
            <p className="text-sm text-accent-400 mt-1">Accès réservé aux administrateurs</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-accent-700 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@portedescieux.org"
                {...register('email')}
                className="w-full px-3 py-2.5 text-sm border border-accent-200 rounded-lg bg-white text-accent-900 placeholder-accent-300 outline-none focus:border-primary-500 transition-colors"
              />
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="motDePasse" className="block text-xs font-medium text-accent-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('motDePasse')}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-accent-200 rounded-lg bg-white text-accent-900 placeholder-accent-300 outline-none focus:border-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-400 hover:text-accent-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.motDePasse && (
                <p className="text-[11px] text-red-500 mt-1">{errors.motDePasse.message}</p>
              )}
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-xs text-accent-300 mt-10">
          Porte des Cieux — Administration
        </p>
      </div>

    </div>
  );
}
