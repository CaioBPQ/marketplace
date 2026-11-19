'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { useCompanyBrand } from '@/lib/company-brand';
import { Servico } from '@/types';
import { formatarPreco } from '@/lib/utils';
import {
  Wrench,
  ShieldAlert,
  PhoneCall,
  Car,
  CheckCircle2,
  Calendar,
  X,
  Loader2,
  Sparkles,
  Gauge,
  Truck,
  KeyRound,
  BatteryCharging,
} from 'lucide-react';

const CATEGORIAS_SERVICO = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'REVISAO', label: 'Revisão' },
  { id: 'MANUTENCAO', label: 'Manutenção' },
  { id: 'FUNILARIA', label: 'Funilaria' },
  { id: 'ACESSORIOS', label: 'Acessórios' },
  { id: 'SEGURO', label: 'Seguro' },
];

const REVISOES_TABELA = [
  {
    km: 10000,
    titulo: '10.000 km',
    valorEstimado: 599,
    duracao: '2h',
    itens: [
      'Troca de óleo sintético 0W20/5W30 e filtro de óleo',
      'Inspeção de freios, suspensão e nível de fluidos',
      'Check-up eletrônico com scanner oficial',
      'Rodízio de pneus e calibragem',
    ],
  },
  {
    km: 20000,
    titulo: '20.000 km',
    valorEstimado: 799,
    duracao: '3h',
    itens: [
      'Todos os itens da revisão de 10.000 km',
      'Troca do filtro de ar do motor e filtro de cabine',
      'Alinhamento 3D e balanceamento das 4 rodas',
      'Higienização do ar-condicionado',
    ],
  },
  {
    km: 30000,
    titulo: '30.000 km',
    valorEstimado: 949,
    duracao: '3h30',
    itens: [
      'Todos os itens anteriores + filtro de combustível',
      'Limpeza do sistema de injeção eletrônica',
      'Inspeção detalhada de pastilhas e discos de freio',
      'Teste de carga da bateria e alternador',
    ],
  },
  {
    km: 40000,
    titulo: '40.000+ km',
    valorEstimado: 1390,
    duracao: '4h30',
    itens: [
      'Revisão completa de 50 pontos críticos',
      'Substituição do fluido de freio DOT 4',
      'Troca de velas de ignição e correia auxiliar (conforme manual)',
      'Laudo técnico preventivo de segurança',
    ],
  },
];

const PLANOS_MOVE = [
  {
    nome: 'Move Urbano',
    categoria: 'Hatch / Compacto Automático',
    mensalidade: 2290,
    franquia: '1.000 km/mês',
    beneficios: ['IPVA e Licenciamento inclusos', 'Seguro completo com proteção 24h', 'Revisões programadas sem custo'],
  },
  {
    nome: 'Move Família SUV',
    categoria: 'SUV Turbo Automático',
    mensalidade: 3490,
    franquia: '1.500 km/mês',
    destaque: true,
    beneficios: ['Zero entrada e zero burocracia', 'Carro reserva garantido', 'Troca de pneus e manutenção preventiva'],
  },
  {
    nome: 'Move Executivo',
    categoria: 'Sedan Híbrido / Premium',
    mensalidade: 4890,
    franquia: '2.000 km/mês',
    beneficios: ['Renovação anual por carro atualizado', 'Gestão completa de documentação', 'Atendimento concierge dedicado'],
  },
];

