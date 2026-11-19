'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronUp, Palette, Sparkles } from 'lucide-react';
import {
  BRAND_PRESETS,
  BrandPresetId,
  useBrandSwitcher,
} from '@/lib/company-brand';

export default function BrandThemeSwitcher() {
  const { brand, activePresetId, switchBrand, mounted } = useBrandSwitcher();
  const [open, setOpen] = useState(false);

  if (!mounted) {
    return null;
  }

  const isRodrigo = activePresetId === 'rodrigo-veiculos';

  const handleSelect = (presetId: BrandPresetId) => {
    switchBrand(presetId);
    const chosen = BRAND_PRESETS[presetId];
    toast.success(`Tema White-Label ativo: ${chosen.nome} (${chosen.cidade}/${chosen.estado})`);
    setOpen(false);
  };

  const handleQuickToggle = () => {
    const nextId: BrandPresetId = isRodrigo ? 'default' : 'rodrigo-veiculos';
    handleSelect(nextId);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start">
      {/* Popover do Seletor White-Label */}
      {open && (
        <div
          role="dialog"
          aria-label="Seletor de Identidade White-Label"
          className="mb-3 w-72 sm:w-80 rounded-card border border-hairline bg-surface p-3.5 shadow-2xl animate-slide-up"
        >
          <div className="flex items-center justify-between border-b border-hairline pb-2.5 mb-2.5">
            <div>
              <span className="eyebrow text-bronze-600 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                White-Label Demo
              </span>
              <p className="text-xs font-semibold text-ink mt-0.5">
                Alternar Identidade da Aplicação
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickToggle}
              className="px-2 py-1 rounded-editorial bg-obsidian text-canvas text-[10px] font-semibold uppercase tracking-wider hover:bg-bronze-500 transition-colors"
            >
              Alternar 1-Click
            </button>
          </div>

          <div className="space-y-2">
            {(
              [
                {
                  id: 'rodrigo-veiculos' as BrandPresetId,
                  label: 'Rodrigo Veículos',
                  sub: 'Linhares - ES • Verde Neon & #051A05',
                  swatchPrimary: '#00E600',
                  swatchDark: '#051A05',
                },
                {
                  id: 'default' as BrandPresetId,
                  label: 'AutoMarket (Padrão)',
                  sub: 'Tema Editorial • Bronze & Obsidian',
                  swatchPrimary: '#CFAF82',
                  swatchDark: '#121211',
                },
              ] as const
            ).map((item) => {
              const selected = activePresetId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-editorial border text-left transition-all ${
                    selected
                      ? 'border-ink bg-stone/70 ring-1 ring-ink/15'
                      : 'border-hairline bg-canvas hover:border-ink-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-editorial border border-black/15 shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${item.swatchPrimary} 0%, ${item.swatchDark} 100%)`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-ink-muted truncate">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  {selected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-obsidian text-canvas">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 pt-2 border-t border-hairline text-[10px] text-ink-muted">
            Dica: você também pode apresentar usando{' '}
            <code className="font-mono text-ink">?brand=rodrigo</code> ou{' '}
            <code className="font-mono text-ink">?brand=default</code> na URL.
          </p>
        </div>
      )}

      {/* Botão Flutuante Discreto no Canto Inferior Esquerdo */}
      <div className="flex items-center gap-1.5 rounded-full border border-obsidian-border bg-obsidian/95 p-1 pr-2.5 text-white shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Abrir seletor de tema White-Label"
          className="inline-flex items-center gap-2 rounded-full bg-obsidian-soft px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-bronze-400"
        >
          <Palette
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: isRodrigo ? '#00E600' : '#CFAF82' }}
          />
          <span className="hidden sm:inline max-w-[140px] truncate">
            {brand.nome}
          </span>
          <ChevronUp
            className={`h-3.5 w-3.5 text-white/70 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={handleQuickToggle}
          title={
            isRodrigo
              ? 'Alternar para AutoMarket (Padrão)'
              : 'Alternar para Rodrigo Veículos (Linhares - ES)'
          }
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all badge-brand-vibrant"
        >
          {isRodrigo ? 'Padrão' : 'Rodrigo'}
        </button>
      </div>
    </div>
  );
}
