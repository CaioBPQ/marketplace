'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
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
      const userJson = localStorage.getItem('automarket-user');

      if (!userJson) {
        setHasToken(false);
        setUser(null);
        return;
      }

      const parsed = JSON.parse(userJson) as User;
      if (parsed && parsed.role && parsed.role !== 'USUARIO') {
        setHasToken(true);
        setUser(parsed);
      } else {
        setHasToken(false);
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
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Prossegue com limpeza local mesmo se a requisição falhar
    } finally {
      localStorage.removeItem('automarket-user');
      window.dispatchEvent(new Event('automarket-auth-change'));
      setHasToken(false);
      setUser(null);
      setMobileOpen(false);
      setLoggingOut(false);
      toast.success('Sessão administrativa encerrada.');
      router.push('/');
      router.refresh();
    }
  };

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

        {/* Ação Administrativa Simplificada (Strapi CMS Bridge) */}
        <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
          {!mounted ? (
            <div className="h-9 w-36 animate-pulse rounded-editorial bg-stone" />
          ) : hasToken ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-editorial bg-obsidian px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-canvas transition-colors duration-300 hover:bg-bronze-500"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-bronze-300" />
                Painel Strapi
              </Link>
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
            <Link
              href="/login"
              title="Acesso Administrativo via Strapi CMS"
              className="inline-flex items-center gap-1.5 rounded-editorial border border-hairline bg-surface px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary transition-colors duration-300 hover:border-ink hover:text-ink"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-bronze-500" />
              Gestão Strapi
            </Link>
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
                <div className="flex items-center justify-between rounded-editorial border border-hairline bg-canvas px-3.5 py-2 text-xs text-ink-secondary">
                  <span>Gestor autenticado: <strong className="text-ink">{user?.nome || 'Admin Strapi'}</strong></span>
                </div>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-editorial bg-obsidian px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-bronze-500"
                >
                  <LayoutDashboard className="h-4 w-4 text-bronze-300" />
                  Acessar Painel Strapi
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-editorial border border-danger-500/30 bg-danger-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger-700 transition-colors hover:bg-danger-500 hover:text-white disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar Sessão
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-editorial border border-hairline bg-canvas px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink"
              >
                <ShieldCheck className="h-4 w-4 text-bronze-500" />
                Acesso Administrativo (Strapi)
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
