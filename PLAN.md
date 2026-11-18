# 📋 PLAN.md — Quadro Central de Tarefas (Single Source of Truth)

> **Regra:** Todo agente deve ler este arquivo antes de agir e atualizar o status do item que está executando.
> Legenda: `[ ]` Pendente | `[~]` Em Andamento | `[x]` Concluído | `[!]` Bloqueado

---

## 1. Objetivo da Demanda Atual
Refatorar a arquitetura do projeto **AutoMarket** mantendo 100% do objetivo de produto, identidade visual editorial (`#FAF8F5`, `#18181B`, `#8C6D46`) e fluxo de páginas (Home, Catálogo com Swipe Mobile-First, Detalhes do Veículo, Ofertas, Concessionária, Serviços, Sobre e Painel Gerencial), aplicando **4 mudanças estruturais de segurança, integração e automação**:

1. **Pilar 1 — Simplificação de Login e Migração para Strapi (Headless CMS):**
   - Eliminar a superfície de ataque criada pela autenticação multi-perfil feita do zero (`USUARIO`, `LOJISTA`, `ADMIN`, registro público de contas, edição de perfil de comprador, bcrypt/JWT artesanal multi-role).
   - Reestruturar o front-end React/Next.js para atuar como camada de apresentação pura consumindo a REST API de um servidor **Strapi Headless CMS** (`NEXT_PUBLIC_STRAPI_URL`), com **Fallback Resiliente** para o snapshot local/SQLite para que o preview local e o GitHub Pages (`https://caiobpq.github.io/marketplace/`) continuem 100% funcionais mesmo sem o servidor Strapi online.
   - Simplificar a rota `/login` e o `Header` exclusivamente para acesso administrativo via Strapi (`/api/auth/local` do Strapi ou redirecionamento direto ao Strapi Admin Panel).

2. **Pilar 2 — Camada de Integração Externa (ERP / DMS Sync — Evitar Duplo Cadastro):**
   - Criar módulo de serviço (`src/lib/erp-sync.ts`) e endpoint de Webhook/Integração (`src/app/api/webhooks/erp-sync/route.ts`) preparados para receber eventos de sistemas de gestão automotiva (DMS/ERP como AutoAvaliar, DealerNet, Linx, Syonet ou ERP próprio).
   - Sincronizar automaticamente o catálogo (`UPSERT` por `externalId` / `placa` / `chassi`, atualização de preço/estoque e baixa automática quando vendido no ERP) tanto no Strapi quanto no banco local, autenticado via header `x-erp-signature` (HMAC-SHA256) ou `x-webhook-secret`.

3. **Pilar 3 — Estrutura para IA de Atendimento ao Cliente:**
   - Criar componente/widget modular flutuante no front-end (`src/components/AIAssistantWidget.tsx`) integrado ao `src/app/layout.tsx`.
   - Criar módulo de orquestração (`src/lib/ai-agent.ts`) e endpoint (`src/app/api/ai/chat/route.ts`) com contexto em tempo real do estoque de veículos, simulação de financiamento, agendamento de revisões e transbordo (handoff) direto para o WhatsApp comercial (`+55 27 99834-5027`), compatível com provedores LLM (OpenAI / Gemini / Webhook n8n) e motor inteligente local de fallback.

4. **Pilar 4 — Automação de Posts para Redes Sociais (Gatilhos Strapi Webhooks):**
   - Criar módulo formatador e despachante (`src/lib/social-automation.ts`) e rota receptora de webhooks do Strapi (`src/app/api/webhooks/strapi-social/route.ts`).
   - Escutar os eventos nativos do Strapi (`entry.create`, `entry.update`, `entry.publish` da collection `api::veiculo.veiculo`), gerar automaticamente o pacote de postagem para redes sociais (copy persuasiva formatada para Instagram Feed/Reels, Facebook e Status do WhatsApp, hashtags, link direto do anúncio e URLs das fotos) e disparar webhook de saída para automações externas (`SOCIAL_AUTOMATION_WEBHOOK_URL` — n8n, Make, Zapier ou Meta Graph API).

---

## 2. Diagnóstico Técnico (Preenchido por: Gemini 4 Argon / Claude Opus 5.5)

