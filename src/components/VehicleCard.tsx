'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  Settings2,
  Star,
  Store,
  Tag,
} from 'lucide-react';
import {
  formatarKM,
  formatarPreco,
  gerarLinkWhatsApp,
  LABELS,
} from '@/lib/utils';
import type { Veiculo } from '@/types/index';

interface VehicleCardProps {
  vehicle: Veiculo;
  viewMode?: 'grid' | 'list';
}

export default function VehicleCard({
  vehicle,
  viewMode = 'grid',
}: VehicleCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; scrollLeft: number } | null>(null);
  const didSwipeRef = useRef(false);

  const galeria = useMemo(() => {
    const urls: string[] = [];
    if (typeof vehicle.imagemPrincipal === 'string' && vehicle.imagemPrincipal.trim()) {
      urls.push(vehicle.imagemPrincipal.trim());
    }
    if (vehicle.imagens) {
      try {
        const parsed = JSON.parse(vehicle.imagens);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item === 'string') {
              const trimmed = item.trim();
              if (trimmed && !urls.includes(trimmed)) {
                urls.push(trimmed);
              }
            }
          }
        }
      } catch {
        // Ignora JSON malformado
      }
    }
    return urls;
  }, [vehicle.imagemPrincipal, vehicle.imagens]);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    if (
      touchStartRef.current &&
      Math.abs(el.scrollLeft - touchStartRef.current.scrollLeft) > 8
    ) {
      didSwipeRef.current = true;
    }
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(galeria.length - 1, nextIndex));
    if (clamped !== activeIndex) {
      setActiveIndex(clamped);
    }
  };

  const scrollToIndex = (targetIndex: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const el = trackRef.current;
    if (!el || galeria.length <= 1) return;
    const normalized =
      ((targetIndex % galeria.length) + galeria.length) % galeria.length;
    el.scrollTo({
      left: normalized * el.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(normalized);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      scrollLeft: trackRef.current?.scrollLeft ?? 0,
    };
    didSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLAnchorElement>) => {
    const start = touchStartRef.current;
    const t = e.touches[0];
    if (!start || !t) return;
    const deltaX = t.clientX - start.x;
    if (Math.abs(deltaX) > 8) {
      didSwipeRef.current = true;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: trackRef.current?.scrollLeft ?? 0,
    };
    didSwipeRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const start = touchStartRef.current;
    if (!start) return;
    const deltaX = e.clientX - start.x;
    if (Math.abs(deltaX) > 8) {
      didSwipeRef.current = true;
    }
  };

  const handlePointerUp = () => {
    const start = touchStartRef.current;
    const currentScrollLeft = trackRef.current?.scrollLeft ?? 0;
    if (start && Math.abs(currentScrollLeft - start.scrollLeft) > 8) {
      didSwipeRef.current = true;
    }
    touchStartRef.current = null;
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (didSwipeRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didSwipeRef.current = false;
    }
  };

  const temPromocao =
    typeof vehicle.precoPromocional === 'number' &&
    vehicle.precoPromocional > 0 &&
    vehicle.precoPromocional < vehicle.preco;

  const precoExibido = temPromocao
    ? (vehicle.precoPromocional as number)
    : vehicle.preco;

  const percentualDesconto = temPromocao
    ? Math.round(
        ((vehicle.preco - (vehicle.precoPromocional as number)) /
          vehicle.preco) *
          100
      )
    : 0;

  const whatsappHref = gerarLinkWhatsApp({
    numero: vehicle.loja?.whatsapp || '5527998345027',
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    ano: vehicle.ano,
    preco: precoExibido,
    veiculoId: vehicle.id,
  });

  const isList = viewMode === 'list';
  const detalheHref = vehicle.id.startsWith('gh_')
    ? `/veiculos/item?id=${vehicle.id}`
    : `/veiculos/${vehicle.id}`;
  const temMultiplasFotos = galeria.length > 1;

  return (
    <article
      className={`group relative overflow-hidden rounded-card border border-hairline bg-surface transition-colors duration-300 ease-editorial hover:border-[#ABA394] ${
        isList ? 'flex flex-col md:flex-row' : 'flex flex-col'
      }`}
    >
      {/* Imagem Editorial do Veículo com Carrossel Mobile-First (CSS Scroll Snap) */}
      <Link
        href={detalheHref}
        onClick={handleLinkClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative block overflow-hidden bg-stone ${
          isList
            ? 'h-60 w-full shrink-0 border-b border-hairline md:h-auto md:w-80 md:border-b-0 md:border-r'
            : 'aspect-[16/10] w-full border-b border-hairline'
        }`}
      >
        {galeria.length > 0 ? (
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
          >
            {galeria.map((fotoUrl, index) => (
              <div
                key={`${fotoUrl}-${index}`}
                className="relative h-full w-full flex-[0_0_100%] shrink-0 snap-start select-none"
              >
                {!failedImages[index] ? (
                  <img
                    src={fotoUrl}
                    alt={`${vehicle.marca} ${vehicle.modelo} ${vehicle.ano} - Foto ${index + 1}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding={index === 0 ? undefined : 'async'}
                    draggable={false}
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [index]: true }))
                    }
                    className="h-full w-full select-none object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-obsidian p-4 text-center text-canvas">
                    <Car className="h-10 w-10 text-bronze-300 opacity-85" />
                    <span className="mt-2 font-serif text-lg font-medium">
                      {vehicle.marca} {vehicle.modelo}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-obsidian p-4 text-center text-canvas">
            <Car className="h-10 w-10 text-bronze-300 opacity-85" />
            <span className="mt-2 font-serif text-lg font-medium">
              {vehicle.marca} {vehicle.modelo}
            </span>
          </div>
        )}

        {/* Badges discretas no topo esquerdo */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {vehicle.destaque && (
            <span className="inline-flex items-center gap-1 rounded-editorial border border-bronze-400/40 bg-obsidian/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-bronze-300 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-bronze-300" />
              Destaque
            </span>
          )}
          {temPromocao && (
            <span className="inline-flex items-center gap-1 rounded-editorial bg-bronze-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-canvas">
              <Tag className="h-2.5 w-2.5" />
              Oferta {percentualDesconto > 0 ? `-${percentualDesconto}%` : ''}
            </span>
          )}
        </div>

        {/* Contador discreto 1 / N no canto superior direito */}
        {temMultiplasFotos && (
          <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-obsidian/80 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.08em] text-canvas tabular-nums backdrop-blur-sm">
            {activeIndex + 1} / {galeria.length}
          </span>
        )}

        {/* Setas laterais sutis no desktop (visíveis apenas no hover) */}
        {temMultiplasFotos && (
          <>
            <button
              type="button"
              onClick={(e) => scrollToIndex(activeIndex - 1, e)}
              aria-label="Foto anterior"
              className="absolute left-2.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-obsidian/75 text-canvas opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-obsidian group-hover:opacity-100 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => scrollToIndex(activeIndex + 1, e)}
              aria-label="Próxima foto"
              className="absolute right-2.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-obsidian/75 text-canvas opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-obsidian group-hover:opacity-100 md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Categoria discreta */}
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-editorial border border-white/15 bg-obsidian/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-canvas backdrop-blur-sm">
          {LABELS.categoria[vehicle.categoria] || vehicle.categoria}
        </span>

        {/* Pagination Dots minimalistas na base central da imagem */}
        {temMultiplasFotos && (
          <div
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-obsidian/45 px-2 py-1 backdrop-blur-[2px]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {galeria.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => scrollToIndex(idx, e)}
                aria-label={`Ir para foto ${idx + 1} de ${galeria.length}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'w-4 bg-canvas'
                    : 'w-1.5 bg-canvas/50 hover:bg-canvas/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Overlay de VENDIDO */}
        {vehicle.vendido && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-obsidian/75 backdrop-blur-[2px]">
            <span className="rounded-editorial border border-bronze-300/60 bg-obsidian px-5 py-2 font-serif text-lg font-semibold uppercase tracking-[0.22em] text-canvas">
              Vendido
            </span>
          </div>
        )}
      </Link>

      {/* Conteúdo Editorial do Card */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <p className="eyebrow text-bronze-600">{vehicle.marca}</p>
          <Link
            href={detalheHref}
            className="mt-1 block truncate font-serif text-2xl font-semibold leading-tight text-ink transition-colors hover:text-bronze-600"
          >
            {vehicle.modelo}
          </Link>
          <p className="mt-1 truncate text-xs text-ink-secondary">
            {vehicle.versao || `Ano ${vehicle.ano}`}
          </p>

          {/* Tabela Técnica Minimalista com divisórias 1px */}
          <div
            className={`mt-4 grid gap-px overflow-hidden rounded-editorial border border-hairline bg-hairline text-xs text-ink-secondary ${
              isList ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
            }`}
          >
            <div className="flex items-center gap-2 bg-canvas px-3 py-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-bronze-500" />
              <span className="truncate font-medium tabular-nums text-ink">
                {vehicle.ano}
                {vehicle.anoModelo ? `/${vehicle.anoModelo}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-canvas px-3 py-2">
              <Gauge className="h-3.5 w-3.5 shrink-0 text-bronze-500" />
              <span className="truncate font-medium tabular-nums text-ink">
                {formatarKM(vehicle.km)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-canvas px-3 py-2">
              <Settings2 className="h-3.5 w-3.5 shrink-0 text-bronze-500" />
              <span className="truncate font-medium text-ink">
                {LABELS.cambio[vehicle.cambio] || vehicle.cambio}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-canvas px-3 py-2">
              <Fuel className="h-3.5 w-3.5 shrink-0 text-bronze-500" />
              <span className="truncate font-medium text-ink">
                {LABELS.combustivel[vehicle.combustivel] || vehicle.combustivel}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé: Preço, Loja e Ações */}
        <div className="mt-5 border-t border-hairline pt-4">
          <div
            className={`flex flex-wrap items-end justify-between gap-3 ${
              isList ? 'sm:flex-nowrap' : ''
            }`}
          >
            <div>
              {temPromocao && (
                <p className="text-xs font-medium tabular-nums text-ink-muted line-through">
                  {formatarPreco(vehicle.preco)}
                </p>
              )}
              <p className="font-serif text-2xl font-bold tabular-nums text-ink">
                {formatarPreco(precoExibido)}
              </p>
              {vehicle.loja && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-secondary">
                  <Store className="h-3 w-3 shrink-0 text-bronze-500" />
                  <span className="truncate font-medium text-ink">
                    {vehicle.loja.nome}
                  </span>
                  <span className="text-hairline">•</span>
                  <span className="inline-flex items-center gap-0.5 truncate text-ink-muted">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {vehicle.loja.cidade}
                    {vehicle.loja.estado ? `/${vehicle.loja.estado}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="flex w-full items-center gap-2 pt-1 sm:w-auto sm:pt-0">
              <Link
                href={detalheHref}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-editorial bg-obsidian px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-canvas transition-colors duration-300 ease-editorial hover:bg-bronze-500 sm:flex-initial"
              >
                Detalhes
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              {!vehicle.vendido && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Conversar no WhatsApp sobre ${vehicle.marca} ${vehicle.modelo}`}
                  title="Chamar no WhatsApp"
                  className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-editorial border border-sage-700 bg-sage-700 text-canvas transition-colors duration-300 hover:bg-sage-800"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
