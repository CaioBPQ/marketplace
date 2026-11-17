// ═══════════════════════════════════════════════════════════
// Middleware Next.js (Edge Runtime) - Rate Limiting, Segurança e Auth
// ═══════════════════════════════════════════════════════════

import { NextResponse, NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/jwt-edge';
import { checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Rate Limiting global ───────────────────────────────
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(`global:${ip}`);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

  // ─── Headers de segurança ───────────────────────────────
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();

  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // ─── Proteção de rotas autenticadas (/dashboard e /perfil)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/perfil')) {
    const token = request.cookies.get('automarket-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Adiciona dados do usuário nos headers da resposta
    response.headers.set('X-User-Id', payload.userId);
    response.headers.set('X-User-Role', payload.role);
  }

  // ─── Proteção de rotas /api/dashboard/* ─────────────────
  if (pathname.startsWith('/api/dashboard')) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : request.cookies.get('automarket-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Token não fornecido.' },
        { status: 401 }
      );
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Token inválido ou expirado.' },
        { status: 401 }
      );
    }
  }

  return response;
}

// ─── Configuração de rotas que o middleware intercepta ────
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