### 2.1. Arquivos e Fluxos Atuais Auditados
- **Autenticação Legada (Multi-perfil a ser simplificada/removida):**
  - `src/lib/auth.ts` & `src/lib/jwt-edge.ts`: Gerenciam criação de token JWT próprio com roles `USUARIO | LOJISTA | ADMIN`.
  - `src/middleware.ts`: Intercepta `/dashboard`, `/perfil` e `/api/dashboard` exigindo cookie `auth-token` multi-role.
  - `src/app/api/auth/login/route.ts`, `src/app/api/auth/registro/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/perfil/route.ts`: Rotas de autenticação própria e gestão de contas de compradores/lojistas.
  - `src/app/(auth)/registro/page.tsx` e `src/app/perfil/page.tsx`: Telas de cadastro público e perfil de comprador (portas de entrada desnecessárias que serão desativadas/redirecionadas).
  - `src/app/(auth)/login/page.tsx` e `src/components/Header.tsx`: Atualmente exibem opções de cadastro de comprador/vendedor e menu multi-perfil (`Meu Perfil`, `Cadastre-se`).
- **Consumo de Dados nas Páginas Públicas (UI a ser 100% preservada):**
  - `src/app/page.tsx`, `src/app/veiculos/page.tsx`, `src/app/veiculos/[id]/VeiculoDetalhesClient.tsx`, `src/app/ofertas/page.tsx`, `src/app/concessionarias/page.tsx`, `src/app/servicos/page.tsx`.
  - Componentes visuais preservados intactos: `src/components/VehicleCard.tsx` (com carrossel mobile-first swipe recém-auditado), `src/components/HeroBanner.tsx`, `src/components/FilterSidebar.tsx`, `src/components/LeadForm.tsx`, `src/components/ServiceCard.tsx`, `src/components/InteractiveSalesDashboard.tsx`, `src/components/GitHubPagesRuntime.tsx`.

### 2.2. Arquitetura Alvo (De -> Para)
1. **Camada Cliente Strapi (`src/lib/strapi.ts`):**
   - Centraliza o consumo da API REST do Strapi v4/v5 (`GET /api/veiculos?populate=*`, `GET /api/servicos?populate=*`, `GET /api/lojas?populate=*`, `POST /api/leads`, `POST /api/agendamentos`, `POST /api/auth/local`).
   - Inclui **Normalizador de Dados (`normalizeStrapiVeiculo`, `normalizeStrapiServico`, `normalizeStrapiLoja`)** que converte o formato `{ id, attributes }` (Strapi v4) ou documento plano (Strapi v5) exatamente para as interfaces TypeScript existentes em `src/types/index.ts`.
   - **Zero Quebra de UI:** Caso `NEXT_PUBLIC_STRAPI_URL` não esteja configurado ou o servidor Strapi esteja offline no ambiente de demonstração, o cliente aciona automaticamente o fallback de dados locais, mantendo todas as páginas e o GitHub Pages operacionais.
2. **Camada de Integração ERP (`src/lib/erp-sync.ts` + `src/app/api/webhooks/erp-sync/route.ts`):**
   - Contrato de entrada (`ERPVehiclePayload`): `{ event: 'vehicle.upsert' | 'vehicle.sold' | 'vehicle.delete' | 'catalog.batch_sync', sourceErp: string, timestamp: string, data: ERPVehicleItem | ERPVehicleItem[] }`.
   - Validação de segurança via `x-webhook-secret` ou assinatura HMAC `x-erp-signature` (`ERP_WEBHOOK_SECRET`).
   - Reconciliação inteligente por identificadores únicos (`externalErpId` / `placa` / `marca+modelo+ano`), espelhando a alteração para o Strapi (via `STRAPI_API_TOKEN`) e banco local, além de registrar log de sincronização consultável via `GET /api/webhooks/erp-sync`.
3. **Camada de IA de Atendimento (`src/lib/ai-agent.ts` + `src/app/api/ai/chat/route.ts` + `src/components/AIAssistantWidget.tsx`):**
   - Endpoint `POST /api/ai/chat` recebe `{ messages, vehicleContext?, sessionId }`.
   - Injeta contexto real do catálogo (veículos em estoque, preços, câmbio, km, ofertas, serviços de oficina e financiamento) no prompt do agente.
   - Se `AI_PROVIDER_API_KEY` (OpenAI / Gemini) ou `AI_AGENT_WEBHOOK_URL` estiver definido, consome o LLM externo; caso contrário, utiliza um motor RAG/Semântico determinístico local capaz de buscar carros reais do estoque por faixa de preço/categoria, simular parcelas e gerar link de fechamento no WhatsApp (`+55 27 99834-5027`) com cards clicáveis dentro do chat.
   - No GitHub Pages (`src/components/GitHubPagesRuntime.tsx`), a rota `/api/ai/chat` também é interceptada no browser para que o assistente de IA funcione ao vivo no deploy estático!
