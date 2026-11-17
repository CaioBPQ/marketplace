// ═══════════════════════════════════════════════════════════
// API de Perfil - Gerenciamento de conta para Admin, Lojista e Comprador
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, getAuthUser, hashPassword } from '@/lib/auth';
import { checkRateLimit, perfilUpdateSchema } from '@/lib/security';
import { getClientIP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// ─── GET: Dados completos do perfil do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        loja: payload.role === 'LOJISTA' ? true : false,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    // Para compradores (USUARIO), retorna histórico de leads/interesses enviados
    let meusLeads: unknown[] = [];
    if (usuario.role === 'USUARIO') {
      meusLeads = await prisma.lead.findMany({
        where: {
          OR: [{ userId: usuario.id }, { email: usuario.email }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          veiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              ano: true,
              preco: true,
              precoPromocional: true,
              imagemPrincipal: true,
            },
          },
          loja: {
            select: {
              id: true,
              nome: true,
              cidade: true,
              estado: true,
              whatsapp: true,
            },
          },
        },
      });
    }

    // Para administradores (ADMIN), retorna visão geral do sistema
    let adminStats: {
      totalUsuarios: number;
      totalLojas: number;
      totalVeiculos: number;
      totalLeads: number;
      totalAgendamentos: number;
      ultimosUsuarios: {
        id: string;
        nome: string;
        email: string;
        role: string;
        createdAt: Date;
      }[];
    } | null = null;

    if (usuario.role === 'ADMIN') {
      const [
        totalUsuarios,
        totalLojas,
        totalVeiculos,
        totalLeads,
        totalAgendamentos,
        ultimosUsuarios,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.loja.count(),
        prisma.veiculo.count({ where: { ativo: true } }),
        prisma.lead.count(),
        prisma.agendamentoServico.count(),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
      ]);

      adminStats = {
        totalUsuarios,
        totalLojas,
        totalVeiculos,
        totalLeads,
        totalAgendamentos,
        ultimosUsuarios,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        user: usuario,
        meusLeads,
        adminStats,
      },
    });
  } catch (error) {
    console.error('[PERFIL/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── PUT: Atualiza nome, telefone, avatar e/ou senha ──────
export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`perfil:${ip}`, 20);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisições. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const resultado = perfilUpdateSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            resultado.error.issues[0]?.message || 'Dados do perfil inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nome, telefone, avatarUrl, senhaAtual, novaSenha } = resultado.data;

    const usuarioAtual = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!usuarioAtual) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const updateData: {
      nome: string;
      telefone: string | null;
      avatarUrl?: string | null;
      senha?: string;
    } = {
      nome,
      telefone: telefone ? telefone.trim() : null,
    };

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    }

    // Validação de troca de senha quando solicitada
    if (novaSenha) {
      const senhaConfere = await comparePassword(
        senhaAtual || '',
        usuarioAtual.senha
      );
      if (!senhaConfere) {
        return NextResponse.json(
          { success: false, error: 'A senha atual informada está incorreta.' },
          { status: 400 }
        );
      }
      updateData.senha = await hashPassword(novaSenha);
    }

    const usuarioAtualizado = await prisma.user.update({
      where: { id: usuarioAtual.id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: usuarioAtualizado,
      message: 'Perfil atualizado com sucesso.',
    });
  } catch (error) {
    console.error('[PERFIL/PUT] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
