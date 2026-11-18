'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VehicleCard from '@/components/VehicleCard';
import LeadForm, { QueroEsseCarroInline } from '@/components/LeadForm';
import { Veiculo } from '@/types';
import { formatarKM, formatarPreco, gerarLinkWhatsApp, LABELS } from '@/lib/utils';
import {
  ChevronRight,
  Calendar,
  Gauge,
  Settings2,
  Fuel,
  Car,
  Palette,
  Zap,
  DoorOpen,
  Hash,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Sparkles,
  Check,
  Building2,
  ArrowLeft,
} from 'lucide-react';

const FALLBACK_CAR_IMAGE =
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000';

export default function VeiculoDetalhesClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  const routeId = typeof params?.id === 'string' ? params.id : '';
  const id = routeId === 'item' && queryId ? queryId : routeId;

  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [semelhantes, setSemelhantes] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ativo = true;

    async function carregarDetalhes() {
      setLoading(true);
      setErro(false);
      try {
        const res = await fetch(`/api/veiculos/${id}`);
        if (!res.ok) {
          if (ativo) setErro(true);
          return;
        }
        const json = await res.json();
        if (ativo && json.success && json.data) {
          const v: Veiculo = json.data;
          setVeiculo(v);

          if (v.categoria) {
            const resSim = await fetch(
              `/api/veiculos?categoria=${v.categoria}&limite=5`
            );
            if (resSim.ok) {
              const jsonSim = await resSim.json();
              if (ativo && jsonSim.success && Array.isArray(jsonSim.data)) {
                setSemelhantes(
                  jsonSim.data.filter((item: Veiculo) => item.id !== v.id).slice(0, 4)
                );
              }
            }
          }
        } else if (ativo) {
          setErro(true);
        }
      } catch (err) {
        console.error('Erro ao buscar veículo:', err);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDetalhes();
    return () => {
      ativo = false;
    };
  }, [id]);

  const listaImagens = useMemo(() => {
    if (!veiculo) return [FALLBACK_CAR_IMAGE];
    const imgs: string[] = [];
    if (veiculo.imagemPrincipal) imgs.push(veiculo.imagemPrincipal);
    if (veiculo.imagens) {
      try {
        const parsed = JSON.parse(veiculo.imagens);
        if (Array.isArray(parsed)) {
          parsed.forEach((url) => {
            if (typeof url === 'string' && url && !imgs.includes(url)) {
              imgs.push(url);
            }
          });
        }
      } catch {
        // Ignora JSON inválido
      }
    }
    return imgs.length > 0 ? imgs : [FALLBACK_CAR_IMAGE];
  }, [veiculo]);

  const listaOpcionais = useMemo(() => {
    if (!veiculo?.opcionais) return [];
    try {
      const parsed = JSON.parse(veiculo.opcionais);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return veiculo.opcionais
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }, [veiculo]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-4 w-56 bg-stone rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-96 bg-stone rounded-card animate-pulse" />
            <div className="lg:col-span-5 h-96 bg-stone rounded-card animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (erro || !veiculo) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-surface rounded-card p-10 text-center max-w-md border border-hairline">
            <Car className="w-12 h-12 text-ink-muted mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-semibold text-ink">
              Veículo não encontrado
            </h1>
            <p className="text-ink-secondary text-sm mt-2">
              Este anúncio pode ter sido vendido ou removido do catálogo.
            </p>
            <Link
              href="/veiculos"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-editorial bg-obsidian text-canvas font-semibold text-xs uppercase tracking-[0.14em] hover:bg-bronze-500 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao estoque
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const nomeCompleto = `${veiculo.marca} ${veiculo.modelo}`;
  const precoFinal = veiculo.precoPromocional || veiculo.preco;
  const economia =
    veiculo.precoPromocional && veiculo.precoPromocional < veiculo.preco
      ? veiculo.preco - veiculo.precoPromocional
      : 0;

  const linkWhatsApp = gerarLinkWhatsApp({
    numero: veiculo.loja?.whatsapp || '5527999999999',
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    ano: veiculo.ano,
    preco: precoFinal,
    veiculoId: veiculo.id,
  });

  const especificacoes = [
    {
      label: 'Ano',
      valor: veiculo.anoModelo ? `${veiculo.ano}/${veiculo.anoModelo}` : String(veiculo.ano),
      icon: Calendar,
    },
    { label: 'Quilometragem', valor: formatarKM(veiculo.km), icon: Gauge },
    {
      label: 'Câmbio',
      valor: LABELS.cambio[veiculo.cambio] || veiculo.cambio,
      icon: Settings2,
    },
    {
      label: 'Combustível',
      valor: LABELS.combustivel[veiculo.combustivel] || veiculo.combustivel,
      icon: Fuel,
    },
    {
      label: 'Categoria',
      valor: LABELS.categoria[veiculo.categoria] || veiculo.categoria,
      icon: Car,
    },
    { label: 'Cor', valor: veiculo.cor || 'Não informada', icon: Palette },
    { label: 'Motor', valor: veiculo.motor || 'Consulte', icon: Zap },
    { label: 'Potência', valor: veiculo.potencia || 'Consulte', icon: Sparkles },
    {
      label: 'Portas',
      valor: veiculo.portas ? `${veiculo.portas} portas` : '4 portas',
      icon: DoorOpen,
    },
    {
      label: 'Placa',
      valor: veiculo.finalPlaca ? `Final ${veiculo.finalPlaca}` : 'Sob consulta',
      icon: Hash,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas pb-24 lg:pb-0">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-7 pb-4 border-b border-hairline flex-wrap">
          <Link href="/" className="hover:text-ink transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/veiculos" className="hover:text-ink transition-colors">
            Veículos
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-ink">{nomeCompleto}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-surface rounded-card p-3 border border-hairline">
              <div className="relative aspect-[16/10] rounded-editorial overflow-hidden bg-stone border border-hairline">
                <img
                  src={listaImagens[imagemAtiva] || FALLBACK_CAR_IMAGE}
                  alt={nomeCompleto}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_CAR_IMAGE;
                  }}
                  className="w-full h-full object-cover"
                />
                {veiculo.destaque && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-editorial border border-bronze-400/40 bg-obsidian/90 text-bronze-300 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
                    Destaque Curado
                  </span>
                )}
                {veiculo.vendido && (
                  <div className="absolute inset-0 bg-obsidian/75 flex items-center justify-center">
                    <span className="px-6 py-2 rounded-editorial border border-bronze-300/60 bg-obsidian text-canvas font-serif font-semibold text-2xl tracking-[0.2em] uppercase">
                      Vendido
                    </span>
                  </div>
                )}
              </div>

              {listaImagens.length > 1 && (
                <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
                  {listaImagens.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImagemAtiva(idx)}
                      className={`relative w-20 h-14 rounded-editorial overflow-hidden shrink-0 border transition-all ${
                        imagemAtiva === idx
                          ? 'border-obsidian opacity-100'
                          : 'border-hairline opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${nomeCompleto} foto ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_CAR_IMAGE;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="bg-surface rounded-card p-6 sm:p-7 border border-hairline">
              <span className="eyebrow text-bronze-600">Dossiê Técnico</span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-1 mb-5">
                Especificações do Exemplar
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-hairline border border-hairline rounded-editorial overflow-hidden">
                {especificacoes.map((spec) => {
                  const Icon = spec.icon;
                  return (
                    <div key={spec.label} className="p-3.5 bg-canvas">
                      <div className="flex items-center gap-1.5 text-ink-muted text-[11px] mb-1">
                        <Icon className="w-3.5 h-3.5 text-bronze-500" />
                        <span>{spec.label}</span>
                      </div>
                      <p className="font-semibold text-xs sm:text-sm text-ink truncate tabular-nums">
                        {spec.valor}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {listaOpcionais.length > 0 && (
              <section className="bg-surface rounded-card p-6 sm:p-7 border border-hairline">
                <span className="eyebrow text-bronze-600">Equipamentos</span>
                <h2 className="text-2xl font-serif font-semibold text-ink mt-1 mb-5">
                  Itens e Opcionais
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listaOpcionais.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-editorial bg-canvas text-ink text-xs font-medium border border-hairline"
                    >
                      <Check className="w-3 h-3 text-bronze-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-surface rounded-card p-6 sm:p-7 border border-hairline">
              <span className="eyebrow text-bronze-600">Notas do Showroom</span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-1 mb-4">
                Sobre este veículo
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed whitespace-pre-line">
                {veiculo.descricao ||
                  'Veículo com laudo cautelar aprovado, revisado e pronto para transferência imediata. Entre em contato com nossos consultores para simular financiamento ou agendar uma visita.'}
              </p>
            </section>

            <QueroEsseCarroInline
              veiculoId={veiculo.id}
              veiculoNome={nomeCompleto}
              lojaNome={veiculo.loja?.nome}
            />
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-surface rounded-card p-6 sm:p-7 border border-hairline">
              <div className="flex items-center gap-2 eyebrow text-bronze-600 mb-2">
                <span>{LABELS.categoria[veiculo.categoria] || veiculo.categoria}</span>
                <span>•</span>
                <span className="tabular-nums">{veiculo.ano}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-ink leading-tight">
                {nomeCompleto}
              </h1>
              {veiculo.versao && (
                <p className="text-ink-secondary text-sm mt-1.5">{veiculo.versao}</p>
              )}

              <div className="mt-6 pt-5 border-t border-hairline">
                {economia > 0 && (
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-sm text-ink-muted line-through tabular-nums">
                      {formatarPreco(veiculo.preco)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-editorial border border-sage-600/25 bg-sage-50 text-sage-800 text-[11px] font-semibold">
                      Economize {formatarPreco(economia)}
                    </span>
                  </div>
                )}
                <div className="text-4xl font-serif font-bold tabular-nums text-ink">
                  {formatarPreco(precoFinal)}
                </div>
                <p className="text-xs text-ink-secondary mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sage-700" />
                  Consulte condições de financiamento e avaliação de usado no showroom
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-editorial bg-sage-700 hover:bg-sage-800 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chamar no WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => setLeadModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
                >
                  Quero esse carro
                </button>
              </div>
            </div>

            {veiculo.loja && (
              <div className="bg-surface rounded-card p-6 border border-hairline">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-editorial bg-obsidian text-bronze-300 flex items-center justify-center shrink-0 overflow-hidden border border-obsidian-border">
                    {veiculo.loja.logoUrl ? (
                      <img
                        src={veiculo.loja.logoUrl}
                        alt={veiculo.loja.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="eyebrow text-bronze-600">Nosso Showroom</span>
                    <h3 className="text-xl font-serif font-semibold text-ink">
                      {veiculo.loja.nome}
                    </h3>
                    <p className="text-xs text-ink-muted">
                      {veiculo.loja.cidade} - {veiculo.loja.estado}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-ink-secondary pt-4 border-t border-hairline">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-bronze-500 shrink-0 mt-0.5" />
                    <span>
                      {veiculo.loja.endereco} — {veiculo.loja.cidade}/{veiculo.loja.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-bronze-500 shrink-0" />
                    <span className="tabular-nums">{veiculo.loja.telefone}</span>
                  </div>
                  {veiculo.loja.horarioFuncionamento && (
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-3.5 h-3.5 text-bronze-500 shrink-0 mt-0.5" />
                      <span>{veiculo.loja.horarioFuncionamento}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-between">
                  <Link
                    href="/veiculos"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-ink hover:text-bronze-600 transition-colors"
                  >
                    Ver todo o estoque →
                  </Link>
                  <Link
                    href="/concessionarias"
                    className="text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Agendar visita
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {semelhantes.length > 0 && (
          <section className="mt-16 pt-12 border-t border-hairline">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="eyebrow text-bronze-600">Curadoria Relacionada</span>
                <h2 className="text-3xl font-serif font-semibold text-ink mt-1">
                  Veículos Semelhantes
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  Outras opções na categoria {LABELS.categoria[veiculo.categoria] || veiculo.categoria}
                </p>
              </div>
              <Link
                href={`/veiculos?categoria=${veiculo.categoria}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-ink hover:text-bronze-600"
              >
                Ver mais →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {semelhantes.map((item) => (
                <VehicleCard key={item.id} vehicle={item} viewMode="grid" />
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-lg border-t border-hairline px-4 py-3 flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-ink-muted truncate">{nomeCompleto}</p>
          <p className="text-lg font-serif font-bold tabular-nums text-ink">
            {formatarPreco(precoFinal)}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-editorial bg-sage-700 text-canvas font-semibold text-[11px] uppercase tracking-wider"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setLeadModalOpen(true)}
            className="px-3.5 py-2.5 rounded-editorial bg-obsidian text-canvas font-semibold text-[11px] uppercase tracking-wider"
          >
            Tenho Interesse
          </button>
        </div>
      </div>

      <LeadForm
        veiculoId={veiculo.id}
        veiculoNome={nomeCompleto}
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
