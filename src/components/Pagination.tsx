'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (pagina: number) => void;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

function gerarItensPaginacao(
  paginaAtual: number,
  totalPaginas: number
): PageItem[] {
  if (totalPaginas <= 5) {
    return Array.from({ length: totalPaginas }, (_, idx) => idx + 1);
  }

  if (paginaAtual <= 3) {
    return [1, 2, 3, 4, 'ellipsis-end', totalPaginas];
  }

  if (paginaAtual >= totalPaginas - 2) {
    return [
      1,
      'ellipsis-start',
      totalPaginas - 3,
      totalPaginas - 2,
      totalPaginas - 1,
      totalPaginas,
    ];
  }

  return [
    1,
    'ellipsis-start',
    paginaAtual - 1,
    paginaAtual,
    paginaAtual + 1,
    'ellipsis-end',
    totalPaginas,
  ];
}

export default function Pagination({
  paginaAtual,
  totalPaginas,
  onPageChange,
}: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const itens = gerarItensPaginacao(paginaAtual, totalPaginas);

  return (
    <nav
      aria-label="Paginação de resultados"
      className="flex flex-wrap items-center justify-center gap-1.5 py-4"
    >
      {/* Anterior */}
      <button
        type="button"
        disabled={paginaAtual <= 1}
        onClick={() => onPageChange(paginaAtual - 1)}
        aria-label="Página anterior"
        className="inline-flex h-10 items-center gap-1 rounded-editorial border border-hairline bg-surface px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Números das páginas */}
      <div className="flex items-center gap-1">
        {itens.map((item) => {
          if (item === 'ellipsis-start' || item === 'ellipsis-end') {
            return (
              <span
                key={item}
                aria-hidden="true"
                className="flex h-10 w-8 items-center justify-center text-sm font-medium text-ink-muted"
              >
                …
              </span>
            );
          }

          const isCurrent = item === paginaAtual;
          return (
            <button
              key={item}
              type="button"
              onClick={() => !isCurrent && onPageChange(item)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex h-10 min-w-[40px] items-center justify-center rounded-editorial px-3 text-xs font-semibold tabular-nums transition-colors ${
                isCurrent
                  ? 'border border-obsidian bg-obsidian text-canvas'
                  : 'border border-hairline bg-surface text-ink-secondary hover:border-ink hover:text-ink'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Próxima */}
      <button
        type="button"
        disabled={paginaAtual >= totalPaginas}
        onClick={() => onPageChange(paginaAtual + 1)}
        aria-label="Próxima página"
        className="inline-flex h-10 items-center gap-1 rounded-editorial border border-hairline bg-surface px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
