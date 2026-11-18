// ═══════════════════════════════════════════════════════════
// Pilar 3: Motor de IA para Atendimento ao Cliente
// Suporta Webhook Externo (n8n / Dify / Strapi AI),
// LLM compatível com OpenAI e Motor Semântico Local conectado
// ao estoque real de veículos com simulação de financiamento
// e transbordo imediato para WhatsApp (+55 27 99834-5027).
// ═══════════════════════════════════════════════════════════

import type {
  AIChatRequest,
  AIChatResponse,
  AIChatVehicleSuggestion,
  Veiculo,
} from '@/types/index';

const WHATSAPP_COMERCIAL = '5527998345027';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function estimateInstallment(preco: number): number {
  // Simulação padrão: 30% de entrada + 48x com taxa média de 1,39% a.m.
  const principal = preco * 0.7;
  const taxa = 0.0139;
  const n = 48;
  const fator = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
  return Math.round(principal * fator);
}

function buildWhatsappUrl(summaryText: string): string {
  return `https://wa.me/${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(summaryText)}`;
}

function toSuggestion(v: Veiculo): AIChatVehicleSuggestion {
  const precoAtivo =
    v.precoPromocional && v.precoPromocional < v.preco
      ? v.precoPromocional
      : v.preco;
  return {
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    versao: v.versao,
    ano: v.ano,
    km: v.km,
    cambio: v.cambio,
    combustivel: v.combustivel,
    preco: v.preco,
    precoPromocional: v.precoPromocional,
    imagemPrincipal: v.imagemPrincipal,
    parcelaEstimada: estimateInstallment(precoAtivo),
  };
}

function extractMaxPriceFromText(text: string): number | null {
  const normalized = text.toLowerCase().replace(/\./g, '').replace(/,/g, '.');
  const milMatch = normalized.match(/(?:ate|até|menos de|maximo|máximo|por|de)\s*(?:r\$\s*)?(\d+(?:\.\d+)?)\s*(?:mil|k)/);
  if (milMatch) {
    return Number(milMatch[1]) * 1000;
  }
  const fullMatch = normalized.match(/(?:ate|até|menos de|maximo|máximo)\s*(?:r\$\s*)?(\d{5,7})/);
  if (fullMatch) {
    return Number(fullMatch[1]);
  }
  return null;
}

