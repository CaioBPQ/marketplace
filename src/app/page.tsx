'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import VehicleCard from '@/components/VehicleCard';
import ServiceCard from '@/components/ServiceCard';
import { useCompanyBrand } from '@/lib/company-brand';
import { Veiculo, Servico } from '@/types';
import {
  Shield,
  Award,
  Clock,
  ThumbsUp,
  ArrowRight,
  Car,
  Truck,
  Tag,
  MapPin,
  Compass,
  Zap,
  CheckCircle2,
  Building2,
} from 'lucide-react';

const CATEGORIAS_HOME = [
  {
    key: 'SUV',
    nome: 'SUVs',
    subtitulo: 'Espaço, presença elevada e versatilidade',
    icon: Compass,
    numero: '01',
  },
  {
    key: 'SEDAN',
    nome: 'Sedans',
    subtitulo: 'Conforto executivo e silêncio a bordo',
    icon: Car,
    numero: '02',
  },
  {
    key: 'HATCH',
    nome: 'Hatches',
    subtitulo: 'Agilidade urbana e eficiência diária',
    icon: Zap,
    numero: '03',
  },
  {
    key: 'PICKUP',
    nome: 'Picapes 4x4',
    subtitulo: 'Força estrutural para trabalho e estrada',
    icon: Truck,
    numero: '04',
  },
];

const PILARES = [
  {
    numero: '01',
    icon: Shield,
    titulo: 'Procedência Garantida',
    descricao:
      'Todos os veículos passam por vistoria cautelar e laudo completo antes de ingressar na curadoria.',
  },
  {
    numero: '02',
    icon: Award,
    titulo: 'Curadoria & Garantia Própria',
    descricao:
      'Estoque próprio selecionado pela nossa equipe técnica com garantia contratual e procedência comprovada.',
  },
  {
    numero: '03',
    icon: Clock,
    titulo: 'Atendimento Ágil',
    descricao:
      'Simule financiamento e negocie diretamente pelo WhatsApp ou formulário com resposta em minutos.',
  },
  {
    numero: '04',
    icon: ThumbsUp,
    titulo: 'Pós-Venda Completo',
    descricao:
      'Agende revisões programadas, inspeções e assistência 24h em nossa rede credenciada.',
  },
];

