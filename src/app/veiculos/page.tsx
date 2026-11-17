'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/FilterSidebar';
import VehicleCard from '@/components/VehicleCard';
import Pagination from '@/components/Pagination';
import { ContagensFiltros, FiltrosVeiculo, Veiculo } from '@/types';
import { LayoutGrid, List, ArrowUpDown, Car, RotateCcw } from 'lucide-react';

const DEFAULT_CONTAGENS: ContagensFiltros = {
  marcas: [],
  cambios: [],
  combustiveis: [],
  categorias: [],
  precoRange: { min: 0, max: 500000 },
  anoRange: { min: 2010, max: 2026 },
  kmRange: { min: 0, max: 200000 },
  total: 0,
};

function VeiculosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [contagens, setContagens] = useState<ContagensFiltros>(DEFAULT_CONTAGENS);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtros: FiltrosVeiculo & { lojaId?: string; ofertas?: boolean } = useMemo(() => {
    return {
      busca: searchParams.get('busca') || undefined,
      marca: searchParams.get('marca') || undefined,
      modelo: searchParams.get('modelo') || undefined,
      categoria: searchParams.get('categoria') || undefined,
      cambio: searchParams.get('cambio') || undefined,
      combustivel: searchParams.get('combustivel') || undefined,
      anoMin: searchParams.get('anoMin') ? Number(searchParams.get('anoMin')) : undefined,
      anoMax: searchParams.get('anoMax') ? Number(searchParams.get('anoMax')) : undefined,
      precoMin: searchParams.get('precoMin') ? Number(searchParams.get('precoMin')) : undefined,
      precoMax: searchParams.get('precoMax') ? Number(searchParams.get('precoMax')) : undefined,
      kmMax: searchParams.get('kmMax') ? Number(searchParams.get('kmMax')) : undefined,
      ordenar: (searchParams.get('ordenar') as FiltrosVeiculo['ordenar']) || 'recentes',
      pagina: searchParams.get('pagina') ? Number(searchParams.get('pagina')) : 1,
      limite: 12,
      lojaId: searchParams.get('lojaId') || undefined,
      ofertas: searchParams.get('ofertas') === 'true' ? true : undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    let ativo = true;

    async function carregarVeiculos() {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.get('limite')) {
          params.set('limite', '12');
        }

        const res = await fetch(`/api/veiculos?${params.toString()}`);
        if (!res.ok) throw new Error('Falha ao buscar veículos');

        const json = await res.json();
        if (ativo && json.success) {
          setVeiculos(Array.isArray(json.data) ? json.data : []);
          if (json.contagens) {
            setContagens(json.contagens);
          }
          if (json.meta) {
            setTotalPaginas(json.meta.totalPaginas || 1);
            setTotalResultados(json.meta.total || 0);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar veículos:', err);
        if (ativo) {
          setVeiculos([]);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarVeiculos();
    return () => {
      ativo = false;
    };
  }, [searchParams]);

  const atualizarURL = useCallback(
    (novosFiltros: FiltrosVeiculo & { lojaId?: string; ofertas?: boolean }) => {
      const params = new URLSearchParams();

      if (novosFiltros.busca) params.set('busca', novosFiltros.busca);
      if (novosFiltros.marca) params.set('marca', novosFiltros.marca);
      if (novosFiltros.modelo) params.set('modelo', novosFiltros.modelo);
      if (novosFiltros.categoria) params.set('categoria', novosFiltros.categoria);
      if (novosFiltros.cambio) params.set('cambio', novosFiltros.cambio);
      if (novosFiltros.combustivel) params.set('combustivel', novosFiltros.combustivel);
      if (novosFiltros.anoMin) params.set('anoMin', String(novosFiltros.anoMin));
      if (novosFiltros.anoMax) params.set('anoMax', String(novosFiltros.anoMax));
      if (novosFiltros.precoMin) params.set('precoMin', String(novosFiltros.precoMin));
      if (novosFiltros.precoMax) params.set('precoMax', String(novosFiltros.precoMax));
      if (novosFiltros.kmMax) params.set('kmMax', String(novosFiltros.kmMax));
      if (novosFiltros.ordenar && novosFiltros.ordenar !== 'recentes') {
        params.set('ordenar', novosFiltros.ordenar);
      }
      if (novosFiltros.pagina && novosFiltros.pagina > 1) {
        params.set('pagina', String(novosFiltros.pagina));
      }
      if (novosFiltros.lojaId) params.set('lojaId', novosFiltros.lojaId);
      if (novosFiltros.ofertas) params.set('ofertas', 'true');

      const query = params.toString();
      router.push(query ? `/veiculos?${query}` : '/veiculos');
    },
    [router]
  );

  const handleFiltroChange = (novosFiltros: FiltrosVeiculo) => {
    atualizarURL({
      ...novosFiltros,
      ordenar: filtros.ordenar,
      lojaId: filtros.lojaId,
      ofertas: filtros.ofertas,
      pagina: 1,
    });
  };

  const handleOrdenacaoChange = (ordenar: FiltrosVeiculo['ordenar']) => {
    atualizarURL({
      ...filtros,
      ordenar,
      pagina: 1,
    });
  };

  const handlePageChange = (pagina: number) => {
    atualizarURL({
      ...filtros,
      pagina,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimparTudo = () => {
    router.push('/veiculos');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Cabeçalho Editorial da Listagem */}
      <div className="pb-6 mb-8 border-b border-hairline flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-bronze-600">Curadoria de Estoque</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-ink mt-1.5">
            Catálogo de Veículos
          </h1>
          <p className="text-ink-secondary text-sm mt-1">
            Refine sua pesquisa por especificações técnicas, faixa de investimento ou categoria.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar de Filtros Facetados */}
        <FilterSidebar
          contagens={contagens}
          filtros={filtros}
          onFiltroChange={handleFiltroChange}
        />

        {/* Área de Resultados */}
        <div className="flex-1 w-full min-w-0">
          {/* Toolbar Minimalista */}
          <div className="bg-surface rounded-card p-4 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs text-ink-secondary">
              <span className="font-semibold tabular-nums text-ink text-sm">
                {loading ? '...' : totalResultados}
              </span>
              <span>
                {totalResultados === 1 ? 'veículo encontrado' : 'veículos encontrados'}
              </span>
              {(filtros.busca ||
                filtros.marca ||
                filtros.categoria ||
                filtros.cambio ||
                filtros.combustivel ||
                filtros.lojaId ||
                filtros.ofertas) && (
                <button
                  onClick={handleLimparTudo}
                  className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-bronze-600 hover:text-ink transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* Ordenação */}
              <div className="flex items-center gap-2 bg-canvas border border-hairline rounded-editorial px-3 py-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted" />
                <select
                  aria-label="Ordenar veículos"
                  value={filtros.ordenar || 'recentes'}
                  onChange={(e) =>
                    handleOrdenacaoChange(e.target.value as FiltrosVeiculo['ordenar'])
                  }
                  className="bg-transparent text-xs font-medium text-ink focus:outline-none cursor-pointer"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="preco_asc">Menor preço</option>
                  <option value="preco_desc">Maior preço</option>
                  <option value="ano_desc">Mais novos (Ano)</option>
                  <option value="km_asc">Menor quilometragem</option>
                </select>
              </div>

              {/* Grid / List Toggle */}
              <div className="hidden sm:flex items-center bg-canvas p-1 rounded-editorial border border-hairline">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Visualização em grade"
                  className={`p-1.5 rounded-[2px] transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-obsidian text-canvas'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Visualização em lista"
                  className={`p-1.5 rounded-[2px] transition-colors ${
                    viewMode === 'list'
                      ? 'bg-obsidian text-canvas'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid ou Lista */}
          {loading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card overflow-hidden border border-hairline animate-pulse"
                >
                  <div className="aspect-[16/10] bg-stone" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-stone rounded w-1/3" />
                    <div className="h-6 bg-stone rounded w-3/4" />
                    <div className="h-7 bg-stone rounded w-1/2 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : veiculos.length > 0 ? (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {veiculos.map((veiculo) => (
                  <VehicleCard
                    key={veiculo.id}
                    vehicle={veiculo}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {totalPaginas > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination
                    paginaAtual={filtros.pagina || 1}
                    totalPaginas={totalPaginas}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface rounded-card p-12 text-center border border-hairline">
              <div className="w-14 h-14 rounded-editorial border border-hairline bg-canvas flex items-center justify-center mx-auto mb-4">
                <Car className="w-6 h-6 text-ink-muted" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-ink">
                Nenhum veículo encontrado
              </h3>
              <p className="text-ink-secondary text-sm mt-2 max-w-md mx-auto">
                Não localizamos exemplares com os critérios selecionados. Experimente ampliar a faixa de preço ou limpar os filtros ativos.
              </p>
              <button
                onClick={handleLimparTudo}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VeiculosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="h-10 w-64 bg-stone rounded-editorial animate-pulse mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="h-96 bg-stone rounded-card animate-pulse" />
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-80 bg-stone rounded-card animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <VeiculosContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
