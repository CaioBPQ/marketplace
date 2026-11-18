// ═══════════════════════════════════════════════════════════
// API de Login Administrativo — Ponte Strapi Headless CMS
// Simplificado: elimina múltiplos perfis públicos (comprador)
// e centraliza a autenticação administrativa via Strapi API
// com fallback local resiliente para demonstração.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema, checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';
import { strapiAuthLogin, STRAPI_BASE_URL, isStrapiConfigured } from '@/lib/strapi';

export async function POST(request: NextRequest) {
  try {
    // ─── Rate limiting: 10 tentativas por minuto por IP ───
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`login:${ip}`, 10);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas tentativas de login. Aguarde um minuto e tente novamente.',
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

    // ─── 1. Prioridade: Autenticação no Strapi Headless CMS (/api/auth/local)
    const strapiAuth = await strapiAuthLogin(email.toLowerCase(), senha);
    if (strapiAuth && strapiAuth.jwt && strapiAuth.user) {
      const token = generateToken({
        userId: String(strapiAuth.user.id),
        email: strapiAuth.user.email,
        role: 'ADMIN',
      });

      const response = NextResponse.json({
        success: true,
        authProvider: 'STRAPI_CMS',
        strapiUrl: STRAPI_BASE_URL,
        token,
        strapiJwt: strapiAuth.jwt,
        user: {
          id: String(strapiAuth.user.id),
          nome: strapiAuth.user.username || 'Gestor Strapi',
          email: strapiAuth.user.email,
          telefone: null,
          role: 'ADMIN',
          avatarUrl: null,
        },
      });

      response.cookies.set('automarket-token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });

      return response;
    }

    // ─── 2. Fallback Local (Restrito exclusivamente a Gestores/Equipe) ────
    const usuario = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!usuario) {
      return NextResponse.json(
        {
          success: false,
          error: isStrapiConfigured()
            ? 'Credenciais inválidas no Strapi CMS e no repositório local.'
            : 'Credenciais administrativas inválidas.',
        },
        { status: 401 }
      );
    }

    // Bloqueia login de perfil "USUARIO" (comprador) — autenticação agora é exclusiva para gestão
    if (usuario.role === 'USUARIO') {
      return NextResponse.json(
        {
          success: false,
          error:
            'O login de compradores foi desativado por segurança. Clientes navegam livremente e utilizam o Concierge IA ou WhatsApp sem necessidade de senha.',
        },
        { status: 403 }
      );
    }

    const senhaValida = await comparePassword(senha, usuario.senha);

    if (!senhaValida) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    const response = NextResponse.json({
      success: true,
      authProvider: 'LOCAL_FALLBACK',
      strapiUrl: STRAPI_BASE_URL,
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
