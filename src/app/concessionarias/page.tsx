'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Search,
  Building2,
  Car,
  Calendar,
  X,
  Loader2,
  ArrowRight,
  Award,
} from 'lucide-react';

interface LojaPublica {
  id: string;
  nome: string;
  descricao?: string | null;
  logoUrl?: string | null;
  endereco?: string;
  cidade: string;
  estado: string;
  cep?: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  horarioFuncionamento?: string | null;
  plano: string;
  totalVeiculos?: number;
}

export default function ConcessionariasPage() {
  const [lojas, setLojas] = useState<LojaPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');

  const [lojaSelecionada, setLojaSelecionada] = useState<LojaPublica | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataPreferida, setDataPreferida] = useState('');
  const [horarioPreferido, setHorarioPreferido] = useState('10:00');
  const [veiculoInfo, setVeiculoInfo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregarLojas() {
      try {
        const res = await fetch('/api/lojas');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setLojas(json.data);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar lojas:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarLojas();
  }, []);

  const estadosDisponiveis = useMemo(() => {
    const set = new Set(lojas.map((l) => l.estado).filter(Boolean));
    return ['TODOS', ...Array.from(set).sort()];
  }, [lojas]);

  const lojasFiltradas = useMemo(() => {
    return lojas.filter((loja) => {
      const matchEstado =
        estadoFiltro === 'TODOS' || loja.estado === estadoFiltro;
      const termo = busca.trim().toLowerCase();
      const matchBusca =
        !termo ||
        loja.nome.toLowerCase().includes(termo) ||
        loja.cidade.toLowerCase().includes(termo) ||
        (loja.endereco && loja.endereco.toLowerCase().includes(termo));
      return matchEstado && matchBusca;
    });
  }, [lojas, busca, estadoFiltro]);

  const handleAgendarTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaSelecionada) return;

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
          tipo: 'TEST_DRIVE',
          lojaId: lojaSelecionada.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao agendar visita.');
      }

      toast.success(
        `Visita agendada na ${lojaSelecionada.nome}! Aguarde a confirmação.`
      );
      setLojaSelecionada(null);
      setNome('');
      setEmail('');
      setTelefone('');
      setDataPreferida('');
      setVeiculoInfo('');
      setObservacoes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao agendar visita.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1">
        {/* Hero Obsidian */}
        <section className="border-b border-obsidian-border bg-obsidian text-canvas py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="eyebrow inline-flex items-center gap-2 text-bronze-300 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                Showroom &amp; Unidades de Atendimento
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif font-semibold leading-tight">
                Nosso Showroom &amp; Contato
              </h1>
              <p className="text-[#B8B2A6] text-base sm:text-lg mt-4 leading-relaxed">
                Visite nosso showroom presencialmente, conheça os exemplares disponíveis e agende seu test drive ou avaliação com nossos consultores.
              </p>
            </div>

            {/* Barra de Busca Editorial */}
            <div className="mt-9 bg-surface rounded-card p-3 border border-hairline flex flex-col sm:flex-row gap-3 text-ink">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome da loja, cidade ou endereço..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-editorial bg-canvas border border-hairline text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {estadosDisponiveis.map((uf) => (
                  <button
                    key={uf}
                    type="button"
                    onClick={() => setEstadoFiltro(uf)}
                    className={`px-4 py-2.5 rounded-editorial text-xs font-semibold uppercase tracking-[0.12em] border transition-colors shrink-0 ${
                      estadoFiltro === uf
                        ? 'bg-obsidian text-canvas border-obsidian'
                        : 'bg-canvas text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                    }`}
                  >
                    {uf === 'TODOS' ? 'Todos' : uf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Lista de Lojas */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card h-80 border border-hairline animate-pulse"
                />
              ))}
            </div>
          ) : lojasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lojasFiltradas.map((loja) => {
                const whatsappLimpo = loja.whatsapp.replace(/\D/g, '');
                const waUrl = `https://wa.me/${whatsappLimpo}?text=${encodeURIComponent(
                  `Olá! Vi a loja ${loja.nome} no AutoMarket e gostaria de falar com um consultor.`
                )}`;

                return (
                  <div
                    key={loja.id}
                    className="bg-surface rounded-card p-6 border border-hairline transition-colors duration-300 hover:border-[#ABA394] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-editorial bg-obsidian text-bronze-300 border border-obsidian-border flex items-center justify-center shrink-0 overflow-hidden">
                            {loja.logoUrl ? (
                              <img
                                src={loja.logoUrl}
                                alt={loja.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <span className="eyebrow inline-flex items-center gap-1 text-bronze-600">
                              <Award className="w-3 h-3" />
                              Plano {loja.plano}
                            </span>
                            <h2 className="text-2xl font-serif font-semibold text-ink">
                              {loja.nome}
                            </h2>
                          </div>
                        </div>
                      </div>

                      {loja.descricao && (
                        <p className="text-sm text-ink-secondary mb-4 line-clamp-2 leading-relaxed">
                          {loja.descricao}
                        </p>
                      )}

                      <div className="space-y-2.5 text-xs text-ink-secondary pt-4 border-t border-hairline">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-3.5 h-3.5 text-bronze-500 shrink-0 mt-0.5" />
                          <span>
                            {loja.endereco ? `${loja.endereco}, ` : ''}
                            {loja.cidade} - {loja.estado}
                            {loja.cep ? ` (CEP: ${loja.cep})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-3.5 h-3.5 text-bronze-500 shrink-0" />
                          <span className="tabular-nums">{loja.telefone}</span>
                        </div>
                        {loja.horarioFuncionamento && (
                          <div className="flex items-start gap-2.5">
                            <Clock className="w-3.5 h-3.5 text-bronze-500 shrink-0 mt-0.5" />
                            <span>{loja.horarioFuncionamento}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 pt-1">
                          <Car className="w-3.5 h-3.5 text-bronze-500 shrink-0" />
                          <span className="font-semibold text-ink tabular-nums">
                            {loja.totalVeiculos ?? 0} veículos disponíveis em estoque
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-hairline space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setLojaSelecionada(loja)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 text-bronze-300" />
                        Agendar Visita / Test Drive
                      </button>

                      <div className="grid grid-cols-2 gap-2.5">
                        <Link
                          href={`/veiculos?lojaId=${loja.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-editorial border border-hairline bg-canvas hover:border-ink text-ink font-semibold text-xs uppercase tracking-wider transition-colors"
                        >
                          Ver Estoque
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-editorial bg-sage-700 hover:bg-sage-800 text-canvas font-semibold text-xs uppercase tracking-wider transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface rounded-card p-12 text-center border border-hairline">
              <Building2 className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <h3 className="text-2xl font-serif font-semibold text-ink">
                Nenhuma loja encontrada
              </h3>
              <p className="text-sm text-ink-secondary mt-1">
                Tente buscar por outra cidade ou limpar os filtros.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Modal Agendar Test Drive */}
      {lojaSelecionada && (
        <div className="fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-hairline max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-obsidian-border bg-obsidian px-6 py-5 text-canvas">
              <div>
                <span className="eyebrow text-bronze-300">Agendamento Presencial</span>
                <h3 className="text-2xl font-serif font-semibold mt-1">
                  Visita em {lojaSelecionada.nome}
                </h3>
                <p className="text-xs text-[#A39D92] mt-0.5">
                  {lojaSelecionada.cidade}/{lojaSelecionada.estado}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLojaSelecionada(null)}
                className="p-1.5 rounded-editorial border border-obsidian-border text-[#A39D92] hover:border-bronze-400 hover:text-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAgendarTestDrive} className="p-6 space-y-4">
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
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:30">11:30</option>
                    <option value="14:00">14:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:30">17:30</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                  Modelo de Interesse (opcional)
                </label>
                <input
                  type="text"
                  value={veiculoInfo}
                  onChange={(e) => setVeiculoInfo(e.target.value)}
                  placeholder="Ex: Toyota Corolla XEi 2024"
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
                  placeholder="Gostaria de avaliar meu carro usado na troca..."
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setLojaSelecionada(null)}
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
