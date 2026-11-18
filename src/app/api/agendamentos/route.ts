// ═══════════════════════════════════════════════════════════
// API de Agendamentos - Serviços pós-venda, revisões e test drives
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { agendamentoSchema, checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// ─── POST: Criar novo agendamento (público) ──────────────
export async function POST(request: NextRequest) {
  try {
    // ─── Rate limiting: 10 agendamentos por minuto por IP ─
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`agendamento:${ip}`, 10);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas solicitações. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    // ─── Validação do corpo ───────────────────────────────
    const body = await request.json();
    const resultado = agendamentoSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados do agendamento inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const dados = resultado.data;
    let lojaIdFinal = dados.lojaId || null;

    // Se servicoId foi informado, valida e obtém a loja do serviço caso necessário
    if (dados.servicoId) {
      const servico = await prisma.servico.findUnique({
        where: { id: dados.servicoId },
        select: { id: true, lojaId: true, ativo: true },
      });

      if (!servico || !servico.ativo) {
        return NextResponse.json(
          { success: false, error: 'Serviço não encontrado ou indisponível.' },
          { status: 404 }
        );
      }

      if (!lojaIdFinal) {
        lojaIdFinal = servico.lojaId;
      }
    }

    if (!lojaIdFinal) {
      return NextResponse.json(
        { success: false, error: 'Concessionária (lojaId) é obrigatória.' },
        { status: 400 }
      );
    }

    // Verifica se a loja existe e está ativa
    const loja = await prisma.loja.findUnique({
      where: { id: lojaIdFinal },
      select: { id: true, ativo: true },
    });

    if (!loja || !loja.ativo) {
      return NextResponse.json(
        { success: false, error: 'Concessionária não encontrada.' },
        { status: 404 }
      );
    }

    // ─── Cria o agendamento no banco ──────────────────────
    const agendamento = await prisma.agendamentoServico.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        dataPreferida: dados.dataPreferida,
        horarioPreferido: dados.horarioPreferido,
        veiculoInfo: dados.veiculoInfo || null,
        observacoes: dados.observacoes || null,
        tipo: dados.tipo,
        status: 'PENDENTE',
        servicoId: dados.servicoId || null,
        lojaId: loja.id,
      },
      include: {
        servico: {
          select: { id: true, nome: true, categoria: true },
        },
        loja: {
          select: { id: true, nome: true, cidade: true, estado: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: agendamento },
      { status: 201 }
    );
  } catch (error) {
    console.error('[AGENDAMENTOS/POST] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── GET: Listar agendamentos (LOJISTA ou ADMIN) ─────────
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'LOJISTA' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a lojistas e administradores.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFiltro = searchParams.get('status') || undefined;
    const tipoFiltro = searchParams.get('tipo') || undefined;
    const lojaIdFiltro = searchParams.get('lojaId') || undefined;
    const paginaRaw = Number.parseInt(searchParams.get('pagina') || '1', 10);
    const limiteRaw = Number.parseInt(searchParams.get('limite') || '30', 10);
    const pagina = Number.isFinite(paginaRaw) ? Math.max(1, paginaRaw) : 1;
    const limite = Number.isFinite(limiteRaw) ? Math.min(100, Math.max(1, limiteRaw)) : 30;
    const skip = (pagina - 1) * limite;

    const where: { lojaId?: string; status?: string; tipo?: string } = {};

    if (payload.role === 'LOJISTA') {
      const loja = await prisma.loja.findUnique({
        where: { userId: payload.userId },
      });

      if (!loja) {
        return NextResponse.json(
          { success: false, error: 'Loja não encontrada.' },
          { status: 404 }
        );
      }
      where.lojaId = loja.id;
    } else if (lojaIdFiltro) {
      where.lojaId = lojaIdFiltro;
    }

    if (statusFiltro) where.status = statusFiltro;
    if (tipoFiltro) where.tipo = tipoFiltro;

    const [agendamentos, total] = await Promise.all([
      prisma.agendamentoServico.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limite,
        include: {
          servico: {
            select: { id: true, nome: true, categoria: true, preco: true },
          },
          loja: {
            select: { id: true, nome: true, cidade: true, estado: true },
          },
        },
      }),
      prisma.agendamentoServico.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: agendamentos,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('[AGENDAMENTOS/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── PATCH: Atualizar status do agendamento (LOJISTA ou ADMIN)
export async function PATCH(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'LOJISTA' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a lojistas e administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID e status são obrigatórios.' },
        { status: 400 }
      );
    }

    const statusValidos = ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'];
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido.' },
        { status: 400 }
      );
    }

    const agendamento = await prisma.agendamentoServico.findUnique({
      where: { id },
    });

    if (!agendamento) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado.' },
        { status: 404 }
      );
    }

    if (payload.role === 'LOJISTA') {
      const loja = await prisma.loja.findUnique({
        where: { userId: payload.userId },
      });

      if (!loja) {
        return NextResponse.json(
          { success: false, error: 'Loja não encontrada.' },
          { status: 404 }
        );
      }

      if (agendamento.lojaId !== loja.id) {
        return NextResponse.json(
          { success: false, error: 'Sem permissão para atualizar este agendamento.' },
          { status: 403 }
        );
      }
    }

    const agendamentoAtualizado = await prisma.agendamentoServico.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: agendamentoAtualizado,
    });
  } catch (error) {
    console.error('[AGENDAMENTOS/PATCH] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
