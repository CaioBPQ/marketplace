// ═══════════════════════════════════════════════════════════
// API de Status das Integrações (Strapi, ERP, IA, Social)
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { getStrapiConnectionStatus } from '@/lib/strapi';
import { getErpSyncHistory } from '@/lib/erp-sync';
import { getSocialAutomationHistory } from '@/lib/social-automation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const strapi = await getStrapiConnectionStatus();

  return NextResponse.json({
    success: true,
    data: {
      strapi,
      erpSync: {
        endpoint: '/api/webhooks/erp-sync',
        secretConfigured: Boolean(process.env.ERP_WEBHOOK_SECRET),
        recentLogs: getErpSyncHistory().slice(0, 5),
      },
      aiAgent: {
        endpoint: '/api/ai/chat',
        provider: process.env.AI_AGENT_WEBHOOK_URL
          ? 'STRAPI_AI_WEBHOOK'
          : process.env.AI_PROVIDER_API_KEY
          ? 'OPENAI_COMPATIBLE'
          : 'LOCAL_CATALOG_ENGINE',
        whatsappHandoff: '+55 27 99834-5027',
      },
      socialAutomation: {
        endpoint: '/api/webhooks/strapi-social',
        externalWebhookConfigured: Boolean(process.env.SOCIAL_AUTOMATION_WEBHOOK_URL),
        recentPosts: getSocialAutomationHistory().slice(0, 5),
      },
    },
  });
}
