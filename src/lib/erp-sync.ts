// ═══════════════════════════════════════════════════════════
// Pilar 2: Camada de Integração Externa (ERP / DMS Sync)
// Sincroniza automaticamente o catálogo de veículos a partir
// do sistema de gestão que o cliente já utiliza (DealerNet,
// AutoAvaliar, Linx, Syonet ou ERP próprio), evitando duplo
// cadastro e espelhando os dados no Strapi CMS + Banco Local.
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { isStrapiConfigured, strapiUpsertVeiculo } from '@/lib/strapi';
import { processStrapiSocialWebhook } from '@/lib/social-automation';
import type {
  ERPSyncEventType,
  ERPSyncLogEntry,
  ERPVehicleItem,
  ERPWebhookPayload,
} from '@/types/index';

const ERP_WEBHOOK_SECRET =
  process.env.ERP_WEBHOOK_SECRET || 'erp-sync-secret-2026';

// Histórico em memória das últimas sincronizações de ERP
const erpSyncHistory: ERPSyncLogEntry[] = [];

// ─── Validação de Segurança (Secret ou HMAC-SHA256) ───────
export function verifyErpWebhookSignature(
  rawBody: string,
  secretHeader?: string | null,
  hmacHeader?: string | null
): boolean {
  if (!process.env.ERP_WEBHOOK_SECRET) {
    // Em ambiente local/demo sem variável forçada, aceita o segredo padrão ou chamada de teste do painel
    if (!secretHeader && !hmacHeader) return true;
    if (secretHeader === ERP_WEBHOOK_SECRET || secretHeader === 'demo-erp-sync') {
      return true;
    }
  }

  if (secretHeader && secretHeader === ERP_WEBHOOK_SECRET) {
    return true;
  }

  if (hmacHeader) {
    const cleanSignature = hmacHeader.replace(/^sha256=/i, '');
    const expectedHmac = crypto
      .createHmac('sha256', ERP_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature),
        Buffer.from(expectedHmac)
      );
    } catch {
      return false;
    }
  }

  return false;
}

// ─── Normalizadores de Campos vindos de ERPs Automotivos ──
function normalizeCambio(raw?: string): string {
  const val = (raw || '').toUpperCase();
  if (val.includes('CVT')) return 'CVT';
  if (val.includes('MAN')) return 'MANUAL';
  if (val.includes('SEMI') || val.includes('AUTOMATIZADO')) return 'AUTOMATIZADO';
  return 'AUTOMATICO';
}

function normalizeCombustivel(raw?: string): string {
  const val = (raw || '').toUpperCase();
  if (val.includes('DIESEL')) return 'DIESEL';
  if (val.includes('ELETR') || val.includes('EV')) return 'ELETRICO';
  if (val.includes('HIBR') || val.includes('HYBRID')) return 'HIBRIDO';
  if (val.includes('GAS')) return 'GASOLINA';
  return 'FLEX';
}

function normalizeCategoria(raw?: string): string {
  const val = (raw || '').toUpperCase();
  if (val.includes('PICAPE') || val.includes('PICKUP')) return 'PICAPE';
  if (val.includes('SEDAN') || val.includes('SEDÃ')) return 'SEDAN';
  if (val.includes('HATCH')) return 'HATCH';
  if (val.includes('ESPORT') || val.includes('COUPE')) return 'ESPORTIVO';
  return 'SUV';
}

