// ═══════════════════════════════════════════════════════════
// Cliente & Adaptador Strapi Headless CMS (v4 / v5)
// Centraliza o consumo de dados da API do Strapi com
// normalização de entidades e fallback resiliente.
// ═══════════════════════════════════════════════════════════

import type {
  Loja,
  Servico,
  StrapiAuthResponse,
  StrapiCollectionResponse,
  StrapiConnectionStatus,
  StrapiEntity,
  StrapiSingleResponse,
  Veiculo,
} from '@/types/index';

export const STRAPI_BASE_URL = (
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.STRAPI_URL ||
  'http://localhost:1337'
).replace(/\/+$/, '');

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export function isStrapiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL);
}

// ─── Utilitário para resolver URLs de mídia do Strapi ─────
export function resolveStrapiMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${STRAPI_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Extrator compatível com Strapi v4 (attributes) e v5 ──
function unwrapEntity<T extends Record<string, unknown>>(
  entity: StrapiEntity<T> | Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!entity || typeof entity !== 'object') return null;
  const raw = entity as Record<string, unknown>;
  const attrs =
    raw.attributes && typeof raw.attributes === 'object'
      ? (raw.attributes as Record<string, unknown>)
      : raw;

  return {
    ...attrs,
    id: String(raw.documentId || raw.id || attrs.id || ''),
    strapiNumericId: raw.id,
  };
}

// ─── Normalizador de Loja (Strapi -> Interface Loja) ──────
export function normalizeStrapiLoja(
  rawEntity: StrapiEntity<Record<string, unknown>> | Record<string, unknown>
): Loja {
  const data = unwrapEntity(rawEntity) || {};
  return {
    id: String(data.id || 'loja-strapi-1'),
    nome: String(data.nome || 'AutoMarket Select'),
    cnpj: String(data.cnpj || '12345678000190'),
    descricao: data.descricao ? String(data.descricao) : null,
    logoUrl: resolveStrapiMediaUrl(
      typeof data.logoUrl === 'string'
        ? data.logoUrl
        : (data.logo as any)?.data?.attributes?.url || (data.logo as any)?.url
    ),
    bannerUrl: resolveStrapiMediaUrl(
      typeof data.bannerUrl === 'string'
        ? data.bannerUrl
        : (data.banner as any)?.data?.attributes?.url || (data.banner as any)?.url
    ),
    endereco: String(data.endereco || 'Av. Europa, 500'),
    cidade: String(data.cidade || 'São Paulo'),
    estado: String(data.estado || 'SP'),
    cep: String(data.cep || '01449000'),
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    telefone: String(data.telefone || '+55 27 99834-5027'),
    whatsapp: String(data.whatsapp || '5527998345027'),
    email: String(data.email || 'contato@automarket.com.br'),
    website: data.website ? String(data.website) : null,
    horarioFuncionamento: data.horarioFuncionamento
      ? String(data.horarioFuncionamento)
      : 'Seg a Sex: 8h às 19h | Sáb: 9h às 15h',
    plano: String(data.plano || 'ENTERPRISE'),
    assinaturaAtiva: data.assinaturaAtiva !== false,
    ativo: data.ativo !== false,
    userId: String(data.userId || 'strapi-admin'),
    totalVeiculos:
      typeof data.totalVeiculos === 'number' ? data.totalVeiculos : undefined,
  };
}

