'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AgendamentoServico, Lead, Loja } from '@/types';
import { formatarKM, formatarPreco, LABELS, STATUS_COLORS } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';

interface VeiculoRastreavel {
  id: string;
  marca: string;
  modelo: string;
  versao?: string | null;
  ano: number;
  km: number;
  categoria: string;
  cambio: string;
  combustivel: string;
  preco: number;
  precoPromocional?: number | null;
  precoCusto: number;
  valorVenda?: number | null;
  lucroLiquido?: number | null;
  vendido: boolean;
  destaque: boolean;
  dataVenda?: string | null;
  createdAt: string;
  imagemPrincipal?: string | null;
  fotosCount: number;
  adicionadoPorNome: string;
  adicionadoPorEmail: string;
  vendidoPorNome?: string | null;
  lojaId: string;
  lojaNome: string;
}

interface MovimentacaoItem {
  id: string;
  data: string;
  tipo: 'ENTRADA' | 'SAIDA';
  categoria: string;
  descricao: string;
  detalhe: string;
  vendedorNome: string;
  lojaNome: string;
  valor: number;
}

interface VendedorBalanco {
  vendedorNome: string;
  email: string;
  lojaNome: string;
  totalAdicionados: number;
  emEstoque: number;
  vendidosNoPeriodo: number;
  totalEntradasVendas: number;
  totalSaidasCustos: number;
  saldoLiquido: number;
  carrosAdicionados: VeiculoRastreavel[];
  carrosVendidos: VeiculoRastreavel[];
}

interface DashboardStatsPayload {
  isAdmin: boolean;
  periodo: {
    dataInicio: string;
    dataFim: string;
    vendedor: string;
  };
  totalVeiculos: number;
  veiculosDestaque: number;
  totalLeads: number;
  leadsNovos: number;
  taxaConversao: number;
  agendamentosPendentes: number;
  loja: Loja;
  leadsRecentes: Lead[];
  agendamentosRecentes: AgendamentoServico[];
  agendamentosTodos: AgendamentoServico[];
  balancoFinanceiro: {
    totalEntradas: number;
    entradasVendasVeiculos: number;
    entradasServicos: number;
    entradasAssinaturas: number;
    totalSaidas: number;
    saidasCustoVeiculos: number;
    saidasComissoesOperacional: number;
    saldoLiquido: number;
    margemLiquida: number;
    quantidadeCarrosVendidos: number;
    ticketMedioVenda: number;
  };
  vendasNoPeriodo: VeiculoRastreavel[];
  movimentacoes: MovimentacaoItem[];
  balancoVendedores: VendedorBalanco[];
  catalogoRastreavel: VeiculoRastreavel[];
}

interface InteractiveSalesDashboardProps {
  defaultTab?: 'BALANCO' | 'VENDEDORES' | 'AGENDAMENTOS';
  compactHeader?: boolean;
}

