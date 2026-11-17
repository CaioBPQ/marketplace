'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface LeadFormProps {
  veiculoId: string;
  veiculoNome: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface QueroEsseCarroInlineProps {
  veiculoId: string;
  veiculoNome: string;
  lojaNome?: string;
}

function formatarTelefoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface SharedLeadFieldsProps {
  veiculoId: string;
  veiculoNome: string;
  origem: 'FORMULARIO' | 'SITE';
  compact?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
}

function SharedLeadFields({
  veiculoId,
  veiculoNome,
  origem,
  compact = false,
  submitLabel = 'Enviar Proposta',
  onSuccess,
}: SharedLeadFieldsProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState(
    `Olá! Tenho interesse no ${veiculoNome}. Gostaria de mais informações e condições.`
  );
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setMensagem(
      `Olá! Tenho interesse no ${veiculoNome}. Gostaria de mais informações e condições.`
    );
  }, [veiculoNome]);

  useEffect(() => {
    try {
      const userJson = localStorage.getItem('automarket-user');
      if (userJson) {
        const parsed = JSON.parse(userJson) as {
          nome?: string;
          email?: string;
        };
        if (parsed.nome) setNome((prev) => prev || parsed.nome || '');
        if (parsed.email) setEmail((prev) => prev || parsed.email || '');
      }
    } catch {
      // Ignora erro de leitura do localStorage
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();
    const telefoneDigitos = telefone.replace(/\D/g, '');

    if (nomeLimpo.length < 2) {
      setErro('Informe seu nome completo (mínimo 2 caracteres).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErro('Informe um e-mail válido.');
      return;
    }

    if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) {
      setErro('Informe um telefone ou WhatsApp válido com DDD.');
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = localStorage.getItem('automarket-token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: nomeLimpo,
          email: emailLimpo,
          telefone: telefone.trim(),
          mensagem: mensagem.trim() || undefined,
          veiculoId,
          origem,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msgErro =
          data.error || 'Não foi possível enviar seu interesse. Tente novamente.';
        setErro(msgErro);
        toast.error(msgErro);
        return;
      }

      setEnviado(true);
      toast.success('Proposta enviada! A loja responderá em breve.');
      onSuccess?.();
    } catch {
      const msgErro = 'Erro de conexão. Verifique sua internet e tente novamente.';
      setErro(msgErro);
      toast.error(msgErro);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="rounded-editorial border border-sage-600/30 bg-sage-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-sage-700" />
        <h4 className="mt-3 font-serif text-xl font-semibold text-ink">
          Interesse enviado com sucesso
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-ink-secondary sm:text-sm">
          Um consultor recebeu seus dados sobre{' '}
          <strong className="font-semibold text-ink">{veiculoNome}</strong> e
          entrará em contato rapidamente.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="mt-4 inline-flex items-center justify-center rounded-editorial border border-hairline bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {erro && (
        <div className="rounded-editorial border border-danger-500/30 bg-danger-50 px-3.5 py-2.5 text-xs font-medium text-danger-700">
          {erro}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
          Nome completo *
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-editorial border border-hairline bg-canvas py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder-ink-muted transition-colors focus:border-ink focus:bg-surface focus:outline-none"
          />
        </div>
      </div>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
            E-mail *
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-editorial border border-hairline bg-canvas py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder-ink-muted transition-colors focus:border-ink focus:bg-surface focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
            WhatsApp / Telefone *
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefoneBR(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full rounded-editorial border border-hairline bg-canvas py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder-ink-muted transition-colors focus:border-ink focus:bg-surface focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
          Mensagem (opcional)
        </label>
        <div className="relative">
          <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
          <textarea
            rows={compact ? 2 : 3}
            maxLength={1000}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Gostaria de simular financiamento ou agendar visita..."
            className="w-full resize-none rounded-editorial border border-hairline bg-canvas py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder-ink-muted transition-colors focus:border-ink focus:bg-surface focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-editorial bg-obsidian px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors duration-300 ease-editorial hover:bg-bronze-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            {submitLabel}
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-sage-700" />
        Seus dados estão protegidos e serão enviados apenas à loja anunciante.
      </p>
    </form>
  );
}

export default function LeadForm({
  veiculoId,
  veiculoNome,
  isOpen,
  onClose,
}: LeadFormProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-obsidian/75 backdrop-blur-sm transition-opacity"
      />

      <div className="animate-slide-up relative z-10 w-full max-w-lg overflow-hidden rounded-card border border-hairline bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-obsidian-border bg-obsidian px-6 py-5 text-canvas">
          <div>
            <span className="eyebrow text-bronze-300">Atendimento Direto</span>
            <h3
              id="lead-modal-title"
              className="mt-1 font-serif text-2xl font-semibold"
            >
              Tenho interesse neste veículo
            </h3>
            <p className="mt-0.5 text-xs text-[#A39D92]">{veiculoNome}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="rounded-editorial border border-obsidian-border p-1.5 text-[#A39D92] transition-colors hover:border-bronze-400 hover:text-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <SharedLeadFields
            veiculoId={veiculoId}
            veiculoNome={veiculoNome}
            origem="FORMULARIO"
            submitLabel="Enviar Interesse"
          />
        </div>
      </div>
    </div>
  );
}

export function QueroEsseCarroInline({
  veiculoId,
  veiculoNome,
  lojaNome,
}: QueroEsseCarroInlineProps) {
  return (
    <section className="rounded-card border border-hairline bg-surface p-6 sm:p-7">
      <div className="mb-5 border-b border-hairline pb-4">
        <span className="eyebrow text-bronze-600">Resposta Rápida</span>
        <h3 className="mt-1.5 font-serif text-2xl font-semibold text-ink">
          Quero esse carro
        </h3>
        <p className="mt-1 text-xs text-ink-secondary">
          {lojaNome
            ? `Fale diretamente com ${lojaNome} para simular financiamento ou agendar visita.`
            : 'Receba uma proposta personalizada da loja anunciante.'}
        </p>
      </div>

      <SharedLeadFields
        veiculoId={veiculoId}
        veiculoNome={veiculoNome}
        origem="SITE"
        compact
        submitLabel="Quero receber uma proposta"
      />
    </section>
  );
}
