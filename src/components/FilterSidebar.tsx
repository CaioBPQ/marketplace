'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { formatarPreco, LABELS } from '@/lib/utils';
import type { ContagensFiltros, FiltrosVeiculo } from '@/types/index';

interface FilterSidebarProps {
  contagens: ContagensFiltros;
  filtros: FiltrosVeiculo;
  onFiltroChange: (novos: FiltrosVeiculo) => void;
}

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-hairline py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="eyebrow text-ink">{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-muted transition-transform duration-300 ease-editorial ${
            open ? 'rotate-180 text-ink' : ''
          }`}
        />
      </button>
      {open && <div className="mt-3.5">{children}</div>}
    </div>
  );
}

const PRECO_CHIPS = [
  { label: 'Até R$ 90mil', valor: 90000 },
  { label: 'Até R$ 150mil', valor: 150000 },
  { label: 'Até R$ 250mil', valor: 250000 },
];

const KM_CHIPS = [
  { label: 'Até 20 mil km', valor: 20000 },
  { label: 'Até 40 mil km', valor: 40000 },
  { label: 'Até 80 mil km', valor: 80000 },
];

export default function FilterSidebar({
  contagens,
  filtros,
  onFiltroChange,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllMarcas, setShowAllMarcas] = useState(false);

  // Estados locais para inputs de texto/número com debounce suave
  const [buscaInput, setBuscaInput] = useState(filtros.busca || '');
  const [precoMinInput, setPrecoMinInput] = useState(
    filtros.precoMin !== undefined ? String(filtros.precoMin) : ''
  );
  const [precoMaxInput, setPrecoMaxInput] = useState(
    filtros.precoMax !== undefined ? String(filtros.precoMax) : ''
  );
  const [anoMinInput, setAnoMinInput] = useState(
    filtros.anoMin !== undefined ? String(filtros.anoMin) : ''
  );
  const [anoMaxInput, setAnoMaxInput] = useState(
    filtros.anoMax !== undefined ? String(filtros.anoMax) : ''
  );
  const [kmMaxInput, setKmMaxInput] = useState(
    filtros.kmMax !== undefined ? String(filtros.kmMax) : ''
  );

  useEffect(() => {
    setBuscaInput(filtros.busca || '');
    setPrecoMinInput(
      filtros.precoMin !== undefined ? String(filtros.precoMin) : ''
    );
    setPrecoMaxInput(
      filtros.precoMax !== undefined ? String(filtros.precoMax) : ''
    );
    setAnoMinInput(filtros.anoMin !== undefined ? String(filtros.anoMin) : '');
    setAnoMaxInput(filtros.anoMax !== undefined ? String(filtros.anoMax) : '');
    setKmMaxInput(filtros.kmMax !== undefined ? String(filtros.kmMax) : '');
  }, [
    filtros.busca,
    filtros.precoMin,
    filtros.precoMax,
    filtros.anoMin,
    filtros.anoMax,
    filtros.kmMax,
  ]);

  const emitPatch = (patch: Partial<FiltrosVeiculo>) => {
    onFiltroChange({
      ...filtros,
      ...patch,
      pagina: 1,
    });
  };

  useEffect(() => {
    const trimmed = buscaInput.trim() || undefined;
    if (trimmed === (filtros.busca || undefined)) return;
    const timer = setTimeout(() => {
      onFiltroChange({ ...filtros, busca: trimmed, pagina: 1 });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaInput]);

  const parseNum = (val: string): number | undefined => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) return undefined;
    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 ? num : undefined;
  };

  const applyRangeInputs = () => {
    emitPatch({
      precoMin: parseNum(precoMinInput),
      precoMax: parseNum(precoMaxInput),
      anoMin: parseNum(anoMinInput),
      anoMax: parseNum(anoMaxInput),
      kmMax: parseNum(kmMaxInput),
    });
  };

  const handleClear = () => {
    setBuscaInput('');
    setPrecoMinInput('');
    setPrecoMaxInput('');
    setAnoMinInput('');
    setAnoMaxInput('');
    setKmMaxInput('');
    onFiltroChange({
      ordenar: filtros.ordenar,
      pagina: 1,
    });
    setMobileOpen(false);
  };

  const marcas = contagens?.marcas || [];
  const cambios = contagens?.cambios || [];
  const combustiveis = contagens?.combustiveis || [];
  const categorias = contagens?.categorias || [];
  const totalEncontrado = contagens?.total ?? 0;

  const visibleMarcas = showAllMarcas ? marcas : marcas.slice(0, 8);

  const activeFiltersCount = [
    filtros.busca,
    filtros.marca,
    filtros.precoMin,
    filtros.precoMax,
    filtros.anoMin,
    filtros.anoMax,
    filtros.kmMax,
    filtros.cambio,
    filtros.combustivel,
    filtros.categoria,
  ].filter((v) => v !== undefined && v !== '').length;

  const renderContent = () => (
    <div className="flex flex-col">
      {/* Cabeçalho com contagem em tempo real */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <p className="font-serif text-xl font-semibold text-ink">
            Refinar Busca
          </p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            <strong className="font-semibold tabular-nums text-ink">
              {totalEncontrado}
            </strong>{' '}
            {totalEncontrado === 1
              ? 'veículo encontrado'
              : 'veículos encontrados'}
          </p>
        </div>
        {activeFiltersCount > 0 && (
          <span className="rounded-editorial border border-bronze-300 bg-bronze-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bronze-700">
            {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* 1. Busca textual */}
      <FilterSection title="Palavra-chave">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                emitPatch({ busca: buscaInput.trim() || undefined });
              }
            }}
            placeholder="Marca, modelo ou versão..."
            className="w-full rounded-editorial border border-hairline bg-canvas py-2 pl-9 pr-8 text-xs text-ink placeholder-ink-muted transition-colors focus:border-ink focus:bg-surface focus:outline-none"
          />
          {buscaInput && (
            <button
              type="button"
              onClick={() => {
                setBuscaInput('');
                emitPatch({ busca: undefined });
              }}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* 2. Marca */}
      <FilterSection title="Marca">
        {marcas.length === 0 ? (
          <p className="text-xs text-ink-muted">Nenhuma marca disponível</p>
        ) : (
          <div className="space-y-1">
            {visibleMarcas.map((m) => {
              const selected = filtros.marca === m.nome;
              return (
                <button
                  key={m.nome}
                  type="button"
                  onClick={() =>
                    emitPatch({ marca: selected ? undefined : m.nome })
                  }
                  className={`flex w-full items-center justify-between rounded-editorial px-2.5 py-1.5 text-xs transition-colors ${
                    selected
                      ? 'bg-stone font-semibold text-ink'
                      : 'text-ink-secondary hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
                        selected
                          ? 'border-obsidian bg-obsidian text-canvas'
                          : 'border-[#C4BEB0] bg-surface'
                      }`}
                    >
                      {selected && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className="truncate">{m.nome}</span>
                  </span>
                  <span className="ml-2 rounded-editorial border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-muted">
                    {m.count}
                  </span>
                </button>
              );
            })}
            {marcas.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllMarcas((prev) => !prev)}
                className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-bronze-600 hover:text-ink"
              >
                {showAllMarcas
                  ? 'Mostrar menos'
                  : `Ver todas (${marcas.length})`}
              </button>
            )}
          </div>
        )}
      </FilterSection>

      {/* 3. Faixa de Preço */}
      <FilterSection title="Faixa de Preço">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink-muted">
              Mínimo (R$)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              value={precoMinInput}
              onChange={(e) => setPrecoMinInput(e.target.value)}
              onBlur={applyRangeInputs}
              onKeyDown={(e) => e.key === 'Enter' && applyRangeInputs()}
              placeholder={
                contagens?.precoRange?.min
                  ? String(contagens.precoRange.min)
                  : '0'
              }
              className="w-full rounded-editorial border border-hairline bg-canvas px-2.5 py-1.5 text-xs tabular-nums text-ink focus:border-ink focus:bg-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink-muted">
              Máximo (R$)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              value={precoMaxInput}
              onChange={(e) => setPrecoMaxInput(e.target.value)}
              onBlur={applyRangeInputs}
              onKeyDown={(e) => e.key === 'Enter' && applyRangeInputs()}
              placeholder={
                contagens?.precoRange?.max
                  ? String(contagens.precoRange.max)
                  : '500000'
              }
              className="w-full rounded-editorial border border-hairline bg-canvas px-2.5 py-1.5 text-xs tabular-nums text-ink focus:border-ink focus:bg-surface focus:outline-none"
            />
          </div>
        </div>
        {contagens?.precoRange?.max > 0 && (
          <p className="mt-2 text-[11px] tabular-nums text-ink-muted">
            Faixa: {formatarPreco(contagens.precoRange.min)} –{' '}
            {formatarPreco(contagens.precoRange.max)}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRECO_CHIPS.map((chip) => {
            const active = filtros.precoMax === chip.valor;
            return (
              <button
                key={chip.valor}
                type="button"
                onClick={() => {
                  const next = active ? undefined : chip.valor;
                  setPrecoMaxInput(next ? String(next) : '');
                  emitPatch({ precoMax: next });
                }}
                className={`rounded-editorial border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-obsidian bg-obsidian text-canvas'
                    : 'border-hairline bg-canvas text-ink-secondary hover:border-ink hover:text-ink'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* 4. Ano */}
      <FilterSection title="Ano">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink-muted">
              De
            </label>
            <input
              type="number"
              min={1980}
              max={new Date().getFullYear() + 2}
              value={anoMinInput}
              onChange={(e) => setAnoMinInput(e.target.value)}
              onBlur={applyRangeInputs}
              onKeyDown={(e) => e.key === 'Enter' && applyRangeInputs()}
              placeholder={
                contagens?.anoRange?.min ? String(contagens.anoRange.min) : '2015'
              }
              className="w-full rounded-editorial border border-hairline bg-canvas px-2.5 py-1.5 text-xs tabular-nums text-ink focus:border-ink focus:bg-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink-muted">
              Até
            </label>
            <input
              type="number"
              min={1980}
              max={new Date().getFullYear() + 2}
              value={anoMaxInput}
              onChange={(e) => setAnoMaxInput(e.target.value)}
              onBlur={applyRangeInputs}
              onKeyDown={(e) => e.key === 'Enter' && applyRangeInputs()}
              placeholder={
                contagens?.anoRange?.max
                  ? String(contagens.anoRange.max)
                  : String(new Date().getFullYear() + 1)
              }
              className="w-full rounded-editorial border border-hairline bg-canvas px-2.5 py-1.5 text-xs tabular-nums text-ink focus:border-ink focus:bg-surface focus:outline-none"
            />
          </div>
        </div>
      </FilterSection>

      {/* 5. Quilometragem */}
      <FilterSection title="Quilometragem">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-muted">
            Máximo (km)
          </label>
          <input
            type="number"
            min={0}
            step={5000}
            value={kmMaxInput}
            onChange={(e) => setKmMaxInput(e.target.value)}
            onBlur={applyRangeInputs}
            onKeyDown={(e) => e.key === 'Enter' && applyRangeInputs()}
            placeholder="Ex: 50000"
            className="w-full rounded-editorial border border-hairline bg-canvas px-2.5 py-1.5 text-xs tabular-nums text-ink focus:border-ink focus:bg-surface focus:outline-none"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {KM_CHIPS.map((chip) => {
            const active = filtros.kmMax === chip.valor;
            return (
              <button
                key={chip.valor}
                type="button"
                onClick={() => {
                  const next = active ? undefined : chip.valor;
                  setKmMaxInput(next ? String(next) : '');
                  emitPatch({ kmMax: next });
                }}
                className={`rounded-editorial border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-obsidian bg-obsidian text-canvas'
                    : 'border-hairline bg-canvas text-ink-secondary hover:border-ink hover:text-ink'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* 6. Câmbio */}
      <FilterSection title="Câmbio">
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center justify-between rounded-editorial px-2 py-1.5 text-xs text-ink-secondary hover:bg-canvas">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro-cambio"
                checked={!filtros.cambio}
                onChange={() => emitPatch({ cambio: undefined })}
                className="h-3.5 w-3.5 accent-obsidian"
              />
              <span>Todos</span>
            </span>
          </label>
          {cambios.map((c) => (
            <label
              key={c.nome}
              className="flex cursor-pointer items-center justify-between rounded-editorial px-2 py-1.5 text-xs text-ink-secondary hover:bg-canvas"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filtro-cambio"
                  checked={filtros.cambio === c.nome}
                  onChange={() => emitPatch({ cambio: c.nome })}
                  className="h-3.5 w-3.5 accent-obsidian"
                />
                <span>{LABELS.cambio[c.nome] || c.nome}</span>
              </span>
              <span className="rounded-editorial border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-muted">
                {c.count}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 7. Combustível */}
      <FilterSection title="Combustível">
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center justify-between rounded-editorial px-2 py-1.5 text-xs text-ink-secondary hover:bg-canvas">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro-combustivel"
                checked={!filtros.combustivel}
                onChange={() => emitPatch({ combustivel: undefined })}
                className="h-3.5 w-3.5 accent-obsidian"
              />
              <span>Todos</span>
            </span>
          </label>
          {combustiveis.map((comb) => (
            <label
              key={comb.nome}
              className="flex cursor-pointer items-center justify-between rounded-editorial px-2 py-1.5 text-xs text-ink-secondary hover:bg-canvas"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filtro-combustivel"
                  checked={filtros.combustivel === comb.nome}
                  onChange={() => emitPatch({ combustivel: comb.nome })}
                  className="h-3.5 w-3.5 accent-obsidian"
                />
                <span>{LABELS.combustivel[comb.nome] || comb.nome}</span>
              </span>
              <span className="rounded-editorial border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-muted">
                {comb.count}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 8. Categoria */}
      <FilterSection title="Categoria">
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center justify-between rounded-editorial px-2 py-1.5 text-xs text-ink-secondary hover:bg-canvas">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro-categoria"
                checked={!filtros.categoria}
                onChange={() => emitPatch({ categoria: undefined })}
                className="h-3.5 w-3.5 accent-obsidian"
              />
              <span>Todas</span>
            </span>
          </label>
          {categorias.map((cat) => (
            <label
              key={cat.nome}
              className="flex cursor-pointer items-center justify-between rounded-editorial px-2 py-1.5 text-xs text-ink-secondary hover:bg-canvas"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filtro-categoria"
                  checked={filtros.categoria === cat.nome}
                  onChange={() => emitPatch({ categoria: cat.nome })}
                  className="h-3.5 w-3.5 accent-obsidian"
                />
                <span>{LABELS.categoria[cat.nome] || cat.nome}</span>
              </span>
              <span className="rounded-editorial border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-muted">
                {cat.count}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Botão Limpar Filtros */}
      <button
        type="button"
        onClick={handleClear}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-editorial border border-hairline bg-canvas px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Limpar Filtros
      </button>
    </div>
  );

  return (
    <>
      {/* Botão Trigger Mobile */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-editorial border border-hairline bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
        >
          <SlidersHorizontal className="h-4 w-4 text-bronze-500" />
          Filtrar Estoque
          {activeFiltersCount > 0 && (
            <span className="rounded-editorial bg-obsidian px-2 py-0.5 text-[10px] font-semibold text-canvas">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Overlay Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de veículos"
        >
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-obsidian/70 backdrop-blur-sm"
          />
          <div className="relative z-10 flex h-full w-full max-w-xs flex-col border-r border-hairline bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <span className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
                <SlidersHorizontal className="h-4 w-4 text-bronze-500" />
                Filtrar Busca
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar filtros"
                className="rounded-editorial border border-hairline p-1.5 text-ink-secondary hover:border-ink hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {renderContent()}
            </div>
            <div className="border-t border-hairline p-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-editorial bg-obsidian py-3 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-bronze-500"
              >
                Ver {totalEncontrado} resultado{totalEncontrado === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop (288px) */}
      <aside className="hidden w-[288px] shrink-0 lg:block">
        <div className="sticky top-24 rounded-card border border-hairline bg-surface p-5">
          {renderContent()}
        </div>
      </aside>
    </>
  );
}
