// ═══════════════════════════════════════════════════════════
// Endpoint da IA de Atendimento ao Cliente
// POST /api/ai/chat — Validado com Zod contra Prompt Injection
// e DoS financeiro; contexto real do estoque Strapi/Local.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { strapiGetVeiculos } from '@/lib/strapi';
import { processAIChatRequest } from '@/lib/ai-agent';
import { checkRateLimit, sanitizeString } from '@/lib/security';
import { getClientIP } from '@/lib/utils';
import type { AIChatRequest, Veiculo } from '@/types/index';

export const dynamic = 'force-dynamic';

const aiChatRequestSchema = z.object({
  sessionId: z.string().max(100).optional(),
  vehicleContext: z
    .object({
      id: z.string().max(64).optional(),
      marca: z.string().max(60).optional(),
      modelo: z.string().max(100).optional(),
      preco: z.number().positive().optional(),
    })
    .nullable()
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']), // Impede injeção de role: 'system' pelo cliente
        content: z
          .string()
          .min(1, 'Mensagem vazia.')
          .max(1000, 'Mensagem excede 1000 caracteres.')
          .transform((val) => sanitizeString(val)),
      })
    )
    .min(1, 'Envie ao menos uma mensagem.')
    .max(20, 'Histórico de conversa excedeu o limite permitido.'),
});

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

    const rawBody = await request.json();
    const parsed = aiChatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Formato de conversa inválido.',
          detalhes: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const body: AIChatRequest = parsed.data;

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
