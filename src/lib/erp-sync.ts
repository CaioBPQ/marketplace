// ═══════════════════════════════════════════════════════════
// Pilar 2: Camada de Integração Externa (ERP / DMS Sync)
// Sincroniza automaticamente o catálogo de veículos a partir
// do sistema de gestão utilizado pela concessionária.
// Autenticação estrita Fail-Closed + Validação Zod de payload.
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isStrapiConfigured, strapiUpsertVeiculo } from '@/lib/strapi';
import { processStrapiSocialWebhook } from '@/lib/social-automation';
import { sanitizeString } from '@/lib/security';
import type {
  ERPSyncEventType,
  ERPSyncLogEntry,
  ERPVehicleItem,
  ERPWebhookPayload,
} from '@/types/index';

// Histórico em memória das últimas sincronizações de ERP
const erpSyncHistory: ERPSyncLogEntry[] = [];

const safeHttpImageUrlSchema = z
  .string()
  .max(2048)
  .refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }, 'URL de imagem do ERP inválida');

const erpVehicleItemSchema = z.object({
  externalErpId: z.string().min(1).max(120),
  placa: z.string().max(15).optional(),
  chassi: z.string().max(30).optional(),
  marca: z.string().min(1).max(60),
  modelo: z.string().min(1).max(100),
  versao: z.string().max(120).optional(),
  ano: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2),
  anoModelo: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  km: z.coerce.number().int().min(0).max(999999).default(0),
  cambio: z.string().max(40).default('AUTOMATICO'),
  combustivel: z.string().max(40).default('FLEX'),
  categoria: z.string().max(40).default('SUV'),
  cor: z.string().max(40).optional(),
  portas: z.coerce.number().int().min(2).max(6).optional(),
  motor: z.string().max(40).optional(),
  potencia: z.string().max(30).optional(),
  finalPlaca: z.string().max(2).optional(),
  preco: z.coerce.number().positive(),
  precoPromocional: z.coerce.number().positive().nullable().optional(),
  precoCusto: z.coerce.number().nonnegative().nullable().optional(),
  destaque: z.boolean().optional(),
  vendido: z.boolean().optional(),
  imagemPrincipal: safeHttpImageUrlSchema.optional(),
  imagens: z.array(safeHttpImageUrlSchema).max(20).optional(),
  descricao: z.string().max(5000).optional(),
  opcionais: z.array(z.string().max(120)).max(60).optional(),
  vendedorResponsavel: z.string().max(100).optional(),
});

export const erpWebhookPayloadSchema = z.object({
  event: z.enum(['vehicle.upsert', 'vehicle.sold', 'vehicle.delete', 'catalog.batch_sync']),
  sourceErp: z.string().min(2).max(100),
  timestamp: z.string().max(64).optional(),
  lojaCnpj: z.string().max(20).optional(),
  data: z.union([erpVehicleItemSchema, z.array(erpVehicleItemSchema).min(1).max(100)]),
});

