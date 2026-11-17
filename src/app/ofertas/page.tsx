'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VehicleCard from '@/components/VehicleCard';
import { Veiculo } from '@/types';
import { formatarPreco } from '@/lib/utils';
import {
  Tag,
  Percent,
  Calculator,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Car,
} from 'lucide-react';

export default function OfertasPage() {
  const [ofertas, setOfertas] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [valorVeiculoSim, setValorVeiculoSim] = useState(100000);
  const [entradaSim, setEntradaSim] = useState(30000);
  const [parcelasSim, setParcelasSim] = useState(48);

  useEffect(() => {
    async function fetchOfertas() {
      try {
        const res = await fetch('/api/veiculos?ofertas=true&limite=24');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setOfertas(json.data);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar ofertas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOfertas();
  }, []);

  const valorFinanciado = Math.max(0, valorVeiculoSim - entradaSim);
  const taxaMensal = 0.0149;
  const parcelaEstimada =
    valorFinanciado > 0
      ? (valorFinanciado * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -parcelasSim))
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1">
        {/* Hero Editorial Obsidian */}
        <section className="border-b border-obsidian-border bg-obsidian text-canvas py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-3">
                <Tag className="w-3.5 h-3.5" />
                Curadoria Promocional AutoMarket
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif font-semibold leading-tight">
                Ofertas Especiais Selecionadas
              </h1>
              <p className="text-[#B8B2A6] text-base sm:text-lg mt-4 leading-relaxed">
                Veículos com condições exclusivas, redução real sobre o valor de tabela e aprovação ágil diretamente nas lojas parceiras.
              </p>
              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-obsidian-border text-xs text-[#D7D1C6]">
                <span className="inline-flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-bronze-300" />
                  Descontos reais verificados
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-bronze-300" />
                  Garantia de procedência
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-bronze-300" />
                  Avaliação justa do seu usado
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Grid de Ofertas */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">Oportunidades Ativas</span>
              <h2 className="text-3xl font-serif font-semibold text-ink mt-1">
                Veículos com Preço Promocional
              </h2>
              <p className="text-xs text-ink-secondary mt-1">
                {loading
                  ? 'Carregando ofertas...'
                  : `${ofertas.length} ${ofertas.length === 1 ? 'oferta disponível' : 'ofertas disponíveis'} agora`}
              </p>
            </div>
            <Link
              href="/veiculos"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:text-bronze-600 transition-colors"
            >
              Ver estoque completo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card h-80 border border-hairline animate-pulse"
                />
              ))}
            </div>
          ) : ofertas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ofertas.map((veiculo) => (
                <VehicleCard key={veiculo.id} vehicle={veiculo} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-card p-12 text-center border border-hairline">
              <Car className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <h3 className="text-2xl font-serif font-semibold text-ink">
                Nenhuma oferta promocional ativa no momento
              </h3>
              <p className="text-ink-secondary text-sm mt-1 max-w-md mx-auto">
                Confira nosso catálogo completo com dezenas de veículos selecionados e condições especiais de negociação.
              </p>
              <Link
                href="/veiculos"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-editorial bg-obsidian text-canvas font-semibold text-xs uppercase tracking-[0.14em] hover:bg-bronze-500 transition-colors"
              >
                Explorar Veículos
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* Simulador Rápido de Financiamento */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-surface rounded-card border border-hairline overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 bg-obsidian text-canvas p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-obsidian-border">
                <div>
                  <span className="eyebrow inline-flex items-center gap-1.5 text-bronze-300 mb-3">
                    <Calculator className="w-3.5 h-3.5" />
                    Simulação Instantânea
                  </span>
                  <h2 className="text-3xl font-serif font-semibold">
                    Planeje seu financiamento com clareza
                  </h2>
                  <p className="text-[#A39D92] text-sm mt-3 leading-relaxed">
                    Ajuste o valor de referência, entrada ou usado na troca e prazo desejado para estimar as parcelas antes de conversar com a loja.
                  </p>
                </div>

                <div className="mt-8 p-6 rounded-editorial border border-obsidian-border bg-obsidian-soft">
                  <span className="eyebrow text-[#A39D92]">
                    Parcela mensal estimada
                  </span>
                  <div className="text-4xl font-serif font-bold tabular-nums text-bronze-300 mt-1.5">
                    {formatarPreco(Math.round(parcelaEstimada))}
                    <span className="text-sm font-sans font-normal text-[#A39D92]">
                      /mês
                    </span>
                  </div>
                  <p className="text-xs text-[#8C867B] mt-2 tabular-nums">
                    Valor financiado: {formatarPreco(valorFinanciado)} em {parcelasSim}x (taxa referencial 1,49% a.m.)
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 p-8 sm:p-10 space-y-7">
                <div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-3">
                    <span>Valor do Veículo</span>
                    <span className="text-base font-serif font-bold tabular-nums text-ink">
                      {formatarPreco(valorVeiculoSim)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40000}
                    max={400000}
                    step={5000}
                    value={valorVeiculoSim}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setValorVeiculoSim(val);
                      if (entradaSim >= val) setEntradaSim(Math.round(val * 0.2));
                    }}
                    className="w-full accent-obsidian cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-3">
                    <span>Entrada (ou usado na troca)</span>
                    <span className="text-base font-serif font-bold tabular-nums text-ink">
                      {formatarPreco(entradaSim)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(10000, valorVeiculoSim - 10000)}
                    step={2000}
                    value={entradaSim}
                    onChange={(e) => setEntradaSim(Number(e.target.value))}
                    className="w-full accent-bronze-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-3">
                    Prazo de Pagamento
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {[12, 24, 36, 48, 60].map((prazo) => (
                      <button
                        key={prazo}
                        type="button"
                        onClick={() => setParcelasSim(prazo)}
                        className={`py-2.5 rounded-editorial text-xs font-semibold tabular-nums border transition-colors ${
                          parcelasSim === prazo
                            ? 'bg-obsidian text-canvas border-obsidian'
                            : 'bg-canvas text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                        }`}
                      >
                        {prazo}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Sparkles className="w-3.5 h-3.5 text-bronze-500 shrink-0" />
                    <span>Valores ilustrativos sujeitos à análise de crédito.</span>
                  </div>
                  <Link
                    href="/veiculos"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                  >
                    Ver carros nesta faixa
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
