// ═══════════════════════════════════════════════════════════
// API de Veículo Individual - Detalhes, edição e exclusão
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { veiculoSchema } from '@/lib/security';
import { PLANOS, PlanoKey } from '@/lib/stripe';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET: Detalhes públicos de um veículo ─────────────────
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
      include: {
        loja: true,
      },
    });

    if (!veiculo || !veiculo.ativo) {
      return NextResponse.json(
        { success: false, error: 'Veículo não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: veiculo,
    });
  } catch (error) {
    console.error('[VEICULO/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── PUT: Atualizar veículo (dono da loja ou ADMIN) ──────
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // ─── Autenticação ─────────────────────────────────────
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    // ─── Verifica se o veículo existe ─────────────────────
    const veiculoExistente = await prisma.veiculo.findUnique({
      where: { id },
      include: { loja: true },
    });

    if (!veiculoExistente || !veiculoExistente.ativo) {
      return NextResponse.json(
        { success: false, error: 'Veículo não encontrado.' },
        { status: 404 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, nome: true },
    });

    let loja = veiculoExistente.loja;

    if (payload.role !== 'ADMIN' && payload.role !== 'LOJISTA') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar este veículo.' },
        { status: 403 }
      );
    }

    // ─── Validação parcial ────────────────────────────────
    const body = await request.json();
    const resultado = veiculoSchema.partial().safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      imagemPrincipal,
      destaque: desejaDestaque,
      lojaId: _ignoreLojaId,
      dataVenda: rawDataVenda,
      ...rest
    } = resultado.data;

    // ─── Regra Pilar III: não permite ativar destaque sem assinatura/cota
    let destaqueFinal = veiculoExistente.destaque;
    if (desejaDestaque === false) {
      destaqueFinal = false;
    } else if (desejaDestaque === true && !veiculoExistente.destaque) {
      if (loja.assinaturaAtiva) {
        const planoInfo = PLANOS[loja.plano as PlanoKey];
        const limiteDestaques = planoInfo?.destaques ?? 0;

        if (limiteDestaques > 0) {
          const outrosDestaques = await prisma.veiculo.count({
            where: {
              lojaId: loja.id,
              ativo: true,
              destaque: true,
              id: { not: id },
            },
          });
          destaqueFinal = outrosDestaques < limiteDestaques;
        } else {
          destaqueFinal = false;
        }
      } else {
        destaqueFinal = false;
      }
    }

    // ─── Tratamento de Venda / Reativação e Rastreio do Vendedor
    const vendaDataUpdate: Record<string, unknown> = {};
    if (rest.vendido === true) {
      vendaDataUpdate.dataVenda = rawDataVenda
        ? new Date(rawDataVenda)
        : veiculoExistente.dataVenda || new Date();
      vendaDataUpdate.valorVenda =
        rest.valorVenda ??
        veiculoExistente.valorVenda ??
        veiculoExistente.precoPromocional ??
        veiculoExistente.preco;
      vendaDataUpdate.precoCusto =
        rest.precoCusto ??
        veiculoExistente.precoCusto ??
        Math.round(veiculoExistente.preco * 0.82);
      vendaDataUpdate.vendidoPorId =
        rest.vendidoPorId || veiculoExistente.vendidoPorId || usuario?.id || payload.userId;
      vendaDataUpdate.vendidoPorNome =
        rest.vendidoPorNome ||
        veiculoExistente.vendidoPorNome ||
        usuario?.nome ||
        veiculoExistente.cadastradoPorNome ||
        loja.nome;
    } else if (rest.vendido === false) {
      vendaDataUpdate.dataVenda = null;
      vendaDataUpdate.valorVenda = null;
      vendaDataUpdate.vendidoPorId = null;
      vendaDataUpdate.vendidoPorNome = null;
    } else if (rawDataVenda !== undefined) {
      vendaDataUpdate.dataVenda = rawDataVenda ? new Date(rawDataVenda) : null;
    }

    // ─── Atualiza o veículo ───────────────────────────────
    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id },
      data: {
        ...rest,
        ...vendaDataUpdate,
        ...(imagemPrincipal !== undefined ? { imagemPrincipal: imagemPrincipal || null } : {}),
        ...(desejaDestaque !== undefined ? { destaque: destaqueFinal } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: veiculoAtualizado,
    });
  } catch (error) {
    console.error('[VEICULO/PUT] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft delete do veículo (dono ou ADMIN) ───────
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // ─── Autenticação ─────────────────────────────────────
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
    });

    if (!veiculo || !veiculo.ativo) {
      return NextResponse.json(
        { success: false, error: 'Veículo não encontrado.' },
        { status: 404 }
      );
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'LOJISTA') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para remover este veículo.' },
        { status: 403 }
      );
    }

    // ─── Soft delete: apenas desativa o anúncio ───────────
    await prisma.veiculo.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Veículo removido com sucesso.',
    });
  } catch (error) {
    console.error('[VEICULO/DELETE] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
