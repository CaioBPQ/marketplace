// ═══════════════════════════════════════════════════════════
// Endpoint da IA de Atendimento ao Cliente
// POST /api/ai/chat — Responde com contexto real do estoque
// GET  /api/ai/chat — Status do agente e provedor ativo
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { strapiGetVeiculos } from '@/lib/strapi';
import { processAIChatRequest } from '@/lib/ai-agent';
import { checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';
import type { AIChatRequest, Veiculo } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function GET() {
  const provider = process.env.AI_AGENT_WEBHOOK_URL
    ? 'STRAPI_AI_WEBHOOK'
    : process.env.AI_PROVIDER_API_KEY
    ? 'OPENAI_COMPATIBLE'
    : 'LOCAL_CATALOG_ENGINE';

  return NextResponse.json({
    success: true,
    data: {
      active: true,
      provider,
      whatsappHandoff: '+55 27 99834-5027',
      capabilities: [
        'Busca inteligente no estoque Strapi/Local',
        'Simulação estimada de financiamento',
        'Triagem de avaliação de usado e pós-venda',
        'Transbordo contextualizado para WhatsApp',
      ],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`ai_chat:${ip}`, 30);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas mensagens em sequência. Aguarde alguns segundos.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as AIChatRequest;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Envie ao menos uma mensagem no campo messages.' },
        { status: 400 }
      );
    }

    // Prioriza catálogo do Strapi CMS e faz fallback para o banco local
    const strapiVeiculos = await strapiGetVeiculos();
    let catalog: Veiculo[];

    if (strapiVeiculos && strapiVeiculos.length > 0) {
      catalog = strapiVeiculos;
    } else {
      const dbVeiculos = await prisma.veiculo.findMany({
        where: { ativo: true, vendido: false },
        orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
        take: 40,
      });
      catalog = dbVeiculos.map((v) => ({
        ...v,
        dataVenda: v.dataVenda ? v.dataVenda.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      }));
    }

    const response = await processAIChatRequest(body, catalog);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('[AI/CHAT] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Não foi possível processar a resposta do assistente.' },
      { status: 500 }
    );
  }
}
