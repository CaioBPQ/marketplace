'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Car,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  KeyRound,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

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
        toast.error(json.error || 'E-mail ou senha incorretos.');
        return;
      }

      localStorage.setItem('automarket-token', json.token);
      localStorage.setItem('automarket-user', JSON.stringify(json.user));
      window.dispatchEvent(new Event('automarket-auth-change'));

      toast.success(`Bem-vindo(a), ${json.user.nome}!`);

      if (redirectParam && redirectParam.startsWith('/')) {
        router.push(redirectParam);
      } else if (json.user.role === 'LOJISTA' || json.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      toast.error('Erro ao conectar ao servidor. Tente novamente.');
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
        className="inline-flex items-center gap-3 text-canvas mb-8 group"
      >
        <div className="w-10 h-10 rounded-editorial border border-obsidian-border bg-obsidian-soft text-bronze-300 flex items-center justify-center transition-colors group-hover:border-bronze-400">
          <Car className="w-5 h-5" />
        </div>
        <span className="text-2xl font-serif font-semibold tracking-tight">
          Auto<span className="italic text-bronze-300">Market</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-surface rounded-card border border-hairline p-7 sm:p-9">
        <div className="text-center mb-7 pb-5 border-b border-hairline">
          <span className="eyebrow text-bronze-600">Acesso Seguro</span>
          <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
            Acesse sua conta
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Entre para gerenciar sua loja, perfil ou acompanhar propostas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
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
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Credenciais de Demonstração */}
        <div className="mt-6 pt-5 border-t border-hairline">
          <button
            type="button"
            onClick={() => setShowDemo((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-bronze-500" />
              Contas de demonstração para teste rápido
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
                  <p className="font-semibold text-ink">Vendedor da Equipe (Ricardo Silva)</p>
                  <p className="text-ink-muted font-mono text-[11px]">
                    contato@premiumcarros.com.br
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => preencherDemo('contato@premiumcarros.com.br')}
                  className="px-2.5 py-1 rounded-editorial bg-obsidian text-canvas text-[11px] font-semibold hover:bg-bronze-500 transition-colors"
                >
                  Usar
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-hairline">
                <div>
                  <p className="font-semibold text-ink">Cliente / Comprador</p>
                  <p className="text-ink-muted font-mono text-[11px]">joao@email.com</p>
                </div>
                <button
                  type="button"
                  onClick={() => preencherDemo('joao@email.com')}
                  className="px-2.5 py-1 rounded-editorial border border-hairline bg-surface text-ink text-[11px] font-semibold hover:border-ink transition-colors"
                >
                  Usar
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-hairline">
                <div>
                  <p className="font-semibold text-ink">Administrador da Empresa</p>
                  <p className="text-ink-muted font-mono text-[11px]">
                    admin@automarket.com.br
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => preencherDemo('admin@automarket.com.br')}
                  className="px-2.5 py-1 rounded-editorial bg-bronze-100 text-bronze-800 border border-bronze-200 text-[11px] font-semibold hover:bg-bronze-200 transition-colors"
                >
                  Usar
                </button>
              </div>
              <p className="text-[11px] text-ink-muted pt-1">
                Senha padrão: <strong className="font-mono text-ink">123456</strong>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-secondary mt-6">
          Ainda não tem uma conta?{' '}
          <Link
            href="/registro"
            className="font-semibold text-bronze-600 hover:text-ink transition-colors"
          >
            Cadastre-se grátis
          </Link>
        </p>
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