// ─── Normalizador de Veículo (Strapi -> Interface Veiculo) ─
export function normalizeStrapiVeiculo(
  rawEntity: StrapiEntity<Record<string, unknown>> | Record<string, unknown>
): Veiculo {
  const data = unwrapEntity(rawEntity) || {};

  // Extrai galeria de imagens caso venha como Media Field do Strapi ou JSON string
  let imagemPrincipal =
    typeof data.imagemPrincipal === 'string'
      ? resolveStrapiMediaUrl(data.imagemPrincipal)
      : resolveStrapiMediaUrl(
          (data.imagemPrincipal as any)?.data?.attributes?.url ||
            (data.imagemPrincipal as any)?.url
        );

  let imagensSerializadas: string | null = null;
  if (typeof data.imagens === 'string') {
    imagensSerializadas = data.imagens;
  } else if (Array.isArray(data.imagens)) {
    const urls = data.imagens
      .map((img: any) =>
        typeof img === 'string'
          ? resolveStrapiMediaUrl(img)
          : resolveStrapiMediaUrl(img?.attributes?.url || img?.url)
      )
      .filter(Boolean);
    imagensSerializadas = JSON.stringify(urls);
    if (!imagemPrincipal && urls.length > 0) {
      imagemPrincipal = urls[0] || null;
    }
  } else if ((data.galeria as any)?.data && Array.isArray((data.galeria as any).data)) {
    const urls = (data.galeria as any).data
      .map((img: any) => resolveStrapiMediaUrl(img?.attributes?.url || img?.url))
      .filter(Boolean);
    imagensSerializadas = JSON.stringify(urls);
    if (!imagemPrincipal && urls.length > 0) {
      imagemPrincipal = urls[0] || null;
    }
  }

  const rawLoja =
    (data.loja as any)?.data ||
    (data.loja && typeof data.loja === 'object' ? data.loja : null);
  const lojaNormalizada = rawLoja ? normalizeStrapiLoja(rawLoja) : undefined;

  return {
    id: String(data.id || ''),
    marca: String(data.marca || ''),
    modelo: String(data.modelo || ''),
    versao: data.versao ? String(data.versao) : null,
    ano: Number(data.ano || new Date().getFullYear()),
    anoModelo: data.anoModelo ? Number(data.anoModelo) : Number(data.ano || new Date().getFullYear()),
    km: Number(data.km ?? 0),
    cambio: String(data.cambio || 'AUTOMATICO'),
    combustivel: String(data.combustivel || 'FLEX'),
    categoria: String(data.categoria || 'SUV'),
    cor: data.cor ? String(data.cor) : null,
    portas: data.portas ? Number(data.portas) : 4,
    motor: data.motor ? String(data.motor) : null,
    potencia: data.potencia ? String(data.potencia) : null,
    finalPlaca: data.finalPlaca ? String(data.finalPlaca) : null,
    preco: Number(data.preco || 0),
    precoPromocional:
      data.precoPromocional !== null && data.precoPromocional !== undefined
        ? Number(data.precoPromocional)
        : null,
    precoCusto:
      data.precoCusto !== null && data.precoCusto !== undefined
        ? Number(data.precoCusto)
        : null,
    valorVenda:
      data.valorVenda !== null && data.valorVenda !== undefined
        ? Number(data.valorVenda)
        : null,
    destaque: Boolean(data.destaque),
    vendido: Boolean(data.vendido),
    dataVenda: data.dataVenda ? String(data.dataVenda) : null,
    cadastradoPorId: data.cadastradoPorId ? String(data.cadastradoPorId) : null,
    cadastradoPorNome: data.cadastradoPorNome ? String(data.cadastradoPorNome) : null,
    vendidoPorId: data.vendidoPorId ? String(data.vendidoPorId) : null,
    vendidoPorNome: data.vendidoPorNome ? String(data.vendidoPorNome) : null,
    imagemPrincipal,
    imagens: imagensSerializadas,
    descricao: data.descricao ? String(data.descricao) : null,
    opcionais:
      typeof data.opcionais === 'string'
        ? data.opcionais
        : Array.isArray(data.opcionais)
        ? JSON.stringify(data.opcionais)
        : null,
    ativo: data.ativo !== false,
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || new Date().toISOString()),
    lojaId: lojaNormalizada?.id || String(data.lojaId || 'loja-strapi-1'),
    loja: lojaNormalizada,
  };
}

// ─── Normalizador de Serviço (Strapi -> Interface Servico) ─
export function normalizeStrapiServico(
  rawEntity: StrapiEntity<Record<string, unknown>> | Record<string, unknown>
): Servico {
  const data = unwrapEntity(rawEntity) || {};
  return {
    id: String(data.id || ''),
    nome: String(data.nome || ''),
    descricao: String(data.descricao || ''),
    categoria: String(data.categoria || 'REVISAO'),
    preco:
      data.preco !== null && data.preco !== undefined ? Number(data.preco) : null,
    precoPromocional:
      data.precoPromocional !== null && data.precoPromocional !== undefined
        ? Number(data.precoPromocional)
        : null,
    duracao: data.duracao ? String(data.duracao) : null,
    icone: data.icone ? String(data.icone) : null,
    imagemUrl: resolveStrapiMediaUrl(
      typeof data.imagemUrl === 'string' ? data.imagemUrl : null
    ),
    ativo: data.ativo !== false,
    destaque: Boolean(data.destaque),
    lojaId: String(data.lojaId || 'loja-strapi-1'),
    loja: {
      nome: String((data.loja as any)?.nome || 'AutoMarket Service Center'),
    },
  };
}

