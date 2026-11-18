// ═══════════════════════════════════════════════════════════
// API de Serviços - Catálogo de revisões e manutenções
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { isStrapiConfigured, strapiGetServicos } from '@/lib/strapi';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema de validação para criação de serviço
const servicoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres').max(2000),
  categoria: z.enum(['REVISAO', 'MANUTENCAO', 'FUNILARIA', 'ACESSORIOS', 'SEGURO']),
  preco: z.number().positive('Preço deve ser positivo').optional(),
  precoPromocional: z.number().positive().optional(),
  duracao: z.string().max(50).optional(),
  icone: z.string().max(50).optional(),
  imagemUrl: z.string().url().optional(),
  destaque: z.boolean().optional(),
});

// ─── GET: Listar serviços ativos ──────────────────────────
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get('categoria') || undefined;

    if (isStrapiConfigured()) {
      const strapiServicos = await strapiGetServicos(categoria);
      if (strapiServicos && strapiServicos.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'STRAPI_CMS',
          data: strapiServicos,
        });
      }
    }

    // Construção dinâmica do filtro WHERE (Fallback SQLite/Prisma)
    const where: { ativo: boolean; categoria?: string } = {
      ativo: true,
    };

    if (categoria) {
      where.categoria = categoria;
    }

    // Busca serviços com nome da loja
    const servicos = await prisma.servico.findMany({
      where,
      orderBy: [
        { destaque: 'desc' },
        { nome: 'asc' },
      ],
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: servicos,
    });
  } catch (error) {
    console.error('[SERVICOS/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── POST: Criar serviço (somente LOJISTA) ───────────────
export async function POST(request: NextRequest) {
  try {
    // ─── Autenticação ─────────────────────────────────────
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'LOJISTA') {
      return NextResponse.json(
        { success: false, error: 'Apenas lojistas podem cadastrar serviços.' },
        { status: 403 }
      );
    }

    // ─── Busca a loja do usuário ──────────────────────────
    const loja = await prisma.loja.findUnique({
      where: { userId: payload.userId },
    });

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada. Configure sua loja primeiro.' },
        { status: 404 }
      );
    }

    // ─── Validação do corpo ───────────────────────────────
    const body = await request.json();
    const resultado = servicoSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados do serviço inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // ─── Cria o serviço vinculado à loja ──────────────────
    const servico = await prisma.servico.create({
      data: {
        ...resultado.data,
        lojaId: loja.id,
      },
    });

    return NextResponse.json(
      { success: true, data: servico },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SERVICOS/POST] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
