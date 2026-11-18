// ═══════════════════════════════════════════════════════════
// API de Perfil — Desativada por Segurança Arquitetural (410 Gone)
// Perfis públicos de comprador e gestão paralela de contas foram
// descontinuados em favor do modelo administrativo via Strapi CMS.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function goneResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        'A API legada de perfis múltiplos foi desativada por segurança. Utilize o painel administrativo ou o Strapi CMS.',
    },
    { status: 410 }
  );
}

export async function GET() {
  return goneResponse();
}

export async function PUT() {
  return goneResponse();
}
