// ═══════════════════════════════════════════════════════════
// PILAR II - SEGURANÇA: Sanitização, Rate Limiting, Validação
// Compatível com Edge Runtime e Node.js
// ═══════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Rate Limiter (In-Memory Edge-Safe) ───────────────────
// Protege APIs contra scrapers e ataques de força bruta
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// Remove entradas expiradas sob demanda (evita setInterval global no Edge Runtime)
function limparRateLimitExpirado(agora: number): void {
  if (rateLimitStore.size <= 500) {
    return;
  }

  rateLimitStore.forEach((entry, key) => {
    if (agora > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}

export function checkRateLimit(identifier: string, maxReqs = MAX_REQUESTS): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  limparRateLimitExpirado(now);

  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: maxReqs - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= maxReqs) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxReqs - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// ─── Sanitização de Input ─────────────────────────────────
// Previne SQL Injection e XSS

// Remove caracteres perigosos de strings
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove tags HTML
    .replace(/javascript:/gi, '') // Remove javascript: URIs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Sanitiza parâmetros de busca
export function sanitizeSearchParams(params: Record<string, string | null>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = sanitizeString(String(value));
    }
  }

  return sanitized;
}

// Helper para converter booleanos de query string corretamente ("false" -> false)
const queryBooleanSchema = z
  .preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional());

// Helper para sanitizar strings antes da validação Zod (Pilar II)
const sanitized = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (typeof val === 'string' ? sanitizeString(val) : val), schema);

// ─── Schemas de Validação (Zod) ──────────────────────────
// Validação forte de todos os inputs com mensagens em português

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
});

export const registroSchema = z.object({
  nome: sanitized(z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100)),
  email: z.string().email('E-mail inválido').max(255),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
  telefone: sanitized(z.string().optional()),
  role: z.enum(['USUARIO', 'LOJISTA']).default('USUARIO'),
  // Campos opcionais de onboarding para lojistas
  nomeLoja: sanitized(z.string().max(100).optional()),
  cnpj: z.string().max(18).optional(),
  endereco: sanitized(z.string().max(200).optional()),
  cidade: sanitized(z.string().max(100).optional()),
  estado: sanitized(z.string().max(2).optional()),
  cep: z.string().max(9).optional(),
  whatsapp: sanitized(z.string().max(20).optional()),
  horarioFuncionamento: sanitized(z.string().max(200).optional()),
});

// Validação de URL de imagem (aceita URL http(s), caminho local seguro sem '//' ou Data URL segura)
const imagemUrlOuDataUrlSchema = z
  .string()
  .max(2500000, 'Imagem muito grande.')
  .refine(
    (val) => {
      if (!val) return true;
      if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
        return true;
      }
      if (val.startsWith('/') && !val.startsWith('//')) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'Envie uma foto válida (PNG, JPG ou WEBP).' }
  )
  .optional()
  .nullable();

const veiculoBaseSchema = z.object({
  marca: sanitized(z.string().min(1).max(50)),
  modelo: sanitized(z.string().min(1).max(100)),
  versao: sanitized(z.string().max(100).optional().nullable()),
  ano: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  anoModelo: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional().nullable(),
  km: z.number().int().min(0).max(999999),
  cambio: z.enum(['MANUAL', 'AUTOMATICO', 'CVT', 'AUTOMATIZADO']),
  combustivel: z.enum(['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELETRICO', 'HIBRIDO']),
  categoria: z.enum(['SEDAN', 'SUV', 'HATCH', 'PICKUP', 'COUPE', 'CONVERSIVEL', 'VAN', 'MINIVAN']),
  cor: sanitized(z.string().max(30).optional().nullable()),
  portas: z.number().int().min(2).max(5).optional().nullable(),
  motor: sanitized(z.string().max(30).optional().nullable()),
  potencia: sanitized(z.string().max(20).optional().nullable()),
  finalPlaca: sanitized(z.string().max(1).optional().nullable()),
  preco: z.number().positive('Preço deve ser positivo'),
  precoPromocional: z.number().positive().optional().nullable(),
  precoCusto: z.number().nonnegative().optional().nullable(),
  valorVenda: z.number().positive().optional().nullable(),
  destaque: z.boolean().optional(),
  vendido: z.boolean().optional(),
  dataVenda: z.string().optional().nullable(),
  cadastradoPorId: z.string().optional().nullable(),
  cadastradoPorNome: sanitized(z.string().max(100).optional().nullable()),
  vendidoPorId: z.string().optional().nullable(),
  vendidoPorNome: sanitized(z.string().max(100).optional().nullable()),
  lojaId: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  imagemPrincipal: imagemUrlOuDataUrlSchema,
  imagens: z.string().max(15000000).optional().nullable(),
  descricao: sanitized(z.string().max(5000).optional().nullable()),
  opcionais: z.string().optional().nullable(),
});

export const veiculoSchema = veiculoBaseSchema.refine(
  (data) => !data.precoPromocional || data.precoPromocional < data.preco,
  {
    message: 'Preço promocional deve ser menor que o preço principal.',
    path: ['precoPromocional'],
  }
);

export const veiculoUpdateSchema = veiculoBaseSchema.partial().refine(
  (data) =>
    data.precoPromocional === undefined ||
    data.precoPromocional === null ||
    data.preco === undefined ||
    data.precoPromocional < data.preco,
  {
    message: 'Preço promocional deve ser menor que o preço principal.',
    path: ['precoPromocional'],
  }
);

