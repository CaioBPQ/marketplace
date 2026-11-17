// ═══════════════════════════════════════════════════════════
// API Stripe Webhook - Processamento de eventos de pagamento
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { processarEventoWebhook } from '@/lib/payment-processor';

export async function POST(request: NextRequest) {
  try {
    // ─── Lê o corpo cru da requisição ─────────────────────
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura do webhook ausente.' },
        { status: 400 }
      );
    }

    // ─── Verifica assinatura e processa o evento ──────────
    try {
      await processarEventoWebhook(body, signature);
    } catch (err) {
      console.error('[WEBHOOK] Falha na verificação da assinatura:', err);
      return NextResponse.json(
        { success: false, error: 'Assinatura inválida.' },
        { status: 400 }
      );
    }

    // ─── Retorna 200 para confirmar recebimento ───────────
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
