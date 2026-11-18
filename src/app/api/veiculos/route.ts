// ═══════════════════════════════════════════════════════════
// API de Veículos - Listagem pública com filtros facetados
// e criação de anúncios para lojistas (com regras Pilar III)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { filtrosVeiculoSchema, veiculoSchema, checkRateLimit } from '@/lib/security';
import { PLANOS, PlanoKey } from '@/lib/stripe';
import { getClientIP } from '@/lib/utils';
import { isStrapiConfigured, strapiGetVeiculos, strapiUpsertVeiculo } from '@/lib/strapi';
import { processStrapiSocialWebhook } from '@/lib/social-automation';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// ─── GET: Listagem de veículos com filtros ────────────────
export async function GET(request: NextRequest) {
  try {
    // ─── Rate limiting para buscas ────────────────────────
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`veiculos:${ip}`, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisições. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    // ─── Extrai e valida parâmetros de filtro (ignora vazios)
    const searchParams = request.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (value !== '') {
        rawParams[key] = value;
      }
    });

    const resultado = filtrosVeiculoSchema.safeParse(rawParams);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros de filtro inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const filtros = resultado.data;

    // ─── Prioridade Strapi Headless CMS (quando configurado e online) ───
    if (isStrapiConfigured() && !filtros.minhas) {
      const strapiData = await strapiGetVeiculos();
      if (strapiData && strapiData.length > 0) {
        const disponiveis = strapiData.filter((v) => v.ativo && !v.vendido);
        const filtrados = disponiveis.filter((v) => {
          if (filtros.marca && !filtros.marca.split(',').includes(v.marca)) return false;
          if (filtros.modelo && !v.modelo.toLowerCase().includes(filtros.modelo.toLowerCase())) return false;
          if (filtros.cambio && v.cambio !== filtros.cambio) return false;
          if (filtros.combustivel && v.combustivel !== filtros.combustivel) return false;
          if (filtros.categoria && v.categoria !== filtros.categoria) return false;
          if (filtros.destaque && !v.destaque) return false;
          if (filtros.ofertas && !v.precoPromocional) return false;
          if (filtros.precoMin && v.preco < filtros.precoMin) return false;
          if (filtros.precoMax && v.preco > filtros.precoMax) return false;
          if (filtros.anoMin && v.ano < filtros.anoMin) return false;
          if (filtros.anoMax && v.ano > filtros.anoMax) return false;
          if (filtros.kmMax !== undefined && v.km > filtros.kmMax) return false;
          if (
            filtros.busca &&
            !`${v.marca} ${v.modelo} ${v.versao || ''}`.toLowerCase().includes(filtros.busca.toLowerCase())
          ) {
            return false;
          }
          return true;
        });

        const totalStrapi = filtrados.length;
        const skipStrapi = (filtros.pagina - 1) * filtros.limite;
        const paginadosStrapi = filtrados.slice(skipStrapi, skipStrapi + filtros.limite);

        const countField = (field: 'marca' | 'cambio' | 'combustivel' | 'categoria') => {
          const m = new Map<string, number>();
          disponiveis.forEach((item) => {
            const val = item[field];
            if (val) m.set(val, (m.get(val) || 0) + 1);
          });
          return Array.from(m.entries()).map(([nome, count]) => ({ nome, count }));
        };

        return NextResponse.json({
          success: true,
          source: 'STRAPI_CMS',
          data: paginadosStrapi,
          contagens: {
            marcas: countField('marca'),
            cambios: countField('cambio'),
            combustiveis: countField('combustivel'),
            categorias: countField('categoria'),
            precoRange: {
              min: Math.min(...disponiveis.map((v) => v.preco)),
              max: Math.max(...disponiveis.map((v) => v.preco)),
            },
            anoRange: {
              min: Math.min(...disponiveis.map((v) => v.ano)),
              max: Math.max(...disponiveis.map((v) => v.ano)),
            },
            kmRange: {
              min: Math.min(...disponiveis.map((v) => v.km)),
              max: Math.max(...disponiveis.map((v) => v.km)),
            },
            total: disponiveis.length,
          },
          meta: {
            total: totalStrapi,
            pagina: filtros.pagina,
            limite: filtros.limite,
            totalPaginas: Math.max(1, Math.ceil(totalStrapi / filtros.limite)),
          },
        });
      }
    }

    // ─── Construção dinâmica da cláusula WHERE (Fallback SQLite/Prisma) ────────────
    const where: Prisma.VeiculoWhereInput = {
      ativo: true,
    };

    // Modo painel da empresa (?minhas=true): inclui estoque completo e vendidos
    if (filtros.minhas) {
      const payload = getAuthUser(request);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado.' },
          { status: 401 }
        );
      }

      if (payload.role !== 'LOJISTA' && payload.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Acesso restrito a vendedores e administradores.' },
          { status: 403 }
        );
      }

      if (filtros.lojaId) {
        where.lojaId = filtros.lojaId;
      }
    } else {
      // Listagem pública: exibe apenas veículos disponíveis (não vendidos)
      where.vendido = false;
    }

    // Filtro por loja específica (?lojaId=...)
    if (filtros.lojaId && !filtros.minhas) {
      where.lojaId = filtros.lojaId;
    }

    // Filtro por marca (suporta valor único ou lista separada por vírgula)
    if (filtros.marca) {
      const marcas = filtros.marca
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      if (marcas.length > 1) {
        where.marca = { in: marcas };
      } else if (marcas.length === 1) {
        where.marca = marcas[0];
      }
    }

    // Filtro por modelo (contains para busca parcial)
    if (filtros.modelo) {
      where.modelo = { contains: filtros.modelo };
    }

    // Filtro por cor
    if (filtros.cor) {
      where.cor = { contains: filtros.cor };
    }

    // Filtros de faixa: ano
    if (filtros.anoMin || filtros.anoMax) {
      where.ano = {};
      if (filtros.anoMin) where.ano.gte = filtros.anoMin;
      if (filtros.anoMax) where.ano.lte = filtros.anoMax;
    }

    // Filtros de faixa: preço
    if (filtros.precoMin || filtros.precoMax) {
      where.preco = {};
      if (filtros.precoMin) where.preco.gte = filtros.precoMin;
      if (filtros.precoMax) where.preco.lte = filtros.precoMax;
    }

    // Filtros de faixa: quilometragem
    if (filtros.kmMin !== undefined || filtros.kmMax !== undefined) {
      where.km = {};
      if (filtros.kmMin !== undefined) where.km.gte = filtros.kmMin;
      if (filtros.kmMax !== undefined) where.km.lte = filtros.kmMax;
    }

    // Filtros exatos: câmbio, combustível, categoria
    if (filtros.cambio) where.cambio = filtros.cambio;
    if (filtros.combustivel) where.combustivel = filtros.combustivel;
    if (filtros.categoria) where.categoria = filtros.categoria;

    // Filtro de destaque
    if (filtros.destaque) where.destaque = true;

    // Filtro de ofertas promocionais (?ofertas=true)
    if (filtros.ofertas) {
      where.precoPromocional = { not: null };
    }

    // Busca textual: pesquisa em marca, modelo e versão
    if (filtros.busca) {
      where.OR = [
        { marca: { contains: filtros.busca } },
        { modelo: { contains: filtros.busca } },
        { versao: { contains: filtros.busca } },
      ];
    }

    // ─── Ordenação (padrão: destaques pagos primeiro) ─────
    let orderBy:
      | Prisma.VeiculoOrderByWithRelationInput
      | Prisma.VeiculoOrderByWithRelationInput[];

    switch (filtros.ordenar) {
      case 'preco_asc':
        orderBy = { preco: 'asc' };
        break;
      case 'preco_desc':
        orderBy = { preco: 'desc' };
        break;
      case 'ano_desc':
        orderBy = { ano: 'desc' };
        break;
      case 'km_asc':
        orderBy = { km: 'asc' };
        break;
      case 'recentes':
      default:
        orderBy = [{ destaque: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    // ─── Paginação ────────────────────────────────────────
    const pagina = filtros.pagina;
    const limite = filtros.limite;
    const skip = (pagina - 1) * limite;

    // ─── Consulta principal + contagem total ──────────────
    const [veiculos, total] = await Promise.all([
      prisma.veiculo.findMany({
        where,
        orderBy,
        skip,
        take: limite,
        include: {
          loja: {
            select: {
              id: true,
              nome: true,
              cidade: true,
              estado: true,
              whatsapp: true,
              logoUrl: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.veiculo.count({ where }),
    ]);

    // ─── Contagens facetadas (para sidebar de filtros) ────
    const baseWhere: Prisma.VeiculoWhereInput = { ativo: true, vendido: false };

    const [
      contagemMarcas,
      contagemCambios,
      contagemCombustiveis,
      contagemCategorias,
      agregacoes,
    ] = await Promise.all([
      prisma.veiculo.groupBy({
        by: ['marca'],
        where: baseWhere,
        _count: { marca: true },
        orderBy: { _count: { marca: 'desc' } },
      }),
      prisma.veiculo.groupBy({
        by: ['cambio'],
        where: baseWhere,
        _count: { cambio: true },
      }),
      prisma.veiculo.groupBy({
        by: ['combustivel'],
        where: baseWhere,
        _count: { combustivel: true },
      }),
      prisma.veiculo.groupBy({
        by: ['categoria'],
        where: baseWhere,
        _count: { categoria: true },
      }),
      prisma.veiculo.aggregate({
        where: baseWhere,
        _min: { preco: true, ano: true, km: true },
        _max: { preco: true, ano: true, km: true },
      }),
    ]);

    const contagens = {
      marcas: contagemMarcas.map((item) => ({
        nome: item.marca,
        count: item._count.marca,
      })),
      cambios: contagemCambios.map((item) => ({
        nome: item.cambio,
        count: item._count.cambio,
      })),
      combustiveis: contagemCombustiveis.map((item) => ({
        nome: item.combustivel,
        count: item._count.combustivel,
      })),
      categorias: contagemCategorias.map((item) => ({
        nome: item.categoria,
        count: item._count.categoria,
      })),
      precoRange: {
        min: agregacoes._min.preco ?? 0,
        max: agregacoes._max.preco ?? 0,
      },
      anoRange: {
        min: agregacoes._min.ano ?? 0,
        max: agregacoes._max.ano ?? 0,
      },
      kmRange: {
        min: agregacoes._min.km ?? 0,
        max: agregacoes._max.km ?? 0,
      },
      total,
    };

    return NextResponse.json({
      success: true,
      data: veiculos,
      contagens,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('[VEICULOS/GET] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ─── POST: Criar novo veículo (LOJISTA ou ADMIN) ─────────
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

    // ─── Verificação de permissão: lojistas e admin ───────
    if (payload.role !== 'LOJISTA' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas lojistas e administradores podem cadastrar veículos.' },
        { status: 403 }
      );
    }

    // ─── Validação do corpo da requisição ─────────────────
    const body = await request.json();
    const resultado = veiculoSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados do veículo inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      imagemPrincipal,
      destaque: desejaDestaque,
      lojaId: bodyLojaId,
      dataVenda: rawDataVenda,
      cadastradoPorId: bodyCadastradoPorId,
      cadastradoPorNome: bodyCadastradoPorNome,
      ...dadosVeiculo
    } = resultado.data;

    // ─── Busca usuário e loja vinculada ───────────────────
    const usuario = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, nome: true },
    });

    const loja =
      payload.role === 'LOJISTA'
        ? await prisma.loja.findUnique({ where: { userId: payload.userId } })
        : bodyLojaId
        ? await prisma.loja.findUnique({ where: { id: bodyLojaId } })
        : await prisma.loja.findFirst({ where: { ativo: true } });

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada. Configure uma loja primeiro.' },
        { status: 404 }
      );
    }

    // ─── Regra Pilar III: destaque exige assinatura ativa e cota disponível
    let destaquePermitido = false;
    if (desejaDestaque && loja.assinaturaAtiva) {
      const planoInfo = PLANOS[loja.plano as PlanoKey];
      const limiteDestaques = planoInfo?.destaques ?? 0;

      if (limiteDestaques > 0) {
        const destaquesAtivos = await prisma.veiculo.count({
          where: {
            lojaId: loja.id,
            ativo: true,
            destaque: true,
          },
        });
        destaquePermitido = destaquesAtivos < limiteDestaques;
      }
    }

    // ─── Cria o veículo com rastreio do vendedor ──────────
    const veiculo = await prisma.veiculo.create({
      data: {
        ...dadosVeiculo,
        precoCusto:
          dadosVeiculo.precoCusto !== undefined && dadosVeiculo.precoCusto !== null
            ? dadosVeiculo.precoCusto
            : Math.round(dadosVeiculo.preco * 0.82),
        dataVenda: rawDataVenda ? new Date(rawDataVenda) : null,
        cadastradoPorId: bodyCadastradoPorId || usuario?.id || payload.userId,
        cadastradoPorNome: bodyCadastradoPorNome || usuario?.nome || loja.nome,
        imagemPrincipal: imagemPrincipal || null,
        destaque: destaquePermitido,
        lojaId: loja.id,
      },
    });

    // Sincroniza com Strapi CMS e dispara automação de postagem social
    if (isStrapiConfigured()) {
      await strapiUpsertVeiculo(veiculo as unknown as Record<string, unknown>);
    }
    await processStrapiSocialWebhook({
      event: 'entry.create',
      model: 'api::veiculo.veiculo',
      entry: veiculo as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, data: veiculo },
      { status: 201 }
    );
  } catch (error) {
    console.error('[VEICULOS/POST] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
