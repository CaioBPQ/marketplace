// ═══════════════════════════════════════════════════════════
// API Stripe Checkout Transparente - Criação de PaymentIntent
// Suporta assinaturas de planos e destaque individual de veículo
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import {
  PLANOS,
  PlanoKey,
  DESTAQUE_VEICULO_PRECO,
  criarPaymentIntentTransparente,
} from '@/lib/stripe';

const checkoutSchema = z.object({
  tipo: z.enum(['ASSINATURA', 'DESTAQUE_VEICULO']).default('ASSINATURA'),
  plano: z.enum(['BASICO', 'PREMIUM', 'ENTERPRISE']).optional(),
  veiculoId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // ─── Autenticação ─────────────────────────────────────
    const payload = getAuthUser(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'LOJISTA') {
      return NextResponse.json(
        { success: false, error: 'Apenas lojistas podem realizar pagamentos.' },
        { status: 403 }
      );
    }

    // ─── Busca a loja do usuário ──────────────────────────
    const loja = await prisma.loja.findUnique({
      where: { userId: payload.userId },
    });

    if (!loja) {
      return NextResponse.json(
        { success: false, error: 'Loja não encontrada. Cadastre sua loja primeiro.' },
        { status: 404 }
      );
    }

    // ─── Validação do corpo da requisição ─────────────────
    const body = await request.json();
    const resultado = checkoutSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados de checkout inválidos.',
          detalhes: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { tipo, plano, veiculoId } = resultado.data;
    let valor = 0;
    let descricao = '';

    // ─── Fluxo 1: Assinatura de Plano ─────────────────────
    if (tipo === 'ASSINATURA') {
      if (!plano || !(plano in PLANOS)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Plano inválido. Opções: BASICO, PREMIUM, ENTERPRISE.',
          },
          { status: 400 }
        );
      }

      const planoInfo = PLANOS[plano as PlanoKey];
      valor = planoInfo.preco;
      descricao = `Assinatura AutoMarket - Plano ${planoInfo.nome}`;
    }

    // ─── Fluxo 2: Destaque Avulso de Veículo ──────────────
    if (tipo === 'DESTAQUE_VEICULO') {
      if (!veiculoId) {
        return NextResponse.json(
          { success: false, error: 'ID do veículo é obrigatório para destaque.' },
          { status: 400 }
        );
      }

      const veiculo = await prisma.veiculo.findUnique({
        where: { id: veiculoId },
      });

      if (!veiculo || !veiculo.ativo) {
        return NextResponse.json(
          { success: false, error: 'Veículo não encontrado.' },
          { status: 404 }
        );
      }

      if (veiculo.lojaId !== loja.id) {
        return NextResponse.json(
          { success: false, error: 'Sem permissão para destacar este veículo.' },
          { status: 403 }
        );
      }

      valor = DESTAQUE_VEICULO_PRECO;
      descricao = `Destaque de Anúncio - ${veiculo.marca} ${veiculo.modelo} (${veiculo.ano})`;
    }

    // ─── Cria PaymentIntent transparente (Stripe ou Sandbox)
    const intent = await criarPaymentIntentTransparente({
      lojaId: loja.id,
      tipo,
      valor,
      descricao,
      email: payload.email,
      plano,
      veiculoId,
    });

    // ─── Registra transação pendente aguardando webhook ───
    const transacao = await prisma.transacaoPagamento.create({
      data: {
        tipo,
        valor,
        status: 'PENDENTE',
        stripePaymentIntentId: intent.paymentIntentId,
        plano: tipo === 'ASSINATURA' ? plano : null,
        veiculoId: tipo === 'DESTAQUE_VEICULO' ? veiculoId : null,
        lojaId: loja.id,
        webhookConfirmado: false,
      },
    });

    return NextResponse.json({
      success: true,
      mode: intent.mode,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      transacaoId: transacao.id,
      valor,
      descricao,
    });
  } catch (error) {
    console.error('[STRIPE/CHECKOUT] Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao iniciar checkout transparente.' },
      { status: 500 }
    );
  }
}
