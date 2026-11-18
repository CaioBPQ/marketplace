// ═══════════════════════════════════════════════════════════
// PILAR II - SEGURANÇA: Autenticação JWT + bcrypt
// ═══════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// ─── Configuração ─────────────────────────────────────────
const DEV_EPHEMERAL_SECRET = 'dev-only-automarket-jwt-secret-min-32-chars!';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.includes('change-in-production') || secret.includes('fallback-secret')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: JWT_SECRET forte (>= 32 caracteres) é obrigatória em produção.');
    }
    return DEV_EPHEMERAL_SECRET;
  }
  return secret;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = 12; // Custo computacional do bcrypt

// ─── Tipos ────────────────────────────────────────────────
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── Hashing de Senha ─────────────────────────────────────
// Nunca armazene senhas em texto plano!
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT (JSON Web Tokens) ────────────────────────────────
// Tokens com expiração curta para segurança
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Middleware de Autenticação ───────────────────────────
// Extrai e valida o token do header Authorization ou do cookie automarket-token
export function getAuthUser(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  const cookieToken = request.cookies.get('automarket-token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

// Verifica se o usuário tem uma role específica
export function requireRole(user: JWTPayload | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
