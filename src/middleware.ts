// ═══════════════════════════════════════════════════════════
// Middleware Next.js (Edge Runtime) - Rate Limiting, Segurança e Auth Strapi
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

  // ─── Redireciona rotas legadas de multi-perfil (/registro e /perfil) ───
  if (pathname.startsWith('/registro')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/perfil')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ─── Headers de segurança ───────────────────────────────
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();

  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // ─── Proteção de rotas administrativas (/dashboard) ─────
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('automarket-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyTokenEdge(token);
    if (!payload || payload.role === 'USUARIO') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

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
        { success: false, error: 'Não autorizado. Token administrativo não fornecido.' },
        { status: 401 }
      );
    }

    const payload = await verifyTokenEdge(token);
    if (!payload || payload.role === 'USUARIO') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Acesso exclusivo a gestores via Strapi.' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
