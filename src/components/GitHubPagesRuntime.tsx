'use client';

import { useEffect } from 'react';
import initialSnapshot from '@/lib/initial-db-snapshot.json';
import { runLocalCatalogAIEngine } from '@/lib/ai-agent';
import { buildSocialMediaPostPackage } from '@/lib/social-automation';

const DB_STORAGE_KEY = 'automarket-ghpages-db-v3';

interface SnapshotDB {
  users: any[];
  lojas: any[];
  veiculos: any[];
  servicos: any[];
  leads: any[];
  agendamentos: any[];
  transacoes: any[];
}

function loadLocalDB(): SnapshotDB {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.veiculos)) {
        return parsed;
      }
    }
  } catch {
    // fallback para snapshot inicial
  }
  const clone: SnapshotDB = JSON.parse(JSON.stringify(initialSnapshot));
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(clone));
  } catch {
    // ignora erro de quota
  }
  return clone;
}

function saveLocalDB(db: SnapshotDB) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignora erro de quota
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getCurrentUser(db: SnapshotDB) {
  try {
    const rawUser = localStorage.getItem('automarket-user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const found = db.users.find((u) => u.id === parsed.id || u.email === parsed.email);
      if (found) return found;
      return parsed;
    }
  } catch {
    // ignora
  }
  return null;
}