export default function InteractiveSalesDashboard({
  defaultTab = 'BALANCO',
  compactHeader = false,
}: InteractiveSalesDashboardProps) {
  const [dataInicio, setDataInicio] = useState('2026-10-14');
  const [dataFim, setDataFim] = useState('2026-11-17');
  const [vendedorFiltro, setVendedorFiltro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'BALANCO' | 'VENDEDORES' | 'AGENDAMENTOS'>(
    defaultTab
  );
  const [filtroExtrato, setFiltroExtrato] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>(
    'TODOS'
  );
  const [filtroCatalogo, setFiltroCatalogo] = useState<'TODOS' | 'ESTOQUE' | 'VENDIDOS'>(
    'TODOS'
  );

  const [stats, setStats] = useState<DashboardStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [atualizandoPeriodo, setAtualizandoPeriodo] = useState(false);

  const carregarDados = useCallback(
    async (inicio: string, fim: string, vend: string, silencioso = false) => {
      if (silencioso) {
        setAtualizandoPeriodo(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          dataInicio: inicio,
          dataFim: fim,
        });
        if (vend) params.set('vendedor', vend);

        const res = await fetch(`/api/dashboard/stats?${params.toString()}`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setStats(json.data);
        } else {
          toast.error(json.error || 'Erro ao carregar balanço e indicadores.');
        }
      } catch {
        toast.error('Falha de conexão ao carregar painel interativo.');
      } finally {
        setLoading(false);
        setAtualizandoPeriodo(false);
      }
    },
    []
  );

  useEffect(() => {
    carregarDados(dataInicio, dataFim, vendedorFiltro, stats !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim, vendedorFiltro, carregarDados]);

  const handleAtualizarAgendamento = async (id: string, novoStatus: string) => {
    try {
      const res = await fetch('/api/agendamentos', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: novoStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível atualizar agendamento.');
      }
      toast.success('Status do agendamento atualizado!');
      carregarDados(dataInicio, dataFim, vendedorFiltro, true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao atualizar agendamento.'
      );
    }
  };

  const aplicarAtalhoPeriodo = (inicio: string, fim: string) => {
    setDataInicio(inicio);
    setDataFim(fim);
  };

  const movimentacoesFiltradas = useMemo(() => {
    if (!stats) return [];
    if (filtroExtrato === 'TODOS') return stats.movimentacoes;
    return stats.movimentacoes.filter((m) => m.tipo === filtroExtrato);
  }, [stats, filtroExtrato]);

  const catalogoFiltrado = useMemo(() => {
    if (!stats) return [];
    return stats.catalogoRastreavel.filter((v) => {
      if (filtroCatalogo === 'ESTOQUE' && v.vendido) return false;
      if (filtroCatalogo === 'VENDIDOS' && !v.vendido) return false;
      if (
        vendedorFiltro &&
        v.adicionadoPorNome.toLowerCase() !== vendedorFiltro.toLowerCase() &&
        v.vendidoPorNome?.toLowerCase() !== vendedorFiltro.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [stats, filtroCatalogo, vendedorFiltro]);

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-stone rounded-card" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-stone rounded-card" />
          ))}
        </div>
        <div className="h-80 bg-stone rounded-card" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-surface rounded-card p-8 text-center border border-hairline">
        <p className="text-ink-secondary">
          Não foi possível carregar os dados do dashboard interativo.
        </p>
      </div>
    );
  }

  const { balancoFinanceiro: balanco } = stats;
  const somaFluxo = Math.max(1, balanco.totalEntradas + balanco.totalSaidas);
  const pctEntradas = Math.round((balanco.totalEntradas / somaFluxo) * 100);
  const pctSaidas = 100 - pctEntradas;

  const formatarDataCurta = (isoOrDate: string) => {
    if (!isoOrDate) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) {
      const [y, m, d] = isoOrDate.split('-');
      return `${d}/${m}/${y}`;
    }
    return new Date(isoOrDate).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-7">
      {/* Cabeçalho Executivo */}
      {!compactHeader && (
        <div className="bg-obsidian border border-obsidian-border rounded-card p-6 sm:p-8 text-canvas flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="eyebrow text-bronze-300">
              {stats.isAdmin
                ? 'Painel Executivo do Administrador • Balanço & Auditoria'
                : 'Painel Executivo da Loja • Balanço & Vendas'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold mt-1">
              {stats.isAdmin
                ? 'Dashboard Interativo de Vendas & Balanço'
                : `Olá, ${stats.loja.nome}`}
            </h1>
            <p className="text-[#A39D92] text-sm mt-1.5">
              Período ativo:{' '}
              <strong className="text-bronze-300 tabular-nums">
                {formatarDataCurta(dataInicio)} até {formatarDataCurta(dataFim)}
              </strong>{' '}
              •{' '}
              <strong className="text-canvas tabular-nums">
                {balanco.quantidadeCarrosVendidos} veículos vendidos
              </strong>{' '}
              e{' '}
              <strong className="text-bronze-300 tabular-nums">
                {stats.agendamentosTodos.length} agendamentos
              </strong>{' '}
              registrados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/dashboard/veiculos"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-editorial bg-bronze-500 hover:bg-bronze-400 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Gerenciar Catálogo & Fotos
            </Link>
          </div>
        </div>
      )}

      {/* Barra de Filtro de Período (ex: 14/10/2026 até 17/11/2026) & Vendedor */}
      <section className="bg-surface rounded-card p-5 border border-hairline space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1">
                Data Inicial do Período
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-bronze-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm font-medium tabular-nums text-ink focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1">
                Data Final do Período
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-bronze-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm font-medium tabular-nums text-ink focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1">
                Filtrar por Vendedor
              </label>
              <div className="relative">
                <Filter className="w-4 h-4 text-bronze-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={vendedorFiltro}
                  onChange={(e) => setVendedorFiltro(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm font-medium text-ink focus:outline-none focus:border-ink"
                >
                  <option value="">Todos os Vendedores</option>
                  {stats.balancoVendedores.map((v) => (
                    <option key={v.vendedorNome} value={v.vendedorNome}>
                      {v.vendedorNome} ({v.lojaNome})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos de Período */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => aplicarAtalhoPeriodo('2026-10-14', '2026-11-17')}
              className={`px-3 py-2 rounded-editorial text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                dataInicio === '2026-10-14' && dataFim === '2026-11-17'
                  ? 'bg-obsidian text-canvas border-obsidian'
                  : 'bg-canvas text-ink-secondary border-hairline hover:border-ink'
              }`}
            >
              14/10/2026 a 17/11/2026
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoPeriodo('2026-10-01', '2026-10-31')}
              className={`px-3 py-2 rounded-editorial text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                dataInicio === '2026-10-01' && dataFim === '2026-10-31'
                  ? 'bg-obsidian text-canvas border-obsidian'
                  : 'bg-canvas text-ink-secondary border-hairline hover:border-ink'
              }`}
            >
              Outubro/2026
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoPeriodo('2026-11-01', '2026-11-30')}
              className={`px-3 py-2 rounded-editorial text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                dataInicio === '2026-11-01' && dataFim === '2026-11-30'
                  ? 'bg-obsidian text-canvas border-obsidian'
                  : 'bg-canvas text-ink-secondary border-hairline hover:border-ink'
              }`}
            >
              Novembro/2026
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoPeriodo('2026-01-01', '2026-12-31')}
              className={`px-3 py-2 rounded-editorial text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                dataInicio === '2026-01-01' && dataFim === '2026-12-31'
                  ? 'bg-obsidian text-canvas border-obsidian'
                  : 'bg-canvas text-ink-secondary border-hairline hover:border-ink'
              }`}
            >
              Ano 2026
            </button>
            {atualizandoPeriodo && (
              <RefreshCw className="w-4 h-4 animate-spin text-bronze-500 ml-1" />
            )}
          </div>
        </div>

        {/* Abas de Visualização */}
        <div className="pt-4 border-t border-hairline flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva('BALANCO')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-editorial text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
              abaAtiva === 'BALANCO'
                ? 'bg-obsidian text-canvas'
                : 'bg-canvas border border-hairline text-ink-secondary hover:text-ink'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-bronze-300" />
            Balanço (Entradas & Saídas) + Vendas por Vendedor
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('VENDEDORES')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-editorial text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
              abaAtiva === 'VENDEDORES'
                ? 'bg-obsidian text-canvas'
                : 'bg-canvas border border-hairline text-ink-secondary hover:text-ink'
            }`}
          >
            <UserCheck className="w-4 h-4 text-bronze-300" />
            Quem Adicionou & Quem Vendeu Cada Carro ({stats.catalogoRastreavel.length})
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('AGENDAMENTOS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-editorial text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
              abaAtiva === 'AGENDAMENTOS'
                ? 'bg-obsidian text-canvas'
                : 'bg-canvas border border-hairline text-ink-secondary hover:text-ink'
            }`}
          >
            <Calendar className="w-4 h-4 text-bronze-300" />
            Agendamentos de Serviços & Test Drives ({stats.agendamentosTodos.length})
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ABA 1: BALANÇO FINANCEIRO (O QUE ENTROU E O QUE SAIU) & VENDAS
          ═══════════════════════════════════════════════════════════ */}
      {abaAtiva === 'BALANCO' && (
        <div className="space-y-7">
          {/* Cards de Balanço do Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border border-hairline rounded-card overflow-hidden">
            {/* O QUE ENTROU */}
            <div className="bg-surface p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-sage-700">O Que Entrou (Receitas)</span>
                <div className="w-8 h-8 rounded-editorial bg-sage-700 text-canvas flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold tabular-nums text-sage-700">
                  + {formatarPreco(balanco.totalEntradas)}
                </p>
                <p className="text-[11px] text-ink-secondary mt-1.5 tabular-nums">
                  Vendas de carros: <strong>{formatarPreco(balanco.entradasVendasVeiculos)}</strong>
                </p>
                <p className="text-[11px] text-ink-muted tabular-nums">
                  Serviços & Planos: {formatarPreco(balanco.entradasServicos + balanco.entradasAssinaturas)}
                </p>
              </div>
            </div>

            {/* O QUE SAIU */}
            <div className="bg-surface p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-danger-700">O Que Saiu (Custos/Saídas)</span>
                <div className="w-8 h-8 rounded-editorial bg-danger-700 text-canvas flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold tabular-nums text-danger-700">
                  - {formatarPreco(balanco.totalSaidas)}
                </p>
                <p className="text-[11px] text-ink-secondary mt-1.5 tabular-nums">
                  Aquisição de veículos: <strong>{formatarPreco(balanco.saidasCustoVeiculos)}</strong>
                </p>
                <p className="text-[11px] text-ink-muted tabular-nums">
                  Comissões & Preparação: {formatarPreco(balanco.saidasComissoesOperacional)}
                </p>
              </div>
            </div>

            {/* SALDO LÍQUIDO DO PERÍODO */}
            <div className="bg-surface p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-bronze-600">Saldo Líquido (Balanço)</span>
                <div className="w-8 h-8 rounded-editorial bg-obsidian text-bronze-300 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p
                  className={`text-2xl sm:text-3xl font-serif font-bold tabular-nums ${
                    balanco.saldoLiquido >= 0 ? 'text-ink' : 'text-danger-700'
                  }`}
                >
                  {formatarPreco(balanco.saldoLiquido)}
                </p>
                <p className="text-[11px] text-ink-secondary mt-1.5 tabular-nums">
                  Margem Líquida: <strong>{balanco.margemLiquida}%</strong> no período
                </p>
                <p className="text-[11px] text-ink-muted">
                  Entradas menos Saídas no intervalo
                </p>
              </div>
            </div>

            {/* VENDAS REALIZADAS NO PERÍODO */}
            <div className="bg-surface p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-ink-muted">Vendas no Período</span>
                <div className="w-8 h-8 rounded-editorial bg-bronze-500 text-canvas flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold tabular-nums text-ink">
                  {balanco.quantidadeCarrosVendidos}{' '}
                  <span className="text-lg font-normal text-ink-secondary">
                    {balanco.quantidadeCarrosVendidos === 1 ? 'veículo' : 'veículos'}
                  </span>
                </p>
                <p className="text-[11px] text-ink-secondary mt-1.5 tabular-nums">
                  Ticket Médio: <strong>{formatarPreco(balanco.ticketMedioVenda)}</strong>
                </p>
                <p className="text-[11px] text-ink-muted tabular-nums">
                  Estoque ativo atual: {stats.totalVeiculos} carros
                </p>
              </div>
            </div>
          </div>

          {/* Barra Visual Comparativa: O Que Entrou vs. O Que Saiu */}
          <section className="bg-surface rounded-card p-6 border border-hairline space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="eyebrow text-bronze-600">Fluxo de Caixa do Período</span>
                <h2 className="text-2xl font-serif font-semibold text-ink">
                  Proporção: O Que Entrou vs. O Que Saiu ({formatarDataCurta(dataInicio)} a{' '}
                  {formatarDataCurta(dataFim)})
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold tabular-nums">
                <span className="inline-flex items-center gap-1.5 text-sage-700">
                  <span className="w-3 h-3 rounded-sm bg-sage-700 inline-block" />
                  Entradas ({pctEntradas}%)
                </span>
                <span className="inline-flex items-center gap-1.5 text-danger-700">
                  <span className="w-3 h-3 rounded-sm bg-danger-700 inline-block" />
                  Saídas ({pctSaidas}%)
                </span>
              </div>
            </div>

            <div className="h-5 w-full rounded-editorial overflow-hidden bg-stone flex border border-hairline">
              <div
                style={{ width: `${pctEntradas}%` }}
                className="bg-sage-700 h-full transition-all duration-500"
                title={`Entradas: ${formatarPreco(balanco.totalEntradas)}`}
              />
              <div
                style={{ width: `${pctSaidas}%` }}
                className="bg-danger-700 h-full transition-all duration-500"
                title={`Saídas: ${formatarPreco(balanco.totalSaidas)}`}
              />
            </div>
          </section>

          {/* Balanço por Vendedor: Qual Vendedor Vendeu Qual Carro & Qual Vendedor Adicionou Qual Carro */}
          <section className="bg-surface rounded-card p-6 border border-hairline space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
              <div>
                <span className="eyebrow text-bronze-600">
                  Desempenho & Auditoria Comercial
                </span>
                <h2 className="text-2xl font-serif font-semibold text-ink mt-0.5">
                  Balanço por Vendedor — Quem Adicionou & Quem Vendeu Cada Carro
                </h2>
                <p className="text-xs text-ink-secondary">
                  Acompanhe o volume adicionado ao catálogo, os veículos vendidos no período selecionado e o saldo líquido de cada vendedor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {stats.balancoVendedores.map((vend) => (
                <div
                  key={vend.vendedorNome}
                  className="rounded-card border border-hairline bg-canvas p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-hairline">
                      <div>
                        <span className="eyebrow text-bronze-600">{vend.lojaNome}</span>
                        <h3 className="text-xl font-serif font-semibold text-ink mt-0.5">
                          {vend.vendedorNome}
                        </h3>
                        {vend.email && (
                          <p className="text-[11px] text-ink-muted">{vend.email}</p>
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-editorial bg-obsidian text-bronze-300 text-[10px] font-semibold uppercase tracking-wider tabular-nums">
                        {vend.vendidosNoPeriodo} vendidos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-editorial bg-surface border border-hairline">
                        <span className="text-[10px] uppercase tracking-wider text-ink-muted block">
                          Carros Adicionados
                        </span>
                        <strong className="text-base font-serif font-bold text-ink tabular-nums">
                          {vend.totalAdicionados} veículos
                        </strong>
                        <span className="block text-[10px] text-ink-muted tabular-nums">
                          ({vend.emEstoque} em estoque)
                        </span>
                      </div>

                      <div className="p-2.5 rounded-editorial bg-surface border border-hairline">
                        <span className="text-[10px] uppercase tracking-wider text-ink-muted block">
                          Vendas no Período
                        </span>
                        <strong className="text-base font-serif font-bold text-sage-700 tabular-nums">
                          {vend.vendidosNoPeriodo} vendidos
                        </strong>
                        <span className="block text-[10px] text-ink-muted tabular-nums">
                          Lucro: {formatarPreco(vend.saldoLiquido)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-editorial bg-surface border border-hairline space-y-1 text-xs tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Entrou (Vendas):</span>
                        <strong className="text-sage-700">
                          + {formatarPreco(vend.totalEntradasVendas)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Saiu (Custos + Com.):</span>
                        <strong className="text-danger-700">
                          - {formatarPreco(vend.totalSaidasCustos)}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-hairline font-semibold">
                        <span className="text-ink">Balanço do Vendedor:</span>
                        <strong className="text-ink">
                          {formatarPreco(vend.saldoLiquido)}
                        </strong>
                      </div>
                    </div>

                    {/* Carros Vendidos por este Vendedor no Período */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
                        Carros vendidos por {vend.vendedorNome} no período:
                      </p>
                      {vend.carrosVendidos.length > 0 ? (
                        <div className="space-y-2">
                          {vend.carrosVendidos.map((cv) => (
                            <div
                              key={cv.id}
                              className="p-2.5 rounded-editorial bg-surface border border-hairline text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-ink truncate">
                                  {cv.marca} {cv.modelo} ({cv.ano})
                                </p>
                                <p className="text-[11px] text-ink-muted tabular-nums">
                                  Data: {formatarDataCurta(cv.dataVenda || cv.createdAt)} • Cad.:{' '}
                                  {cv.adicionadoPorNome}
                                </p>
                              </div>
                              <div className="text-right shrink-0 tabular-nums">
                                <p className="font-semibold text-sage-700">
                                  {formatarPreco(cv.valorVenda ?? cv.preco)}
                                </p>
                                <p className="text-[10px] text-ink-muted">
                                  Lucro: {formatarPreco((cv.valorVenda ?? cv.preco) - cv.precoCusto)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-muted italic py-2">
                          Nenhuma venda registrada neste intervalo de datas.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVendedorFiltro(vend.vendedorNome);
                      setAbaAtiva('VENDEDORES');
                    }}
                    className="w-full py-2 px-3 rounded-editorial border border-hairline bg-surface hover:border-ink text-[11px] font-semibold uppercase tracking-wider text-ink transition-colors"
                  >
                    Ver todos os {vend.totalAdicionados} carros de {vend.vendedorNome} →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tabela de Vendas Realizadas no Período Selecionado */}
          <section className="bg-surface rounded-card p-6 border border-hairline space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-hairline">
              <div>
                <span className="eyebrow text-bronze-600">Relatório de Fechamentos</span>
                <h2 className="text-2xl font-serif font-semibold text-ink">
                  Vendas Realizadas no Período ({formatarDataCurta(dataInicio)} até{' '}
                  {formatarDataCurta(dataFim)})
                </h2>
              </div>
              <span className="px-3 py-1 rounded-editorial bg-canvas border border-hairline text-xs font-semibold tabular-nums text-ink">
                {stats.vendasNoPeriodo.length} vendas encontradas
              </span>
            </div>

            {stats.vendasNoPeriodo.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="eyebrow text-ink-muted border-b border-hairline">
                      <th className="pb-3 pr-3">Data Venda</th>
                      <th className="pb-3 pr-3">Veículo</th>
                      <th className="pb-3 pr-3">Adicionado Por</th>
                      <th className="pb-3 pr-3">Vendido Por</th>
                      <th className="pb-3 pr-3 text-right">Custo (Saída)</th>
                      <th className="pb-3 pr-3 text-right">Venda (Entrada)</th>
                      <th className="pb-3 text-right">Saldo / Lucro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {stats.vendasNoPeriodo.map((v) => {
                      const entrada = v.valorVenda ?? v.preco;
                      const saida = v.precoCusto;
                      const saldo = entrada - saida;
                      return (
                        <tr key={v.id} className="hover:bg-canvas transition-colors">
                          <td className="py-3.5 pr-3 tabular-nums text-xs font-semibold text-ink whitespace-nowrap">
                            {formatarDataCurta(v.dataVenda || v.createdAt)}
                          </td>
                          <td className="py-3.5 pr-3">
                            <p className="font-semibold text-ink">
                              {v.marca} {v.modelo} ({v.ano})
                            </p>
                            <p className="text-xs text-ink-muted">{v.lojaNome}</p>
                          </td>
                          <td className="py-3.5 pr-3 text-xs">
                            <span className="font-medium text-ink">
                              {v.adicionadoPorNome}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-editorial bg-sage-50 border border-sage-600/30 text-sage-800 font-semibold">
                              <UserCheck className="w-3 h-3" />
                              {v.vendidoPorNome}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-right tabular-nums text-xs font-semibold text-danger-700 whitespace-nowrap">
                            - {formatarPreco(saida)}
                          </td>
                          <td className="py-3.5 pr-3 text-right tabular-nums text-xs font-semibold text-sage-700 whitespace-nowrap">
                            + {formatarPreco(entrada)}
                          </td>
                          <td className="py-3.5 text-right tabular-nums text-xs font-bold text-ink whitespace-nowrap">
                            {formatarPreco(saldo)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-ink-muted">
                Nenhuma venda encontrada entre {formatarDataCurta(dataInicio)} e{' '}
                {formatarDataCurta(dataFim)}. Experimente ajustar as datas acima.
              </div>
            )}
          </section>

          {/* Extrato Financeiro Detalhado: O Que Entrou e O Que Saiu */}
          <section className="bg-surface rounded-card p-6 border border-hairline space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
              <div>
                <span className="eyebrow text-bronze-600">Livro Caixa do Período</span>
                <h2 className="text-2xl font-serif font-semibold text-ink">
                  Extrato Detalhado — Tudo o Que Entrou e Tudo o Que Saiu
                </h2>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'TODOS', label: 'Tudo' },
                    { id: 'ENTRADA', label: 'Entradas (+)' },
                    { id: 'SAIDA', label: 'Saídas (-)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFiltroExtrato(tab.id)}
                    className={`px-3 py-1.5 rounded-editorial text-xs font-semibold uppercase tracking-wider transition-colors ${
                      filtroExtrato === tab.id
                        ? 'bg-obsidian text-canvas'
                        : 'bg-canvas border border-hairline text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {movimentacoesFiltradas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="eyebrow text-ink-muted border-b border-hairline">
                      <th className="pb-3 pr-3">Data</th>
                      <th className="pb-3 pr-3">Tipo</th>
                      <th className="pb-3 pr-3">Descrição da Movimentação</th>
                      <th className="pb-3 pr-3">Vendedor / Origem</th>
                      <th className="pb-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {movimentacoesFiltradas.map((mov) => (
                      <tr key={mov.id} className="hover:bg-canvas transition-colors">
                        <td className="py-3 pr-3 text-xs tabular-nums text-ink-secondary whitespace-nowrap">
                          {formatarDataCurta(mov.data)}
                        </td>
                        <td className="py-3 pr-3">
                          {mov.tipo === 'ENTRADA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-editorial bg-sage-50 border border-sage-600/30 text-sage-800 text-[10px] font-semibold uppercase tracking-wider">
                              <ArrowUpRight className="w-3 h-3" />
                              Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-editorial bg-danger-50 border border-danger-500/30 text-danger-700 text-[10px] font-semibold uppercase tracking-wider">
                              <ArrowDownRight className="w-3 h-3" />
                              Saída
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-ink text-xs sm:text-sm">
                            {mov.descricao}
                          </p>
                          <p className="text-[11px] text-ink-muted">{mov.detalhe}</p>
                        </td>
                        <td className="py-3 pr-3 text-xs text-ink-secondary">
                          <span className="font-medium text-ink">{mov.vendedorNome}</span>
                          <span className="block text-[11px] text-ink-muted">
                            {mov.lojaNome}
                          </span>
                        </td>
                        <td
                          className={`py-3 text-right tabular-nums font-semibold text-xs sm:text-sm whitespace-nowrap ${
                            mov.tipo === 'ENTRADA' ? 'text-sage-700' : 'text-danger-700'
                          }`}
                        >
                          {mov.tipo === 'ENTRADA' ? '+ ' : '- '}
                          {formatarPreco(mov.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-ink-muted">
                Nenhuma movimentação encontrada para este filtro no período selecionado.
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ABA 2: QUEM ADICIONOU & QUEM VENDEU CADA CARRO DO CATÁLOGO
          ═══════════════════════════════════════════════════════════ */}
      {abaAtiva === 'VENDEDORES' && (
        <section className="bg-surface rounded-card p-6 border border-hairline space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">
                Rastreabilidade Completa de Inventário
              </span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-0.5">
                Qual Vendedor Adicionou Qual Carro & Status de Venda
              </h2>
              <p className="text-xs text-ink-secondary">
                Visualize todos os veículos do catálogo, quem os cadastrou, quantas fotos foram enviadas e qual vendedor realizou a venda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'TODOS', label: `Todos (${stats.catalogoRastreavel.length})` },
                  {
                    id: 'ESTOQUE',
                    label: `Em Estoque (${
                      stats.catalogoRastreavel.filter((v) => !v.vendido).length
                    })`,
                  },
                  {
                    id: 'VENDIDOS',
                    label: `Vendidos (${
                      stats.catalogoRastreavel.filter((v) => v.vendido).length
                    })`,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFiltroCatalogo(t.id)}
                  className={`px-3 py-1.5 rounded-editorial text-xs font-semibold uppercase tracking-wider transition-colors ${
                    filtroCatalogo === t.id
                      ? 'bg-obsidian text-canvas'
                      : 'bg-canvas border border-hairline text-ink-secondary hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              {vendedorFiltro && (
                <button
                  type="button"
                  onClick={() => setVendedorFiltro('')}
                  className="px-3 py-1.5 rounded-editorial bg-bronze-100 text-bronze-800 text-xs font-semibold"
                >
                  Limpar filtro: {vendedorFiltro} ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="eyebrow text-ink-muted border-b border-hairline">
                  <th className="pb-3 pr-3">Veículo</th>
                  <th className="pb-3 pr-3">Loja</th>
                  <th className="pb-3 pr-3">Adicionado Por (Vendedor)</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Vendido Por (Vendedor)</th>
                  <th className="pb-3 pr-3 text-right">Custo (Saída)</th>
                  <th className="pb-3 text-right">Preço / Venda (Entrada)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {catalogoFiltrado.map((v) => (
                  <tr key={v.id} className="hover:bg-canvas transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            v.imagemPrincipal ||
                            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'
                          }
                          alt={`${v.marca} ${v.modelo}`}
                          className="w-14 h-10 rounded-editorial object-cover border border-hairline shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-ink">
                            {v.marca} {v.modelo} ({v.ano})
                          </p>
                          <p className="text-[11px] text-ink-muted tabular-nums">
                            {formatarKM(v.km)} • {v.fotosCount} fotos no anúncio
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 text-xs text-ink-secondary">
                      {v.lojaNome}
                    </td>
                    <td className="py-3.5 pr-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                        <UserCheck className="w-3.5 h-3.5 text-bronze-500" />
                        {v.adicionadoPorNome}
                      </span>
                      <span className="block text-[11px] text-ink-muted tabular-nums">
                        Em {formatarDataCurta(v.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      {v.vendido ? (
                        <span className="px-2 py-0.5 rounded-editorial bg-danger-50 border border-danger-500/30 text-danger-700 text-[10px] font-semibold uppercase tracking-wider">
                          Vendido
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-editorial bg-sage-50 border border-sage-600/30 text-sage-800 text-[10px] font-semibold uppercase tracking-wider">
                          Disponível
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-3 text-xs">
                      {v.vendido ? (
                        <div>
                          <span className="font-semibold text-sage-700">
                            {v.vendidoPorNome}
                          </span>
                          {v.dataVenda && (
                            <span className="block text-[11px] text-ink-muted tabular-nums">
                              Em {formatarDataCurta(v.dataVenda)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-3 text-right tabular-nums text-xs text-ink-secondary">
                      {formatarPreco(v.precoCusto)}
                    </td>
                    <td className="py-3.5 text-right tabular-nums text-xs font-semibold text-ink">
                      {formatarPreco(v.valorVenda ?? v.precoPromocional ?? v.preco)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ABA 3: AGENDAMENTOS DE SERVIÇOS & TEST DRIVES
          ═══════════════════════════════════════════════════════════ */}
      {abaAtiva === 'AGENDAMENTOS' && (
        <section className="bg-surface rounded-card p-6 border border-hairline space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">Agenda Integrada</span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-0.5">
                Agendamentos de Serviços &amp; Test Drives
              </h2>
              <p className="text-xs text-ink-secondary">
                Gerencie todas as solicitações de revisões periódicas, pós-venda e test drives presenciais.
              </p>
            </div>
            <span className="px-3 py-1 rounded-editorial bg-canvas border border-hairline text-xs font-semibold tabular-nums text-ink">
              {stats.agendamentosTodos.length} agendamentos
            </span>
          </div>

          {stats.agendamentosTodos.length > 0 ? (
            <div className="space-y-3">
              {stats.agendamentosTodos.map((ag) => (
                <div
                  key={ag.id}
                  className="p-4 rounded-editorial bg-canvas border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-editorial bg-stone border border-hairline text-ink text-[10px] font-semibold uppercase tracking-wider">
                        {ag.tipo === 'TEST_DRIVE'
                          ? 'Test Drive'
                          : ag.tipo === 'REVISAO'
                          ? 'Revisão'
                          : 'Serviço'}
                      </span>
                      {ag.servico && (
                        <span className="text-xs font-semibold text-ink">
                          • {ag.servico.nome}
                        </span>
                      )}
                      {ag.loja && (
                        <span className="text-xs text-bronze-600 font-medium inline-flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {ag.loja.nome}
                        </span>
                      )}
                    </div>

                    <p className="font-serif text-lg font-semibold text-ink">
                      {ag.nome}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-ink-secondary">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-bronze-500" />
                        {ag.dataPreferida}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-bronze-500" />
                        {ag.horarioPreferido}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-bronze-500" />
                        {ag.telefone}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-bronze-500" />
                        {ag.email}
                      </span>
                    </div>

                    {ag.veiculoInfo && (
                      <p className="text-xs text-ink-muted flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" />
                        Veículo: {ag.veiculoInfo}
                      </p>
                    )}
                    {ag.observacoes && (
                      <p className="text-xs text-ink-muted italic">
                        &ldquo;{ag.observacoes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <select
                      value={ag.status}
                      onChange={(e) =>
                        handleAtualizarAgendamento(ag.id, e.target.value)
                      }
                      className="px-3.5 py-2 rounded-editorial border border-hairline bg-surface text-xs font-semibold text-ink cursor-pointer"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="CONFIRMADO">Confirmado</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-ink-muted">
              Nenhum agendamento registrado até o momento.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
