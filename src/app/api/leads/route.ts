// ═══════════════════════════════════════════════════════════
// API de Leads - Captação e gerenciamento de interessados
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { leadSchema, checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';
import { isStrapiConfigured, strapiCreateLead } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

// ─── POST: Criar novo lead (público) ─────────────────────
export async function POST(request: NextRequest) {
  try {
    // ─── Rate limiting: 10 leads por minuto por IP ────────
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`lead:${ip}`, 10);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas solicitações. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    // ─── Validação do corpo ───────────────────────────────
    const body = await request.json();
    const resultado = leadSchema.safeParse(body);

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

    const dados = resultado.data;

    // ─── Busca o veículo para obter o lojaId ──────────────
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: dados.veiculoId },
      select: { id: true, lojaId: true, ativo: true },
    });

    if (!veiculo || !veiculo.ativo) {
      return NextResponse.json(
        { success: false, error: 'Veículo não encontrado ou indisponível.' },
        { status: 404 }
      );
    }

    // ─── Verifica se o usuário está autenticado (opcional) ─
    const payload = getAuthUser(request);

    // ─── Cria o lead vinculado ao veículo e à loja ────────
    const lead = await prisma.lead.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        mensagem: dados.mensagem || null,
        origem: dados.origem,
        veiculoId: veiculo.id,
        lojaId: veiculo.lojaId,
        userId: payload?.userId || null,
      },
    });

    if (isStrapiConfigured()) {
      await strapiCreateLead({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        mensagem: dados.mensagem || null,
        origem: dados.origem,
        veiculoId: veiculo.id,
        lojaId: veiculo.lojaId,
      });
    }

    return NextResponse.json(
      { success: true, data: { id: lead.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('[LEADS/POST] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── GET: Listar leads da loja ou todos (LOJISTA ou ADMIN)
export async function GET(request: NextRequest) {
  try {
    // ─── Autenticação ─────────────────────────────────────
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

    // ─── Parâmetros de filtro e paginação ─────────────────
    const searchParams = request.nextUrl.searchParams;
    const statusFiltro = searchParams.get('status') || undefined;
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1'));
    const limite = Math.min(50, Math.max(1, parseInt(searchParams.get('limite') || '20')));
    const skip = (pagina - 1) * limite;

    // ─── Construção do filtro WHERE ───────────────────────
    const where: { lojaId?: string; status?: string } = {};

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
    }

    if (statusFiltro) {
      where.status = statusFiltro;
    }

    // ─── Consulta com paginação ───────────────────────────
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limite,
        include: {
          veiculo: {
            select: {
              marca: true,
              modelo: true,
              ano: true,
              preco: true,
              imagemPrincipal: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: leads,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('[LEADS/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── PATCH: Atualizar status do lead (LOJISTA ou ADMIN) ──
export async function PATCH(request: NextRequest) {
  try {
    // ─── Autenticação ─────────────────────────────────────
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

    // ─── Validação do corpo ───────────────────────────────
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID e status são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação dos status permitidos
    const statusValidos = ['NOVO', 'CONTATADO', 'NEGOCIANDO', 'CONVERTIDO', 'PERDIDO'];
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido.' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado.' },
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

      if (lead.lojaId !== loja.id) {
        return NextResponse.json(
          { success: false, error: 'Sem permissão para atualizar este lead.' },
          { status: 403 }
        );
      }
    }

    // ─── Atualiza o status do lead ────────────────────────
    const leadAtualizado = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: leadAtualizado,
    });
  } catch (error) {
    console.error('[LEADS/PATCH] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
