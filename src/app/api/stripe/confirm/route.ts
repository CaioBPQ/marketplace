// ═══════════════════════════════════════════════════════════
// API Stripe Confirm - Confirmação de Checkout Transparente
// Gera e verifica assinatura HMAC-SHA256 do webhook antes de ativar
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import {
  stripe,
  isStripeConfigured,
  gerarAssinaturaWebhookSandbox,
} from '@/lib/stripe';
import { processarEventoWebhook } from '@/lib/payment-processor';

const confirmSchema = z.object({
  paymentIntentId: z.string().min(1, 'paymentIntentId é obrigatório'),
  transacaoId: z.string().min(1, 'transacaoId é obrigatório'),
});

export async function POST(request: NextRequest) {
  try {
    // ─── Autenticação ─────────────────────────────────────
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    const loja = await prisma.loja.findUnique({
      where: { userId: payload.userId },
    });

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }

    // ─── Validação do corpo ───────────────────────────────
    const body = await request.json();
    const resultado = confirmSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados de confirmação inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { paymentIntentId, transacaoId } = resultado.data;

    // ─── Localiza transação e valida propriedade ──────────
    const transacao = await prisma.transacaoPagamento.findUnique({
      where: { id: transacaoId },
    });

    if (!transacao) {
      return NextResponse.json(
        { success: false, error: 'Transação não encontrada.' },
        { status: 404 }
      );
    }

    if (transacao.lojaId !== loja.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para confirmar esta transação.' },
        { status: 403 }
      );
    }

    if (transacao.stripePaymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'PaymentIntent não corresponde à transação.' },
        { status: 400 }
      );
    }

    // Idempotência: retorna sucesso se webhook já foi confirmado
    if (transacao.status === 'PAGO' && transacao.webhookConfirmado) {
      return NextResponse.json({
        success: true,
        webhookConfirmado: true,
        transacaoId: transacao.id,
        tipo: transacao.tipo,
        message: 'Pagamento já confirmado anteriormente.',
      });
    }

    // Em produção, exige Stripe real configurado e bloqueia fluxos pi_sandbox_*
    if (process.env.NODE_ENV === 'production' && (!isStripeConfigured() || paymentIntentId.startsWith('pi_sandbox_'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Modo sandbox desabilitado em produção. Utilize confirmação via webhook oficial do Stripe.',
        },
        { status: 403 }
      );
    }

    // Em modo Stripe real, verifica se o PaymentIntent foi realmente pago e bloqueia IDs sandbox
    if (isStripeConfigured()) {
      if (paymentIntentId.startsWith('pi_sandbox_')) {
        return NextResponse.json(
          {
            success: false,
            error: 'PaymentIntent sandbox não é aceito quando o Stripe real está configurado.',
          },
          { status: 400 }
        );
      }

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return NextResponse.json(
          {
            success: false,
            error: `Pagamento ainda não confirmado no Stripe (status: ${intent.status}).`,
          },
          { status: 400 }
        );
      }
    }

    // ─── Constrói evento payment_intent.succeeded assinado ─
    // A ativação do benefício ocorre SOMENTE após passar pela
    // validação criptográfica do webhook (Pilar III)
    const webhookEvent = {
      id: `evt_sandbox_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: transacao.stripePaymentIntentId,
          object: 'payment_intent',
          amount: Math.round(transacao.valor * 100),
          currency: 'brl',
          status: 'succeeded',
          metadata: {
            transacaoId: transacao.id,
            lojaId: transacao.lojaId,
            tipo: transacao.tipo,
            plano: transacao.plano || '',
            veiculoId: transacao.veiculoId || '',
          },
        },
      },
    };

    const rawPayload = JSON.stringify(webhookEvent);
    const signature = gerarAssinaturaWebhookSandbox(rawPayload);

    await processarEventoWebhook(rawPayload, signature);

    return NextResponse.json({
      success: true,
      webhookConfirmado: true,
      transacaoId: transacao.id,
      tipo: transacao.tipo,
    });
  } catch (error) {
    console.error('[STRIPE/CONFIRM] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao confirmar pagamento.' },
      { status: 500 }
    );
  }
}
