// ═══════════════════════════════════════════════════════════
// Webhook de Integração Externa (ERP / DMS Sync)
// POST /api/webhooks/erp-sync
// Evita duplo cadastro sincronizando veículos diretamente do
// sistema de gestão utilizado pela concessionária.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  executeErpCatalogSync,
  getErpSyncHistory,
  verifyErpWebhookSignature,
} from '@/lib/erp-sync';
import type { ERPWebhookPayload } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    let body: ERPWebhookPayload;
    try {
      body = JSON.parse(rawBody) as ERPWebhookPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'JSON inválido no corpo do webhook ERP.' },
        { status: 400 }
      );
    }

    if (!body || !body.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payload incompleto. Informe { event, sourceErp, data: { externalErpId, marca, modelo, ano, preco, ... } }.',
        },
        { status: 400 }
      );
    }

    const resultado = await executeErpCatalogSync(body);

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
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao processar sincronização com o ERP.',
      },
      { status: 500 }
    );
  }
}
