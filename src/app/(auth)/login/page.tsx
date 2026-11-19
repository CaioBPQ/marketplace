'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import BrandLogo from '@/components/BrandLogo';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Database,
} from 'lucide-react';

const STRAPI_ADMIN_URL =
  (process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337').replace(/\/+$/, '') +
  '/admin';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error || 'Credenciais administrativas incorretas.');
        return;
      }

      localStorage.setItem('automarket-user', JSON.stringify(json.user));
      window.dispatchEvent(new Event('automarket-auth-change'));

      toast.success(
        `Acesso Administrativo autorizado (${
          json.authProvider === 'STRAPI_CMS' ? 'Strapi Headless CMS' : 'Modo Local'
        })`
      );

      // Proteção contra Open Redirect (bloqueia //evil.com e backslashes)
      const isSafeRelativeRedirect =
        Boolean(redirectParam) &&
        redirectParam!.startsWith('/') &&
        !redirectParam!.startsWith('//') &&
        !redirectParam!.includes('\\');

      if (isSafeRelativeRedirect && redirectParam) {
        router.push(redirectParam);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      toast.error('Erro ao conectar ao servidor Strapi. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const preencherDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setSenha('123456');
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col justify-center items-center p-4 sm:p-6">
      <Link
        href="/"
        className="inline-flex items-center text-canvas mb-7 group"
      >
        <BrandLogo variant="dark" size="lg" />
      </Link>

      <div className="w-full max-w-md bg-surface rounded-card border border-hairline p-7 sm:p-9">
        <div className="text-center mb-6 pb-5 border-b border-hairline">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-editorial bg-bronze-100/70 border border-bronze-200 text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze-800 mb-2">
            <Database className="w-3 h-3 text-bronze-600" />
            Strapi Headless CMS • Single Auth
          </span>
          <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
            Acesso Administrativo
          </h1>
          <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
            Autenticação unificada para gestão de estoque, integrações ERP e automação social via Strapi API.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
              E-mail Administrativo (Strapi)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@automarket.com.br"
                className="w-full pl-10 pr-4 py-3 rounded-editorial border border-hairline bg-canvas text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-ink focus:bg-surface"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-editorial border border-hairline bg-canvas text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-ink focus:bg-surface"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                {mostrarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Autenticando no Strapi...
              </>
            ) : (
              <>
                Acessar Painel de Gestão
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Link Direto para o Servidor Strapi Admin */}
        <div className="mt-4">
          <a
            href={STRAPI_ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-editorial border border-hairline bg-canvas hover:border-ink text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-bronze-600" />
            Abrir Console Nativo do Strapi Admin (:1337/admin)
          </a>
        </div>

        {/* Credenciais Administrativas de Demonstração */}
        <div className="mt-6 pt-5 border-t border-hairline">
          <button
            type="button"
            onClick={() => setShowDemo((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-bronze-500" />
              Credenciais de Gestão (Ambiente Demo / Fallback)
            </span>
            {showDemo ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDemo && (
            <div className="mt-3 p-3.5 rounded-editorial bg-canvas border border-hairline space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">Gestor Geral (Strapi Admin Bridge)</p>
                  <p className="text-ink-muted font-mono text-[11px]">
                    admin@automarket.com.br
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => preencherDemo('admin@automarket.com.br')}
                  className="px-2.5 py-1 rounded-editorial bg-obsidian text-canvas text-[11px] font-semibold hover:bg-bronze-500 transition-colors"
                >
                  Preencher
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-hairline">
                <div>
                  <p className="font-semibold text-ink">Operação Comercial (Ricardo Silva)</p>
                  <p className="text-ink-muted font-mono text-[11px]">
                    contato@premiumcarros.com.br
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => preencherDemo('contato@premiumcarros.com.br')}
                  className="px-2.5 py-1 rounded-editorial bg-bronze-100 text-bronze-800 border border-bronze-200 text-[11px] font-semibold hover:bg-bronze-200 transition-colors"
                >
                  Preencher
                </button>
              </div>
              <p className="text-[11px] text-ink-muted pt-1">
                Senha padrão: <strong className="font-mono text-ink">123456</strong>
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 p-3 rounded-editorial bg-canvas/70 border border-hairline flex items-start gap-2.5 text-[11px] text-ink-secondary">
          <ShieldCheck className="w-4 h-4 text-bronze-600 shrink-0 mt-0.5" />
          <span>
            <strong>Nota de Segurança:</strong> O cadastro público de múltiplos perfis (comprador/vendedor) foi eliminado. Clientes utilizam o site, o Concierge IA e o WhatsApp sem necessidade de login.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex items-center justify-center text-canvas">
          <Loader2 className="w-8 h-8 animate-spin text-bronze-300" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
