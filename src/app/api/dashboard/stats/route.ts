// ═══════════════════════════════════════════════════════════
// API Dashboard Stats & Balanço Interativo (Lojista e Admin)
// Suporta filtro por período (dataInicio, dataFim), balanço de
// entradas/saídas, rastreio de vendedores e agendamentos
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
        { success: false, error: 'Acesso restrito a lojistas e administradores.' },
        { status: 403 }
      );
    }

    const isAdmin = payload.role === 'ADMIN';
    const searchParams = request.nextUrl.searchParams;

    // ─── Período selecionado (default: 14/10/2026 até 17/11/2026) ─
    const dataInicioParam = searchParams.get('dataInicio') || '2026-10-14';
    const dataFimParam = searchParams.get('dataFim') || '2026-11-17';
    const vendedorFiltro = searchParams.get('vendedor') || '';

    const inicioDate = new Date(`${dataInicioParam}T00:00:00.000-03:00`);
    const fimDate = new Date(`${dataFimParam}T23:59:59.999-03:00`);

    const periodoValido =
      !isNaN(inicioDate.getTime()) && !isNaN(fimDate.getTime());

    // ─── Escopo unificado da Empresa / Showroom ───────────
    const primeiraLoja = await prisma.loja.findFirst({
      where: { ativo: true },
    });

    const lojaDoUsuario = !isAdmin
      ? await prisma.loja.findUnique({ where: { userId: payload.userId } })
      : null;

    const loja = lojaDoUsuario ||
      primeiraLoja || {
        id: 'global-admin',
        nome: 'AutoMarket Select',
        cnpj: '00000000000191',
        endereco: 'Showroom Principal',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '00000000',
        telefone: '08007772424',
        whatsapp: '5511999881234',
        email: 'admin@automarket.com.br',
        plano: 'ENTERPRISE',
        assinaturaAtiva: true,
        ativo: true,
        userId: payload.userId,
      };

    const lojaWhere = {};

    // ─── Consultas principais ─────────────────────────────
    const [
      todosVeiculos,
      veiculosDestaque,
      totalLeads,
      leadsNovos,
      leadsConvertidos,
      agendamentosPendentes,
      leadsRecentes,
      agendamentosTodos,
      transacoesPagas,
      lojasAtivas,
    ] = await Promise.all([
      prisma.veiculo.findMany({
        where: { ...lojaWhere, ativo: true },
        orderBy: { createdAt: 'desc' },
        include: {
          loja: {
            select: {
              id: true,
              nome: true,
              cidade: true,
              estado: true,
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
      prisma.veiculo.count({
        where: { ...lojaWhere, ativo: true, vendido: false, destaque: true },
      }),
      prisma.lead.count({
        where: lojaWhere,
      }),
      prisma.lead.count({
        where: { ...lojaWhere, status: 'NOVO' },
      }),
      prisma.lead.count({
        where: { ...lojaWhere, status: 'CONVERTIDO' },
      }),
      prisma.agendamentoServico.count({
        where: { ...lojaWhere, status: 'PENDENTE' },
      }),
      prisma.lead.findMany({
        where: lojaWhere,
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          veiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              ano: true,
              preco: true,
              imagemPrincipal: true,
            },
          },
          loja: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.agendamentoServico.findMany({
        where: lojaWhere,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          servico: {
            select: {
              id: true,
              nome: true,
              categoria: true,
              preco: true,
            },
          },
          loja: {
            select: {
              id: true,
              nome: true,
              cidade: true,
              estado: true,
            },
          },
        },
      }),
      prisma.transacaoPagamento.findMany({
        where: {
          ...lojaWhere,
          status: 'PAGO',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          loja: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.loja.findMany({
        where: { ativo: true },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const veiculosEmEstoque = todosVeiculos.filter((v) => !v.vendido);
    const totalVeiculos = veiculosEmEstoque.length;

    const taxaConversao =
      totalLeads > 0
        ? Number(((leadsConvertidos / totalLeads) * 100).toFixed(1))
        : 0;

    // ─── Normaliza informações de vendedor em cada veículo ─
    const catalogoRastreavel = todosVeiculos.map((v) => {
      const vendedorAdicionou =
        v.cadastradoPorNome || v.loja?.user?.nome || v.loja?.nome || 'Vendedor';
      const vendedorVendeu = v.vendido
        ? v.vendidoPorNome ||
          v.cadastradoPorNome ||
          v.loja?.user?.nome ||
          v.loja?.nome ||
          'Vendedor'
        : null;
      const valorVendaFinal = v.vendido
        ? v.valorVenda ?? v.precoPromocional ?? v.preco
        : null;
      const custoEstimado = v.precoCusto ?? Math.round(v.preco * 0.81);

      let fotosCount = v.imagemPrincipal ? 1 : 0;
      if (v.imagens) {
        try {
          const parsed = JSON.parse(v.imagens);
          if (Array.isArray(parsed)) {
            fotosCount = Math.max(fotosCount, parsed.length);
          }
        } catch {
          // ignora JSON inválido
        }
      }

      return {
        id: v.id,
        marca: v.marca,
        modelo: v.modelo,
        versao: v.versao,
        ano: v.ano,
        km: v.km,
        categoria: v.categoria,
        cambio: v.cambio,
        combustivel: v.combustivel,
        preco: v.preco,
        precoPromocional: v.precoPromocional,
        precoCusto: custoEstimado,
        valorVenda: valorVendaFinal,
        lucroLiquido:
          valorVendaFinal !== null ? valorVendaFinal - custoEstimado : null,
        vendido: v.vendido,
        destaque: v.destaque,
        dataVenda: v.dataVenda ? v.dataVenda.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        imagemPrincipal: v.imagemPrincipal,
        fotosCount,
        adicionadoPorNome: vendedorAdicionou,
        adicionadoPorEmail: v.loja?.user?.email || '',
        vendidoPorNome: vendedorVendeu,
        lojaId: v.lojaId,
        lojaNome: v.loja?.nome || 'Loja Parceira',
      };
    });

    // ─── Filtra vendas realizadas no período selecionado ──
    const vendasNoPeriodo = catalogoRastreavel.filter((v) => {
      if (!v.vendido) return false;
      if (
        vendedorFiltro &&
        v.vendidoPorNome?.toLowerCase() !== vendedorFiltro.toLowerCase() &&
        v.adicionadoPorNome.toLowerCase() !== vendedorFiltro.toLowerCase()
      ) {
        return false;
      }
      if (!periodoValido) return true;
      const refDate = v.dataVenda ? new Date(v.dataVenda) : new Date(v.createdAt);
      return refDate >= inicioDate && refDate <= fimDate;
    });

    // ─── Filtra serviços concluídos e assinaturas no período
    const servicosConcluidosPeriodo = agendamentosTodos.filter((ag) => {
      if (ag.status !== 'CONCLUIDO') return false;
      if (!periodoValido) return true;
      const d = new Date(ag.createdAt);
      return d >= inicioDate && d <= fimDate;
    });

    const transacoesPeriodo = transacoesPagas.filter((tx) => {
      if (!periodoValido) return true;
      const d = new Date(tx.createdAt);
      return d >= inicioDate && d <= fimDate;
    });

    // ─── Cálculo do Balanço Financeiro (Entradas vs. Saídas)
    const entradasVendasVeiculos = vendasNoPeriodo.reduce(
      (acc, v) => acc + (v.valorVenda ?? v.preco),
      0
    );

    const entradasServicos = servicosConcluidosPeriodo.reduce(
      (acc, ag) => acc + (ag.servico?.preco ?? 350),
      0
    );

    const entradasAssinaturas = transacoesPeriodo.reduce(
      (acc, tx) => acc + tx.valor,
      0
    );

    const totalEntradas =
      entradasVendasVeiculos + entradasServicos + entradasAssinaturas;

    const saidasCustoVeiculos = vendasNoPeriodo.reduce(
      (acc, v) => acc + v.precoCusto,
      0
    );

    const saidasComissoesOperacional = vendasNoPeriodo.reduce(
      (acc, v) => acc + Math.round((v.valorVenda ?? v.preco) * 0.025),
      0
    );

    const totalSaidas = saidasCustoVeiculos + saidasComissoesOperacional;
    const saldoLiquido = totalEntradas - totalSaidas;
    const margemLiquida =
      totalEntradas > 0
        ? Number(((saldoLiquido / totalEntradas) * 100).toFixed(1))
        : 0;
    const ticketMedioVenda =
      vendasNoPeriodo.length > 0
        ? Math.round(entradasVendasVeiculos / vendasNoPeriodo.length)
        : 0;

    // ─── Extrato Detalhado (O que Entrou e O que Saiu) ─────
    interface MovimentacaoItem {
      id: string;
      data: string;
      tipo: 'ENTRADA' | 'SAIDA';
      categoria: 'VENDA_VEICULO' | 'CUSTO_AQUISICAO' | 'COMISSAO' | 'SERVICO_POS_VENDA' | 'ASSINATURA';
      descricao: string;
      detalhe: string;
      vendedorNome: string;
      lojaNome: string;
      valor: number;
    }

    const movimentacoes: MovimentacaoItem[] = [];

    for (const v of vendasNoPeriodo) {
      const dataMov = v.dataVenda || v.createdAt;
      const valorVenda = v.valorVenda ?? v.preco;
      const comissao = Math.round(valorVenda * 0.025);

      movimentacoes.push({
        id: `ent-venda-${v.id}`,
        data: dataMov,
        tipo: 'ENTRADA',
        categoria: 'VENDA_VEICULO',
        descricao: `Venda: ${v.marca} ${v.modelo} ${v.ano}`,
        detalhe: `Vendido por ${v.vendidoPorNome} • Adicionado por ${v.adicionadoPorNome}`,
        vendedorNome: v.vendidoPorNome || v.adicionadoPorNome,
        lojaNome: v.lojaNome,
        valor: valorVenda,
      });

      movimentacoes.push({
        id: `sai-custo-${v.id}`,
        data: dataMov,
        tipo: 'SAIDA',
        categoria: 'CUSTO_AQUISICAO',
        descricao: `Custo de Aquisição/Repasse: ${v.marca} ${v.modelo} ${v.ano}`,
        detalhe: `Entrada de estoque por ${v.adicionadoPorNome} (${v.lojaNome})`,
        vendedorNome: v.adicionadoPorNome,
        lojaNome: v.lojaNome,
        valor: v.precoCusto,
      });

      movimentacoes.push({
        id: `sai-com-${v.id}`,
        data: dataMov,
        tipo: 'SAIDA',
        categoria: 'COMISSAO',
        descricao: `Comissão & Preparação: ${v.marca} ${v.modelo}`,
        detalhe: `Comissão sobre venda de ${v.vendidoPorNome}`,
        vendedorNome: v.vendidoPorNome || v.adicionadoPorNome,
        lojaNome: v.lojaNome,
        valor: comissao,
      });
    }

    for (const ag of servicosConcluidosPeriodo) {
      if (!vendedorFiltro) {
        movimentacoes.push({
          id: `ent-srv-${ag.id}`,
          data: ag.createdAt.toISOString(),
          tipo: 'ENTRADA',
          categoria: 'SERVICO_POS_VENDA',
          descricao: `Pós-Venda Concluído: ${ag.servico?.nome || ag.tipo}`,
          detalhe: `Cliente: ${ag.nome} • ${ag.veiculoInfo || ' Atendimento na loja'}`,
          vendedorNome: ag.loja?.nome || 'Pós-Venda',
          lojaNome: ag.loja?.nome || 'Loja Parceira',
          valor: ag.servico?.preco ?? 350,
        });
      }
    }

    for (const tx of transacoesPeriodo) {
      if (!vendedorFiltro) {
        movimentacoes.push({
          id: `ent-tx-${tx.id}`,
          data: tx.createdAt.toISOString(),
          tipo: 'ENTRADA',
          categoria: 'ASSINATURA',
          descricao:
            tx.tipo === 'ASSINATURA'
              ? `Assinatura Plano ${tx.plano || 'Mensal'}`
              : 'Destaque de Veículo Patrocinado',
          detalhe: `Faturamento confirmado (${tx.loja?.nome || 'Loja'})`,
          vendedorNome: tx.loja?.nome || 'Plataforma',
          lojaNome: tx.loja?.nome || 'AutoMarket',
          valor: tx.valor,
        });
      }
    }

    movimentacoes.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    // ─── Balanço Consolidado por Vendedor ─────────────────
    // Reúne todos os vendedores conhecidos nas lojas e veículos
    const mapaVendedores = new Map<
      string,
      {
        vendedorNome: string;
        email: string;
        lojaNome: string;
        totalAdicionados: number;
        emEstoque: number;
        vendidosNoPeriodo: number;
        totalEntradasVendas: number;
        totalSaidasCustos: number;
        saldoLiquido: number;
        carrosAdicionados: typeof catalogoRastreavel;
        carrosVendidos: typeof catalogoRastreavel;
      }
    >();

    for (const l of lojasAtivas) {
      const nomeVend = l.user?.nome || l.nome;
      const chave = nomeVend.toLowerCase();
      if (!mapaVendedores.has(chave)) {
        mapaVendedores.set(chave, {
          vendedorNome: nomeVend,
          email: l.user?.email || l.email,
          lojaNome: l.nome,
          totalAdicionados: 0,
          emEstoque: 0,
          vendidosNoPeriodo: 0,
          totalEntradasVendas: 0,
          totalSaidasCustos: 0,
          saldoLiquido: 0,
          carrosAdicionados: [],
          carrosVendidos: [],
        });
      }
    }

    // Contabiliza quais carros cada vendedor adicionou
    for (const v of catalogoRastreavel) {
      const chaveAdicionou = v.adicionadoPorNome.toLowerCase();
      if (!mapaVendedores.has(chaveAdicionou)) {
        mapaVendedores.set(chaveAdicionou, {
          vendedorNome: v.adicionadoPorNome,
          email: v.adicionadoPorEmail,
          lojaNome: v.lojaNome,
          totalAdicionados: 0,
          emEstoque: 0,
          vendidosNoPeriodo: 0,
          totalEntradasVendas: 0,
          totalSaidasCustos: 0,
          saldoLiquido: 0,
          carrosAdicionados: [],
          carrosVendidos: [],
        });
      }
      const itemAdd = mapaVendedores.get(chaveAdicionou)!;
      itemAdd.totalAdicionados += 1;
      if (!v.vendido) itemAdd.emEstoque += 1;
      itemAdd.carrosAdicionados.push(v);
    }

    // Contabiliza quais carros cada vendedor vendeu no período selecionado
    for (const v of vendasNoPeriodo) {
      const nomeQuemVendeu = v.vendidoPorNome || v.adicionadoPorNome;
      const chaveVendeu = nomeQuemVendeu.toLowerCase();
      if (!mapaVendedores.has(chaveVendeu)) {
        mapaVendedores.set(chaveVendeu, {
          vendedorNome: nomeQuemVendeu,
          email: v.adicionadoPorEmail,
          lojaNome: v.lojaNome,
          totalAdicionados: 0,
          emEstoque: 0,
          vendidosNoPeriodo: 0,
          totalEntradasVendas: 0,
          totalSaidasCustos: 0,
          saldoLiquido: 0,
          carrosAdicionados: [],
          carrosVendidos: [],
        });
      }
      const itemVend = mapaVendedores.get(chaveVendeu)!;
      const entrada = v.valorVenda ?? v.preco;
      const saida = v.precoCusto + Math.round(entrada * 0.025);
      itemVend.vendidosNoPeriodo += 1;
      itemVend.totalEntradasVendas += entrada;
      itemVend.totalSaidasCustos += saida;
      itemVend.saldoLiquido =
        itemVend.totalEntradasVendas - itemVend.totalSaidasCustos;
      itemVend.carrosVendidos.push(v);
    }

    const balancoVendedores = Array.from(mapaVendedores.values()).sort(
      (a, b) => b.totalEntradasVendas - a.totalEntradasVendas
    );

    return NextResponse.json({
      success: true,
      data: {
        isAdmin,
        periodo: {
          dataInicio: dataInicioParam,
          dataFim: dataFimParam,
          vendedor: vendedorFiltro,
        },
        totalVeiculos,
        veiculosDestaque,
        totalLeads,
        leadsNovos,
        taxaConversao,
        agendamentosPendentes,
        loja,
        leadsRecentes,
        agendamentosRecentes: agendamentosTodos.slice(0, 6),
        agendamentosTodos,
        balancoFinanceiro: {
          totalEntradas,
          entradasVendasVeiculos,
          entradasServicos,
          entradasAssinaturas,
          totalSaidas,
          saidasCustoVeiculos,
          saidasComissoesOperacional,
          saldoLiquido,
          margemLiquida,
          quantidadeCarrosVendidos: vendasNoPeriodo.length,
          ticketMedioVenda,
        },
        vendasNoPeriodo,
        movimentacoes,
        balancoVendedores,
        catalogoRastreavel,
      },
    });
  } catch (error) {
    console.error('[DASHBOARD/STATS] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
