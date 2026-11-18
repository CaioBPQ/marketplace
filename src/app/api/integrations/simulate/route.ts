// ═══════════════════════════════════════════════════════════
// Simulador Autenticado de Integrações (Painel Administrativo)
// POST /api/integrations/simulate
// Exige sessão válida ADMIN ou LOJISTA (cookie HttpOnly),
// eliminando qualquer necessidade de segredos hardcoded no client.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { executeErpCatalogSync } from '@/lib/erp-sync';
import { processStrapiSocialWebhook } from '@/lib/social-automation';

const simulateSchema = z.object({
  action: z.enum(['erp-sync', 'strapi-social']),
});

export async function POST(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Faça login administrativo.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'LOJISTA') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a gestores e lojistas.' },
        { status: 403 }
      );
    }

    if (process.env.NODE_ENV === 'production' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Simulação restrita ao administrador em produção.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = simulateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ação de simulação inválida.' },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'erp-sync') {
      const resultado = await executeErpCatalogSync({
        event: 'vehicle.upsert',
        sourceErp: 'DealerNet DMS (Simulação Painel)',
        data: {
          externalErpId: `ERP-SIM-${Date.now().toString().slice(-4)}`,
          placa: 'ABC1D23',
          marca: 'Toyota',
          modelo: 'Corolla Cross',
          versao: 'XRX Hybrid 1.8',
          ano: 2025,
          km: 4200,
          cambio: 'CVT',
          combustivel: 'HIBRIDO',
          categoria: 'SUV',
          cor: 'Branco Pérola',
          preco: 194900,
          destaque: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: resultado.log.summary,
        data: resultado,
      });
    }

    // action === 'strapi-social'
    const primeiroAtivo = await prisma.veiculo.findFirst({
      where: { ativo: true, vendido: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!primeiroAtivo) {
      return NextResponse.json(
        { success: false, error: 'Nenhum veículo ativo disponível para gerar prévia social.' },
        { status: 404 }
      );
    }

    const postPackage = await processStrapiSocialWebhook({
      event: 'entry.create',
      model: 'api::veiculo.veiculo',
      entry: primeiroAtivo as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Prévia de postagem automática gerada com segurança via sessão autenticada.',
        data: postPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[INTEGRATIONS/SIMULATE] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao executar simulação autenticada.' },
      { status: 500 }
    );
  }
}
