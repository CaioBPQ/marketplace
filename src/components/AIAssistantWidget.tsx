'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  ExternalLink,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useCompanyBrand } from '@/lib/company-brand';
import type { AIChatMessage, AIChatResponse } from '@/types/index';

const INITIAL_MESSAGE: AIChatMessage = {
  id: 'welcome-ai',
  role: 'assistant',
  content:
    'Olá! Sou o Concierge IA da AutoMarket. Posso buscar veículos no nosso estoque, simular parcelas ou conectar você direto ao nosso consultor no WhatsApp.',
  createdAt: new Date().toISOString(),
  quickReplies: [
    'SUVs até R$ 150 mil',
    'Ofertas com desconto',
    'Simular financiamento',
    'Agendar revisão',
  ],
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AIAssistantWidget() {
  const pathname = usePathname();
  const brand = useCompanyBrand();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([INITIAL_MESSAGE]);
  const [sessionId] = useState(() => `sess_${Date.now()}`);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Detecta se o cliente está na página de detalhes de um veículo
  const vehicleIdMatch = pathname?.match(/^\/veiculos\/([^/]+)$/);
  const activeVehicleId = vehicleIdMatch ? vehicleIdMatch[1] : undefined;

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          vehicleContext: activeVehicleId ? { id: activeVehicleId } : null,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: AIChatResponse;
        error?: string;
      };

      if (res.ok && json.success && json.data) {
        const aiMsg: AIChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: json.data.reply,
          createdAt: new Date().toISOString(),
          suggestions: json.data.suggestions,
          whatsappHandoffUrl: json.data.whatsappHandoffUrl,
          quickReplies: json.data.quickReplies,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_err_${Date.now()}`,
            role: 'assistant',
            content:
              'Estou com instabilidade momentânea, mas você pode falar direto com nossa equipe no WhatsApp (+55 27 99834-5027).',
            whatsappHandoffUrl: 'https://wa.me/5527998345027',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          content:
            'Não consegui conectar agora. Toque abaixo para falar diretamente com um consultor humano no WhatsApp.',
          whatsappHandoffUrl: 'https://wa.me/5527998345027',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="fixed bottom-24 right-5 sm:right-6 z-50 flex flex-col items-end">
      {/* Janela do Chat IA */}
      {open && (
        <div
          role="dialog"
          aria-label={`Concierge IA ${brand.nome}`}
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[390px] h-[510px] max-h-[75vh] bg-surface border border-hairline rounded-card shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Cabeçalho */}
          <div className="bg-obsidian text-canvas px-4 py-3.5 flex items-center justify-between border-b border-obsidian-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-editorial bg-obsidian-soft border border-obsidian-border flex items-center justify-center text-bronze-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold leading-tight text-canvas">
                  Concierge IA {brand.nome}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-bronze-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Estoque & Financiamento Online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar assistente IA"
              className="p-1.5 rounded-editorial text-ink-muted hover:text-canvas hover:bg-obsidian-soft transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-canvas/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-card px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-obsidian text-canvas'
                      : 'bg-surface border border-hairline text-ink'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Mini-cards de Veículos Sugeridos pela IA */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 w-full space-y-2">
                    {msg.suggestions.map((car) => {
                      const precoFinal =
                        car.precoPromocional && car.precoPromocional < car.preco
                          ? car.precoPromocional
                          : car.preco;
                      return (
                        <Link
                          key={car.id}
                          href={`/veiculos/${car.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-editorial bg-surface border border-hairline hover:border-bronze-500 transition-colors group"
                        >
                          <div className="w-16 h-12 rounded-sm overflow-hidden bg-obsidian shrink-0">
                            {car.imagemPrincipal ? (
                              <img
                                src={car.imagemPrincipal}
                                alt={`${car.marca} ${car.modelo}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-bronze-300 text-[10px]">
                                Foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-ink truncate group-hover:text-bronze-600">
                              {car.marca} {car.modelo} {car.ano}
                            </p>
                            <p className="text-[11px] text-ink-secondary">
                              {formatBRL(precoFinal)}
                              {car.parcelaEstimada
                                ? ` • ~48x ${formatBRL(car.parcelaEstimada)}`
                                : ''}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Botão de Transbordo para WhatsApp */}
                {msg.whatsappHandoffUrl && (
                  <a
                    href={msg.whatsappHandoffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-editorial bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Continuar no WhatsApp (+55 27 99834-5027)
                  </a>
                )}

                {/* Sugestões Rápidas */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => void sendMessage(qr)}
                        className="px-2.5 py-1 rounded-editorial border border-hairline bg-surface hover:border-ink text-[11px] text-ink-secondary hover:text-ink transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-ink-secondary">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-bronze-500" />
                Consultando estoque em tempo real...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input de Mensagem */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 bg-surface border-t border-hairline flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: SUV até 150 mil ou simular..."
              className="flex-1 px-3 py-2 rounded-editorial border border-hairline bg-canvas text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar pergunta"
              className="p-2.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante Modular */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir Concierge IA AutoMarket"
        className="group inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-obsidian hover:bg-bronze-600 text-canvas border border-obsidian-border shadow-xl transition-all duration-300"
      >
        <Bot className="w-5 h-5 text-bronze-300 group-hover:text-canvas transition-colors" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] hidden sm:inline">
          {open ? 'Fechar IA' : 'Concierge IA'}
        </span>
      </button>
    </div>
  );
}
