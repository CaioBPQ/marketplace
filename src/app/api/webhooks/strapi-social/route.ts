// ═══════════════════════════════════════════════════════════
// Endpoint Receptor de Webhooks do Strapi para Redes Sociais
// POST /api/webhooks/strapi-social
// Configurado no Strapi Admin (Settings > Webhooks) para disparar
// em entry.create, entry.update e entry.publish do modelo Veículo.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSocialAutomationHistory,
  processStrapiSocialWebhook,
  verifyStrapiWebhookToken,
} from '@/lib/social-automation';
import type { StrapiWebhookEvent, StrapiWebhookPayload } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      webhookEndpoint: '/api/webhooks/strapi-social',
      supportedEvents: ['entry.create', 'entry.update', 'entry.publish'],
      targetCollection: 'api::veiculo.veiculo',
      externalWebhookConfigured: Boolean(process.env.SOCIAL_AUTOMATION_WEBHOOK_URL),
      history: getSocialAutomationHistory(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const secretHeader =
      request.headers.get('x-strapi-webhook-secret') ||
      request.headers.get('x-webhook-secret') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!verifyStrapiWebhookToken(secretHeader)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assinatura de webhook do Strapi inválida (x-strapi-webhook-secret).',
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<StrapiWebhookPayload> & {
      veiculoId?: string;
    };

    const event: StrapiWebhookEvent =
      body.event === 'entry.update' ||
      body.event === 'entry.publish' ||
      body.event === 'entry.unpublish'
        ? body.event
        : 'entry.create';

    // Permite tanto o payload nativo do Strapi ({ event, model, entry })
    // quanto o disparo por ID de veículo ({ veiculoId }) a partir do painel
    let entryData: Record<string, unknown> | null =
      body.entry && typeof body.entry === 'object' ? body.entry : null;

    if (!entryData && body.veiculoId) {
      const found = await prisma.veiculo.findUnique({
        where: { id: body.veiculoId },
      });
      if (found) {
        entryData = found as unknown as Record<string, unknown>;
      }
    }

    if (!entryData) {
      const primeiroAtivo = await prisma.veiculo.findFirst({
        where: { ativo: true, vendido: false },
        orderBy: { createdAt: 'desc' },
      });
      if (primeiroAtivo) {
        entryData = primeiroAtivo as unknown as Record<string, unknown>;
      }
    }

    if (!entryData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload do Strapi não contém o objeto entry do veículo.',
        },
        { status: 400 }
      );
    }

    const modelName = String(body.model || body.uid || 'veiculo').toLowerCase();
    if (!modelName.includes('veiculo')) {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: `Evento ${event} ignorado para o modelo ${modelName}.`,
      });
    }

    // Não gera post para veículo marcado como vendido ou inativo
    if (entryData.vendido === true || entryData.ativo === false || event === 'entry.unpublish') {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: 'Veículo vendido ou despublicado — postagem automática ignorada.',
      });
    }

    const postPackage = await processStrapiSocialWebhook({
      event,
      model: modelName,
      entry: entryData,
      createdAt: body.createdAt || new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pacote de postagem para redes sociais gerado com sucesso via gatilho Strapi.',
        data: postPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[WEBHOOK/STRAPI-SOCIAL] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar gatilho de automação social.' },
      { status: 500 }
    );
  }
}