4. **Camada de Automação Social (`src/lib/social-automation.ts` + `src/app/api/webhooks/strapi-social/route.ts`):**
   - Recebe o payload nativo de Webhook do Strapi (`event: 'entry.create' | 'entry.update' | 'entry.publish'`, `model: 'veiculo'`, `entry: { ... }`).
   - Gera automaticamente legendas otimizadas para Instagram Feed, Reels/Stories e Status do WhatsApp, extrai as imagens principais e dispara o payload consolidado para `SOCIAL_AUTOMATION_WEBHOOK_URL` (n8n / Make / Meta Graph API), mantendo histórico de disparos auditável via `GET /api/webhooks/strapi-social`.

### 2.3. Riscos e Cuidados
- **Preservação do Deploy Estático (GitHub Pages):** Qualquer nova rota em `src/app/api/*` é movida temporariamente durante o `output: 'export'` do GitHub Pages. Portanto, o `GitHubPagesRuntime.tsx` deve prover mocks cliente para `/api/ai/chat`, `/api/webhooks/erp-sync` e `/api/webhooks/strapi-social` para que tudo funcione tanto no servidor Node quanto no GitHub Pages estático.
- **Compatibilidade de Tipos:** Manter `src/types/index.ts` retrocompatível, apenas estendendo com as tipagens de Strapi, ERP Sync, IA Chat e Social Webhook.

---

## 3. Checklist de Execução (Preenchido por: Claude Opus 5.5)

- [x] **Tarefa 1 (SDK Strapi & Contratos de Tipos):** Estender `src/types/index.ts` com os contratos de integração (Strapi, ERP Sync, AI Chat, Social Automation) e criar o cliente/adaptador `src/lib/strapi.ts` com suporte a Strapi v4/v5, autenticação via `STRAPI_API_TOKEN` e fallback transparente.
  - *Arquivos:* `src/types/index.ts`, `src/lib/strapi.ts`, `.env.example`
  - *Agente Responsável:* Engenheiro Sênior / Construtor Principal
  - *Comando de Validação:* `npx tsc --noEmit`

- [x] **Tarefa 2 (Pilar 1 — Simplificação de Login e Remoção de Multi-Perfis):** Simplificar `src/lib/auth.ts`, `src/middleware.ts`, `src/app/api/auth/login/route.ts` e `src/app/api/auth/me/route.ts` para autenticação única vinculada ao Strapi Admin/API (eliminando criação de contas públicas de comprador/vendedor). Desativar o registro público em `src/app/api/auth/registro/route.ts`, redirecionar `src/app/(auth)/registro/page.tsx` e `src/app/perfil/page.tsx`, e atualizar `src/app/(auth)/login/page.tsx` e `src/components/Header.tsx` para refletir o acesso administrativo simplificado via Strapi.
  - *Arquivos:* `src/lib/auth.ts`, `src/middleware.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/auth/registro/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/registro/page.tsx`, `src/app/perfil/page.tsx`, `src/components/Header.tsx`
  - *Agente Responsável:* Construtor Principal
  - *Comando de Validação:* `npx tsc --noEmit`

- [x] **Tarefa 3 (Pilar 1 — Conexão das Rotas de Catálogo ao Strapi):** Atualizar `src/app/api/veiculos/route.ts`, `src/app/api/veiculos/[id]/route.ts`, `src/app/api/servicos/route.ts`, `src/app/api/lojas/route.ts` e `src/app/api/leads/route.ts` para priorizarem o consumo e escrita via `strapiClient` (`src/lib/strapi.ts`), mantendo fallback local automático.
  - *Arquivos:* `src/app/api/veiculos/route.ts`, `src/app/api/veiculos/[id]/route.ts`, `src/app/api/servicos/route.ts`, `src/app/api/lojas/route.ts`, `src/app/api/leads/route.ts`
  - *Agente Responsável:* Construtor Principal
  - *Comando de Validação:* `npx tsc --noEmit`

- [x] **Tarefa 4 (Pilar 2 — Camada de Integração Externa ERP/DMS Sync):** Criar o serviço `src/lib/erp-sync.ts` e o endpoint de webhook `src/app/api/webhooks/erp-sync/route.ts` com validação de assinatura (`x-erp-signature` / `x-webhook-secret`), normalização de payload de ERPs automotivos, upsert automático no Strapi/catálogo sem duplo cadastro e baixa automática de veículos vendidos.
  - *Arquivos:* `src/lib/erp-sync.ts`, `src/app/api/webhooks/erp-sync/route.ts`
  - *Agente Responsável:* Construtor Principal
  - *Comando de Validação:* `npx tsc --noEmit`

