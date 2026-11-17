'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCompanyBrand } from '@/lib/company-brand';
import {
  Car,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const brand = useCompanyBrand();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    if (nome.trim().length < 2) {
      setErroValidacao('Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (senha.length < 6) {
      setErroValidacao('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErroValidacao('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        nome: nome.trim(),
        email: email.trim(),
        senha,
        telefone: telefone.replace(/\D/g, ''),
        role: 'USUARIO',
      };

      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.error || 'Não foi possível concluir o cadastro.';
        setErroValidacao(msg);
        toast.error(msg);
        return;
      }

      localStorage.setItem('automarket-token', json.token);
      localStorage.setItem('automarket-user', JSON.stringify(json.user));
      window.dispatchEvent(new Event('automarket-auth-change'));

      toast.success('Conta de cliente criada com sucesso!');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Erro de conexão ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col justify-center items-center p-4 sm:p-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-3 text-canvas mb-7 group"
      >
        <div className="w-10 h-10 rounded-editorial border border-obsidian-border bg-obsidian-soft text-bronze-300 flex items-center justify-center transition-colors group-hover:border-bronze-400">
          <Car className="w-5 h-5" />
        </div>
        <span className="text-2xl font-serif font-semibold tracking-tight">
          {brand.nome}
        </span>
      </Link>

      <div className="w-full max-w-lg bg-surface rounded-card border border-hairline p-7 sm:p-9">
        <div className="text-center mb-6 pb-5 border-b border-hairline">
          <span className="eyebrow text-bronze-600">Cadastro de Cliente</span>
          <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
            Criar minha conta
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Acompanhe propostas, agende revisões e salve seus veículos de interesse
          </p>
        </div>

        {erroValidacao && (
          <div className="mb-4 p-3.5 rounded-editorial bg-danger-50 border border-danger-500/30 text-xs font-medium text-danger-700">
            {erroValidacao}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
              Nome Completo *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full pl-10 pr-4 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-ink focus:bg-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                E-mail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="11999999999"
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>
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
                Criando conta...
              </>
            ) : (
              <>
                Finalizar Cadastro
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 p-3 rounded-editorial bg-canvas border border-hairline flex items-center gap-2.5 text-[11px] text-ink-secondary">
          <ShieldCheck className="w-4 h-4 text-bronze-500 shrink-0" />
          <span>
            Contas de <strong>Vendedores Internos</strong> e <strong>Administração</strong> são credenciadas diretamente pela gestão da empresa.
          </span>
        </div>

        <p className="text-center text-xs text-ink-secondary mt-5">
          Já possui uma conta?{' '}
          <Link
            href="/login"
            className="font-semibold text-bronze-600 hover:text-ink transition-colors"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
