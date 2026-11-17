// ═══════════════════════════════════════════════════════════
// API de Registro - Criação de conta + onboarding de lojista
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { registroSchema, checkRateLimit } from '@/lib/security';
import { getClientIP } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // ─── Rate limiting: 5 registros por minuto por IP ─────
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`registro:${ip}`, 5);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas tentativas de registro. Tente novamente em alguns minutos.',
        },
        { status: 429 }
      );
    }

    // ─── Validação do corpo da requisição ─────────────────
    const body = await request.json();
    const resultado = registroSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      nome,
      email,
      senha,
      telefone,
      role,
      nomeLoja,
      cnpj,
      endereco,
      cidade,
      estado,
      cep,
      whatsapp,
      horarioFuncionamento,
    } = resultado.data;

    // ─── Verifica se o e-mail já existe ───────────────────
    const emailExistente = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (emailExistente) {
      return NextResponse.json(
        { success: false, error: 'Este e-mail já está cadastrado.' },
        { status: 400 }
      );
    }

    // ─── Prepara CNPJ se for LOJISTA ──────────────────────
    const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : '';
    if (role === 'LOJISTA' && cnpjLimpo.length === 14) {
      const cnpjExistente = await prisma.loja.findUnique({
        where: { cnpj: cnpjLimpo },
      });
      if (cnpjExistente) {
        return NextResponse.json(
          { success: false, error: 'Este CNPJ já está cadastrado.' },
          { status: 400 }
        );
      }
    }

    const cnpjFinal =
      cnpjLimpo.length === 14
        ? cnpjLimpo
        : `${Date.now().toString().slice(-10)}${Math.floor(1000 + Math.random() * 9000)}`;

    // ─── Hash da senha com bcrypt ─────────────────────────
    const senhaHash = await hashPassword(senha);

    // ─── Cria o usuário (e loja automática se LOJISTA) ────
    const novoUsuario = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nome,
          email: email.toLowerCase(),
          senha: senhaHash,
          telefone: telefone || null,
          role,
        },
      });

      if (role === 'LOJISTA') {
        await tx.loja.create({
          data: {
            nome: nomeLoja?.trim() || `Loja de ${nome}`,
            cnpj: cnpjFinal,
            endereco: endereco?.trim() || 'Endereço a definir',
            cidade: cidade?.trim() || 'São Paulo',
            estado: (estado?.trim() || 'SP').toUpperCase().slice(0, 2),
            cep: cep?.replace(/\D/g, '').slice(0, 8) || '01000000',
            telefone: telefone?.trim() || whatsapp?.trim() || '11999999999',
            whatsapp: whatsapp?.trim() || telefone?.trim() || '5511999999999',
            email: email.toLowerCase(),
            horarioFuncionamento:
              horarioFuncionamento?.trim() || 'Seg-Sex: 8h às 18h | Sáb: 8h às 13h',
            plano: 'BASICO',
            assinaturaAtiva: false,
            userId: user.id,
          },
        });
      }

      return user;
    });

    // ─── Gera o token JWT ─────────────────────────────────
    const token = generateToken({
      userId: novoUsuario.id,
      email: novoUsuario.email,
      role: novoUsuario.role,
    });

    // ─── Retorna dados do novo usuário e define cookie ────
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          telefone: novoUsuario.telefone,
          role: novoUsuario.role,
          avatarUrl: novoUsuario.avatarUrl,
        },
      },
      { status: 201 }
    );

    response.cookies.set('automarket-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error('[REGISTRO] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
