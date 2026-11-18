// ═══════════════════════════════════════════════════════════
// API /auth/me - Retorna dados do gestor autenticado (Strapi ou Local)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload || payload.role === 'USUARIO') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Token inválido ou ausente.' },
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
        loja: true,
      },
    });

    if (!usuario) {
      // Caso o gestor tenha autenticado diretamente via Strapi CMS
      const lojaPadrao = await prisma.loja.findFirst({ where: { ativo: true } });
      return NextResponse.json({
        success: true,
        data: {
          id: payload.userId,
          nome: 'Gestor Strapi CMS',
          email: payload.email,
          telefone: null,
          role: 'ADMIN',
          avatarUrl: null,
          loja: lojaPadrao,
        },
      });
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
