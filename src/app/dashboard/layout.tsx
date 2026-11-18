'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCompanyBrand } from '@/lib/company-brand';
import { User, Loja } from '@/types';
import {
  LayoutDashboard,
  Car,
  Users,
  Store,
  CreditCard,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Loader2,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';

interface MeResponse extends User {
  loja?: Loja | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Painel & Balanço', icon: LayoutDashboard },
  { href: '/dashboard/veiculos', label: 'Catálogo & Fotos', icon: Car },
  { href: '/dashboard/leads', label: 'Leads & Propostas', icon: Users },
  { href: '/dashboard/loja', label: 'Personalizar & Agenda', icon: Store },
  { href: '/perfil', label: 'Meu Perfil', icon: UserCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const brand = useCompanyBrand();

  const [user, setUser] = useState<MeResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function verificarAuth() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!res.ok) {
          localStorage.removeItem('automarket-user');
          router.replace(`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
          return;
        }

        const json = await res.json();
        if (ativo && json.success && json.data) {
          const userData: MeResponse = json.data;
          if (userData.role !== 'LOJISTA' && userData.role !== 'ADMIN') {
            toast.error('Área exclusiva para lojistas e administradores.');
            router.replace('/');
            return;
          }
          setUser(userData);
        }
      } catch {
        if (ativo) {
          router.replace('/login');
        }
      } finally {
        if (ativo) setChecking(false);
      }
    }

    verificarAuth();
    return () => {
      ativo = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignora erro de rede ao limpar sessão
    }
    localStorage.removeItem('automarket-user');
    window.dispatchEvent(new Event('automarket-auth-change'));
    toast.success('Sessão encerrada.');
    router.push('/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-bronze-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
          Carregando portal do lojista...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-obsidian/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Obsidian */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-obsidian text-canvas border-r border-obsidian-border flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-obsidian-border">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-editorial border border-obsidian-border bg-obsidian-soft text-bronze-300 flex items-center justify-center shrink-0 overflow-hidden">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Car className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-serif font-semibold text-lg tracking-tight block leading-none truncate">
                {brand.nome}
              </span>
              <span className="text-[9px] text-[#8C867B] uppercase tracking-[0.18em]">
                Gestão da Empresa
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-editorial border border-obsidian-border text-[#A39D92] hover:text-canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info da Loja ou Administração */}
        {user?.role === 'ADMIN' ? (
          <div className="mx-4 mt-5 p-3.5 rounded-editorial bg-obsidian-soft border border-bronze-400/40">
            <p className="font-serif text-base font-semibold text-canvas truncate">
              Administração Central
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-bronze-300">
                Acesso Global
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-editorial font-semibold uppercase tracking-wider bg-bronze-500/20 text-bronze-300 border border-bronze-400/40">
                <ShieldCheck className="w-2.5 h-2.5" />
                Admin
              </span>
            </div>
          </div>
        ) : (
          user?.loja && (
            <div className="mx-4 mt-5 p-3.5 rounded-editorial bg-obsidian-soft border border-obsidian-border">
              <p className="font-serif text-base font-semibold text-canvas truncate">
                {user.loja.nome}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-bronze-300">
                  Plano {user.loja.plano}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-editorial font-semibold uppercase tracking-wider ${
                    user.loja.assinaturaAtiva
                      ? 'bg-sage-800/70 text-[#B8D7C4] border border-sage-600/40'
                      : 'bg-bronze-900/60 text-bronze-200 border border-bronze-500/30'
                  }`}
                >
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {user.loja.assinaturaAtiva ? 'Ativo' : 'Pendente'}
                </span>
              </div>
            </div>
          )
        )}

        {/* Navegação */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const ativo =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-editorial text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  ativo
                    ? 'bg-bronze-500 text-canvas'
                    : 'text-[#A39D92] hover:bg-obsidian-soft hover:text-canvas'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Links Inferiores */}
        <div className="p-4 border-t border-obsidian-border space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-editorial border border-obsidian-border bg-obsidian-soft hover:border-bronze-400 text-[11px] font-semibold uppercase tracking-wider text-[#D7D1C6] transition-colors"
          >
            <span>Vitrine Pública</span>
            <ExternalLink className="w-3.5 h-3.5 text-bronze-300" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-editorial text-[11px] font-semibold uppercase tracking-wider text-[#D98882] hover:bg-danger-700/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[72px] bg-surface border-b border-hairline px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-editorial border border-hairline text-ink hover:border-ink"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="font-serif font-semibold text-ink text-xl sm:text-2xl truncate">
              {NAV_ITEMS.find((i) =>
                i.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(i.href)
              )?.label || 'Painel Administrativo'}
            </h2>
          </div>

          <Link
            href="/perfil"
            className="flex items-center gap-3 group rounded-editorial px-2.5 py-1.5 border border-transparent hover:border-hairline hover:bg-canvas transition-colors"
            title="Gerenciar Meu Perfil"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-ink leading-tight group-hover:text-bronze-600">
                {user?.nome}
              </p>
              <p className="text-[11px] text-ink-muted">{user?.email}</p>
            </div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.nome}
                className="w-9 h-9 rounded-full object-cover border border-hairline"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-obsidian text-bronze-300 flex items-center justify-center font-serif font-semibold text-sm">
                {user?.nome?.charAt(0).toUpperCase() || 'L'}
              </div>
            )}
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