export const leadSchema = z.object({
  nome: sanitized(z.string().min(2, 'Nome é obrigatório').max(100)),
  email: z.string().email('E-mail inválido').max(255),
  telefone: sanitized(z.string().min(10, 'Telefone inválido').max(20)),
  mensagem: sanitized(z.string().max(1000).optional().nullable()),
  veiculoId: z.string().min(1),
  origem: z.enum(['SITE', 'WHATSAPP', 'FORMULARIO']).default('SITE'),
});

export const lojaSchema = z.object({
  nome: sanitized(z.string().min(2).max(100)),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  descricao: sanitized(z.string().max(2000).optional()),
  endereco: sanitized(z.string().min(5).max(200)),
  cidade: sanitized(z.string().min(2).max(100)),
  estado: sanitized(z.string().length(2)),
  cep: z.string().length(8),
  telefone: sanitized(z.string().min(10).max(20)),
  whatsapp: sanitized(z.string().min(10).max(20)),
  email: z.string().email().max(255),
  website: z.string().url().optional(),
  horarioFuncionamento: sanitized(z.string().max(200).optional()),
});

export const lojaUpdateSchema = z.object({
  nome: sanitized(z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional()),
  cnpj: z.string().min(14, 'CNPJ inválido').max(18).optional(),
  descricao: sanitized(z.string().max(2000).optional().nullable()),
  logoUrl: imagemUrlOuDataUrlSchema,
  bannerUrl: imagemUrlOuDataUrlSchema,
  endereco: sanitized(z.string().min(3, 'Endereço inválido').max(200).optional()),
  cidade: sanitized(z.string().min(2, 'Cidade inválida').max(100).optional()),
  estado: sanitized(z.string().length(2, 'Estado deve ser a sigla UF com 2 letras').optional()),
  cep: z.string().min(8, 'CEP inválido').max(9).optional(),
  telefone: sanitized(z.string().min(10, 'Telefone inválido').max(20).optional()),
  whatsapp: sanitized(z.string().min(10, 'WhatsApp inválido').max(20).optional()),
  email: z.string().email('E-mail inválido').max(255).optional(),
  website: z.string().url('URL do website inválida').or(z.literal('')).optional().nullable(),
  horarioFuncionamento: sanitized(z.string().max(200).optional().nullable()),
});

export const agendamentoSchema = z.object({
  nome: sanitized(z.string().min(2, 'Nome é obrigatório').max(100)),
  email: z.string().email('E-mail inválido').max(255),
  telefone: sanitized(z.string().min(10, 'Telefone inválido').max(20)),
  dataPreferida: sanitized(z.string().min(1, 'Data preferida é obrigatória').max(30)),
  horarioPreferido: sanitized(z.string().min(1, 'Horário preferido é obrigatório').max(30)),
  veiculoInfo: sanitized(z.string().max(200).optional().nullable()),
  observacoes: sanitized(z.string().max(1000).optional().nullable()),
  tipo: z.enum(['SERVICO', 'TEST_DRIVE', 'REVISAO']).default('SERVICO'),
  servicoId: z.string().optional().nullable(),
  lojaId: z.string().optional().nullable(),
});

// Validação de URL de avatar (aceita URL http(s) ou Data URL de imagem segura)
const avatarUrlSchema = z
  .string()
  .max(650000, 'Imagem muito grande. Utilize uma foto de até 450 KB.')
  .refine(
    (val) => {
      if (!val) return true;
      if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
        return true;
      }
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'Informe uma URL de imagem válida ou envie uma foto PNG/JPG/WEBP.' }
  )
  .optional()
  .nullable();

export const perfilUpdateSchema = z
  .object({
    nome: sanitized(z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100)),
    telefone: sanitized(z.string().max(20).optional().nullable()),
    avatarUrl: avatarUrlSchema,
    senhaAtual: z.string().max(128).optional(),
    novaSenha: z
      .string()
      .min(6, 'A nova senha deve ter pelo menos 6 caracteres')
      .max(128)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.novaSenha && !data.senhaAtual) return false;
      return true;
    },
    {
      message: 'Informe a senha atual para definir uma nova senha.',
      path: ['senhaAtual'],
    }
  );

// ─── Filtros de Busca (Validação) ─────────────────────────
export const filtrosVeiculoSchema = z.object({
  marca: sanitized(z.string().optional()),
  modelo: sanitized(z.string().optional()),
  anoMin: z.coerce.number().int().min(1900).optional(),
  anoMax: z.coerce.number().int().max(2030).optional(),
  precoMin: z.coerce.number().min(0).optional(),
  precoMax: z.coerce.number().max(10000000).optional(),
  kmMin: z.coerce.number().int().min(0).optional(),
  kmMax: z.coerce.number().int().max(999999).optional(),
  cambio: sanitized(z.string().optional()),
  combustivel: sanitized(z.string().optional()),
  categoria: sanitized(z.string().optional()),
  cor: sanitized(z.string().optional()),
  destaque: queryBooleanSchema,
  ofertas: queryBooleanSchema,
  minhas: queryBooleanSchema,
  lojaId: sanitized(z.string().optional()),
  ordenar: z.enum(['preco_asc', 'preco_desc', 'ano_desc', 'km_asc', 'recentes']).optional(),
  pagina: z.coerce.number().int().min(1).optional().default(1),
  limite: z.coerce.number().int().min(1).max(50).optional().default(12),
  busca: sanitized(z.string().max(100).optional()),
});
