'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  Car,
  CheckCircle2,
  MapPin,
  Search,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { LABELS } from '@/lib/utils';
import { useCompanyBrand } from '@/lib/company-brand';

const FAIXAS_PRECO = [
  { label: 'Qualquer faixa', value: '' },
  { label: 'Até R$ 80.000', value: '80000' },
  { label: 'Até R$ 120.000', value: '120000' },
  { label: 'Até R$ 180.000', value: '180000' },
  { label: 'Até R$ 250.000', value: '250000' },
  { label: 'Até R$ 350.000', value: '350000' },
];

export default function HeroBanner() {
  const router = useRouter();
  const brand = useCompanyBrand();
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precoMax, setPrecoMax] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busca.trim()) params.set('busca', busca.trim());
    if (categoria) params.set('categoria', categoria);
    if (precoMax) params.set('precoMax', precoMax);

    const query = params.toString();
    router.push(query ? `/veiculos?${query}` : '/veiculos');
  };

  return (
    <section className="relative overflow-hidden border-b border-obsidian-border bg-obsidian text-canvas">
      {/* Atmosfera sutil bronze / carvão (Avantgarde aesthetic) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(154, 107, 59, 0.18), transparent 70%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 72px 72px, 72px 72px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow inline-flex items-center gap-2.5 text-bronze-300">
            <span className="h-[1px] w-6 bg-bronze-400/60" />
            {brand.slogan || 'Showroom Multimarcas & Seminovos Selecionados'}
            <span className="h-[1px] w-6 bg-bronze-400/60" />
          </p>

          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.06] tracking-tight text-canvas sm:text-6xl lg:text-7xl">
            Encontre o carro dos seus{' '}
            <span className="italic font-normal text-bronze-300">sonhos</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[#B8B2A6] sm:text-base">
            {brand.descricao}
          </p>
        </div>

        {/* Barra de Busca Arquitetônica (1px border, superfície marfim) */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-5xl rounded-card border border-hairline bg-surface p-2.5 sm:p-3"
        >
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
            {/* Input de busca textual */}
            <div className="relative md:col-span-5">
              <label htmlFor="hero-busca" className="sr-only">
                Buscar marca, modelo ou versão
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="hero-busca"
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Busque por marca, modelo ou versão..."
                className="h-12 w-full rounded-editorial border border-hairline bg-canvas pl-10 pr-4 text-sm text-ink placeholder-ink-muted transition-colors focus:border-ink focus:bg-surface focus:outline-none"
              />
            </div>

            {/* Select de Categoria */}
            <div className="md:col-span-3">
              <label htmlFor="hero-categoria" className="sr-only">
                Categoria do veículo
              </label>
              <select
                id="hero-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="h-12 w-full rounded-editorial border border-hairline bg-canvas px-3.5 text-sm font-medium text-ink transition-colors focus:border-ink focus:bg-surface focus:outline-none"
              >
                <option value="">Todas as Categorias</option>
                {Object.entries(LABELS.categoria).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Select de Preço Máximo */}
            <div className="md:col-span-2">
              <label htmlFor="hero-preco" className="sr-only">
                Preço máximo
              </label>
              <select
                id="hero-preco"
                value={precoMax}
                onChange={(e) => setPrecoMax(e.target.value)}
                className="h-12 w-full rounded-editorial border border-hairline bg-canvas px-3.5 text-sm font-medium text-ink transition-colors focus:border-ink focus:bg-surface focus:outline-none"
              >
                {FAIXAS_PRECO.map((faixa) => (
                  <option key={faixa.value || 'all'} value={faixa.value}>
                    {faixa.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Buscar */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-editorial bg-obsidian px-4 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors duration-300 ease-editorial hover:bg-bronze-500"
              >
                Buscar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Atalhos Editoriais */}
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <Link
            href="/veiculos"
            className="inline-flex items-center gap-2 rounded-editorial border border-obsidian-border bg-obsidian-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D7D1C6] transition-colors duration-300 hover:border-bronze-400 hover:text-canvas"
          >
            <Car className="h-3.5 w-3.5 text-bronze-300" />
            Explorar Estoque
          </Link>
          <Link
            href="/ofertas"
            className="inline-flex items-center gap-2 rounded-editorial border border-obsidian-border bg-obsidian-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D7D1C6] transition-colors duration-300 hover:border-bronze-400 hover:text-canvas"
          >
            <Tag className="h-3.5 w-3.5 text-bronze-300" />
            Conferir Ofertas
          </Link>
          <Link
            href="/concessionarias"
            className="inline-flex items-center gap-2 rounded-editorial border border-obsidian-border bg-obsidian-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D7D1C6] transition-colors duration-300 hover:border-bronze-400 hover:text-canvas"
          >
            <MapPin className="h-3.5 w-3.5 text-bronze-300" />
            Visitar Nosso Showroom
          </Link>
        </div>

        {/* Ledger de Confiança com divisórias 1px */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 divide-y divide-obsidian-border border-t border-obsidian-border pt-7 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="flex items-center justify-center gap-2.5 px-3 py-2">
            <Car className="h-4 w-4 shrink-0 text-bronze-300" />
            <span className="text-xs font-medium tracking-wide text-[#D7D1C6]">
              Estoque Próprio Revisado
            </span>
          </div>
          <div className="flex items-center justify-center gap-2.5 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-bronze-300" />
            <span className="text-xs font-medium tracking-wide text-[#D7D1C6]">
              Vistoria Cautelar 100%
            </span>
          </div>
          <div className="flex items-center justify-center gap-2.5 px-3 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-bronze-300" />
            <span className="text-xs font-medium tracking-wide text-[#D7D1C6]">
              Laudo &amp; Procedência
            </span>
          </div>
          <div className="flex items-center justify-center gap-2.5 px-3 py-2">
            <Award className="h-4 w-4 shrink-0 text-bronze-300" />
            <span className="text-xs font-medium tracking-wide text-[#D7D1C6]">
              Garantia &amp; Pós-Venda
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
