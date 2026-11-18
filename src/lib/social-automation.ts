// ═══════════════════════════════════════════════════════════
// Pilar 4: Automação de Posts para Redes Sociais (Strapi Webhooks)
// Processa gatilhos entry.create, entry.update e entry.publish
// do Strapi CMS, formata copy editorial (Instagram, Reels,
// Facebook e Status do WhatsApp) e dispara para fluxos externos.
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto';
import { normalizeStrapiVeiculo } from '@/lib/strapi';
import type {
  SocialMediaPostPackage,
  StrapiWebhookEvent,
  StrapiWebhookPayload,
  Veiculo,
} from '@/types/index';

const SOCIAL_AUTOMATION_WEBHOOK_URL =
  process.env.SOCIAL_AUTOMATION_WEBHOOK_URL || '';

const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://caiobpq.github.io/marketplace'
).replace(/\/+$/, '');

// Histórico em memória dos últimos pacotes de postagem gerados
const socialPostHistory: SocialMediaPostPackage[] = [];

// Verificação estrita Fail-Closed com comparação em tempo constante (timingSafeEqual)
export function verifyStrapiWebhookToken(tokenHeader?: string | null): boolean {
  const secret = process.env.STRAPI_WEBHOOK_SECRET;
  if (!secret || secret.length < 16 || !tokenHeader) {
    return false;
  }

  const receivedBuf = Buffer.from(tokenHeader, 'utf8');
  const expectedBuf = Buffer.from(secret, 'utf8');

  if (receivedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function extractMediaUrls(veiculo: Veiculo): string[] {
  const urls: string[] = [];
  if (veiculo.imagemPrincipal && isSafeHttpUrl(veiculo.imagemPrincipal)) {
    urls.push(veiculo.imagemPrincipal);
  }
  if (veiculo.imagens) {
    try {
      const parsed = JSON.parse(veiculo.imagens);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            typeof item === 'string' &&
            item &&
            isSafeHttpUrl(item) &&
            !urls.includes(item)
          ) {
            urls.push(item);
          }
        }
      }
    } catch {
      // ignora JSON inválido
    }
  }
  return urls;
}

