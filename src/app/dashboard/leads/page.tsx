'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lead } from '@/types';
import { formatarPreco, LABELS, STATUS_COLORS } from '@/lib/utils';
import {
  Users,
  MessageCircle,
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  Car,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'NOVO', label: 'Novos' },
  { id: 'CONTATADO', label: 'Contatados' },
  { id: 'NEGOCIANDO', label: 'Negociando' },
  { id: 'CONVERTIDO', label: 'Convertidos' },
  { id: 'PERDIDO', label: 'Perdidos' },
];

export default function DashboardLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [leadDetalhe, setLeadDetalhe] = useState<Lead | null>(null);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const carregarLeads = useCallback(async () => {
    setLoading(true);
    try {
      const query =
        statusFiltro !== 'TODOS'
          ? `?status=${statusFiltro}&limite=50`
          : '?limite=50';
      const res = await fetch(`/api/leads${query}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setLeads(json.data);
      } else {
        toast.error(json.error || 'Erro ao carregar leads.');
      }
    } catch {
      toast.error('Erro de conexão ao carregar leads.');
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  useEffect(() => {
    carregarLeads();
  }, [carregarLeads]);

  const handleAlterarStatus = async (leadId: string, novoStatus: string) => {
    setAtualizandoId(leadId);
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: leadId, status: novoStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao atualizar status.');
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: novoStatus } : l))
      );
      if (leadDetalhe?.id === leadId) {
        setLeadDetalhe((prev) => (prev ? { ...prev, status: novoStatus } : null));
      }
      toast.success('Status do lead atualizado!');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao atualizar status.'
      );
    } finally {
      setAtualizandoId(null);
    }
  };

  const gerarWhatsAppLead = (lead: Lead) => {
    const num = lead.telefone.replace(/\D/g, '');
    const numeroComDdi = num.startsWith('55') ? num : `55${num}`;
    const carro = lead.veiculo
      ? `${lead.veiculo.marca} ${lead.veiculo.modelo}`
      : 'veículo';
    return `https://wa.me/${numeroComDdi}?text=${encodeURIComponent(
      `Olá ${lead.nome}! Tudo bem? Recebemos seu interesse no ${carro} pelo AutoMarket. Como posso te ajudar?`
    )}`;
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-hairline">
        <span className="eyebrow text-bronze-600">Funil Comercial</span>
        <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
          Gerenciamento de Leads
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Acompanhe propostas, altere o estágio do funil e responda clientes pelo WhatsApp.
        </p>
      </div>

      {/* Abas de Status */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFiltro(tab.id)}
            className={`px-3.5 py-2 rounded-editorial text-xs font-semibold uppercase tracking-wider border transition-colors ${
              statusFiltro === tab.id
                ? 'bg-obsidian text-canvas border-obsidian'
                : 'bg-surface text-ink-secondary border-hairline hover:border-ink hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-surface rounded-card border border-hairline overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-stone rounded-editorial" />
            ))}
          </div>
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-canvas eyebrow text-ink-muted border-b border-hairline">
                <tr>
                  <th className="px-5 py-3.5">Data</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Veículo</th>
                  <th className="px-5 py-3.5">Contato</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-canvas/70 transition-colors">
                    <td className="px-5 py-4 text-xs tabular-nums text-ink-muted whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{lead.nome}</p>
                      <span className="text-[11px] text-ink-muted">
                        Origem: {lead.origem}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {lead.veiculo ? (
                        <div>
                          <p className="font-medium text-ink">
                            {lead.veiculo.marca} {lead.veiculo.modelo}
                          </p>
                          <p className="text-xs text-ink-muted tabular-nums">
                            {lead.veiculo.ano} • {formatarPreco(lead.veiculo.preco)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-secondary">
                      <p className="tabular-nums">{lead.telefone}</p>
                      <p className="text-ink-muted">{lead.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={lead.status}
                        disabled={atualizandoId === lead.id}
                        onChange={(e) => handleAlterarStatus(lead.id, e.target.value)}
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-editorial cursor-pointer focus:outline-none ${
                          STATUS_COLORS[lead.status] || 'bg-stone text-ink'
                        }`}
                      >
                        {Object.entries(LABELS.statusLead).map(([val, lab]) => (
                          <option key={val} value={val} className="bg-surface text-ink">
                            {lab}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={gerarWhatsAppLead(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Responder no WhatsApp"
                          className="p-2 rounded-editorial border border-sage-600/30 bg-sage-50 text-sage-800 hover:bg-sage-700 hover:text-canvas transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setLeadDetalhe(lead)}
                          title="Ver detalhes"
                          className="p-2 rounded-editorial border border-hairline bg-canvas text-ink hover:bg-obsidian hover:text-canvas transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <h3 className="text-2xl font-serif font-semibold text-ink">
              Nenhum lead encontrado
            </h3>
            <p className="text-sm text-ink-secondary mt-1">
              Quando compradores demonstrarem interesse nos seus veículos, eles aparecerão aqui.
            </p>
          </div>
        )}
      </div>

      {/* Modal Detalhes do Lead */}
      {leadDetalhe && (
        <div className="fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-hairline max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between gap-4 px-6 py-5 bg-obsidian text-canvas border-b border-obsidian-border">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-editorial text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${
                    STATUS_COLORS[leadDetalhe.status] || 'bg-stone text-ink'
                  }`}
                >
                  {LABELS.statusLead[leadDetalhe.status] || leadDetalhe.status}
                </span>
                <h3 className="text-2xl font-serif font-semibold">
                  {leadDetalhe.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLeadDetalhe(null)}
                className="p-1.5 rounded-editorial border border-obsidian-border text-[#A39D92] hover:text-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-ink-secondary text-xs">
                  <Mail className="w-4 h-4 text-bronze-500" />
                  <span className="truncate">{leadDetalhe.email}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-secondary text-xs">
                  <Phone className="w-4 h-4 text-bronze-500" />
                  <span className="tabular-nums">{leadDetalhe.telefone}</span>
                </div>
              </div>

              {leadDetalhe.veiculo && (
                <div className="p-3.5 rounded-editorial bg-canvas border border-hairline flex items-center gap-3">
                  <Car className="w-5 h-5 text-bronze-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-ink">
                      {leadDetalhe.veiculo.marca} {leadDetalhe.veiculo.modelo} (
                      {leadDetalhe.veiculo.ano})
                    </p>
                    <p className="text-xs text-bronze-600 font-semibold tabular-nums">
                      {formatarPreco(leadDetalhe.veiculo.preco)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="eyebrow text-ink-muted mb-1.5">
                  Mensagem do Interessado
                </p>
                <div className="p-4 rounded-editorial bg-canvas border border-hairline text-ink-secondary whitespace-pre-line text-xs sm:text-sm">
                  {leadDetalhe.mensagem || 'Sem mensagem adicional.'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Recebido em{' '}
                  {new Date(leadDetalhe.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
                <select
                  value={leadDetalhe.status}
                  onChange={(e) => handleAlterarStatus(leadDetalhe.id, e.target.value)}
                  className="px-3.5 py-2.5 rounded-editorial border border-hairline text-xs font-semibold bg-canvas text-ink"
                >
                  {Object.entries(LABELS.statusLead).map(([val, lab]) => (
                    <option key={val} value={val}>
                      {lab}
                    </option>
                  ))}
                </select>

                <a
                  href={gerarWhatsAppLead(leadDetalhe)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-editorial bg-sage-700 hover:bg-sage-800 text-canvas font-semibold text-xs uppercase tracking-wider transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chamar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
