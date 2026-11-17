'use client';

import Link from 'next/link';
import {
  CalendarCheck,
  CircleDot,
  Clock,
  Droplets,
  Paintbrush,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { formatarPreco } from '@/lib/utils';
import type { Servico } from '@/types/index';

interface ServiceCardProps {
  servico: Servico & { loja?: { nome: string } };
  onAgendar?: (servico: Servico) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  wrench: Wrench,
  droplets: Droplets,
  'circle-dot': CircleDot,
  wind: Wind,
  paintbrush: Paintbrush,
  settings: Settings,
  search: Search,
  'shield-check': ShieldCheck,
};

const CATEGORIA_SERVICO_LABELS: Record<
  string,
  { label: string; badgeClass: string }
> = {
  REVISAO: {
    label: 'Revisão',
    badgeClass: 'border border-hairline bg-stone text-ink',
  },
  MANUTENCAO: {
    label: 'Manutenção',
    badgeClass: 'border border-hairline bg-canvas text-ink-secondary',
  },
  FUNILARIA: {
    label: 'Funilaria & Pintura',
    badgeClass: 'border border-bronze-200 bg-bronze-50 text-bronze-700',
  },
  ACESSORIOS: {
    label: 'Acessórios',
    badgeClass: 'border border-hairline bg-stone text-ink',
  },
  SEGURO: {
    label: 'Seguro',
    badgeClass: 'border border-sage-600/30 bg-sage-50 text-sage-700',
  },
};

export default function ServiceCard({ servico, onAgendar }: ServiceCardProps) {
  const IconComponent =
    (servico.icone && ICON_MAP[servico.icone.toLowerCase()]) || Wrench;

  const categoriaInfo = CATEGORIA_SERVICO_LABELS[servico.categoria] || {
    label: servico.categoria,
    badgeClass: 'border border-hairline bg-canvas text-ink-secondary',
  };

  const temPromocao =
    typeof servico.precoPromocional === 'number' &&
    servico.precoPromocional > 0 &&
    typeof servico.preco === 'number' &&
    servico.precoPromocional < servico.preco;

  const precoExibido = temPromocao
    ? (servico.precoPromocional as number)
    : servico.preco;

  return (
    <article className="group flex flex-col justify-between rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 ease-editorial hover:border-[#ABA394]">
      <div>
        {/* Topo: Ícone + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-editorial border border-obsidian bg-obsidian text-bronze-300 transition-colors duration-300 group-hover:border-bronze-500 group-hover:bg-bronze-500 group-hover:text-canvas">
            <IconComponent className="h-5 w-5" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {servico.destaque && (
              <span className="inline-flex items-center gap-1 rounded-editorial bg-obsidian px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-bronze-300">
                <Star className="h-2.5 w-2.5 fill-bronze-300" />
                Destaque
              </span>
            )}
            <span
              className={`rounded-editorial px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoriaInfo.badgeClass}`}
            >
              {categoriaInfo.label}
            </span>
          </div>
        </div>

        {/* Nome e Descrição */}
        <h3 className="mt-5 font-serif text-xl font-semibold leading-snug text-ink">
          {servico.nome}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-secondary">
          {servico.descricao}
        </p>

        {/* Meta: Loja e Duração */}
        {(servico.loja?.nome || servico.duracao) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
            {servico.loja?.nome && (
              <span className="inline-flex items-center gap-1.5 rounded-editorial border border-hairline bg-canvas px-2.5 py-1 font-medium text-ink">
                <Store className="h-3 w-3 text-bronze-500" />
                {servico.loja.nome}
              </span>
            )}
            {servico.duracao && (
              <span className="inline-flex items-center gap-1.5 rounded-editorial border border-hairline bg-canvas px-2.5 py-1 font-medium tabular-nums text-ink">
                <Clock className="h-3 w-3 text-bronze-500" />
                {servico.duracao}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rodapé: Preço e Botão Agendar */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Valor estimado
          </span>
          {typeof precoExibido === 'number' && precoExibido > 0 ? (
            <div className="mt-0.5">
              {temPromocao && typeof servico.preco === 'number' && (
                <span className="mr-1.5 text-xs tabular-nums text-ink-muted line-through">
                  {formatarPreco(servico.preco)}
                </span>
              )}
              <span className="font-serif text-2xl font-bold tabular-nums text-ink">
                {formatarPreco(precoExibido)}
              </span>
            </div>
          ) : (
            <span className="mt-0.5 block font-serif text-lg font-semibold text-bronze-600">
              Sob Consulta
            </span>
          )}
        </div>

        {onAgendar ? (
          <button
            type="button"
            onClick={() => onAgendar(servico)}
            className="inline-flex items-center gap-1.5 rounded-editorial bg-obsidian px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-canvas transition-colors duration-300 hover:bg-bronze-500"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-bronze-300" />
            Agendar
          </button>
        ) : (
          <Link
            href={`/servicos?agendar=${servico.id}`}
            className="inline-flex items-center gap-1.5 rounded-editorial bg-obsidian px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-canvas transition-colors duration-300 hover:bg-bronze-500"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-bronze-300" />
            Agendar
          </Link>
        )}
      </div>
    </article>
  );
}
