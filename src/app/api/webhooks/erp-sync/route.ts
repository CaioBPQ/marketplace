// ═══════════════════════════════════════════════════════════
// Webhook de Integração Externa (ERP / DMS Sync)
// POST /api/webhooks/erp-sync
// Autenticado estritamente via ERP_WEBHOOK_SECRET + Zod Schema
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  erpWebhookPayloadSchema,
  executeErpCatalogSync,
  getErpSyncHistory,
  verifyErpWebhookSignature,
} from '@/lib/erp-sync';
import { checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';
import type { ERPWebhookPayload } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secretHeader = request.headers.get('x-webhook-secret');
  if (!verifyErpWebhookSignature('', secretHeader, null)) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      endpoint: '/api/webhooks/erp-sync',
      supportedEvents: [
        'vehicle.upsert',
        'vehicle.sold',
        'vehicle.delete',
        'catalog.batch_sync',
      ],
      compatibleSystems: ['DealerNet', 'AutoAvaliar', 'Linx DMS', 'Syonet', 'Custom ERP'],
      authHeaders: ['x-webhook-secret', 'x-erp-signature (HMAC-SHA256)'],
      history: getErpSyncHistory(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(`webhook_erp:${ip}`, 30);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Limite de requisições excedido.' },
        { status: 429 }
      );
    }

    const rawBody = await request.text();
    const secretHeader = request.headers.get('x-webhook-secret');
    const hmacHeader = request.headers.get('x-erp-signature');

    if (!verifyErpWebhookSignature(rawBody, secretHeader, hmacHeader)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Assinatura ou chave secreta do ERP inválida. Verifique x-webhook-secret ou x-erp-signature.',
        },
        { status: 401 }
      );
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'JSON inválido no corpo do webhook ERP.' },
        { status: 400 }
      );
    }

    const parsed = erpWebhookPayloadSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload do ERP inválido.',
          detalhes: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const resultado = await executeErpCatalogSync(parsed.data as ERPWebhookPayload);

    return NextResponse.json(
      {
        success: true,
        message: resultado.log.summary,
        data: resultado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[WEBHOOK/ERP-SYNC] Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao processar sincronização com o ERP.',
      },
      { status: 500 }
    );
  }
}
