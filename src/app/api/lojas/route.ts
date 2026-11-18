// ═══════════════════════════════════════════════════════════
// API de Lojas - Listagem pública e gestão do perfil da loja
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { lojaSchema, lojaUpdateSchema } from '@/lib/security';
import { isStrapiConfigured, strapiGetLojas } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

// Campos públicos selecionados para listagem e detalhes de lojas
const lojaPublicSelect = {
  id: true,
  nome: true,
  cnpj: true,
  descricao: true,
  logoUrl: true,
  bannerUrl: true,
  endereco: true,
  cidade: true,
  estado: true,
  cep: true,
  latitude: true,
  longitude: true,
  telefone: true,
  whatsapp: true,
  email: true,
  website: true,
  horarioFuncionamento: true,
  plano: true,
  assinaturaAtiva: true,
  ativo: true,
  userId: true,
  _count: {
    select: {
      veiculos: {
        where: { ativo: true, vendido: false },
      },
    },
  },
};

// ─── GET: Listar lojas ou buscar loja específica ──────────
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const minha = searchParams.get('minha');

    // ─── Retorna a loja do lojista autenticado (ou 1ª loja para ADMIN)
    if (minha === 'true') {
      const payload = getAuthUser(request);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado.' },
          { status: 401 }
        );
      }

      const minhaLoja =
        payload.role === 'ADMIN'
          ? await prisma.loja.findFirst({
              where: id ? { id } : { ativo: true },
              select: lojaPublicSelect,
            })
          : await prisma.loja.findUnique({
              where: { userId: payload.userId },
              select: lojaPublicSelect,
            });

      if (!minhaLoja) {
        return NextResponse.json(
          { success: false, error: 'Loja não encontrada.' },
          { status: 404 }
        );
      }

      const { _count, ...dados } = minhaLoja;
      return NextResponse.json({
        success: true,
        data: {
          ...dados,
          totalVeiculos: _count.veiculos,
        },
      });
    }

    // ─── Busca de loja específica por ID ──────────────────
    if (id) {
      const loja = await prisma.loja.findUnique({
        where: { id },
        select: lojaPublicSelect,
      });

      if (!loja || !loja.ativo) {
        return NextResponse.json(
          { success: false, error: 'Loja não encontrada.' },
          { status: 404 }
        );
      }

      const { _count, ...dados } = loja;
      return NextResponse.json({
        success: true,
        data: {
          ...dados,
          totalVeiculos: _count.veiculos,
        },
      });
    }

    // ─── Listagem de todas as lojas ativas (Strapi -> Fallback Local) ────────────────
    if (isStrapiConfigured()) {
      const strapiLojas = await strapiGetLojas();
      if (strapiLojas && strapiLojas.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'STRAPI_CMS',
          data: strapiLojas,
        });
      }
    }

    const lojas = await prisma.loja.findMany({
      where: { ativo: true },
      select: lojaPublicSelect,
      orderBy: { nome: 'asc' },
    });

    const lojasFormatadas = lojas.map(({ _count, ...loja }) => ({
      ...loja,
      totalVeiculos: _count.veiculos,
    }));

    return NextResponse.json({
      success: true,
      data: lojasFormatadas,
    });
  } catch (error) {
    console.error('[LOJAS/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── POST: Criar loja para o lojista autenticado ──────────
export async function POST(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'LOJISTA') {
      return NextResponse.json(
        { success: false, error: 'Apenas lojistas podem cadastrar uma loja.' },
        { status: 403 }
      );
    }

    // Verifica se o usuário já possui loja
    const lojaExistente = await prisma.loja.findUnique({
      where: { userId: payload.userId },
    });

    if (lojaExistente) {
      return NextResponse.json(
        { success: false, error: 'Você já possui uma loja cadastrada.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const dadosLimpos = {
      ...body,
      cnpj: typeof body.cnpj === 'string' ? body.cnpj.replace(/\D/g, '') : body.cnpj,
      cep: typeof body.cep === 'string' ? body.cep.replace(/\D/g, '') : body.cep,
      estado: typeof body.estado === 'string' ? body.estado.toUpperCase() : body.estado,
    };

    const resultado = lojaSchema.safeParse(dadosLimpos);
    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados da loja inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Verifica duplicidade de CNPJ
    const cnpjEmUso = await prisma.loja.findUnique({
      where: { cnpj: resultado.data.cnpj },
    });
    if (cnpjEmUso) {
      return NextResponse.json(
        { success: false, error: 'Este CNPJ já está cadastrado.' },
        { status: 400 }
      );
    }

    const novaLoja = await prisma.loja.create({
      data: {
        ...resultado.data,
        userId: payload.userId,
        plano: 'BASICO',
        assinaturaAtiva: false,
      },
    });

    return NextResponse.json(
      { success: true, data: novaLoja },
      { status: 201 }
    );
  } catch (error) {
    console.error('[LOJAS/POST] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── PUT: Atualizar perfil da loja do lojista autenticado ─
export async function PUT(request: NextRequest) {
  try {
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'LOJISTA' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas lojistas e administradores podem atualizar a loja.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const loja =
      payload.role === 'ADMIN'
        ? await prisma.loja.findFirst({
            where: typeof body.id === 'string' && body.id ? { id: body.id } : { ativo: true },
          })
        : await prisma.loja.findUnique({
            where: { userId: payload.userId },
          });

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }

    const dadosNormalizados = {
      ...body,
      ...(typeof body.cnpj === 'string' ? { cnpj: body.cnpj.replace(/\D/g, '') } : {}),
      ...(typeof body.cep === 'string' ? { cep: body.cep.replace(/\D/g, '') } : {}),
      ...(typeof body.estado === 'string' ? { estado: body.estado.toUpperCase() } : {}),
    };

    const resultado = lojaUpdateSchema.safeParse(dadosNormalizados);
    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados da loja inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { logoUrl, bannerUrl, website, cnpj, ...rest } = resultado.data;

    // Se o CNPJ foi alterado, valida duplicidade
    if (cnpj && cnpj !== loja.cnpj) {
      if (cnpj.length !== 14) {
        return NextResponse.json(
          { success: false, error: 'CNPJ deve ter 14 dígitos.' },
          { status: 400 }
        );
      }
      const cnpjExistente = await prisma.loja.findUnique({ where: { cnpj } });
      if (cnpjExistente) {
        return NextResponse.json(
          { success: false, error: 'Este CNPJ já está cadastrado em outra loja.' },
          { status: 400 }
        );
      }
    }

    const lojaAtualizada = await prisma.loja.update({
      where: { id: loja.id },
      data: {
        ...rest,
        ...(cnpj !== undefined ? { cnpj } : {}),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl: bannerUrl || null } : {}),
        ...(website !== undefined ? { website: website || null } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: lojaAtualizada,
    });
  } catch (error) {
    console.error('[LOJAS/PUT] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