export default function GitHubPagesRuntime() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isGitHubPages =
      window.location.hostname.endsWith('github.io') ||
      process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';

    if (!isGitHubPages) return;

    const originalFetch = window.fetch.bind(window);

    const interceptedFetch: typeof window.fetch = async (input, init) => {
      const rawUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url;

      const apiIdx = rawUrl.indexOf('/api/');
      if (apiIdx === -1) {
        return originalFetch(input, init);
      }

      const urlObj = new URL(rawUrl, window.location.origin);
      const apiPath = urlObj.pathname.slice(urlObj.pathname.indexOf('/api/'));
      const method = (init?.method || 'GET').toUpperCase();
      let body: Record<string, any> = {};

      if (init?.body && typeof init.body === 'string') {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = {};
        }
      }

      const db = loadLocalDB();

      // ─── 1. /api/auth/login ───────────────────────────────
      if (apiPath === '/api/auth/login' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const senha = String(body.senha || '');
        const user = db.users.find((u) => String(u.email).toLowerCase() === email);

        if (!user || (user.customPassword ? user.customPassword !== senha : senha !== '123456')) {
          return jsonResponse({ success: false, error: 'E-mail ou senha incorretos.' }, 401);
        }

        const token = `gh_jwt_${user.id}_${Date.now()}`;
        document.cookie = `automarket-token=${token}; path=/; max-age=604800`;
        return jsonResponse({
          success: true,
          token,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            telefone: user.telefone,
            role: user.role,
            avatarUrl: user.avatarUrl || null,
          },
        });
      }

      // ─── 2. /api/auth/registro ────────────────────────────
      if (apiPath === '/api/auth/registro' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        if (db.users.some((u) => String(u.email).toLowerCase() === email)) {
          return jsonResponse({ success: false, error: 'Este e-mail já está cadastrado.' }, 400);
        }
        const novoUser = {
          id: `gh_user_${Date.now()}`,
          nome: body.nome || 'Cliente',
          email,
          telefone: body.telefone || null,
          role: body.role || 'USUARIO',
          avatarUrl: null,
          customPassword: body.senha || '123456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.users.unshift(novoUser);
        saveLocalDB(db);

        const token = `gh_jwt_${novoUser.id}_${Date.now()}`;
        document.cookie = `automarket-token=${token}; path=/; max-age=604800`;
        return jsonResponse({
          success: true,
          token,
          user: novoUser,
        });
      }

      // ─── 3. /api/auth/logout ──────────────────────────────
      if (apiPath === '/api/auth/logout') {
        document.cookie = 'automarket-token=; path=/; max-age=0';
        return jsonResponse({ success: true });
      }

      // ─── 4. /api/auth/me ──────────────────────────────────
      if (apiPath === '/api/auth/me') {
        const user = getCurrentUser(db);
        if (!user) {
          return jsonResponse({ success: false, error: 'Não autorizado.' }, 401);
        }
        const loja = db.lojas.find((l) => l.userId === user.id) || db.lojas[0] || null;
        return jsonResponse({
          success: true,
          data: {
            ...user,
            loja,
          },
        });
      }

      // ─── 5. /api/perfil ───────────────────────────────────
      if (apiPath === '/api/perfil') {
        const user = getCurrentUser(db);
        if (!user) {
          return jsonResponse({ success: false, error: 'Não autorizado.' }, 401);
        }

        if (method === 'GET') {
          const loja = db.lojas.find((l) => l.userId === user.id) || db.lojas[0] || null;
          const meusLeads = db.leads
            .filter((l) => l.userId === user.id || l.email === user.email)
            .map((l) => ({
              ...l,
              veiculo: db.veiculos.find((v) => v.id === l.veiculoId) || null,
              loja: db.lojas.find((lj) => lj.id === l.lojaId) || db.lojas[0] || null,
            }));

          const adminStats =
            user.role === 'ADMIN'
              ? {
                  totalUsuarios: db.users.length,
                  totalLojas: db.lojas.length,
                  totalVeiculos: db.veiculos.filter((v) => v.ativo && !v.vendido).length,
                  totalLeads: db.leads.length,
                  totalAgendamentos: db.agendamentos.length,
                  ultimosUsuarios: db.users.slice(0, 6),
                }
              : null;

          return jsonResponse({
            success: true,
            data: {
              user: { ...user, loja },
              meusLeads,
              adminStats,
            },
          });
        }

        if (method === 'PUT') {
          const idx = db.users.findIndex((u) => u.id === user.id);
          const atualizado = {
            ...user,
            nome: body.nome || user.nome,
            telefone: body.telefone ?? user.telefone,
            avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : user.avatarUrl,
            ...(body.novaSenha ? { customPassword: body.novaSenha } : {}),
            updatedAt: new Date().toISOString(),
          };
          if (idx !== -1) {
            db.users[idx] = atualizado;
            saveLocalDB(db);
          }
          return jsonResponse({ success: true, data: atualizado });
        }
      }

      // ─── 6. /api/lojas ────────────────────────────────────
      if (apiPath === '/api/lojas') {
        if (method === 'GET') {
          const id = urlObj.searchParams.get('id');
          const minha = urlObj.searchParams.get('minha');
          const user = getCurrentUser(db);

          const formatLoja = (l: Record<string, any>) => ({
            ...l,
            totalVeiculos: db.veiculos.filter(
              (v) => v.ativo && !v.vendido && v.lojaId === l.id
            ).length,
          });

          if (minha === 'true') {
            const found =
              (user && db.lojas.find((l) => l.userId === user.id)) || db.lojas[0];
            return jsonResponse({ success: true, data: formatLoja(found) });
          }

          if (id) {
            const found = db.lojas.find((l) => l.id === id) || db.lojas[0];
            return jsonResponse({ success: true, data: formatLoja(found) });
          }

          return jsonResponse({
            success: true,
            data: db.lojas.map(formatLoja),
          });
        }

        if (method === 'PUT') {
          const targetId = body.id || db.lojas[0]?.id;
          const idx = db.lojas.findIndex((l) => l.id === targetId);
          const base = idx !== -1 ? db.lojas[idx] : db.lojas[0];
          const atualizada = {
            ...base,
            ...body,
            updatedAt: new Date().toISOString(),
          };
          if (idx !== -1) {
            db.lojas[idx] = atualizada;
          } else if (db.lojas.length > 0) {
            db.lojas[0] = atualizada;
          }
          saveLocalDB(db);
          return jsonResponse({ success: true, data: atualizada });
        }
      }

      // ─── 7. /api/servicos ─────────────────────────────────
      if (apiPath === '/api/servicos' && method === 'GET') {
        const cat = urlObj.searchParams.get('categoria');
        const lista = db.servicos
          .filter((s) => s.ativo && (!cat || s.categoria === cat))
          .map((s) => ({
            ...s,
            loja: db.lojas.find((l) => l.id === s.lojaId) || db.lojas[0] || { nome: 'Showroom' },
          }));
        return jsonResponse({ success: true, data: lista });
      }

      // ─── 8. /api/agendamentos ─────────────────────────────
      if (apiPath === '/api/agendamentos') {
        if (method === 'GET') {
          const lista = db.agendamentos.map((ag) => ({
            ...ag,
            servico: db.servicos.find((s) => s.id === ag.servicoId) || null,
            loja: db.lojas.find((l) => l.id === ag.lojaId) || db.lojas[0] || null,
          }));
          return jsonResponse({
            success: true,
            data: lista,
            meta: { total: lista.length, pagina: 1, limite: 50, totalPaginas: 1 },
          });
        }

        if (method === 'POST') {
          const novo = {
            id: `gh_ag_${Date.now()}`,
            nome: body.nome || 'Cliente',
            email: body.email || '',
            telefone: body.telefone || '',
            dataPreferida: body.dataPreferida || '2026-11-25',
            horarioPreferido: body.horarioPreferido || '10:00',
            veiculoInfo: body.veiculoInfo || null,
            observacoes: body.observacoes || null,
            tipo: body.tipo || 'SERVICO',
            status: 'PENDENTE',
            servicoId: body.servicoId || null,
            lojaId: body.lojaId || db.lojas[0]?.id,
            createdAt: new Date().toISOString(),
          };
          db.agendamentos.unshift(novo);
          saveLocalDB(db);
          return jsonResponse({ success: true, data: novo }, 201);
        }

        if (method === 'PATCH') {
          const idx = db.agendamentos.findIndex((a) => a.id === body.id);
          if (idx !== -1) {
            db.agendamentos[idx].status = body.status;
            saveLocalDB(db);
            return jsonResponse({ success: true, data: db.agendamentos[idx] });
          }
          return jsonResponse({ success: false, error: 'Agendamento não encontrado.' }, 404);
        }
      }

      // ─── 9. /api/leads ────────────────────────────────────
      if (apiPath === '/api/leads') {
        if (method === 'GET') {
          const status = urlObj.searchParams.get('status');
          const lista = db.leads
            .filter((l) => !status || l.status === status)
            .map((l) => ({
              ...l,
              veiculo: db.veiculos.find((v) => v.id === l.veiculoId) || null,
            }));
          return jsonResponse({
            success: true,
            data: lista,
            meta: { total: lista.length, pagina: 1, limite: 50, totalPaginas: 1 },
          });
        }

        if (method === 'POST') {
          const user = getCurrentUser(db);
          const veic = db.veiculos.find((v) => v.id === body.veiculoId) || db.veiculos[0];
          const novoLead = {
            id: `gh_lead_${Date.now()}`,
            nome: body.nome || 'Interessado',
            email: body.email || '',
            telefone: body.telefone || '',
            mensagem: body.mensagem || null,
            origem: body.origem || 'SITE',
            status: 'NOVO',
            veiculoId: veic?.id || body.veiculoId,
            lojaId: veic?.lojaId || db.lojas[0]?.id,
            userId: user?.id || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.leads.unshift(novoLead);
          saveLocalDB(db);
          return jsonResponse({ success: true, data: { id: novoLead.id } }, 201);
        }

        if (method === 'PATCH') {
          const idx = db.leads.findIndex((l) => l.id === body.id);
          if (idx !== -1) {
            db.leads[idx].status = body.status;
            saveLocalDB(db);
            return jsonResponse({ success: true, data: db.leads[idx] });
          }
          return jsonResponse({ success: false, error: 'Lead não encontrado.' }, 404);
        }
      }

      // ─── 10. /api/dashboard/stats ─────────────────────────
      if (apiPath === '/api/dashboard/stats' && method === 'GET') {
        const user = getCurrentUser(db);
        const isAdmin = user?.role === 'ADMIN';
        const dataInicioParam = urlObj.searchParams.get('dataInicio') || '2026-10-14';
        const dataFimParam = urlObj.searchParams.get('dataFim') || '2026-11-17';
        const vendedorFiltro = urlObj.searchParams.get('vendedor') || '';

        const inicioDate = new Date(`${dataInicioParam}T00:00:00.000-03:00`);
        const fimDate = new Date(`${dataFimParam}T23:59:59.999-03:00`);

        const todosVeiculos: Record<string, any>[] = db.veiculos.filter((v) => v.ativo);
        const catalogoRastreavel: Record<string, any>[] = todosVeiculos.map((v: Record<string, any>) => {
          const lj = db.lojas.find((l) => l.id === v.lojaId) || db.lojas[0];
          const donoUser = db.users.find((u) => u.id === lj?.userId);
          const vendedorAdicionou =
            v.cadastradoPorNome || donoUser?.nome || lj?.nome || 'Ricardo Silva';
          const vendedorVendeu = v.vendido
            ? v.vendidoPorNome || vendedorAdicionou
            : null;
          const valorVendaFinal = v.vendido
            ? v.valorVenda ?? v.precoPromocional ?? v.preco
            : null;
          const custoEstimado = v.precoCusto ?? Math.round(v.preco * 0.81);

          let fotosCount = v.imagemPrincipal ? 1 : 0;
          if (v.imagens) {
            try {
              const parsed = JSON.parse(v.imagens);
              if (Array.isArray(parsed)) fotosCount = Math.max(fotosCount, parsed.length);
            } catch {
              // ignora
            }
          }

          return {
            ...v,
            precoCusto: custoEstimado,
            valorVenda: valorVendaFinal,
            lucroLiquido: valorVendaFinal !== null ? valorVendaFinal - custoEstimado : null,
            fotosCount,
            adicionadoPorNome: vendedorAdicionou,
            adicionadoPorEmail: donoUser?.email || '',
            vendidoPorNome: vendedorVendeu,
            lojaNome: lj?.nome || 'AutoMarket Select',
          };
        });

        const vendasNoPeriodo = catalogoRastreavel.filter((v) => {
          if (!v.vendido) return false;
          if (
            vendedorFiltro &&
            v.vendidoPorNome?.toLowerCase() !== vendedorFiltro.toLowerCase() &&
            v.adicionadoPorNome.toLowerCase() !== vendedorFiltro.toLowerCase()
          ) {
            return false;
          }
          const refDate = new Date(v.dataVenda || v.createdAt);
          return refDate >= inicioDate && refDate <= fimDate;
        });

        const agendamentosTodos = db.agendamentos.map((ag) => ({
          ...ag,
          servico: db.servicos.find((s) => s.id === ag.servicoId) || null,
          loja: db.lojas.find((l) => l.id === ag.lojaId) || db.lojas[0] || null,
        }));

        const servicosConcluidosPeriodo = agendamentosTodos.filter((ag) => {
          if (ag.status !== 'CONCLUIDO') return false;
          const d = new Date(ag.createdAt);
          return d >= inicioDate && d <= fimDate;
        });

        const transacoesPeriodo = db.transacoes.filter((tx) => {
          if (tx.status !== 'PAGO') return false;
          const d = new Date(tx.createdAt);
          return d >= inicioDate && d <= fimDate;
        });

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

        const movimentacoes: Record<string, any>[] = [];
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
            detalhe: `Entrada de estoque por ${v.adicionadoPorNome}`,
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

        const mapaVendedores = new Map<string, any>();
        for (const v of catalogoRastreavel) {
          const chave = v.adicionadoPorNome.toLowerCase();
          if (!mapaVendedores.has(chave)) {
            mapaVendedores.set(chave, {
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
          const item = mapaVendedores.get(chave);
          item.totalAdicionados += 1;
          if (!v.vendido) item.emEstoque += 1;
          item.carrosAdicionados.push(v);
        }

        for (const v of vendasNoPeriodo) {
          const nomeVend = v.vendidoPorNome || v.adicionadoPorNome;
          const chave = nomeVend.toLowerCase();
          if (!mapaVendedores.has(chave)) {
            mapaVendedores.set(chave, {
              vendedorNome: nomeVend,
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
          const item = mapaVendedores.get(chave);
          const entrada = v.valorVenda ?? v.preco;
          const saida = v.precoCusto + Math.round(entrada * 0.025);
          item.vendidosNoPeriodo += 1;
          item.totalEntradasVendas += entrada;
          item.totalSaidasCustos += saida;
          item.saldoLiquido = item.totalEntradasVendas - item.totalSaidasCustos;
          item.carrosVendidos.push(v);
        }

        return jsonResponse({
          success: true,
          data: {
            isAdmin,
            periodo: { dataInicio: dataInicioParam, dataFim: dataFimParam, vendedor: vendedorFiltro },
            totalVeiculos: catalogoRastreavel.filter((v) => !v.vendido).length,
            veiculosDestaque: catalogoRastreavel.filter((v) => !v.vendido && v.destaque).length,
            totalLeads: db.leads.length,
            leadsNovos: db.leads.filter((l) => l.status === 'NOVO').length,
            taxaConversao: 33.3,
            agendamentosPendentes: db.agendamentos.filter((a) => a.status === 'PENDENTE').length,
            loja: db.lojas[0],
            leadsRecentes: db.leads.slice(0, 6),
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
            balancoVendedores: Array.from(mapaVendedores.values()),
            catalogoRastreavel,
          },
        });
      }

      // ─── 11. /api/veiculos & /api/veiculos/[id] ───────────
      if (apiPath === '/api/veiculos') {
        if (method === 'GET') {
          const sp = urlObj.searchParams;
          const minhas = sp.get('minhas') === 'true';
          const marca = sp.get('marca') || '';
          const categoria = sp.get('categoria') || '';
          const cambio = sp.get('cambio') || '';
          const combustivel = sp.get('combustivel') || '';
          const destaque = sp.get('destaque');
          const ofertas = sp.get('ofertas') === 'true';
          const busca = (sp.get('busca') || '').toLowerCase();
          const precoMin = sp.get('precoMin') ? Number(sp.get('precoMin')) : null;
          const precoMax = sp.get('precoMax') ? Number(sp.get('precoMax')) : null;
          const anoMin = sp.get('anoMin') ? Number(sp.get('anoMin')) : null;
          const anoMax = sp.get('anoMax') ? Number(sp.get('anoMax')) : null;
          const kmMax = sp.get('kmMax') ? Number(sp.get('kmMax')) : null;
          const ordenar = sp.get('ordenar') || 'recentes';
          const pagina = Math.max(1, Number(sp.get('pagina') || '1'));
          const limite = Math.max(1, Number(sp.get('limite') || '12'));

          const basePool = db.veiculos.filter((v) => v.ativo && (minhas ? true : !v.vendido));

          const filtrados = basePool
            .filter((v) => {
              if (marca && !marca.split(',').includes(v.marca)) return false;
              if (categoria && !categoria.split(',').includes(v.categoria)) return false;
              if (cambio && !cambio.split(',').includes(v.cambio)) return false;
              if (combustivel && !combustivel.split(',').includes(v.combustivel)) return false;
              if (destaque === 'true' && !v.destaque) return false;
              if (ofertas && !v.precoPromocional) return false;
              if (precoMin !== null && v.preco < precoMin) return false;
              if (precoMax !== null && v.preco > precoMax) return false;
              if (anoMin !== null && v.ano < anoMin) return false;
              if (anoMax !== null && v.ano > anoMax) return false;
              if (kmMax !== null && v.km > kmMax) return false;
              if (
                busca &&
                !`${v.marca} ${v.modelo} ${v.versao || ''}`.toLowerCase().includes(busca)
              ) {
                return false;
              }
              return true;
            })
            .map((v) => {
              const lj = db.lojas.find((l) => l.id === v.lojaId) || db.lojas[0];
              const dono = db.users.find((u) => u.id === lj?.userId);
              return {
                ...v,
                loja: lj ? { ...lj, user: dono } : undefined,
              };
            });

          filtrados.sort((a, b) => {
            if (ordenar === 'preco_asc') return a.preco - b.preco;
            if (ordenar === 'preco_desc') return b.preco - a.preco;
            if (ordenar === 'ano_desc') return b.ano - a.ano;
            if (ordenar === 'km_asc') return a.km - b.km;
            return Number(b.destaque) - Number(a.destaque);
          });

          const countBy = (field: string) => {
            const m = new Map<string, number>();
            for (const item of basePool) {
              const val = item[field];
              if (val) m.set(val, (m.get(val) || 0) + 1);
            }
            return Array.from(m.entries()).map(([nome, count]) => ({ nome, count }));
          };

          const total = filtrados.length;
          const paginados = filtrados.slice((pagina - 1) * limite, pagina * limite);

          return jsonResponse({
            success: true,
            data: paginados,
            contagens: {
              marcas: countBy('marca'),
              cambios: countBy('cambio'),
              combustiveis: countBy('combustivel'),
              categorias: countBy('categoria'),
              precoRange: { min: 70000, max: 350000 },
              anoRange: { min: 2022, max: 2025 },
              kmRange: { min: 0, max: 60000 },
              total: basePool.length,
            },
            meta: {
              total,
              pagina,
              limite,
              totalPaginas: Math.max(1, Math.ceil(total / limite)),
            },
          });
        }

        if (method === 'POST') {
          const user = getCurrentUser(db);
          const novo = {
            id: `gh_veic_${Date.now()}`,
            ...body,
            precoCusto: body.precoCusto ?? Math.round(Number(body.preco || 100000) * 0.81),
            cadastradoPorId: user?.id || 'lojista1',
            cadastradoPorNome: body.cadastradoPorNome || user?.nome || 'Ricardo Silva',
            vendido: false,
            destaque: Boolean(body.destaque),
            ativo: true,
            lojaId: db.lojas[0]?.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.veiculos.unshift(novo);
          saveLocalDB(db);
          return jsonResponse({ success: true, data: novo }, 201);
        }
      }

      if (apiPath.startsWith('/api/veiculos/')) {
        const id = apiPath.replace('/api/veiculos/', '');
        const idx = db.veiculos.findIndex((v) => v.id === id);

        if (method === 'GET') {
          const v = idx !== -1 ? db.veiculos[idx] : db.veiculos[0];
          if (!v) return jsonResponse({ success: false, error: 'Não encontrado.' }, 404);
          const lj = db.lojas.find((l) => l.id === v.lojaId) || db.lojas[0];
          return jsonResponse({ success: true, data: { ...v, loja: lj } });
        }

        if (method === 'PUT' && idx !== -1) {
          const atual = db.veiculos[idx];
          const atualizado = {
            ...atual,
            ...body,
            ...(body.vendido === false
              ? { dataVenda: null, valorVenda: null, vendidoPorId: null, vendidoPorNome: null }
              : {}),
            updatedAt: new Date().toISOString(),
          };
          db.veiculos[idx] = atualizado;
          saveLocalDB(db);
          return jsonResponse({ success: true, data: atualizado });
        }

        if (method === 'DELETE' && idx !== -1) {
          db.veiculos[idx].ativo = false;
          saveLocalDB(db);
          return jsonResponse({ success: true });
        }
      }

      // ─── 12. /api/stripe/checkout & confirm ───────────────
      if (apiPath === '/api/stripe/checkout' && method === 'POST') {
        return jsonResponse({
          success: true,
          data: {
            paymentIntentId: `pi_gh_${Date.now()}`,
            clientSecret: `pi_gh_secret_${Date.now()}`,
            valor: 49.9,
          },
        });
      }

      if (apiPath === '/api/stripe/confirm' && method === 'POST') {
        if (body.veiculoId) {
          const vIdx = db.veiculos.findIndex((v) => v.id === body.veiculoId);
          if (vIdx !== -1) {
            db.veiculos[vIdx].destaque = true;
            saveLocalDB(db);
          }
        }
        return jsonResponse({ success: true, data: { status: 'PAGO' } });
      }

      // ─── 13. /api/ai/chat (Concierge IA no GitHub Pages) ──
      if (apiPath === '/api/ai/chat') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: {
              active: true,
              provider: 'LOCAL_CATALOG_ENGINE',
              whatsappHandoff: '+55 27 99834-5027',
            },
          });
        }
        if (method === 'POST') {
          const aiResponse = runLocalCatalogAIEngine(body as any, db.veiculos as any);
          return jsonResponse({ success: true, data: aiResponse });
        }
      }

      // ─── 14. /api/webhooks/erp-sync (Simulação no GitHub Pages) ─
      if (apiPath === '/api/webhooks/erp-sync') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: { endpoint: '/api/webhooks/erp-sync', history: [] },
          });
        }
        if (method === 'POST') {
          const items = Array.isArray(body.data) ? body.data : [body.data];
          let created = 0;
          for (const item of items) {
            if (!item?.marca || !item?.modelo) continue;
            const novo = {
              id: `gh_erp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              marca: item.marca,
              modelo: item.modelo,
              versao: item.versao || null,
              ano: Number(item.ano || 2025),
              anoModelo: Number(item.anoModelo || item.ano || 2025),
              km: Number(item.km || 0),
              cambio: item.cambio || 'AUTOMATICO',
              combustivel: item.combustivel || 'FLEX',
              categoria: item.categoria || 'SUV',
              cor: item.cor || 'Prata',
              preco: Number(item.preco || 150000),
              precoCusto: Math.round(Number(item.preco || 150000) * 0.82),
              destaque: Boolean(item.destaque),
              vendido: false,
              ativo: true,
              imagemPrincipal:
                item.imagemPrincipal ||
                db.veiculos[0]?.imagemPrincipal ||
                null,
              imagens: JSON.stringify([
                item.imagemPrincipal || db.veiculos[0]?.imagemPrincipal || '',
              ]),
              lojaId: db.lojas[0]?.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            db.veiculos.unshift(novo);
            created += 1;
          }
          saveLocalDB(db);
          return jsonResponse({
            success: true,
            message: `Sincronização ${body.sourceErp || 'ERP'}: ${created} veículo(s) sincronizado(s) sem duplo cadastro.`,
            data: { createdCount: created },
          });
        }
      }

      // ─── 15. /api/webhooks/strapi-social (Simulação no GitHub Pages) ─
      if (apiPath === '/api/webhooks/strapi-social') {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: { endpoint: '/api/webhooks/strapi-social', history: [] },
          });
        }
        if (method === 'POST') {
          const v =
            (body.veiculoId && db.veiculos.find((item) => item.id === body.veiculoId)) ||
            db.veiculos.find((item) => item.ativo && !item.vendido) ||
            db.veiculos[0];
          const pkg = buildSocialMediaPostPackage(v as any, (body.event as any) || 'entry.create');
          return jsonResponse({ success: true, data: pkg }, 201);
        }
      }

      // ─── 16. /api/integrations/status (GitHub Pages) ─────
      if (apiPath === '/api/integrations/status' && method === 'GET') {
        return jsonResponse({
          success: true,
          data: {
            strapi: {
              configured: false,
              baseUrl: 'http://localhost:1337',
              online: false,
              mode: 'LOCAL_FALLBACK',
              lastCheckedAt: new Date().toISOString(),
            },
            erpSync: {
              endpoint: '/api/webhooks/erp-sync',
              secretConfigured: true,
              recentLogs: [],
            },
            aiAgent: {
              endpoint: '/api/ai/chat',
              provider: 'LOCAL_CATALOG_ENGINE',
              whatsappHandoff: '+55 27 99834-5027',
            },
            socialAutomation: {
              endpoint: '/api/webhooks/strapi-social',
              externalWebhookConfigured: false,
              recentPosts: [],
            },
          },
        });
      }

      return originalFetch(input, init);
    };

    window.fetch = interceptedFetch;
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
