// ═══════════════════════════════════════════════════════════
// API de Registro — Desativada por Segurança Arquitetural
// A criação de múltiplos perfis (comprador/vendedor/admin)
// aberta ao público foi removida. O gerenciamento de usuários
// administrativos é responsabilidade exclusiva do Strapi CMS.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'O auto-cadastro público de múltiplos perfis foi desativado por segurança. A gestão de acessos administrativos é realizada exclusivamente pelo painel do servidor Strapi CMS.',
    },
    { status: 410 }
  );
}
