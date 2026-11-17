'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  User as UserIcon,
  UserPlus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCompanyBrand } from '@/lib/company-brand';
import type { User } from '@/types/index';

interface NavItem {
  label: string;
  href: string;
}

const NAV_LINKS: NavItem[] = [
  { label: 'Início', href: '/' },
  { label: 'Estoque', href: '/veiculos' },
  { label: 'Ofertas', href: '/ofertas' },
  { label: 'Showroom & Contato', href: '/concessionarias' },
  { label: 'Pós-Venda & Serviços', href: '/servicos' },
  { label: 'A Empresa', href: '/sobre' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const brand = useCompanyBrand();
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const syncAuthState = () => {
    try {
      const token = localStorage.getItem('automarket-token');
      const userJson = localStorage.getItem('automarket-user');

      if (!token) {
        setHasToken(false);
        setUser(null);
        return;
      }

      setHasToken(true);
      if (userJson) {
        const parsed = JSON.parse(userJson) as User;
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch {
      setHasToken(false);
      setUser(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    syncAuthState();

    const handleAuthChange = () => syncAuthState();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('automarket-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('automarket-auth-change', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    syncAuthState();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Prossegue com limpeza local mesmo se a requisição falhar
    } finally {
      localStorage.removeItem('automarket-token');
      localStorage.removeItem('automarket-user');
      document.cookie = 'automarket-token=; path=/; max-age=0';
      window.dispatchEvent(new Event('automarket-auth-change'));
      setHasToken(false);
      setUser(null);
      setMobileOpen(false);
      setLoggingOut(false);
      toast.success('Sessão encerrada com sucesso.');
      router.push('/');
      router.refresh();
    }
  };

  const displayName = user?.nome ? user.nome.split(' ')[0] : 'Minha Conta';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/92 backdrop-blur-xl transition-colors duration-300 ease-editorial">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Marca Editorial Personalizável */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 focus:outline-none"
        >
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.nome}
              className="h-9 w-9 rounded-editorial object-cover border border-hairline"
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-editorial border border-obsidian bg-obsidian text-canvas transition-colors duration-300"
              style={{ color: 'var(--accent-bronze-light)' }}
            >
              <Car className="h-4 w-4" />
            </span>
          )}
          <span className="font-serif text-2xl font-semibold tracking-tight text-ink">
            {brand.nome}
          </span>
        </Link>

        {/* Navegação Desktop */}
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 lg:flex"
        >
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 whitespace-nowrap ${
                  active
                    ? 'text-ink after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:bg-bronze-500'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Ações de Autenticação Desktop */}
        <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
          {!mounted ? (
            <div className="h-9 w-44 animate-pulse rounded-editorial bg-stone" />
          ) : hasToken ? (
            <>
              <Link
                href="/perfil"
                title="Gerenciar Meu Perfil"
                className={`inline-flex items-center gap-2 rounded-editorial border px-3 py-1.5 text-xs font-semibold transition-colors duration-300 ${
                  isActive('/perfil')
                    ? 'border-ink bg-stone text-ink'
                    : 'border-hairline bg-surface text-ink hover:border-ink'
                }`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-6 w-6 rounded-full object-cover border border-hairline"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-obsidian text-[11px] font-semibold text-canvas">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
                  </span>
                )}
                <span className="max-w-[110px] truncate">{displayName}</span>
              </Link>
              {(user?.role === 'LOJISTA' || user?.role === 'ADMIN') && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-editorial bg-obsidian px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-canvas transition-colors duration-300 hover:bg-bronze-500"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-bronze-300" />
                  {user?.role === 'ADMIN' ? 'Painel Admin' : 'Painel'}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 rounded-editorial border border-hairline bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-secondary transition-colors duration-300 hover:border-danger-500 hover:text-danger-700 disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-editorial border border-hairline bg-surface px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors duration-300 hover:border-ink"
              >
                <LogIn className="h-3.5 w-3.5 text-bronze-500" />
                Entrar
              </Link>
              <Link
                href="/registro"
                className="inline-flex items-center gap-1.5 rounded-editorial bg-obsidian px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-canvas transition-colors duration-300 hover:bg-bronze-500"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Cadastre-se
              </Link>
            </>
          )}
        </div>

        {/* Botão Menu Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          className="inline-flex items-center justify-center rounded-editorial border border-hairline bg-surface p-2 text-ink transition-colors hover:border-ink lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu Mobile Slide-down */}
      {mobileOpen && (
        <div className="animate-slide-down border-t border-hairline bg-surface px-4 pb-6 pt-4 lg:hidden">
          <nav aria-label="Navegação mobile" className="flex flex-col divide-y divide-hairline/70">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                    active ? 'text-bronze-600' : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-hairline pt-4">
            {hasToken ? (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/perfil"
                  className="flex items-center justify-between gap-2 rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5 text-sm font-medium text-ink"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.nome || 'Usuário'}
                        className="h-7 w-7 rounded-full object-cover border border-hairline"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-bronze-500" />
                    )}
                    <span className="truncate">Olá, {user?.nome || 'Usuário'}</span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-bronze-600">
                    Meu Perfil
                  </span>
                </Link>
                {(user?.role === 'LOJISTA' || user?.role === 'ADMIN') && (
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-editorial bg-obsidian px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-bronze-500"
                  >
                    <LayoutDashboard className="h-4 w-4 text-bronze-300" />
                    {user?.role === 'ADMIN' ? 'Acessar Painel Admin' : 'Acessar Painel da Loja'}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-editorial border border-danger-500/30 bg-danger-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger-700 transition-colors hover:bg-danger-500 hover:text-white disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 rounded-editorial border border-hairline bg-canvas px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink"
                >
                  <LogIn className="h-3.5 w-3.5 text-bronze-500" />
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="flex items-center justify-center gap-1.5 rounded-editorial bg-obsidian px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Cadastre-se
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
