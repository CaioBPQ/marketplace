// ═══════════════════════════════════════════════════════════
// API de Login Administrativo — Ponte Strapi Headless CMS
// Cookie HttpOnly + Secure + SameSite=Lax (JWT nunca exposto
// ao localStorage ou JSON em produção) + Validação de Role Strapi.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema, checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';
import { strapiAuthLogin, STRAPI_BASE_URL, isStrapiConfigured } from '@/lib/strapi';

const ALLOWED_STRAPI_ADMIN_ROLES = new Set([
  'admin',
  'administrator',
  'super-admin',
  'editor',
  'manager',
  'lojista',
]);

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
      if (strapiAuth.user.blocked) {
        return NextResponse.json(
          { success: false, error: 'Conta administrativa bloqueada no Strapi.' },
          { status: 403 }
        );
      }

      const strapiRoleType = (strapiAuth.user.role?.type || '').toLowerCase();
      const strapiRoleName = (strapiAuth.user.role?.name || '').toLowerCase();
      const adminEmails = (process.env.STRAPI_ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const isAuthorizedStrapiRole =
        ALLOWED_STRAPI_ADMIN_ROLES.has(strapiRoleType) ||
        ALLOWED_STRAPI_ADMIN_ROLES.has(strapiRoleName) ||
        adminEmails.includes(strapiAuth.user.email.toLowerCase());

      if (!isAuthorizedStrapiRole) {
        return NextResponse.json(
          {
            success: false,
            error: 'Usuário autenticado no Strapi não possui perfil administrativo autorizado.',
          },
          { status: 403 }
        );
      }

      const token = generateToken({
        userId: String(strapiAuth.user.id),
        email: strapiAuth.user.email,
        role: 'ADMIN',
      });

      const response = NextResponse.json({
        success: true,
        authProvider: 'STRAPI_CMS',
        strapiUrl: STRAPI_BASE_URL,
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 horas
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

    // Bloqueia login de perfil "USUARIO" (comprador) — autenticação exclusiva para gestão
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
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
