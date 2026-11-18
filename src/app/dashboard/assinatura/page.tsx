'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import TransparentCheckoutModal from '@/components/TransparentCheckoutModal';
import { Loja } from '@/types';
import { formatarPreco, LABELS } from '@/lib/utils';
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Crown,
  Zap,
  Loader2,
} from 'lucide-react';

interface PlanoCard {
  key: 'BASICO' | 'PREMIUM' | 'ENTERPRISE';
  nome: string;
  preco: number;
  descricao: string;
  popular?: boolean;
  icon: typeof Zap;
  features: string[];
}

const PLANOS_LISTA: PlanoCard[] = [
  {
    key: 'BASICO',
    nome: 'Básico',
    preco: 99.9,
    descricao: 'Ideal para lojas em início de operação digital',
    icon: Zap,
    features: [
      'Até 10 veículos no catálogo',
      'Recebimento ilimitado de leads',
      'Botão direto de WhatsApp',
      'Perfil completo em Lojas Parceiras',
    ],
  },
  {
    key: 'PREMIUM',
    nome: 'Premium',
    preco: 249.9,
    descricao: 'O equilíbrio perfeito para escalar vendas mensais',
    popular: true,
    icon: Sparkles,
    features: [
      'Até 50 veículos no catálogo',
      '5 destaques mensais inclusos',
      'CRM de leads com funil completo',
      'Agendamento de visitas e serviços',
    ],
  },
  {
    key: 'ENTERPRISE',
    nome: 'Enterprise',
    preco: 499.9,
    descricao: 'Para grandes grupos automotivos e multimarcas',
    icon: Crown,
    features: [
      'Veículos ilimitados no catálogo',
      '20 destaques mensais inclusos',
      'Prioridade máxima nas buscas',
      'Suporte prioritário dedicado',
    ],
  },
];

function AssinaturaContent() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [planoCheckout, setPlanoCheckout] = useState<PlanoCard | null>(null);

  const carregarLoja = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lojas?minha=true', {
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setLoja(json.data);
      }
    } catch {
      toast.error('Erro ao carregar informações da assinatura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarLoja();
  }, [carregarLoja]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-surface rounded-card border border-hairline" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 bg-surface rounded-card border border-hairline" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-hairline">
        <span className="eyebrow text-bronze-600">Faturamento &amp; Planos</span>
        <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
          Assinatura e Planos
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Checkout transparente integrado com ativação automática após confirmação do webhook Stripe.
        </p>
      </div>

      {/* Card do Plano Atual */}
      {loja && (
        <div className="bg-obsidian border border-obsidian-border text-canvas rounded-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-editorial bg-bronze-500 text-canvas flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="eyebrow text-bronze-300">
                Plano Atual da Loja
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold mt-0.5">
                {LABELS.plano[loja.plano] || loja.plano} — {loja.nome}
              </h2>
              <p className="text-xs text-[#A39D92] mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-bronze-300" />
                {loja.assinaturaAtiva
                  ? 'Assinatura ativa e validada por webhook'
                  : 'Assinatura aguardando ativação ou pagamento'}
              </p>
            </div>
          </div>

          <span
            className={`px-3.5 py-1.5 rounded-editorial text-[11px] font-semibold uppercase tracking-wider self-start sm:self-center ${
              loja.assinaturaAtiva
                ? 'bg-sage-800/70 text-[#B8D7C4] border border-sage-600/40'
                : 'bg-bronze-900/60 text-bronze-200 border border-bronze-500/30'
            }`}
          >
            {loja.assinaturaAtiva ? 'Ativa' : 'Inativa'}
          </span>
        </div>
      )}

      {/* Comparação de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANOS_LISTA.map((plano) => {
          const Icon = plano.icon;
          const ehAtual = loja?.plano === plano.key && loja?.assinaturaAtiva;

          return (
            <div
              key={plano.key}
              className={`rounded-card p-7 flex flex-col justify-between border transition-colors ${
                ehAtual
                  ? 'border-sage-700 bg-surface'
                  : plano.popular
                  ? 'border-obsidian bg-surface'
                  : 'border-hairline bg-surface'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div
                    className={`w-10 h-10 rounded-editorial flex items-center justify-center ${
                      plano.popular
                        ? 'bg-obsidian text-bronze-300'
                        : 'bg-canvas border border-hairline text-ink'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {ehAtual ? (
                    <span className="px-2.5 py-0.5 rounded-editorial border border-sage-600/30 bg-sage-50 text-sage-800 text-[10px] font-semibold uppercase tracking-wider">
                      Plano Atual
                    </span>
                  ) : plano.popular ? (
                    <span className="px-2.5 py-0.5 rounded-editorial bg-obsidian text-bronze-300 text-[10px] font-semibold uppercase tracking-wider">
                      Mais Popular
                    </span>
                  ) : null}
                </div>

                <h3 className="text-2xl font-serif font-semibold text-ink">
                  {plano.nome}
                </h3>
                <p className="text-xs text-ink-secondary mt-1">{plano.descricao}</p>

                <div className="my-6 pb-6 border-b border-hairline">
                  <div className="flex items-baseline gap-1 tabular-nums">
                    <span className="text-3xl font-serif font-bold text-ink">
                      {formatarPreco(Math.floor(plano.preco))}
                      <span className="text-lg">
                        ,{String(Math.round((plano.preco % 1) * 100)).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="text-xs text-ink-muted">/mês</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-ink-secondary mb-8">
                  {plano.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-sage-700 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={ehAtual}
                onClick={() => setPlanoCheckout(plano)}
                className={`w-full py-3.5 px-5 rounded-editorial font-semibold text-xs uppercase tracking-[0.14em] transition-colors ${
                  ehAtual
                    ? 'bg-sage-50 text-sage-800 cursor-default border border-sage-600/30'
                    : plano.popular
                    ? 'bg-obsidian hover:bg-bronze-500 text-canvas'
                    : 'bg-canvas border border-hairline hover:border-ink text-ink'
                }`}
              >
                {ehAtual
                  ? 'Plano Ativo'
                  : loja?.assinaturaAtiva
                  ? 'Mudar para este Plano'
                  : 'Assinar Agora'}
              </button>
            </div>
          );
        })}
      </div>

      {planoCheckout && (
        <TransparentCheckoutModal
          isOpen={Boolean(planoCheckout)}
          onClose={() => setPlanoCheckout(null)}
          tipo="ASSINATURA"
          plano={planoCheckout.key}
          titulo={`Assinatura Plano ${planoCheckout.nome}`}
          valor={planoCheckout.preco}
          onSuccess={() => {
            setPlanoCheckout(null);
            carregarLoja();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardAssinaturaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-bronze-500" />
        </div>
      }
    >
      <AssinaturaContent />
    </Suspense>
  );
}
