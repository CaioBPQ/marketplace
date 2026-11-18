'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatarPreco } from '@/lib/utils';

export interface TransparentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'ASSINATURA' | 'DESTAQUE_VEICULO';
  plano?: string;
  veiculoId?: string;
  titulo: string;
  valor: number;
  onSuccess: () => void;
}

type CheckoutStep = 'form' | 'creating' | 'webhook' | 'success';

function formatarNumeroCartao(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatarValidade(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatarCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9
  )}-${digits.slice(9)}`;
}

function formatarValorBRL(valor: number): string {
  if (valor % 1 === 0) {
    return formatarPreco(valor);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function detectarBandeira(digits: string): string {
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(digits)) {
    return 'Elo';
  }
  return 'Cartão';
}

export default function TransparentCheckoutModal({
  isOpen,
  onClose,
  tipo,
  plano,
  veiculoId,
  titulo,
  valor,
  onSuccess,
}: TransparentCheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('form');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState('');
  const [transacaoInfo, setTransacaoInfo] = useState<{
    mode?: string;
    paymentIntentId?: string;
  } | null>(null);

  const emProcessamento = step === 'creating' || step === 'webhook';

  const limparDadosSensiveisCartao = () => {
    setNumeroCartao('');
    setNomeTitular('');
    setValidade('');
    setCvv('');
    setCpf('');
  };

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErro('');
      setTransacaoInfo(null);
    } else {
      limparDadosSensiveisCartao();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !emProcessamento) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, emProcessamento, onClose]);

  if (!isOpen) return null;

  const cardDigits = numeroCartao.replace(/\D/g, '');
  const bandeira = detectarBandeira(cardDigits);

  const validarCartao = (): string | null => {
    if (cardDigits.length < 13 || cardDigits.length > 16) {
      return 'Número do cartão inválido. Informe entre 13 e 16 dígitos.';
    }
    if (nomeTitular.trim().length < 3) {
      return 'Informe o nome completo impresso no cartão.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(validade)) {
      return 'Validade inválida. Utilize o formato MM/AA.';
    }
    const [mesStr, anoStr] = validade.split('/');
    const agora = new Date();
    const anoAtual2Digitos = agora.getFullYear() % 100;
    const mesAtual = agora.getMonth() + 1;
    const anoNum = parseInt(anoStr, 10);
    const mesNum = parseInt(mesStr, 10);
    if (
      anoNum < anoAtual2Digitos ||
      (anoNum === anoAtual2Digitos && mesNum < mesAtual)
    ) {
      return 'Este cartão está com a validade expirada.';
    }
    if (cvv.replace(/\D/g, '').length < 3) {
      return 'Código de segurança (CVV) inválido.';
    }
    if (cpf.replace(/\D/g, '').length !== 11) {
      return 'Informe um CPF válido com 11 dígitos.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');

    // Trava PCI-DSS: bloqueia captura direta em DOM no ambiente de produção real sem tokenização Stripe Elements
    const isStaticDemoHost =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('github.io') ||
        process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true');
    if (
      process.env.NODE_ENV === 'production' &&
      !isStaticDemoHost &&
      process.env.NEXT_PUBLIC_STRIPE_TOKENIZED_ENABLED !== 'true'
    ) {
      const msg =
        'Checkout manual bloqueado em produção por conformidade PCI-DSS. Utilize Stripe Elements tokenizado.';
      setErro(msg);
      toast.error(msg);
      limparDadosSensiveisCartao();
      return;
    }

    const erroValidacao = validarCartao();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const last4 = cardDigits.slice(-4);

    try {
      setStep('creating');

      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo,
          plano,
          veiculoId,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.success) {
        throw new Error(
          checkoutData.error || 'Falha ao iniciar pagamento transparente.'
        );
      }

      setTransacaoInfo({
        mode: checkoutData.mode,
        paymentIntentId: checkoutData.paymentIntentId,
      });

      setStep('webhook');

      const confirmRes = await fetch('/api/stripe/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: checkoutData.paymentIntentId,
          transacaoId: checkoutData.transacaoId,
          cardLast4: last4,
          cardBrand: bandeira,
        }),
      });

      const confirmData = await confirmRes.json();

      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(
          confirmData.error ||
            'Não foi possível confirmar o pagamento via Webhook.'
        );
      }

      limparDadosSensiveisCartao();
      setStep('success');
      toast.success('Pagamento confirmado via Webhook! Benefício ativado.');
      onSuccess();
    } catch (err) {
      limparDadosSensiveisCartao();
      const message =
        err instanceof Error
          ? err.message
          : 'Erro inesperado ao processar o pagamento.';
      setStep('form');
      setErro(message);
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div
        onClick={() => !emProcessamento && onClose()}
        className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm transition-opacity"
      />

      <div className="animate-slide-up relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-card border border-hairline bg-surface shadow-2xl">
        {/* Cabeçalho Obsidian */}
        <div className="flex items-start justify-between border-b border-obsidian-border bg-obsidian px-6 py-5 text-canvas">
          <div>
            <span className="eyebrow inline-flex items-center gap-1.5 text-bronze-300">
              <Lock className="h-3 w-3" />
              Checkout Transparente
            </span>
            <h2
              id="checkout-modal-title"
              className="mt-1 font-serif text-2xl font-semibold"
            >
              Finalizar Pagamento
            </h2>
          </div>
          {!emProcessamento && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar checkout"
              className="rounded-editorial border border-obsidian-border p-1.5 text-[#A39D92] transition-colors hover:border-bronze-400 hover:text-canvas"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Resumo do Item */}
        <div className="border-b border-hairline bg-stone px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-ink-muted">
                {tipo === 'ASSINATURA'
                  ? 'Assinatura Mensal'
                  : 'Impulsionamento de Anúncio'}
              </p>
              <p className="mt-0.5 truncate font-serif text-xl font-semibold text-ink">
                {titulo}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-serif text-2xl font-bold tabular-nums text-ink">
                {formatarValorBRL(valor)}
              </span>
              {tipo === 'ASSINATURA' && (
                <span className="block text-[11px] text-ink-muted">/mês</span>
              )}
            </div>
          </div>
        </div>

        {/* Corpo dinâmico */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {erro && (
                <div className="flex items-start gap-2 rounded-editorial border border-danger-500/30 bg-danger-50 px-3.5 py-3 text-xs font-medium text-danger-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                    Número do Cartão *
                  </label>
                  <span className="rounded-editorial border border-hairline bg-stone px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                    {bandeira}
                  </span>
                </div>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={numeroCartao}
                    onChange={(e) =>
                      setNumeroCartao(formatarNumeroCartao(e.target.value))
                    }
                    placeholder="0000 0000 0000 0000"
                    className="w-full rounded-editorial border border-hairline bg-canvas py-2.5 pl-10 pr-4 font-mono text-sm text-ink placeholder-ink-muted focus:border-ink focus:bg-surface focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                  Nome impresso no cartão *
                </label>
                <input
                  type="text"
                  autoComplete="cc-name"
                  value={nomeTitular}
                  onChange={(e) => setNomeTitular(e.target.value.toUpperCase())}
                  placeholder="COMO ESTÁ NO CARTÃO"
                  className="w-full rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5 text-sm uppercase text-ink placeholder-ink-muted focus:border-ink focus:bg-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                    Validade *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={validade}
                    onChange={(e) =>
                      setValidade(formatarValidade(e.target.value))
                    }
                    placeholder="MM/AA"
                    className="w-full rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink placeholder-ink-muted focus:border-ink focus:bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                    CVV *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="cc-csc"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="123"
                    className="w-full rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink placeholder-ink-muted focus:border-ink focus:bg-surface focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                    CPF do titular *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink placeholder-ink-muted focus:border-ink focus:bg-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-editorial border border-sage-600/25 bg-sage-50 px-3.5 py-2.5 text-xs font-medium text-sage-800">
                <ShieldCheck className="h-4 w-4 shrink-0 text-sage-700" />
                <span>Criptografia SSL + Confirmação via Webhook Stripe</span>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-editorial bg-obsidian px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors duration-300 hover:bg-bronze-500"
              >
                <Lock className="h-3.5 w-3.5 text-bronze-300" />
                Pagar {formatarValorBRL(valor)} com Segurança
              </button>
            </form>
          )}

          {emProcessamento && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-editorial border border-hairline bg-canvas text-bronze-500">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>

              <h3 className="mt-4 font-serif text-2xl font-semibold text-ink">
                {step === 'creating'
                  ? 'Processando pagamento...'
                  : 'Aguardando confirmação do Webhook...'}
              </h3>
              <p className="mt-1 text-sm text-ink-secondary">
                {step === 'creating'
                  ? 'Validando os dados do cartão com o gateway seguro.'
                  : 'Verificando assinatura criptográfica para liberar seu recurso.'}
              </p>

              <div className="mx-auto mt-6 max-w-xs space-y-2 text-left text-xs">
                <div className="flex items-center gap-2.5 rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5">
                  {step === 'creating' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-bronze-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-sage-700" />
                  )}
                  <span className="font-semibold text-ink">
                    1. Criando intenção de pagamento
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-editorial border border-hairline bg-canvas px-3.5 py-2.5">
                  {step === 'webhook' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-bronze-500" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-hairline" />
                  )}
                  <span
                    className={
                      step === 'webhook' ? 'font-semibold text-ink' : 'text-ink-muted'
                    }
                  >
                    2. Confirmando via Webhook Stripe
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-editorial border border-sage-600/30 bg-sage-50 text-sage-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-editorial border border-sage-600/25 bg-sage-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-800">
                <Sparkles className="h-3 w-3" />
                Webhook Confirmado
              </div>

              <h3 className="mt-3 font-serif text-2xl font-semibold text-ink">
                Ativado com sucesso
              </h3>
              <p className="mt-1.5 text-sm text-ink-secondary">
                Seu pagamento de{' '}
                <strong className="text-ink">{formatarValorBRL(valor)}</strong>{' '}
                para <strong className="text-ink">{titulo}</strong> foi validado e
                ativado.
              </p>

              {transacaoInfo?.paymentIntentId && (
                <p className="mt-3 rounded-editorial border border-hairline bg-canvas px-3 py-1.5 font-mono text-[11px] text-ink-muted">
                  ID da Transação: {transacaoInfo.paymentIntentId}
                </p>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-editorial bg-obsidian px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-bronze-500"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
