// ═══════════════════════════════════════════════════════════
// Processador Central de Eventos de Webhook (Pilar III)
// Garante que assinaturas e destaques só sejam ativados após
// verificação criptográfica da assinatura do webhook
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { verificarWebhookSignature } from '@/lib/stripe';

export async function processarEventoWebhook(rawPayload: string, signature: string) {
  // Verifica a assinatura do webhook (lança erro se inválida)
  const event = verificarWebhookSignature(rawPayload, signature);

  switch (event.type) {
    // Confirmação de PaymentIntent (Checkout Transparente)
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const meta = paymentIntent.metadata || {};

      // Localiza a transação registrada no banco
      const transacao = await prisma.transacaoPagamento.findFirst({
        where: {
          OR: [
            { stripePaymentIntentId: paymentIntent.id },
            ...(meta.transacaoId ? [{ id: meta.transacaoId }] : []),
          ],
        },
      });

      const tipo = transacao?.tipo || meta.tipo;
      const lojaId = transacao?.lojaId || meta.lojaId;
      const plano = transacao?.plano || meta.plano;
      const veiculoId = transacao?.veiculoId || meta.veiculoId;

      if (transacao) {
        await prisma.transacaoPagamento.update({
          where: { id: transacao.id },
          data: {
            status: 'PAGO',
            webhookConfirmado: true,
          },
        });
      }

      // Ativa assinatura da loja após confirmação do webhook
      if (tipo === 'ASSINATURA' && lojaId && plano) {
        const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.loja.update({
          where: { id: lojaId },
          data: {
            plano,
            assinaturaAtiva: true,
            assinaturaExpira: expiraEm,
          },
        });

        console.log(`[WEBHOOK] Assinatura confirmada via webhook: loja=${lojaId}, plano=${plano}`);
      }

      // Ativa destaque do veículo após confirmação do webhook
      if (tipo === 'DESTAQUE_VEICULO' && veiculoId && lojaId) {
        await prisma.veiculo.updateMany({
          where: { id: veiculoId, lojaId },
          data: { destaque: true },
        });

        console.log(`[WEBHOOK] Destaque ativado via webhook: veiculo=${veiculoId}, loja=${lojaId}`);
      }

      break;
    }

    // Pagamento via Stripe Checkout Session (fluxo alternativo)
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const lojaId = session.metadata?.lojaId;
      const plano = session.metadata?.plano;

      if (lojaId && plano) {
        await prisma.loja.update({
          where: { id: lojaId },
          data: {
            plano,
            assinaturaAtiva: true,
            stripeSubscriptionId: (session.subscription as string) || undefined,
            stripeCustomerId: (session.customer as string) || undefined,
          },
        });

        console.log(`[WEBHOOK] Checkout session ativado: loja=${lojaId}, plano=${plano}`);
      }
      break;
    }

    // Falha no pagamento
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.transacaoPagamento.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: 'FALHOU' },
      });
      break;
    }

    // Assinatura cancelada ou expirada
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.loja.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { assinaturaAtiva: false },
      });

      console.log(`[WEBHOOK] Assinatura cancelada: subscriptionId=${subscription.id}`);
      break;
    }

    default:
      console.log(`[WEBHOOK] Evento não tratado: ${event.type}`);
  }

  return { eventType: event.type, processed: true };
}