export default function HomePage() {
  const brand = useCompanyBrand();
  const [destaques, setDestaques] = useState<Veiculo[]>([]);
  const [ofertas, setOfertas] = useState<Veiculo[]>([]);
  const [servicos, setServicos] = useState<(Servico & { loja?: { nome: string } })[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [loadingOfertas, setLoadingOfertas] = useState(true);
  const [loadingServicos, setLoadingServicos] = useState(true);

  useEffect(() => {
    async function carregarHome() {
      try {
        const [resDestaques, resOfertas, resServicos] = await Promise.all([
          fetch('/api/veiculos?destaque=true&limite=8'),
          fetch('/api/veiculos?ofertas=true&limite=4'),
          fetch('/api/servicos'),
        ]);

        if (resDestaques.ok) {
          const jsonD = await resDestaques.json();
          if (jsonD.success && Array.isArray(jsonD.data)) {
            setDestaques(jsonD.data);
          }
        }

        if (resOfertas.ok) {
          const jsonO = await resOfertas.json();
          if (jsonO.success && Array.isArray(jsonO.data)) {
            setOfertas(jsonO.data);
          }
        }

        if (resServicos.ok) {
          const jsonS = await resServicos.json();
          if (jsonS.success && Array.isArray(jsonS.data)) {
            setServicos(jsonS.data.slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados da home:', err);
      } finally {
        setLoadingVeiculos(false);
        setLoadingOfertas(false);
        setLoadingServicos(false);
      }
    }

    carregarHome();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Header />

      <main className="flex-1">
        {/* Hero Obsidian */}
        <HeroBanner />

        {/* Faixa Editorial de Ações Rápidas (1px Hairline Modular Grid - General Muir / Humanrace) */}
        <section className="border-b border-hairline bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-hairline">
              <Link
                href="/veiculos"
                className="group py-7 md:pr-8 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-editorial border border-hairline bg-canvas text-ink flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:border-obsidian group-hover:bg-obsidian group-hover:text-bronze-300">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="eyebrow text-bronze-600 block">01 / Inventário</span>
                    <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-bronze-600 transition-colors">
                      Explorar Catálogo
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5 truncate">
                      Filtre por marca, ano, preço, câmbio e km
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-muted shrink-0 group-hover:text-ink group-hover:translate-x-1 transition-all duration-300" />
              </Link>

              <Link
                href="/ofertas"
                className="group py-7 md:px-8 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-editorial border border-hairline bg-canvas text-ink flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:border-obsidian group-hover:bg-obsidian group-hover:text-bronze-300">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="eyebrow text-bronze-600 block">02 / Oportunidades</span>
                    <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-bronze-600 transition-colors">
                      Conferir Ofertas
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5 truncate">
                      Condições especiais e redução real de preço
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-muted shrink-0 group-hover:text-ink group-hover:translate-x-1 transition-all duration-300" />
              </Link>

              <Link
                href="/concessionarias"
                className="group py-7 md:pl-8 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-editorial border border-hairline bg-canvas text-ink flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:border-obsidian group-hover:bg-obsidian group-hover:text-bronze-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="eyebrow text-bronze-600 block">03 / Showroom</span>
                    <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-bronze-600 transition-colors">
                      Nosso Showroom &amp; Visita
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5 truncate">
                      Endereço físico, horários e agendamento de test drive
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-muted shrink-0 group-hover:text-ink group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </div>
          </div>
        </section>

        {/* Veículos em Destaque */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 mb-10 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">Seleção Curada</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink mt-2">
                Veículos em Destaque
              </h2>
              <p className="text-sm text-ink-secondary mt-1.5 max-w-xl">
                Exemplares com procedência auditada, histórico transparente e pronta entrega nas lojas parceiras.
              </p>
            </div>
            <Link
              href="/veiculos"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:text-bronze-600 transition-colors shrink-0"
            >
              Ver todo o estoque
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingVeiculos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card overflow-hidden border border-hairline animate-pulse"
                >
                  <div className="aspect-[16/10] bg-stone" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-stone rounded w-1/3" />
                    <div className="h-6 bg-stone rounded w-3/4" />
                    <div className="h-8 bg-stone rounded w-1/2 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : destaques.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {destaques.map((veiculo) => (
                <VehicleCard key={veiculo.id} vehicle={veiculo} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-card p-12 text-center border border-hairline">
              <Car className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <p className="text-ink-secondary font-medium text-sm">
                Nenhum veículo em destaque no momento.
              </p>
              <Link
                href="/veiculos"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-editorial bg-obsidian text-canvas text-xs font-semibold uppercase tracking-[0.14em] hover:bg-bronze-500 transition-colors"
              >
                Explorar catálogo completo
              </Link>
            </div>
          )}
        </section>

        {/* Ofertas Especiais da Semana */}
        {(loadingOfertas || ofertas.length > 0) && (
          <section className="bg-stone/70 py-20 lg:py-24 border-y border-hairline">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 mb-10 border-b border-hairline">
                <div>
                  <span className="eyebrow text-bronze-600">Condições Exclusivas</span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink mt-2">
                    Ofertas Especiais da Semana
                  </h2>
                  <p className="text-sm text-ink-secondary mt-1.5">
                    Oportunidades selecionadas com redução direta sobre a tabela anunciada.
                  </p>
                </div>
                <Link
                  href="/ofertas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-xs font-semibold uppercase tracking-[0.14em] transition-colors shrink-0"
                >
                  Conferir todas as ofertas
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingOfertas ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-surface rounded-card h-80 border border-hairline animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {ofertas.map((veiculo) => (
                    <VehicleCard key={veiculo.id} vehicle={veiculo} viewMode="grid" />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Categorias — Grid Arquitetônico (Humanrace / Yonobi) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-10 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">Segmentação</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink mt-2">
                Explore por Categoria
              </h2>
            </div>
            <p className="text-sm text-ink-secondary max-w-md">
              Escolha a carroceria que melhor atende à sua dinâmica urbana ou rodoviária.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border border-hairline rounded-card overflow-hidden">
            {CATEGORIAS_HOME.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.key}
                  href={`/veiculos?categoria=${cat.key}`}
                  className="group relative bg-surface p-7 flex flex-col justify-between min-h-[220px] transition-colors duration-300 ease-editorial hover:bg-obsidian hover:text-canvas"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-ink-muted group-hover:text-bronze-300 transition-colors">
                      {cat.numero}
                    </span>
                    <div className="w-10 h-10 rounded-editorial border border-hairline bg-canvas text-ink flex items-center justify-center transition-colors group-hover:border-obsidian-border group-hover:bg-obsidian-soft group-hover:text-bronze-300">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-2xl font-serif font-semibold text-ink group-hover:text-canvas transition-colors">
                      {cat.nome}
                    </h3>
                    <p className="text-xs text-ink-secondary group-hover:text-[#A39D92] mt-1.5 leading-relaxed transition-colors">
                      {cat.subtitulo}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-bronze-600 group-hover:text-bronze-300 mt-5 transition-all group-hover:gap-2.5">
                      Ver modelos <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Por que AutoMarket — Faixa Obsidian */}
        <section className="bg-obsidian text-canvas py-20 lg:py-24 border-y border-obsidian-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-12 border-b border-obsidian-border">
              <div>
                <span className="eyebrow text-bronze-300">Padrão de Excelência • {brand.cidade}/{brand.estado}</span>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold mt-2">
                  Por que escolher a {brand.nome}
                </h2>
              </div>
              <p className="text-sm text-[#A39D92] max-w-md">
                Rigor técnico na seleção de estoque e transparência jurídica em cada etapa da negociação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-obsidian-border border border-obsidian-border rounded-card overflow-hidden">
              {PILARES.map((pilar) => {
                const Icon = pilar.icon;
                return (
                  <div
                    key={pilar.titulo}
                    className="bg-obsidian-soft p-7 transition-colors duration-300 hover:bg-[#22201D]"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs text-bronze-300">
                        {pilar.numero}
                      </span>
                      <Icon className="w-5 h-5 text-bronze-300" />
                    </div>
                    <h3 className="font-serif font-semibold text-xl text-canvas mb-2">
                      {pilar.titulo}
                    </h3>
                    <p className="text-xs text-[#A39D92] leading-relaxed">
                      {pilar.descricao}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Serviços em Destaque */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 mb-10 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">Ecossistema Pós-Venda</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink mt-2">
                Serviços Automotivos &amp; Revisão
              </h2>
              <p className="text-sm text-ink-secondary mt-1.5">
                Manutenção preventiva, inspeção pré-compra e assistência com agendamento online.
              </p>
            </div>
            <Link
              href="/servicos"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:text-bronze-600 transition-colors shrink-0"
            >
              Todos os serviços
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingServicos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card h-64 border border-hairline animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicos.map((servico) => (
                <ServiceCard key={servico.id} servico={servico} />
              ))}
            </div>
          )}
        </section>

        {/* Banner Institucional: Avaliação de Seminovo na Troca & Agendamento */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative overflow-hidden rounded-card border border-obsidian-border bg-obsidian p-8 sm:p-14 text-canvas">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 w-96 h-96 opacity-40"
              style={{
                background:
                  'radial-gradient(circle, var(--brand-glow-color) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="max-w-2xl">
                <div className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  Atendimento Exclusivo no Showroom
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold leading-tight">
                  Deseja avaliar seu veículo na troca ou agendar um Test Drive?
                </h2>
                <p className="text-[#B8B2A6] mt-3 text-sm sm:text-base leading-relaxed">
                  Nossa equipe de consultores avalia seu seminovo com transparência, oferece as melhores taxas de financiamento e prepara o veículo para entrega imediata.
                </p>
                <div className="flex flex-wrap gap-5 mt-6 text-xs text-[#D7D1C6]">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-bronze-300" />
                    Superavaliação do seu usado
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-bronze-300" />
                    Financiamento em até 60x
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-bronze-300" />
                    Laudo cautelar 100% aprovado
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/concessionarias"
                  className="btn-brand-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-editorial font-bold text-xs uppercase tracking-[0.14em]"
                >
                  Agendar Visita no Showroom
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/ofertas"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-editorial border border-obsidian-border bg-obsidian-soft hover:border-bronze-400 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
                >
                  Simular Financiamento
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
