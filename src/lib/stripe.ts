// ═══════════════════════════════════════════════════════════
// PILAR III - MONETIZAÇÃO: Integração Stripe
// Gateway de pagamento para assinaturas e destaques de lojistas
// Suporta modo Stripe real e Checkout Transparente Sandbox
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe';
import crypto from 'crypto';

// Preço unitário para destacar anúncio de veículo individualmente
export const DESTAQUE_VEICULO_PRECO = 49.90;

// Verifica se há uma chave real do Stripe configurada no ambiente
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return Boolean(
    key &&
    !key.includes('SuaChave') &&
    !key.includes('...') &&
    key.startsWith('sk_')
  );
}

// Inicializa o cliente Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_sandbox_placeholder', {
  apiVersion: '2024-10-28.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});

// ─── Planos de Assinatura ─────────────────────────────────
export const PLANOS = {
  BASICO: {
    nome: 'Básico',
    preco: 99.90,
    maxVeiculos: 10,
    destaques: 0,
    descricao: 'Até 10 veículos no catálogo',
    stripePriceId: process.env.STRIPE_PRICE_BASICO || '',
  },
  PREMIUM: {
    nome: 'Premium',
    preco: 249.90,
    maxVeiculos: 50,
    destaques: 5,
    descricao: 'Até 50 veículos + 5 destaques mensais',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || '',
  },
  ENTERPRISE: {
    nome: 'Enterprise',
    preco: 499.90,
    maxVeiculos: -1, // Ilimitado
    destaques: 20,
    descricao: 'Veículos ilimitados + 20 destaques + suporte prioritário',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
  },
} as const;

export type PlanoKey = keyof typeof PLANOS;

// ─── Criar PaymentIntent para Checkout Transparente ───────
export async function criarPaymentIntentTransparente(params: {
  lojaId: string;
  tipo: 'ASSINATURA' | 'DESTAQUE_VEICULO';
  valor: number;
  descricao: string;
  email: string;
  plano?: string;
  veiculoId?: string;
}): Promise<{
  mode: 'stripe' | 'sandbox';
  clientSecret: string;
  paymentIntentId: string;
}> {
  if (isStripeConfigured()) {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(params.valor * 100),
      currency: 'brl',
      receipt_email: params.email,
      description: params.descricao,
      automatic_payment_methods: { enabled: true },
      metadata: {
        lojaId: params.lojaId,
        tipo: params.tipo,
        plano: params.plano || '',
        veiculoId: params.veiculoId || '',
      },
    });

    return {
      mode: 'stripe',
      clientSecret: intent.client_secret || '',
      paymentIntentId: intent.id,
    };
  }

  // Modo Sandbox: gera PaymentIntent compatível com o fluxo transparente
  const sufixo = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  const paymentIntentId = `pi_sandbox_${sufixo}`;
  const clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(12).toString('hex')}`;

  return {
    mode: 'sandbox',
    clientSecret,
    paymentIntentId,
  };
}

// ─── Gerar Assinatura HMAC-SHA256 do Webhook (Padrão Stripe)
export function gerarAssinaturaWebhookSandbox(payload: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_sandbox_secret';
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

// ─── Criar Sessão de Checkout (Legado/Alternativo) ────────
export async function criarCheckoutSession(params: {
  lojaId: string;
  plano: PlanoKey;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const planoInfo = PLANOS[params.plano];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: params.email,
    line_items: [
      {
        price: planoInfo.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      lojaId: params.lojaId,
      plano: params.plano,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

// ─── Verificar Webhook ───────────────────────────────────
// Valida a assinatura HMAC-SHA256 do webhook para segurança
export function verificarWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_sandbox_secret';

  if (isStripeConfigured()) {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }

  // Verificação HMAC-SHA256 no modo Sandbox seguindo exatamente o formato t=...,v1=...
  const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf8');
  const partes = signature.split(',').reduce<Record<string, string>>((acc, item) => {
    const [chave, valor] = item.split('=');
    if (chave && valor) acc[chave.trim()] = valor.trim();
    return acc;
  }, {});

  const timestamp = partes.t;
  const v1 = partes.v1;

  if (!timestamp || !v1) {
    throw new Error('Cabeçalho stripe-signature inválido.');
  }

  // Valida tolerância de 5 minutos para evitar replay attack
  const agora = Math.floor(Date.now() / 1000);
  if (Math.abs(agora - Number(timestamp)) > 300) {
    throw new Error('Timestamp do webhook expirado.');
  }

  const esperado = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadStr}`, 'utf8')
    .digest('hex');

  const recebidoBuf = Buffer.from(v1, 'hex');
  const esperadoBuf = Buffer.from(esperado, 'hex');

  if (
    recebidoBuf.length !== esperadoBuf.length ||
    !crypto.timingSafeEqual(recebidoBuf, esperadoBuf)
  ) {
    throw new Error('Assinatura HMAC do webhook inválida.');
  }

  return JSON.parse(payloadStr) as Stripe.Event;
}

// ─── Cancelar Assinatura ─────────────────────────────────
export async function cancelarAssinatura(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

// ─── Obter Detalhes da Assinatura ────────────────────────
export async function obterAssinatura(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}