// ─── Processamento Principal do Webhook de ERP ────────────
export async function executeErpCatalogSync(
  payload: ERPWebhookPayload
): Promise<{
  log: ERPSyncLogEntry;
  syncedVehicles: Record<string, unknown>[];
}> {
  const items: ERPVehicleItem[] = Array.isArray(payload.data)
    ? payload.data
    : [payload.data];

  const event: ERPSyncEventType = payload.event || 'vehicle.upsert';
  const sourceErp = payload.sourceErp || 'ERP_EXTERNO';

  // Localiza a loja principal (ou pelo CNPJ informado pelo ERP)
  const cleanCnpj = payload.lojaCnpj ? payload.lojaCnpj.replace(/\D/g, '') : '';
  const loja =
    (cleanCnpj
      ? await prisma.loja.findUnique({ where: { cnpj: cleanCnpj } })
      : null) || (await prisma.loja.findFirst({ where: { ativo: true } }));

  if (!loja) {
    throw new Error('Nenhuma loja ativa encontrada para vincular a sincronização do ERP.');
  }

  let createdCount = 0;
  let updatedCount = 0;
  let soldCount = 0;
  let syncedToStrapi = false;
  const syncedVehicles: Record<string, unknown>[] = [];

  for (const item of items) {
    if (!item || !item.marca || !item.modelo) continue;

    const finalPlaca =
      item.finalPlaca ||
      (item.placa ? item.placa.replace(/[^a-zA-Z0-9]/g, '').slice(-1) : null);

    // Tenta localizar veículo já sincronizado anteriormente (evita duplicidade)
    const existente = await prisma.veiculo.findFirst({
      where: {
        lojaId: loja.id,
        marca: item.marca,
        modelo: item.modelo,
        ano: Number(item.ano || new Date().getFullYear()),
        ...(finalPlaca ? { finalPlaca } : {}),
      },
    });

    // 1. Caso seja evento de baixa de venda ou exclusão no ERP
    if (event === 'vehicle.sold' || item.vendido === true) {
      if (existente) {
        const vendido = await prisma.veiculo.update({
          where: { id: existente.id },
          data: {
            vendido: true,
            dataVenda: new Date(),
            valorVenda: item.precoPromocional || item.preco || existente.preco,
            vendidoPorNome: item.vendedorResponsavel || `Sync ${sourceErp}`,
          },
        });
        soldCount += 1;
        syncedVehicles.push(vendido);

        if (isStrapiConfigured()) {
          await strapiUpsertVeiculo(
            {
              ...vendido,
              externalErpId: item.externalErpId,
            },
            existente.id
          );
          syncedToStrapi = true;
        }
      }
      continue;
    }

    if (event === 'vehicle.delete') {
      if (existente) {
        const inativado = await prisma.veiculo.update({
          where: { id: existente.id },
          data: { ativo: false },
        });
        updatedCount += 1;
        syncedVehicles.push(inativado);
      }
      continue;
    }

    // 2. Evento de Cadastro ou Atualização de Estoque (Upsert)
    const imagensArray = Array.isArray(item.imagens)
      ? item.imagens.filter(Boolean)
      : item.imagemPrincipal
      ? [item.imagemPrincipal]
      : [];

    const imagemPrincipal =
      item.imagemPrincipal ||
      imagensArray[0] ||
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2020_Toyota_Corolla_Hybrid_%28MZEA12R%29_Ascent_Sport_hatchback_%282020-11-04%29_01.jpg/960px-2020_Toyota_Corolla_Hybrid_%28MZEA12R%29_Ascent_Sport_hatchback_%282020-11-04%29_01.jpg';

    const dadosNormalizados = {
      marca: item.marca.trim(),
      modelo: item.modelo.trim(),
      versao: item.versao?.trim() || null,
      ano: Number(item.ano || new Date().getFullYear()),
      anoModelo: Number(item.anoModelo || item.ano || new Date().getFullYear()),
      km: Number(item.km ?? 0),
      cambio: normalizeCambio(item.cambio),
      combustivel: normalizeCombustivel(item.combustivel),
      categoria: normalizeCategoria(item.categoria),
      cor: item.cor || 'Preto',
      portas: Number(item.portas || 4),
      motor: item.motor || null,
      potencia: item.potencia || null,
      finalPlaca,
      preco: Number(item.preco || 100000),
      precoPromocional:
        item.precoPromocional !== undefined ? item.precoPromocional : null,
      precoCusto:
        item.precoCusto !== undefined && item.precoCusto !== null
          ? Number(item.precoCusto)
          : Math.round(Number(item.preco || 100000) * 0.82),
      destaque: Boolean(item.destaque),
      vendido: false,
      imagemPrincipal,
      imagens:
        imagensArray.length > 0 ? JSON.stringify(imagensArray) : JSON.stringify([imagemPrincipal]),
      descricao:
        item.descricao ||
        `Veículo sincronizado automaticamente via integração ${sourceErp} (ID Externo: ${item.externalErpId}). Periciado e disponível no showroom.`,
      opcionais: Array.isArray(item.opcionais)
        ? JSON.stringify(item.opcionais)
        : JSON.stringify([
            'Central Multimídia',
            'Câmera de Ré',
            'Ar-Condicionado Digital',
            'Laudo Cautelar Aprovado',
          ]),
      cadastradoPorNome: item.vendedorResponsavel || `Integração ${sourceErp}`,
      ativo: true,
      lojaId: loja.id,
    };

    let registroFinal;
    let isNovo = false;

    if (existente) {
      registroFinal = await prisma.veiculo.update({
        where: { id: existente.id },
        data: dadosNormalizados,
      });
      updatedCount += 1;
    } else {
      registroFinal = await prisma.veiculo.create({
        data: dadosNormalizados,
      });
      createdCount += 1;
      isNovo = true;
    }

    syncedVehicles.push(registroFinal);

    // Espelha imediatamente para o servidor Strapi CMS se configurado
    if (isStrapiConfigured()) {
      const strapiRes = await strapiUpsertVeiculo(
        {
          ...dadosNormalizados,
          externalErpId: item.externalErpId,
        },
        existente?.id
      );
      if (strapiRes) {
        syncedToStrapi = true;
      }
    }

    // Dispara também a automação de posts para redes sociais ao criar ou atualizar oferta via ERP
    await processStrapiSocialWebhook({
      event: isNovo ? 'entry.create' : 'entry.update',
      model: 'api::veiculo.veiculo',
      entry: registroFinal as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    });
  }

  const logEntry: ERPSyncLogEntry = {
    id: `erp_sync_${Date.now()}`,
    timestamp: new Date().toISOString(),
    event,
    sourceErp,
    processedCount: items.length,
    createdCount,
    updatedCount,
    soldCount,
    syncedToStrapi,
    status: 'SUCCESS',
    summary: `Sincronização ${sourceErp}: ${createdCount} criado(s), ${updatedCount} atualizado(s), ${soldCount} baixado(s) como vendido(s).`,
  };

  erpSyncHistory.unshift(logEntry);
  if (erpSyncHistory.length > 25) {
    erpSyncHistory.length = 25;
  }

  return {
    log: logEntry,
    syncedVehicles,
  };
}

export function getErpSyncHistory(): ERPSyncLogEntry[] {
  return erpSyncHistory;
}
