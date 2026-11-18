# Plano de Execução Atual

## 1. Objetivo da Demanda
- **Descrição:** Otimizar os cards de veículos (`VehicleCard.tsx`) da landing page e listagens para dispositivos mobile (Mobile-First UX), permitindo navegar por todas as fotos de cada veículo deslizando horizontalmente (swipe) direto no card com CSS Scroll Snap, sem precisar abrir a página do anúncio.
- **Critério de Sucesso:**
  1. Carrossel horizontal nativo com CSS Scroll Snap (`overflow-x: auto`, `scroll-snap-type: x mandatory`, `scroll-behavior: smooth`), slides `flex: 0 0 100%` + `scroll-snap-align: start`, barra de rolagem oculta (`scrollbar-width: none` e `::-webkit-scrollbar { display: none }`) e proporção fixa (`aspect-[16/10]` / `object-fit: cover`) sem CLS.
  2. Prevenção de clique acidental (separação entre swipe horizontal e tap simples) sem bloquear o scroll vertical da página.
  3. Indicadores visuais minimalistas (contador pílula `1 / N` + pagination dots na base da imagem atualizados via scroll, e setas sutis no desktop visíveis apenas no hover).
  4. Performance Mobile: 1ª foto carregada normalmente e demais fotos do carrossel com `loading="lazy"` e `decoding="async"`.

---

## 2. Diagnóstico Técnico (Preenchido por: Gemini 4 Argon High — `@1-mapear.md`)
- **Fluxo atual identificado:**
  - O componente `src/components/VehicleCard.tsx` é utilizado na landing page (`src/app/page.tsx` nas seções "Veículos em Destaque" e "Ofertas Especiais da Semana"), no catálogo (`src/app/veiculos/page.tsx`), em ofertas (`src/app/ofertas/page.tsx`) e em veículos semelhantes (`src/app/veiculos/[id]/VeiculoDetalhesClient.tsx`).
  - Atualmente, `VehicleCard.tsx` renderiza apenas `vehicle.imagemPrincipal` dentro de um `<Link href={detalheHref}>`, ignorando o campo `vehicle.imagens` (JSON array de URLs/Data URLs já presente em todos os 26 veículos do banco e nos cadastros multi-foto).
- **Arquivos que serão afetados:**
  - `src/app/globals.css` — Adição do utilitário `.no-scrollbar` (`scrollbar-width: none`, `-ms-overflow-style: none` e `::-webkit-scrollbar { display: none }`).
  - `src/components/VehicleCard.tsx` — Extração da galeria (`imagemPrincipal` + parse seguro de `vehicle.imagens`), implementação da trilha de CSS Scroll Snap, detecção de gesto swipe vs. tap (`onPointerDown`/`onPointerMove`/`onTouchStart`/`onTouchMove`/`onClick`), atualização reativa do índice ativo via `onScroll`, pagination dots, contador pílula `1 / N`, setas de hover no desktop e `loading="lazy"` para `index > 0`.
- **Contratos, Tipos e Banco de Dados:**
  - Nenhuma alteração de schema necessária: a interface `Veiculo` (`src/types/index.ts`) já possui `imagemPrincipal?: string | null` e `imagens?: string | null`.
- **Riscos e Efeitos Colaterais:**
  - **Conflito Swipe vs. Link Navigation:** Em navegadores mobile e desktop (drag com mouse ou touch), envolver o carrossel em `<Link>` pode disparar navegação após um arrasto se não houver guarda de deslocamento (`deltaX > 8px`).
  - **Bloqueio de Scroll Vertical:** Não utilizar `touch-action: pan-x` isolado; manter o comportamento nativo do `overflow-x: auto` permite que o navegador direcione gestos verticais para o scroll da página e horizontais para o carrossel.
  - **Layout Shift (CLS):** O container externo deve manter `aspect-[16/10]` (modo `grid`) ou `h-60 md:h-auto md:w-80` (modo `list`) com cada slide ocupando `w-full h-full shrink-0 basis-full snap-start`.

---

## 3. Checklist de Execução (Planejado por: Claude Opus 5.5 — `@2-planejar.md` / Executado por: Gemini 4 Hydrogen — `@3-executar.md`)
> Legenda: `[ ]` Pendente | `[~]` Em andamento | `[x]` Concluído

- [x] **Tarefa 1:** Adicionar utilitário `.no-scrollbar` na camada de utilitários globais para ocultar a barra de rolagem horizontal no WebKit, Firefox e Edge/IE sem afetar o scroll nativo.
  - **Arquivos exclusivos:** `src/app/globals.css`
  - **Agente responsável:** Gemini 4 Hydrogen
  - **Validação:** `.\node_modules\.bin\tsc.cmd --noEmit`

- [x] **Tarefa 2:** Refatorar a área de mídia do `VehicleCard.tsx` para suportar carrossel horizontal com CSS Scroll Snap, extração completa de `vehicle.imagens`, prevenção de clique acidental no swipe/drag, pagination dots + contador pílula `1 / N`, setas sutis no desktop (`group-hover`) e `loading="lazy"` nas fotos secundárias (`index > 0`).
  - **Arquivos exclusivos:** `src/components/VehicleCard.tsx`
  - **Agente responsável:** Gemini 4 Hydrogen
  - **Validação:** `.\node_modules\.bin\tsc.cmd --noEmit` e `.\node_modules\.bin\next.cmd build`

---

## 4. Parecer do Conselho dos Anciões (Preenchido por: Claude Opus 5.5 High — `@4-conselho.md`)
- **Status da Revisão:** `APROVADO`
- **Bloqueios Críticos (Bugs / Segurança / Regressão):**
  - Nenhum bloqueio crítico encontrado.
  - **Auditoria dos 4 Requisitos:**
    1. **Fluidez Nativa e Scroll Snap:** A trilha do carrossel aplica `overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar` com slides `flex-[0_0_100%] shrink-0 snap-start` e proporção fixa (`aspect-[16/10]` / `object-cover`), eliminando qualquer Layout Shift (CLS) e ocultando a barra de rolagem em todos os motores via `src/app/globals.css`.
    2. **Prevenção de Clique Acidental:** O rastreamento de deslocamento horizontal (`deltaX > 8px` e variação de `scrollLeft > 8px`) em `onTouchStart`/`onTouchMove`, `onPointerDown`/`onPointerMove`/`onPointerUp` e `onScroll` bloqueia o clique acidental no `<Link>` após um swipe/arrasto, preservando a rolagem vertical nativa da página sem usar `touch-action: pan-x` restritivo.
    3. **Indicadores Visuais Minimalistas (Affordance):** Contador pílula discreto `1 / N` (`tabular-nums`) no topo direito, pagination dots interativos na base central sincronizados em tempo real via `onScroll` e setas laterais sutis no desktop (`hidden md:flex` com `opacity-0 group-hover:opacity-100`).
    4. **Performance Mobile:** 1ª foto com `loading="eager"`, demais fotos (`index > 0`) com `loading="lazy"` e `decoding="async"`, parse seguro de `vehicle.imagens` com `try/catch` + deduplicação via `useMemo` e fallback individual por slide (`failedImages[index]`).
- **Sugestões Opcionais de Melhoria:**
  - Nenhuma. Código cirúrgico, sem dependências externas e aderente ao Design System editorial.
- **Veredito Final:** `APROVADO PARA COMMIT`