export function buildSocialMediaPostPackage(
  veiculo: Veiculo,
  eventoOrigem: StrapiWebhookEvent = 'entry.create'
): SocialMediaPostPackage {
  const isOferta =
    Boolean(veiculo.precoPromocional) &&
    Number(veiculo.precoPromocional) < veiculo.preco;
  const precoExibicao = isOferta
    ? Number(veiculo.precoPromocional)
    : veiculo.preco;
  const precoFormatado = formatBRL(precoExibicao);
  const precoOriginalFormatado = formatBRL(veiculo.preco);

  const tituloVeiculo = `${veiculo.marca} ${veiculo.modelo}${
    veiculo.versao ? ` ${veiculo.versao}` : ''
  } (${veiculo.ano}/${veiculo.anoModelo || veiculo.ano})`;

  const kmFormatado =
    veiculo.km === 0
      ? '0 km'
      : `${new Intl.NumberFormat('pt-BR').format(veiculo.km)} km`;

  const marcaTag = `#${veiculo.marca.replace(/[^a-zA-Z0-9]/g, '')}`;
  const modeloTag = `#${veiculo.modelo.replace(/[^a-zA-Z0-9]/g, '')}`;
  const categoriaTag = `#${(veiculo.categoria || 'Seminovo').replace(/[^a-zA-Z0-9]/g, '')}`;

  const hashtags = [
    marcaTag,
    modeloTag,
    categoriaTag,
    '#AutoMarket',
    '#CuradoriaAutomotiva',
    '#SeminovosPericiados',
    '#CarrosPremium',
    isOferta ? '#OfertaEspecial' : '#NovoNoEstoque',
  ];

  const linkAnuncio = `${PUBLIC_SITE_URL}/veiculos/${encodeURIComponent(veiculo.id)}`;
  const mediaUrls = extractMediaUrls(veiculo);

  const headerHook =
    eventoOrigem === 'entry.update' && isOferta
      ? `✨ CONDIÇÃO ESPECIAL ATUALIZADA NO SHOWROOM`
      : `🏛️ NOVA ENTRADA NA CURADORIA AUTOMARKET`;

  const blocoPreco = isOferta
    ? `De ${precoOriginalFormatado} por apenas ${precoFormatado}`
    : `Investimento: ${precoFormatado}`;

  const instagramFeedCaption = [
    headerHook,
    '',
    `🚘 ${tituloVeiculo}`,
    '',
    `• Quilometragem: ${kmFormatado}`,
    `• Câmbio: ${veiculo.cambio}`,
    `• Combustível: ${veiculo.combustivel}`,
    veiculo.cor ? `• Cor: ${veiculo.cor}` : null,
    veiculo.motor ? `• Motorização: ${veiculo.motor}` : null,
    '',
    `💎 ${blocoPreco}`,
    '✔️ Laudo cautelar 100% aprovado, garantia e simulação imediata.',
    '',
    `📲 Atendimento direto via WhatsApp: +55 (27) 99834-5027`,
    `🔗 Veja todas as fotos no site: ${linkAnuncio}`,
    '',
    hashtags.join(' '),
  ]
    .filter((line) => line !== null)
    .join('\n');

  const storiesReelsCaption = `${
    isOferta ? '🔥 OFERTA:' : '🚘 NOVO NO ESTOQUE:'
  } ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano} • ${kmFormatado} • ${precoFormatado}. Toque no link para simular financiamento ou chamar no WhatsApp!`;

  const whatsappStatusText = `*${veiculo.marca} ${veiculo.modelo} ${
    veiculo.ano
  }* (${kmFormatado} • ${veiculo.cambio})\n💰 *${precoFormatado}*\n👉 Fotos e detalhes: ${linkAnuncio}`;

  return {
    id: `social_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    veiculoId: veiculo.id,
    eventoOrigem,
    tituloVeiculo,
    precoFormatado,
    instagramFeedCaption,
    storiesReelsCaption,
    whatsappStatusText,
    hashtags,
    mediaUrls,
    linkAnuncio,
    dispatchedToWebhook: false,
    externalWebhookStatus: SOCIAL_AUTOMATION_WEBHOOK_URL
      ? 'PENDING'
      : 'READY_FOR_WEBHOOK_CONNECTOR',
    createdAt: new Date().toISOString(),
  };
}

export async function processStrapiSocialWebhook(
  payload: StrapiWebhookPayload
): Promise<SocialMediaPostPackage> {
  const veiculo = normalizeStrapiVeiculo(payload.entry);
  const postPackage = buildSocialMediaPostPackage(veiculo, payload.event);

  if (SOCIAL_AUTOMATION_WEBHOOK_URL && isSafeHttpUrl(SOCIAL_AUTOMATION_WEBHOOK_URL)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(SOCIAL_AUTOMATION_WEBHOOK_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-AutoMarket-Event': payload.event,
        },
        body: JSON.stringify(postPackage),
      });
      postPackage.dispatchedToWebhook = response.ok;
      postPackage.externalWebhookStatus = response.ok
        ? `DISPATCHED_HTTP_${response.status}`
        : `WEBHOOK_ERROR_HTTP_${response.status}`;
    } catch {
      postPackage.dispatchedToWebhook = false;
      postPackage.externalWebhookStatus = 'WEBHOOK_TIMEOUT_OR_OFFLINE';
    } finally {
      clearTimeout(timer);
    }
  }

  socialPostHistory.unshift(postPackage);
  if (socialPostHistory.length > 25) {
    socialPostHistory.length = 25;
  }

  return postPackage;
}

export function getSocialAutomationHistory(): SocialMediaPostPackage[] {
  return socialPostHistory;
}
