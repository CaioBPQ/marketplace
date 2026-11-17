// ═══════════════════════════════════════════════════════════
// API de Login - Autenticação com JWT + Cookie HttpOnly
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema, checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // ─── Rate limiting: 10 tentativas por minuto por IP ───
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`login:${ip}`, 10);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
        },
        { status: 429 }
      );
    }

    // ─── Validação do corpo da requisição ─────────────────
    const body = await request.json();
    const resultado = loginSchema.safeParse(body);

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

    const { email, senha } = resultado.data;

    // ─── Busca o usuário pelo e-mail ──────────────────────
    const usuario = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // ─── Verifica a senha com bcrypt ──────────────────────
    const senhaValida = await comparePassword(senha, usuario.senha);

    if (!senhaValida) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // ─── Gera o token JWT ─────────────────────────────────
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    // ─── Retorna dados do usuário (sem senha) e define cookie
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        role: usuario.role,
        avatarUrl: usuario.avatarUrl,
      },
    });

    response.cookies.set('automarket-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error('[LOGIN] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
