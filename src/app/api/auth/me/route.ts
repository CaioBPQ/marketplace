// ═══════════════════════════════════════════════════════════
// API /auth/me - Retorna dados do usuário autenticado
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ─── Extrai e valida o token do header Authorization ──
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Token inválido ou ausente.' },
        { status: 401 }
      );
    }

    // ─── Busca o usuário no banco (exclui a senha) ────────
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
        // Se for LOJISTA, inclui dados da loja
        loja: payload.role === 'LOJISTA' ? true : false,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('[AUTH/ME] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
