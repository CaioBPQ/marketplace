'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bot,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  Share2,
  Webhook,
} from 'lucide-react';
import type {
  ERPSyncLogEntry,
  SocialMediaPostPackage,
  StrapiConnectionStatus,
} from '@/types/index';

interface IntegrationsStatusPayload {
  strapi: StrapiConnectionStatus;
  erpSync: {
    endpoint: string;
    secretConfigured: boolean;
    recentLogs: ERPSyncLogEntry[];
  };
  aiAgent: {
    endpoint: string;
    provider: string;
    whatsappHandoff: string;
  };
  socialAutomation: {
    endpoint: string;
    externalWebhookConfigured: boolean;
    recentPosts: SocialMediaPostPackage[];
  };
}

export default function IntegrationsHubPanel() {
  const [status, setStatus] = useState<IntegrationsStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingErp, setTestingErp] = useState(false);
  const [testingSocial, setTestingSocial] = useState(false);
  const [lastSocialPreview, setLastSocialPreview] =
    useState<SocialMediaPostPackage | null>(null);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data);
        if (json.data.socialAutomation?.recentPosts?.[0]) {
          setLastSocialPreview(json.data.socialAutomation.recentPosts[0]);
        }
      }
    } catch {
      // ignora em caso de erro de rede
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleTestErpSync = async () => {
    setTestingErp(true);
    try {
      const res = await fetch('/api/webhooks/erp-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'demo-erp-sync',
        },
        body: JSON.stringify({
          event: 'vehicle.upsert',
          sourceErp: 'DealerNet DMS (Teste)',
          data: {
            externalErpId: `ERP-TEST-${Date.now().toString().slice(-4)}`,
            placa: 'ABC1D23',
            marca: 'Toyota',
            modelo: 'Corolla Cross',
            versao: 'XRX Hybrid 1.8',
            ano: 2025,
            km: 4200,
            cambio: 'CVT',
            combustivel: 'HIBRIDO',
            categoria: 'SUV',
            cor: 'Branco Pérola',
            preco: 194900,
            destaque: true,
          },
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Sincronização ERP executada!');
        await loadStatus();
      } else {
        toast.error(json.error || 'Erro ao simular sincronização ERP.');
      }
    } catch {
      toast.error('Falha ao acionar webhook ERP.');
    } finally {
      setTestingErp(false);
    }
  };

  const handleTestSocialWebhook = async () => {
    setTestingSocial(true);
    try {
      const res = await fetch('/api/webhooks/strapi-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-strapi-webhook-secret': 'demo-trigger',
        },
        body: JSON.stringify({
          event: 'entry.create',
          model: 'api::veiculo.veiculo',
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setLastSocialPreview(json.data);
        toast.success('Copy de postagem gerada pelo gatilho Strapi!');
        await loadStatus();
      } else {
        toast.error(json.error || 'Erro ao gerar post automático.');
      }
    } catch {
      toast.error('Falha ao acionar webhook social.');
    } finally {
      setTestingSocial(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="bg-surface border border-hairline rounded-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
          <div>
            <span className="eyebrow text-bronze-600">
              Arquitetura Headless • Webhooks & IA
            </span>
            <h2 className="text-xl font-serif font-semibold text-ink mt-0.5">
              Hub de Integrações (Strapi CMS, ERP Sync, IA e Redes Sociais)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-editorial border border-hairline bg-canvas text-xs font-semibold text-ink hover:border-ink transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Status
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* 1. Strapi CMS */}
          <div className="p-4 rounded-editorial bg-canvas border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Database className="w-4 h-4 text-bronze-600" />
                  Strapi Headless CMS
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-editorial bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {status?.strapi.online ? 'Online' : 'Fallback Ativo'}
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary mt-2 leading-relaxed">
                Autenticação única administrativa e consumo REST via{' '}
                <code className="font-mono text-ink">src/lib/strapi.ts</code>.
              </p>
            </div>
            <p className="text-[10px] font-mono text-ink-muted mt-3 truncate">
              {status?.strapi.baseUrl || 'http://localhost:1337'}
            </p>
          </div>

          {/* 2. Integração ERP */}
          <div className="p-4 rounded-editorial bg-canvas border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Webhook className="w-4 h-4 text-bronze-600" />
                  Webhook ERP / DMS
                </span>
                <span className="text-[10px] font-mono text-bronze-700 bg-bronze-100 px-2 py-0.5 rounded-editorial">
                  Anti-Duplo Cadastro
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary mt-2 leading-relaxed">
                Recebe estoque e baixas de venda direto do ERP em{' '}
                <code className="font-mono text-ink">/api/webhooks/erp-sync</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestErpSync}
              disabled={testingErp}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-[11px] font-semibold transition-colors disabled:opacity-60"
            >
              {testingErp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Simular Sync do ERP'
              )}
            </button>
          </div>

          {/* 3. IA de Atendimento */}
          <div className="p-4 rounded-editorial bg-canvas border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Bot className="w-4 h-4 text-bronze-600" />
                  Concierge IA Online
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-editorial bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Widget Ativo
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary mt-2 leading-relaxed">
                Motor conectado ao estoque via{' '}
                <code className="font-mono text-ink">/api/ai/chat</code> com transbordo para WhatsApp.
              </p>
            </div>
            <p className="text-[10px] font-mono text-ink-muted mt-3">
              Provedor: {status?.aiAgent.provider || 'LOCAL_CATALOG_ENGINE'}
            </p>
          </div>

          {/* 4. Automação Social */}
          <div className="p-4 rounded-editorial bg-canvas border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Share2 className="w-4 h-4 text-bronze-600" />
                  Automação Social
                </span>
                <span className="text-[10px] font-mono text-ink-secondary bg-surface border border-hairline px-2 py-0.5 rounded-editorial">
                  Strapi Trigger
                </span>
              </div>
              <p className="text-[11px] text-ink-secondary mt-2 leading-relaxed">
                Gera legendas e mídia para Instagram/Status em{' '}
                <code className="font-mono text-ink">/api/webhooks/strapi-social</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestSocialWebhook}
              disabled={testingSocial}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-editorial border border-hairline bg-surface hover:border-ink text-ink text-[11px] font-semibold transition-colors disabled:opacity-60"
            >
              {testingSocial ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Testar Gatilho de Post'
              )}
            </button>
          </div>
        </div>

        {/* Preview do último post gerado automaticamente */}
        {lastSocialPreview && (
          <div className="mt-4 p-4 rounded-editorial bg-obsidian text-canvas border border-obsidian-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bronze-300">
                Preview do Post Automático ({lastSocialPreview.eventoOrigem}) —{' '}
                {lastSocialPreview.tituloVeiculo}
              </span>
              <span className="text-[10px] font-mono text-canvas/70">
                Status: {lastSocialPreview.externalWebhookStatus}
              </span>
            </div>
            <pre className="text-xs font-sans whitespace-pre-wrap text-canvas/90 leading-relaxed">
              {lastSocialPreview.instagramFeedCaption}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