export default function ServicosPage() {
  const brand = useCompanyBrand();
  const [servicos, setServicos] = useState<(Servico & { loja?: { nome: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');
  const [revisaoSelecionada, setRevisaoSelecionada] = useState(REVISOES_TABELA[0]);

  const [servicoModal, setServicoModal] = useState<Servico | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataPreferida, setDataPreferida] = useState('');
  const [horarioPreferido, setHorarioPreferido] = useState('09:00');
  const [veiculoInfo, setVeiculoInfo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregarServicos() {
      try {
        const res = await fetch('/api/servicos');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setServicos(json.data);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar serviços:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarServicos();
  }, []);

  const servicosFiltrados = useMemo(() => {
    if (categoriaAtiva === 'TODOS') return servicos;
    return servicos.filter((s) => s.categoria === categoriaAtiva);
  }, [servicos, categoriaAtiva]);

  const handleConfirmarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoModal) return;

    setEnviando(true);
    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          telefone: telefone.replace(/\D/g, ''),
          dataPreferida,
          horarioPreferido,
          veiculoInfo: veiculoInfo || undefined,
          observacoes: observacoes || undefined,
          tipo: servicoModal.categoria === 'REVISAO' ? 'REVISAO' : 'SERVICO',
          servicoId: servicoModal.id,
          lojaId: servicoModal.lojaId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao agendar serviço.');
      }

      toast.success(`Agendamento de "${servicoModal.nome}" realizado com sucesso!`);
      setServicoModal(null);
      setNome('');
      setEmail('');
      setTelefone('');
      setDataPreferida('');
      setVeiculoInfo('');
      setObservacoes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao agendar serviço.');
    } finally {
      setEnviando(false);
    }
  };

  const abrirAgendamentoRevisao = () => {
    const servicoRevisao =
      servicos.find((s) => s.categoria === 'REVISAO') || servicos[0];
    if (servicoRevisao) {
      setObservacoes(`Revisão Periódica de ${revisaoSelecionada.titulo}`);
      setServicoModal(servicoRevisao);
    } else {
      toast('Entre em contato pelo WhatsApp para agendar sua revisão.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1">
        {/* Hero Pós-Venda */}
        <section className="border-b border-obsidian-border bg-obsidian text-canvas py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-3">
                <Wrench className="w-3.5 h-3.5" />
                Ecossistema Pós-Venda {brand.nome}
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif font-semibold leading-tight">
                Serviços, Revisões &amp; Assistência
              </h1>
              <p className="text-[#B8B2A6] text-base sm:text-lg mt-4 leading-relaxed">
                Manutenção preventiva com transparência de valores, revisões periódicas programadas, suporte rodoviário 24h e mobilidade por assinatura.
              </p>
            </div>
          </div>
        </section>

        {/* Catálogo de Serviços */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 mb-10 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600">Oficinas Credenciadas</span>
              <h2 className="text-3xl font-serif font-semibold text-ink mt-1">
                Catálogo de Serviços Automotivos
              </h2>
              <p className="text-ink-secondary text-sm mt-1">
                Agende online diretamente com as lojas e oficinas parceiras.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS_SERVICO.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-3.5 py-2 rounded-editorial text-xs font-semibold uppercase tracking-wider border transition-colors ${
                    categoriaAtiva === cat.id
                      ? 'bg-obsidian text-canvas border-obsidian'
                      : 'bg-surface text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card h-64 border border-hairline animate-pulse"
                />
              ))}
            </div>
          ) : servicosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicosFiltrados.map((servico) => (
                <ServiceCard
                  key={servico.id}
                  servico={servico}
                  onAgendar={(s) => setServicoModal(s)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-card p-10 text-center border border-hairline">
              <p className="text-ink-secondary text-sm">
                Nenhum serviço encontrado nesta categoria.
              </p>
            </div>
          )}
        </section>

        {/* Revisões Periódicas */}
        <section className="bg-surface py-16 sm:py-20 border-y border-hairline">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="eyebrow inline-flex items-center gap-1.5 text-bronze-600 mb-2">
                <Gauge className="w-3.5 h-3.5" />
                Manutenção Preventiva
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink">
                Revisões Periódicas Programadas
              </h2>
              <p className="text-ink-secondary text-sm mt-2">
                Selecione a faixa de quilometragem para consultar o checklist completo e o valor sugerido.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto">
              {REVISOES_TABELA.map((rev) => (
                <button
                  key={rev.km}
                  type="button"
                  onClick={() => setRevisaoSelecionada(rev)}
                  className={`py-3 px-4 rounded-editorial font-sans font-semibold text-xs uppercase tracking-[0.12em] tabular-nums border transition-colors ${
                    revisaoSelecionada.km === rev.km
                      ? 'bg-obsidian text-canvas border-obsidian'
                      : 'bg-canvas text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                  }`}
                >
                  {rev.titulo}
                </button>
              ))}
            </div>

            <div className="max-w-4xl mx-auto bg-canvas rounded-card p-6 sm:p-8 border border-hairline flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex-1">
                <span className="eyebrow text-bronze-600">Plano de Inspeção</span>
                <h3 className="text-2xl font-serif font-semibold text-ink mt-1 mb-4">
                  Checklist Revisão {revisaoSelecionada.titulo}
                </h3>
                <ul className="space-y-2.5">
                  {revisaoSelecionada.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                      <CheckCircle2 className="w-4 h-4 text-sage-700 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full md:w-64 bg-surface rounded-card p-6 border border-hairline text-center shrink-0">
                <span className="eyebrow text-ink-muted">Preço Sugerido</span>
                <div className="text-3xl font-serif font-bold tabular-nums text-ink mt-1.5">
                  {formatarPreco(revisaoSelecionada.valorEstimado)}
                </div>
                <p className="text-xs text-ink-muted mt-1 mb-5">
                  Tempo médio: {revisaoSelecionada.duracao}
                </p>
                <button
                  type="button"
                  onClick={abrirAgendamentoRevisao}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-bronze-300" />
                  Agendar Revisão
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Assistência 24h Obsidian */}
        <section className="bg-obsidian text-canvas py-16 sm:py-20 border-b border-obsidian-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <span className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-3">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Emergência Rodoviária
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold leading-tight">
                  Assistência 24h em todo o território nacional
                </h2>
                <p className="text-[#A39D92] text-sm sm:text-base mt-3 leading-relaxed">
                  Suporte imediato a qualquer hora para imprevistos urbanos ou em viagens.
                </p>

                <a
                  href="tel:08007772424"
                  className="mt-7 inline-flex items-center gap-3 px-6 py-4 rounded-editorial bg-bronze-500 hover:bg-bronze-400 text-canvas font-mono font-semibold text-base tracking-wider transition-colors"
                >
                  <PhoneCall className="w-5 h-5" />
                  0800 777 2424
                </a>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-obsidian-border border border-obsidian-border rounded-card overflow-hidden">
                {[
                  {
                    icon: Truck,
                    titulo: 'Reboque / Guincho 24h',
                    desc: 'Remoção rápida até a oficina credenciada mais próxima sem limite de horário.',
                  },
                  {
                    icon: BatteryCharging,
                    titulo: 'Pane Elétrica ou Seca',
                    desc: 'Auxílio para partida emergencial, troca de bateria e abastecimento de emergência.',
                  },
                  {
                    icon: KeyRound,
                    titulo: 'Chaveiro Automotivo',
                    desc: 'Abertura segura do veículo em caso de perda ou trancamento acidental das chaves.',
                  },
                  {
                    icon: Car,
                    titulo: 'Troca de Pneus & Táxi',
                    desc: 'Substituição de estepe no local e transporte alternativo para você e sua família.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.titulo} className="bg-obsidian-soft p-6">
                      <Icon className="w-5 h-5 text-bronze-300 mb-3" />
                      <h3 className="font-serif text-xl font-semibold text-canvas">
                        {item.titulo}
                      </h3>
                      <p className="text-xs text-[#A39D92] mt-1.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* AutoMarket Move */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow inline-flex items-center gap-1.5 text-bronze-600 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Carro por Assinatura
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-ink">
              {brand.nome} Move: Mobilidade sem imobilizar capital
            </h2>
            <p className="text-ink-secondary text-sm mt-2">
              IPVA, seguro completo, documentação e revisões já incluídos em uma única mensalidade previsível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANOS_MOVE.map((plano) => (
              <div
                key={plano.nome}
                className={`rounded-card p-7 flex flex-col justify-between border transition-colors ${
                  plano.destaque
                    ? 'bg-obsidian text-canvas border-obsidian-border'
                    : 'bg-surface text-ink border-hairline'
                }`}
              >
                <div>
                  <span
                    className={`eyebrow ${
                      plano.destaque ? 'text-bronze-300' : 'text-bronze-600'
                    }`}
                  >
                    {plano.franquia}
                  </span>
                  <h3 className="text-2xl font-serif font-semibold mt-1.5">
                    {plano.nome}
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      plano.destaque ? 'text-[#A39D92]' : 'text-ink-secondary'
                    }`}
                  >
                    {plano.categoria}
                  </p>

                  <div
                    className={`my-6 pb-6 border-b ${
                      plano.destaque ? 'border-obsidian-border' : 'border-hairline'
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider opacity-70">
                      A partir de
                    </span>
                    <div
                      className={`text-3xl font-serif font-bold tabular-nums mt-1 ${
                        plano.destaque ? 'text-bronze-300' : 'text-ink'
                      }`}
                    >
                      {formatarPreco(plano.mensalidade)}
                      <span className="text-xs font-sans font-normal opacity-75">
                        /mês
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-sm mb-8">
                    {plano.beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plano.destaque ? 'text-bronze-300' : 'text-sage-700'
                          }`}
                        />
                        <span
                          className={
                            plano.destaque ? 'text-[#D7D1C6]' : 'text-ink-secondary'
                          }
                        >
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`https://wa.me/${(brand.whatsapp || '5527998345027').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá! Tenho interesse no programa ${brand.nome} Move - Plano ${plano.nome}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-editorial font-semibold text-xs uppercase tracking-[0.14em] transition-colors ${
                    plano.destaque
                      ? 'btn-brand-primary font-bold'
                      : 'bg-obsidian hover:bg-bronze-500 text-canvas'
                  }`}
                >
                  Consultar Disponibilidade
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal Agendar Serviço */}
      {servicoModal && (
        <div className="fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-hairline max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-obsidian-border bg-obsidian px-6 py-5 text-canvas">
              <div>
                <span className="eyebrow text-bronze-300">Agendamento de Serviço</span>
                <h3 className="text-2xl font-serif font-semibold mt-1">
                  {servicoModal.nome}
                </h3>
                {servicoModal.preco && (
                  <p className="text-xs font-medium text-bronze-300 mt-0.5 tabular-nums">
                    Valor estimado: {formatarPreco(servicoModal.precoPromocional || servicoModal.preco)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setServicoModal(null)}
                className="p-1.5 rounded-editorial border border-obsidian-border text-[#A39D92] hover:border-bronze-400 hover:text-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarAgendamento} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="11999999999"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                    Data Preferida *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataPreferida}
                    onChange={(e) => setDataPreferida(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                    Horário Preferido *
                  </label>
                  <select
                    value={horarioPreferido}
                    onChange={(e) => setHorarioPreferido(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                  >
                    <option value="08:30">08:30</option>
                    <option value="10:00">10:00</option>
                    <option value="13:30">13:30</option>
                    <option value="15:00">15:00</option>
                    <option value="16:30">16:30</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                  Seu Veículo (Marca / Modelo / Ano)
                </label>
                <input
                  type="text"
                  value={veiculoInfo}
                  onChange={(e) => setVeiculoInfo(e.target.value)}
                  placeholder="Ex: Honda Civic 2022"
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Detalhes adicionais sobre o serviço..."
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setServicoModal(null)}
                  className="px-4 py-2.5 rounded-editorial border border-hairline text-xs font-semibold uppercase tracking-wider text-ink-secondary hover:border-ink hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
