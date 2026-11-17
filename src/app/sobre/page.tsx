import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Target,
  Eye,
  HeartHandshake,
  Leaf,
  Zap,
  ShieldCheck,
  Award,
  ArrowRight,
  Building2,
  TrendingUp,
} from 'lucide-react';

const TRAJETORIA = [
  {
    ano: '2021',
    titulo: 'Fundação e Propósito',
    desc: 'Nascimento do AutoMarket com foco em digitalizar revendas regionais e trazer transparência à compra de seminovos.',
  },
  {
    ano: '2022',
    titulo: 'Padrão de Qualidade 150 Pontos',
    desc: 'Implantação do selo de vistoria cautelar obrigatória e integração direta de estoque com grandes grupos automotivos.',
  },
  {
    ano: '2024',
    titulo: 'Ecossistema Pós-Venda & Assinatura',
    desc: 'Expansão para agendamento de revisões online, assistência 24h nacional e programa de mobilidade por assinatura.',
  },
  {
    ano: '2025+',
    titulo: 'Mobilidade Limpa e Eletrificação',
    desc: 'Meta de ampliar para 35% o catálogo com veículos híbridos e elétricos e neutralizar emissões operacionais.',
  },
];

const PARCEIROS = [
  'Premium Carros SP',
  'AutoTop Rio',
  'Lux Motors BH',
  'Banco AutoFin',
  'Rede Vistoria Certa',
  'Seguros Brasil Auto',
];

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1">
        {/* Hero Institucional Obsidian */}
        <section className="border-b border-obsidian-border bg-obsidian text-canvas py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="eyebrow text-bronze-300 mb-3 block">
                Manifesto Institucional &amp; ESG
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif font-semibold leading-tight">
                Sobre o AutoMarket
              </h1>
              <p className="text-[#B8B2A6] text-base sm:text-lg mt-4 leading-relaxed">
                Conectamos pessoas e lojas de revenda de confiança por meio de curadoria rigorosa, segurança jurídica e compromisso real com o futuro da mobilidade sustentável no Brasil.
              </p>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores em Grid 1px */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border border-hairline rounded-card overflow-hidden">
            <div className="bg-surface p-8">
              <div className="w-10 h-10 rounded-editorial bg-obsidian text-bronze-300 flex items-center justify-center mb-5">
                <Target className="w-5 h-5" />
              </div>
              <span className="eyebrow text-bronze-600">01 / Propósito</span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-1 mb-2">
                Nossa Missão
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Simplificar a compra, venda e manutenção automotiva com total transparência de histórico, preço justo e atendimento consultivo.
              </p>
            </div>

            <div className="bg-surface p-8">
              <div className="w-10 h-10 rounded-editorial bg-bronze-500 text-canvas flex items-center justify-center mb-5">
                <Eye className="w-5 h-5" />
              </div>
              <span className="eyebrow text-bronze-600">02 / Horizonte</span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-1 mb-2">
                Nossa Visão
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Ser o ecossistema automotivo digital mais confiável da América Latina, liderando a transição para veículos eletrificados e conectados.
              </p>
            </div>

            <div className="bg-surface p-8">
              <div className="w-10 h-10 rounded-editorial bg-sage-700 text-canvas flex items-center justify-center mb-5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="eyebrow text-bronze-600">03 / Princípios</span>
              <h2 className="text-2xl font-serif font-semibold text-ink mt-1 mb-2">
                Nossos Valores
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Integridade nas informações veiculares, inovação centrada no cliente, responsabilidade ambiental e parceria sólida com lojistas.
              </p>
            </div>
          </div>
        </section>

        {/* Nossa Trajetória */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow text-bronze-600">Evolução Contínua</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink mt-2">
              Nossa Trajetória
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border border-hairline rounded-card overflow-hidden">
            {TRAJETORIA.map((marco) => (
              <div key={marco.ano} className="bg-surface p-7">
                <span className="inline-block px-3 py-1 rounded-editorial bg-obsidian text-bronze-300 font-mono font-semibold text-xs mb-5">
                  {marco.ano}
                </span>
                <h3 className="font-serif font-semibold text-xl text-ink mb-2">
                  {marco.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  {marco.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ESG e Sustentabilidade */}
        <section className="bg-obsidian text-canvas py-20 border-y border-obsidian-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <span className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-3">
                  <Leaf className="w-3.5 h-3.5" />
                  Compromisso ESG
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold leading-tight">
                  Sustentabilidade, Eletrificação e Governança
                </h2>
                <p className="text-[#A39D92] mt-4 text-sm sm:text-base leading-relaxed">
                  Acreditamos que o setor automotivo precisa liderar a descarbonização e a ética comercial. Nossas diretrizes ESG guiam desde a curadoria de veículos híbridos até a segurança digital dos dados dos compradores.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-px bg-obsidian-border border border-obsidian-border rounded-card overflow-hidden">
                <div className="bg-obsidian-soft p-6">
                  <Zap className="w-6 h-6 text-bronze-300 mb-4" />
                  <h3 className="font-serif font-semibold text-xl">Frota Eletrificada</h3>
                  <p className="text-xs text-[#A39D92] mt-2 leading-relaxed">
                    Incentivo e destaque para modelos híbridos e 100% elétricos de baixa emissão de CO₂.
                  </p>
                </div>

                <div className="bg-obsidian-soft p-6">
                  <TrendingUp className="w-6 h-6 text-bronze-300 mb-4" />
                  <h3 className="font-serif font-semibold text-xl">Redução de CO₂</h3>
                  <p className="text-xs text-[#A39D92] mt-2 leading-relaxed">
                    Digitalização completa de contratos e vistorias, eliminando impressões e deslocamentos desnecessários.
                  </p>
                </div>

                <div className="bg-obsidian-soft p-6">
                  <ShieldCheck className="w-6 h-6 text-bronze-300 mb-4" />
                  <h3 className="font-serif font-semibold text-xl">Transparência</h3>
                  <p className="text-xs text-[#A39D92] mt-2 leading-relaxed">
                    Auditoria rigorosa de quilometragem, procedência e proteção de dados conforme LGPD.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parceiros & CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-10">
            <span className="eyebrow text-bronze-600">Alianças Estratégicas</span>
            <h2 className="text-3xl font-serif font-semibold text-ink mt-1">
              Ecossistema de Parceiros
            </h2>
            <p className="text-sm text-ink-secondary mt-1">
              Grupos automotivos, financeiras e certificadoras que operam com o AutoMarket
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-hairline border border-hairline rounded-card overflow-hidden mb-14">
            {PARCEIROS.map((parceiro) => (
              <div
                key={parceiro}
                className="bg-surface p-5 flex flex-col items-center justify-center text-center"
              >
                <Building2 className="w-5 h-5 text-bronze-500 mb-2" />
                <span className="text-xs font-semibold text-ink">{parceiro}</span>
              </div>
            ))}
          </div>

          <div className="bg-obsidian rounded-card border border-obsidian-border p-8 sm:p-12 text-canvas flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-2">
                <Award className="w-3.5 h-3.5" />
                Faça Parte da Rede
              </div>
              <h3 className="text-3xl font-serif font-semibold">
                Pronto para acelerar com o AutoMarket?
              </h3>
              <p className="text-[#A39D92] text-sm mt-2">
                Cadastre-se como comprador ou loja parceira em menos de 2 minutos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-editorial bg-bronze-500 hover:bg-bronze-400 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
              >
                Criar Conta Gratuita
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/veiculos"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-editorial border border-obsidian-border bg-obsidian-soft hover:border-bronze-400 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
              >
                Ver Catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