// ─── Fetch genérico para o Strapi com timeout de segurança ─
export async function strapiFetch<T>(
  endpoint: string,
  options: RequestInit & { token?: string; timeoutMs?: number } = {}
): Promise<T | null> {
  if (!isStrapiConfigured()) {
    return null;
  }

  const { token, timeoutMs = 2500, headers, ...restOptions } = options;
  const authToken = token || STRAPI_API_TOKEN;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${STRAPI_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(url, {
      ...restOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(headers || {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    // Caso o servidor Strapi esteja offline, retorna null para acionar o fallback local sem quebrar a página
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Autenticação Administrativa Única via Strapi ─────────
export async function strapiAuthLogin(
  identifier: string,
  password: string
): Promise<StrapiAuthResponse | null> {
  if (!isStrapiConfigured()) return null;

  const res = await strapiFetch<StrapiAuthResponse>('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
    timeoutMs: 3500,
  });

  if (res && res.jwt && res.user) {
    // Tenta popular o role do usuário no Strapi para validação de privilégio
    if (!res.user.role) {
      const me = await strapiFetch<StrapiAuthResponse['user']>(
        '/api/users/me?populate=role',
        { token: res.jwt, timeoutMs: 2500 }
      );
      if (me && me.role) {
        res.user.role = me.role;
      }
    }
    return res;
  }
  return null;
}

// ─── Consultas e Escritas de Catálogo no Strapi ───────────
export async function strapiGetVeiculos(
  params?: Record<string, string | number | boolean | undefined>
): Promise<Veiculo[] | null> {
  const qs = new URLSearchParams();
  qs.set('populate', '*');
  qs.set('pagination[pageSize]', '100');

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        qs.set(key, String(val));
      }
    });
  }

  const response = await strapiFetch<
    StrapiCollectionResponse<Record<string, unknown>>
  >(`/api/veiculos?${qs.toString()}`);

  if (!response || !Array.isArray(response.data)) {
    return null;
  }

  return response.data.map((item) => normalizeStrapiVeiculo(item));
}

export async function strapiGetVeiculoById(id: string): Promise<Veiculo | null> {
  const response = await strapiFetch<
    StrapiSingleResponse<Record<string, unknown>>
  >(`/api/veiculos/${encodeURIComponent(id)}?populate=*`);

  if (!response || !response.data) {
    return null;
  }

  return normalizeStrapiVeiculo(response.data);
}

export async function strapiUpsertVeiculo(
  payload: Record<string, unknown>,
  existingStrapiId?: string | number
): Promise<Veiculo | null> {
  const endpoint = existingStrapiId
    ? `/api/veiculos/${encodeURIComponent(String(existingStrapiId))}`
    : '/api/veiculos';
  const method = existingStrapiId ? 'PUT' : 'POST';

  const response = await strapiFetch<
    StrapiSingleResponse<Record<string, unknown>>
  >(endpoint, {
    method,
    body: JSON.stringify({ data: payload }),
  });

  if (!response || !response.data) {
    return null;
  }

  return normalizeStrapiVeiculo(response.data);
}

export async function strapiGetServicos(
  categoria?: string
): Promise<Servico[] | null> {
  const qs = new URLSearchParams({ populate: '*' });
  if (categoria) {
    qs.set('filters[categoria][$eq]', categoria);
  }

  const response = await strapiFetch<
    StrapiCollectionResponse<Record<string, unknown>>
  >(`/api/servicos?${qs.toString()}`);

  if (!response || !Array.isArray(response.data)) {
    return null;
  }

  return response.data.map((item) => normalizeStrapiServico(item));
}

export async function strapiGetLojas(): Promise<Loja[] | null> {
  const response = await strapiFetch<
    StrapiCollectionResponse<Record<string, unknown>>
  >('/api/lojas?populate=*');

  if (!response || !Array.isArray(response.data)) {
    return null;
  }

  return response.data.map((item) => normalizeStrapiLoja(item));
}

export async function strapiCreateLead(
  leadData: Record<string, unknown>
): Promise<{ id: string } | null> {
  const response = await strapiFetch<
    StrapiSingleResponse<Record<string, unknown>>
  >('/api/leads', {
    method: 'POST',
    body: JSON.stringify({ data: leadData }),
  });

  if (!response || !response.data) {
    return null;
  }

  return { id: String(response.data.documentId || response.data.id) };
}

export async function getStrapiConnectionStatus(): Promise<StrapiConnectionStatus> {
  const configured = isStrapiConfigured();
  let online = false;

  if (configured) {
    const ping = await strapiFetch<unknown>('/api/veiculos?pagination[pageSize]=1', {
      timeoutMs: 1800,
    });
    online = ping !== null;
  }

  return {
    configured,
    baseUrl: STRAPI_BASE_URL,
    online,
    mode: configured && online ? 'STRAPI_REST_API' : 'LOCAL_FALLBACK',
    lastCheckedAt: new Date().toISOString(),
  };
}
