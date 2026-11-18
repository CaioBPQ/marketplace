// ═══════════════════════════════════════════════════════════
// Verificação JWT compatível com Edge Runtime (Web Crypto API)
// Não depende de Node.js crypto/stream para funcionar no middleware
// ═══════════════════════════════════════════════════════════

import type { JWTPayload } from './auth';

const DEV_EPHEMERAL_SECRET = 'dev-only-automarket-jwt-secret-min-32-chars!';

function getEdgeJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.includes('change-in-production') || secret.includes('fallback-secret')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: JWT_SECRET forte (>= 32 caracteres) é obrigatória em produção.');
    }
    return DEV_EPHEMERAL_SECRET;
  }
  return secret;
}

// Converte Base64URL para Uint8Array sem depender de Buffer do Node.js
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

// Verifica assinatura HS256 e expiração de um JWT no Edge Runtime
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Valida algoritmo HS256 no cabeçalho
    const headerJson = decoder.decode(base64UrlToUint8Array(headerB64));
    const header = JSON.parse(headerJson) as { alg?: string };
    if (header.alg !== 'HS256') {
      return null;
    }

    // Importa chave secreta para verificação HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(getEdgeJwtSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlToUint8Array(signatureB64);
    const dataBytes = encoder.encode(`${headerB64}.${payloadB64}`);

    const assinaturaValida = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as BufferSource,
      dataBytes as BufferSource
    );

    if (!assinaturaValida) {
      return null;
    }

    // Decodifica e valida expiração e campos obrigatórios do payload
    const payloadJson = decoder.decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson) as JWTPayload;

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (!payload.userId || !payload.email || !payload.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