export function runLocalCatalogAIEngine(
  req: AIChatRequest,
  catalog: Veiculo[]
): AIChatResponse {
  const disponiveis = catalog.filter((v) => v.ativo !== false && !v.vendido);
  const lastUserMessage =
    [...req.messages].reverse().find((m) => m.role === 'user')?.content || '';
  const query = lastUserMessage.toLowerCase().trim();

  const vehicleInContext = req.vehicleContext?.id
    ? disponiveis.find((v) => v.id === req.vehicleContext?.id)
    : undefined;

  // 1. Intenção de falar com consultor humano / WhatsApp
  if (
    query.includes('whatsapp') ||
    query.includes('atendente') ||
    query.includes('vendedor') ||
    query.includes('humano') ||
    query.includes('telefone')
  ) {
    const contextLabel = vehicleInContext
      ? `${vehicleInContext.marca} ${vehicleInContext.modelo} ${vehicleInContext.ano}`
      : 'veículos do estoque';
    return {
      provider: 'LOCAL_CATALOG_ENGINE',
      reply: `Perfeito! Posso transferir você agora mesmo para nosso consultor especialista pelo WhatsApp oficial (+55 27 99834-5027) já com o resumo do seu interesse em ${contextLabel}.`,
      whatsappHandoffUrl: buildWhatsappUrl(
        `Olá! Vim pelo Concierge IA do site e gostaria de falar com um consultor sobre ${contextLabel}.`
      ),
      quickReplies: [
        'Simular financiamento',
        'Ver ofertas com desconto',
        'Agendar revisão / pós-venda',
      ],
    };
  }

  // 2. Intenção de financiamento / parcelas
  if (
    query.includes('financ') ||
    query.includes('parcela') ||
    query.includes('entrada') ||
    query.includes('simular')
  ) {
    const alvo = vehicleInContext || disponiveis[0];
    if (alvo) {
      const precoBase =
        alvo.precoPromocional && alvo.precoPromocional < alvo.preco
          ? alvo.precoPromocional
          : alvo.preco;
      const entrada = Math.round(precoBase * 0.3);
      const parcela48 = estimateInstallment(precoBase);
      return {
        provider: 'LOCAL_CATALOG_ENGINE',
        reply: `Para o ${alvo.marca} ${alvo.modelo} ${alvo.ano} (${formatBRL(
          precoBase
        )}), uma simulação padrão com 30% de entrada (${formatBRL(
          entrada
        )}) fica em torno de 48x de ${formatBRL(
          parcela48
        )} (sujeito à aprovação de crédito). Também aceitamos seu seminovo na troca!`,
        suggestions: [toSuggestion(alvo)],
        whatsappHandoffUrl: buildWhatsappUrl(
          `Olá! Gostaria de simular financiamento real para o ${alvo.marca} ${alvo.modelo} ${alvo.ano} (${formatBRL(precoBase)}).`
        ),
        quickReplies: [
          'Aceitam usado na troca?',
          'Ver SUVs até R$ 150 mil',
          'Falar no WhatsApp',
        ],
      };
    }
  }

  // 3. Intenção de revisão, oficina ou pós-venda
  if (
    query.includes('revis') ||
    query.includes('oficina') ||
    query.includes('servico') ||
    query.includes('serviço') ||
    query.includes('agendar')
  ) {
    return {
      provider: 'LOCAL_CATALOG_ENGINE',
      reply:
        'Nosso Centro de Pós-Venda realiza revisão programada, alinhamento 3D, higienização premium, estética automotiva e funilaria. Você pode agendar online na aba "Pós-Venda & Serviços" ou confirmar horário direto no WhatsApp (+55 27 99834-5027).',
      whatsappHandoffUrl: buildWhatsappUrl(
        'Olá! Gostaria de agendar uma revisão/serviço no Centro de Pós-Venda.'
      ),
      quickReplies: [
        'Ver ofertas do estoque',
        'SUVs disponíveis',
        'Falar no WhatsApp',
      ],
    };
  }

  // 4. Intenção de troca / avaliação de usado
  if (query.includes('troca') || query.includes('usado') || query.includes('avalia')) {
    return {
      provider: 'LOCAL_CATALOG_ENGINE',
      reply:
        'Aceitamos o seu veículo usado como parte do pagamento com avaliação justa baseada na Tabela Fipe e perícia técnica na hora. Envie modelo, ano e quilometragem pelo WhatsApp para receber uma pré-avaliação imediata.',
      whatsappHandoffUrl: buildWhatsappUrl(
        'Olá! Gostaria de avaliar meu carro usado para dar na troca.'
      ),
      quickReplies: [
        'Ver ofertas com desconto',
        'Simular financiamento',
        'SUVs até R$ 160 mil',
      ],
    };
  }

  // 5. Busca inteligente no catálogo por categoria, combustível, marca ou faixa de preço
  const maxPrice = extractMaxPriceFromText(query);
  const categoryKeywords: Record<string, string> = {
    suv: 'SUV',
    picape: 'PICAPE',
    caminhonete: 'PICAPE',
    sedan: 'SEDAN',
    sedã: 'SEDAN',
    hatch: 'HATCH',
    esportivo: 'ESPORTIVO',
  };

  let matchedCategory: string | null = null;
  for (const [kw, cat] of Object.entries(categoryKeywords)) {
    if (query.includes(kw)) {
      matchedCategory = cat;
      break;
    }
  }

  const wantsOferta =
    query.includes('oferta') ||
    query.includes('desconto') ||
    query.includes('promoc') ||
    query.includes('promoç');
  const wantsHybrid =
    query.includes('hibrid') || query.includes('híbrid') || query.includes('eletric');
  const wantsDiesel = query.includes('diesel') || query.includes('4x4');

  const scored = disponiveis
    .map((v) => {
      let score = 0;
      const precoEfetivo = v.precoPromocional ?? v.preco;
      const fullText = `${v.marca} ${v.modelo} ${v.versao || ''} ${v.categoria} ${v.combustivel} ${v.cambio}`.toLowerCase();

      if (matchedCategory && v.categoria === matchedCategory) score += 5;
      if (wantsOferta && v.precoPromocional && v.precoPromocional < v.preco) score += 6;
      if (wantsHybrid && (v.combustivel === 'HIBRIDO' || v.combustivel === 'ELETRICO')) score += 5;
      if (wantsDiesel && v.combustivel === 'DIESEL') score += 5;
      if (maxPrice !== null) {
        if (precoEfetivo <= maxPrice) score += 4;
        else score -= 6;
      }

      // Correspondência por palavras-chave de marca/modelo
      const tokens = query
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !['com', 'para', 'quero', 'tem', 'uma', 'ate', 'até', 'carro', 'carros'].includes(t));
      for (const token of tokens) {
        if (fullText.includes(token)) score += 4;
      }

      if (v.destaque) score += 1;
      return { veiculo: v, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected =
    scored.length > 0
      ? scored.slice(0, 3).map((s) => s.veiculo)
      : disponiveis.filter((v) => v.destaque).slice(0, 3);

  const suggestions = selected.map(toSuggestion);

  if (vehicleInContext && !query.includes('outro') && scored.length === 0) {
    const preco =
      vehicleInContext.precoPromocional ?? vehicleInContext.preco;
    return {
      provider: 'LOCAL_CATALOG_ENGINE',
      reply: `Você está vendo o ${vehicleInContext.marca} ${vehicleInContext.modelo} ${vehicleInContext.ano} (${formatBRL(
        preco
      )}, ${new Intl.NumberFormat('pt-BR').format(vehicleInContext.km)} km, câmbio ${
        vehicleInContext.cambio
      }). Posso simular parcelas, explicar a garantia ou agendar um test-drive para você!`,
      suggestions: [toSuggestion(vehicleInContext)],
      whatsappHandoffUrl: buildWhatsappUrl(
        `Olá! Tenho interesse no ${vehicleInContext.marca} ${vehicleInContext.modelo} ${vehicleInContext.ano}.`
      ),
      quickReplies: [
        'Simular financiamento',
        'Aceitam usado na troca?',
        'Agendar test-drive no WhatsApp',
      ],
    };
  }

  const intro =
    scored.length > 0
      ? `Encontrei ${suggestions.length} excelente(s) opção(ões) no nosso estoque atual que combinam com o que você procura:`
      : `Temos ${disponiveis.length} veículos selecionados e periciados em estoque. Separei estes destaques da nossa curadoria para você conferir:`;

  return {
    provider: 'LOCAL_CATALOG_ENGINE',
    reply: intro,
    suggestions,
    whatsappHandoffUrl: buildWhatsappUrl(
      `Olá! Estava conversando com o Concierge IA sobre "${
        lastUserMessage || 'veículos do estoque'
      }" e gostaria de atendimento.`
    ),
    quickReplies: [
      'SUVs até R$ 150 mil',
      'Ofertas com desconto',
      'Simular financiamento',
      'Falar no WhatsApp',
    ],
  };
}

// ─── Orquestrador Principal (Webhook Externo -> LLM -> Local) ───
export async function processAIChatRequest(
  req: AIChatRequest,
  catalog: Veiculo[]
): Promise<AIChatResponse> {
  const disponiveis = catalog.filter((v) => v.ativo !== false && !v.vendido);

  // 1. Webhook Externo de IA (n8n, Dify, Flowise ou Strapi AI Plugin)
  const externalWebhookUrl = process.env.AI_AGENT_WEBHOOK_URL;
  if (externalWebhookUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(externalWebhookUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: req.sessionId,
          messages: req.messages,
          vehicleContext: req.vehicleContext,
          catalogSummary: disponiveis.slice(0, 15).map((v) => ({
            id: v.id,
            titulo: `${v.marca} ${v.modelo} ${v.versao || ''} ${v.ano}`,
            preco: v.precoPromocional ?? v.preco,
            km: v.km,
            categoria: v.categoria,
            combustivel: v.combustivel,
          })),
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as Partial<AIChatResponse>;
        if (json.reply) {
          return {
            provider: 'STRAPI_AI_WEBHOOK',
            reply: json.reply,
            suggestions: json.suggestions,
            whatsappHandoffUrl:
              json.whatsappHandoffUrl ||
              buildWhatsappUrl('Olá! Vim pelo atendimento IA do site.'),
            quickReplies: json.quickReplies,
          };
        }
      }
    } catch {
      // Fallback para próximo provedor
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Provedor LLM OpenAI-Compatible (se AI_PROVIDER_API_KEY estiver configurada)
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (apiKey) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    try {
      const catalogContext = disponiveis
        .slice(0, 12)
        .map(
          (v) =>
            `- [${v.id}] ${v.marca} ${v.modelo} ${v.ano} | ${formatBRL(
              v.precoPromocional ?? v.preco
            )} | ${v.km} km | ${v.cambio} | ${v.combustivel}`
        )
        .join('\n');

      const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_PROVIDER_MODEL || 'gpt-4o-mini',
          temperature: 0.4,
          max_tokens: 350,
          messages: [
            {
              role: 'system',
              content: `Você é o Concierge IA da AutoMarket. Responda em português de forma elegante, objetiva e consultiva. Nunca invente carros fora do estoque abaixo. WhatsApp oficial de vendas: +55 27 99834-5027.\n\nESTOQUE ATUAL:\n${catalogContext}`,
            },
            ...req.messages.slice(-6),
          ],
        }),
      });

      if (llmRes.ok) {
        const llmJson = (await llmRes.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = llmJson.choices?.[0]?.message?.content?.trim();
        if (content) {
          const localFallback = runLocalCatalogAIEngine(req, disponiveis);
          return {
            provider: 'OPENAI_COMPATIBLE',
            reply: content,
            suggestions: localFallback.suggestions,
            whatsappHandoffUrl: localFallback.whatsappHandoffUrl,
            quickReplies: localFallback.quickReplies,
          };
        }
      }
    } catch {
      // Fallback para motor local
    } finally {
      clearTimeout(timer);
    }
  }

  // 3. Motor Semântico Local conectado ao Catálogo Real
  return runLocalCatalogAIEngine(req, disponiveis);
}