- [x] **Tarefa 5 (Pilar 4 — Automação de Posts para Redes Sociais via Strapi Webhooks):** Criar o serviço `src/lib/social-automation.ts` e o endpoint `src/app/api/webhooks/strapi-social/route.ts` que recebem eventos `entry.create`, `entry.update` e `entry.publish` do Strapi, geram copy editorial para Instagram/Facebook/WhatsApp Status com specs e fotos do veículo, e disparam webhook externo para automação de postagem.
  - *Arquivos:* `src/lib/social-automation.ts`, `src/app/api/webhooks/strapi-social/route.ts`
  - *Agente Responsável:* Construtor Principal
  - *Comando de Validação:* `npx tsc --noEmit`

- [x] **Tarefa 6 (Pilar 3 — Estrutura de IA de Atendimento & Widget Modular React):** Criar o motor de IA `src/lib/ai-agent.ts`, o endpoint `src/app/api/ai/chat/route.ts` e o componente flutuante `src/components/AIAssistantWidget.tsx` (com busca inteligente no estoque, recomendação de veículos com cards interativos, simulação de financiamento e handoff para WhatsApp), integrando-o em `src/app/layout.tsx` e no `src/components/GitHubPagesRuntime.tsx`.
  - *Arquivos:* `src/lib/ai-agent.ts`, `src/app/api/ai/chat/route.ts`, `src/components/AIAssistantWidget.tsx`, `src/app/layout.tsx`, `src/components/GitHubPagesRuntime.tsx`
  - *Agente Responsável:* Construtor Principal
  - *Comando de Validação:* `npx tsc --noEmit`

- [x] **Tarefa 7 (Visibilidade no Painel & Auditoria Final do Conselho):** Adicionar seção de status das integrações (Conexão Strapi, Webhook ERP Sync e Automação de Posts) no painel gerencial (`src/app/dashboard/page.tsx`) para facilitar testes e monitoramento, validar o build completo (`next build`) e submeter ao Conselho dos Anciões (`@4-conselho.md`) antes de publicar no GitHub (`main` e `gh-pages`).
  - *Arquivos:* `src/app/dashboard/page.tsx`, `src/components/IntegrationsHubPanel.tsx`, `src/app/api/integrations/status/route.ts`
  - *Agente Responsável:* Conselho dos Anciões (Auditor)
  - *Comando de Validação:* `npm run build`

---

## 4. Parecer do Conselho dos Anciões (Preenchido por: Claude Opus 5.5)
- **Status da Revisão:** `[APROVADO + HARDENING APPSEC P0/P1/P2 CONCLUÍDO]`
- **Apontamentos de Segurança / Lógica:** Auditoria SAST e remediação completa aplicadas em 3 fases:
  - **Fase 1 (P0 + P1):** Chaves criptográficas no `.env` (sem commit), remoção de fallbacks inseguros (`auth.ts`, `jwt-edge.ts`, `stripe.ts`), webhooks fail-closed com `crypto.timingSafeEqual` (`erp-sync.ts`, `social-automation.ts`), simulador autenticado em `/api/integrations/simulate` substituindo segredos do client, trava sandbox em produção (`/api/stripe/confirm`), correção de IDOR (`veiculos`, `veiculos/[id]`, `dashboard/stats`, `integrations/status`), HTTP 410 em `/api/perfil`, cookie `HttpOnly + Secure` exclusivo sem JWT no `localStorage`, validação de role Strapi e bloqueio de Mass Assignment + cota atômica em `$transaction`.
  - **Fase 2 (P2):** Schema Zod `aiChatRequestSchema` em `/api/ai/chat`, validação estrita de URL/payload no ERP, tratamento contra `NaN` em paginação (`/api/leads`, `/api/agendamentos`), proteção contra Open Redirect em `/login`, mitigação de IP spoofing em `getClientIP`, trava PCI-DSS no modal de checkout e CSP/remotePatterns endurecidos em `next.config.js` com typecheck e lint ativos no build.
  - **Fase 3:** Atualização segura de dependências (`next@14.2.35`, `zod@3.25.76`), eliminando a CVE crítica de bypass no middleware (`GHSA-f82v-jwr5-mffw`), validada com `npx tsc --noEmit` e `npm run build` (51/51 rotas).