// ─── Validação Estrita Fail-Closed (Secret ou HMAC-SHA256) ─
export function verifyErpWebhookSignature(
  rawBody: string,
  secretHeader?: string | null,
  hmacHeader?: string | null
): boolean {
  const secret = process.env.ERP_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) {
    return false;
  }

  if (secretHeader) {
    const receivedBuf = Buffer.from(secretHeader, 'utf8');
    const expectedBuf = Buffer.from(secret, 'utf8');
    if (
      receivedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      return true;
    }
  }

  if (hmacHeader) {
    const cleanSignature = hmacHeader.replace(/^sha256=/i, '');
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(cleanSignature, 'utf8');
    const expBuf = Buffer.from(expectedHmac, 'utf8');
    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return true;
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
  if (val.includes('PICAPE') || val.includes('PICKUP')) return 'PICKUP';
  if (val.includes('SEDAN') || val.includes('SEDÃ')) return 'SEDAN';
  if (val.includes('HATCH')) return 'HATCH';
  if (val.includes('ESPORT') || val.includes('COUPE')) return 'COUPE';
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
  const sourceErp = sanitizeString(payload.sourceErp || 'ERP_EXTERNO');

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

    const marcaLimpa = sanitizeString(item.marca);
    const modeloLimpo = sanitizeString(item.modelo);

    const finalPlaca =
      item.finalPlaca ||
      (item.placa ? item.placa.replace(/[^a-zA-Z0-9]/g, '').slice(-1) : null);

    // Tenta localizar veículo já sincronizado anteriormente (evita duplicidade)
    const existente = await prisma.veiculo.findFirst({
      where: {
        lojaId: loja.id,
        marca: marcaLimpa,
        modelo: modeloLimpo,
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
            valorVenda:
              item.precoPromocional && item.precoPromocional < item.preco
                ? item.precoPromocional
                : item.preco || existente.preco,
            vendidoPorNome: item.vendedorResponsavel
              ? sanitizeString(item.vendedorResponsavel)
              : `Sync ${sourceErp}`,
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
      ? item.imagens.filter((url) => safeHttpImageUrlSchema.safeParse(url).success)
      : item.imagemPrincipal && safeHttpImageUrlSchema.safeParse(item.imagemPrincipal).success
      ? [item.imagemPrincipal]
      : [];

    const imagemPrincipal =
      (item.imagemPrincipal && safeHttpImageUrlSchema.safeParse(item.imagemPrincipal).success
        ? item.imagemPrincipal
        : imagensArray[0]) ||
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2020_Toyota_Corolla_Hybrid_%28MZEA12R%29_Ascent_Sport_hatchback_%282020-11-04%29_01.jpg/960px-2020_Toyota_Corolla_Hybrid_%28MZEA12R%29_Ascent_Sport_hatchback_%282020-11-04%29_01.jpg';

    const precoBase = Number(item.preco || 100000);
    const precoPromo =
      item.precoPromocional !== undefined &&
      item.precoPromocional !== null &&
      item.precoPromocional < precoBase
        ? item.precoPromocional
        : null;

    const dadosNormalizados = {
      marca: marcaLimpa,
      modelo: modeloLimpo,
      versao: item.versao ? sanitizeString(item.versao) : null,
      ano: Number(item.ano || new Date().getFullYear()),
      anoModelo: Number(item.anoModelo || item.ano || new Date().getFullYear()),
      km: Number(item.km ?? 0),
      cambio: normalizeCambio(item.cambio),
      combustivel: normalizeCombustivel(item.combustivel),
      categoria: normalizeCategoria(item.categoria),
      cor: item.cor ? sanitizeString(item.cor) : 'Preto',
      portas: Number(item.portas || 4),
      motor: item.motor ? sanitizeString(item.motor) : null,
      potencia: item.potencia ? sanitizeString(item.potencia) : null,
      finalPlaca: finalPlaca ? sanitizeString(finalPlaca).slice(0, 1) : null,
      preco: precoBase,
      precoPromocional: precoPromo,
      precoCusto:
        item.precoCusto !== undefined && item.precoCusto !== null
          ? Number(item.precoCusto)
          : Math.round(precoBase * 0.82),
      destaque: Boolean(item.destaque),
      vendido: false,
      imagemPrincipal,
      imagens:
        imagensArray.length > 0
          ? JSON.stringify(imagensArray)
          : JSON.stringify([imagemPrincipal]),
      descricao: item.descricao
        ? sanitizeString(item.descricao)
        : `Veículo sincronizado automaticamente via integração ${sourceErp} (ID Externo: ${sanitizeString(
            item.externalErpId
          )}). Periciado e disponível no showroom.`,
      opcionais: Array.isArray(item.opcionais)
        ? JSON.stringify(item.opcionais.map((op) => sanitizeString(op)))
        : JSON.stringify([
            'Central Multimídia',
            'Câmera de Ré',
            'Ar-Condicionado Digital',
            'Laudo Cautelar Aprovado',
          ]),
      cadastradoPorNome: item.vendedorResponsavel
        ? sanitizeString(item.vendedorResponsavel)
        : `Integração ${sourceErp}`,
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
