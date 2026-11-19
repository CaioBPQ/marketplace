'use client';

import { useCallback, useEffect, useState } from 'react';

export type BrandPresetId = 'default' | 'rodrigo-veiculos';

export type AestheticThemeKey =
  | 'RODRIGO_NEON_GREEN'
  | 'BRONZE_EDITORIAL'
  | 'GOLD_IMPERIAL'
  | 'EMERALD_RACING'
  | 'SLATE_MONOCHROME'
  | 'CRIMSON_SPORT';

export interface AestheticThemeInfo {
  key: AestheticThemeKey;
  nome: string;
  descricao: string;
  accentPrimary: string;
  accentLight: string;
  previewBg: string;
}

export const AESTHETIC_THEMES: Record<AestheticThemeKey, AestheticThemeInfo> = {
  RODRIGO_NEON_GREEN: {
    key: 'RODRIGO_NEON_GREEN',
    nome: 'Rodrigo Veículos (Neon Green)',
    descricao: 'Verde vibrante #00E600 -> #00B300 com superfícies #051A05 e contraste AAA',
    accentPrimary: '#008F00',
    accentLight: '#00E600',
    previewBg: '#051A05',
  },
  BRONZE_EDITORIAL: {
    key: 'BRONZE_EDITORIAL',
    nome: 'Bronze Editorial (AutoMarket)',
    descricao: 'Acabamento mineral quente inspirado em galerias automotivas',
    accentPrimary: '#9A6B3B',
    accentLight: '#CFAF82',
    previewBg: '#121211',
  },
  GOLD_IMPERIAL: {
    key: 'GOLD_IMPERIAL',
    nome: 'Ouro Clássico',
    descricao: 'Contraste dourado sóbrio para revendas de alto padrão',
    accentPrimary: '#A67C2E',
    accentLight: '#DFC17B',
    previewBg: '#141310',
  },
  EMERALD_RACING: {
    key: 'EMERALD_RACING',
    nome: 'British Racing Green',
    descricao: 'Herança automobilística europeia em verde profundo',
    accentPrimary: '#21573E',
    accentLight: '#82BBA0',
    previewBg: '#101613',
  },
  SLATE_MONOCHROME: {
    key: 'SLATE_MONOCHROME',
    nome: 'Grafite Monocromático',
    descricao: 'Minimalismo arquitetônico neutro e contemporâneo',
    accentPrimary: '#4A525D',
    accentLight: '#A8B1BD',
    previewBg: '#131518',
  },
  CRIMSON_SPORT: {
    key: 'CRIMSON_SPORT',
    nome: 'Rosso Sport',
    descricao: 'Assinatura esportiva contida para showrooms de performance',
    accentPrimary: '#8E2B29',
    accentLight: '#D88B89',
    previewBg: '#161111',
  },
};

export interface CompanyBrandConfig {
  id?: string;
  presetId: BrandPresetId;
  nome: string;
  nomeTop: string;
  nomeSub: string;
  slogan: string;
  logoUrl: string;
  tema: AestheticThemeKey;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  email: string;
  horarioFuncionamento: string;
  descricao: string;
}

export const BRAND_PRESETS: Record<BrandPresetId, CompanyBrandConfig> = {
  'rodrigo-veiculos': {
    presetId: 'rodrigo-veiculos',
    nome: 'Rodrigo Veículos',
    nomeTop: 'RODRIGO',
    nomeSub: 'VEÍCULOS',
    slogan: 'Seminovos Selecionados • Linhares - ES',
    logoUrl: '/images/logo-rodrigo-veiculos.png',
    tema: 'RODRIGO_NEON_GREEN',
    endereco: 'Av. Governador Lindemberg, 1250 — Centro',
    cidade: 'Linhares',
    estado: 'ES',
    cep: '29900020',
    telefone: '(27) 99834-5027',
    whatsapp: '5527998345027',
    email: 'contato@rodrigoveiculos.com.br',
    horarioFuncionamento: 'Seg-Sex: 8h às 18h | Sáb: 8h às 13h',
    descricao:
      'Referência em seminovos periciados e veículos multimarcas em Linhares - ES. Procedência comprovada, taxas exclusivas e atendimento consultivo.',
  },
  default: {
    presetId: 'default',
    nome: 'AutoMarket Select',
    nomeTop: 'AutoMarket',
    nomeSub: 'Select',
    slogan: 'Showroom Multimarcas & Seminovos Periciados',
    logoUrl: '',
    tema: 'BRONZE_EDITORIAL',
    endereco: 'Av. dos Autonomistas, 1500',
    cidade: 'Vitória',
    estado: 'ES',
    cep: '29055000',
    telefone: '(27) 99834-5027',
    whatsapp: '5527998345027',
    email: 'contato@automarket.com.br',
    horarioFuncionamento: 'Seg-Sex: 8h às 18h | Sáb: 8h às 14h',
    descricao:
      'Showroom especializado em veículos seminovos selecionados, periciados com laudo cautelar 100% aprovado e garantia própria.',
  },
};

export const DEFAULT_BRAND_PRESET_ID: BrandPresetId = 'rodrigo-veiculos';
export const DEFAULT_COMPANY_BRAND: CompanyBrandConfig = BRAND_PRESETS[DEFAULT_BRAND_PRESET_ID];

const PRESET_STORAGE_KEY = 'automarket-active-brand-preset-v1';
const STORAGE_KEY = 'automarket-company-brand-v3';
const CUSTOM_OVERRIDE_KEY = 'automarket-custom-brand-override-v1';

export function resolveBrandPresetFromQuery(param: string | null): BrandPresetId | null {
  if (!param) return null;
  const clean = param.trim().toLowerCase();
  if (clean === 'rodrigo' || clean === 'rodrigo-veiculos' || clean === 'linhares') {
    return 'rodrigo-veiculos';
  }
  if (clean === 'default' || clean === 'automarket') {
    return 'default';
  }
  return null;
}

export function resolvePublicAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const basePath =
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('github.io') ||
      process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true')
      ? '/marketplace'
      : '';
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

export function lerPresetAtivo(): BrandPresetId {
  if (typeof window === 'undefined') return DEFAULT_BRAND_PRESET_ID;
  try {
    const queryBrand = resolveBrandPresetFromQuery(
      new URLSearchParams(window.location.search).get('brand')
    );
    if (queryBrand) {
      return queryBrand;
    }
    const saved = localStorage.getItem(PRESET_STORAGE_KEY);
    if (saved === 'default' || saved === 'rodrigo-veiculos') {
      return saved;
    }
  } catch {
    // ignora erro de storage
  }
  return DEFAULT_BRAND_PRESET_ID;
}

export function aplicarDataBrandHTML(presetId: BrandPresetId, temaKey?: AestheticThemeKey) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-brand', presetId);
  const tema = temaKey
    ? AESTHETIC_THEMES[temaKey]
    : AESTHETIC_THEMES[BRAND_PRESETS[presetId].tema];

  if (tema && temaKey && temaKey !== 'RODRIGO_NEON_GREEN' && temaKey !== 'BRONZE_EDITORIAL') {
    document.documentElement.style.setProperty('--accent-bronze', tema.accentPrimary);
    document.documentElement.style.setProperty('--accent-bronze-light', tema.accentLight);
    document.documentElement.style.setProperty('--brand-primary', tema.accentLight);
  } else {
    // Remove overrides inline para deixar [data-brand="..."] em globals.css comandar toda a paleta
    document.documentElement.style.removeProperty('--accent-bronze');
    document.documentElement.style.removeProperty('--accent-bronze-light');
    document.documentElement.style.removeProperty('--brand-primary');
  }
}

export function aplicarTemaEsteticoCSS(temaKey: AestheticThemeKey) {
  const presetId: BrandPresetId =
    temaKey === 'RODRIGO_NEON_GREEN' ? 'rodrigo-veiculos' : lerPresetAtivo();
  aplicarDataBrandHTML(presetId, temaKey);
}

export function aplicarPresetMarca(presetId: BrandPresetId): CompanyBrandConfig {
  const preset = BRAND_PRESETS[presetId] || BRAND_PRESETS[DEFAULT_BRAND_PRESET_ID];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, preset.presetId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
      localStorage.removeItem(CUSTOM_OVERRIDE_KEY);
    } catch {
      // ignora erro de storage
    }
  }
  aplicarDataBrandHTML(preset.presetId, preset.tema);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('automarket-brand-change'));
  }
  return preset;
}

export function salvarBrandLocal(config: Partial<CompanyBrandConfig>) {
  if (typeof window === 'undefined') return;
  try {
    const atual = lerBrandLocal();
    const atualizado: CompanyBrandConfig = { ...atual, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
    localStorage.setItem(CUSTOM_OVERRIDE_KEY, JSON.stringify(config));
    aplicarDataBrandHTML(atualizado.presetId, atualizado.tema);
    window.dispatchEvent(new Event('automarket-brand-change'));
  } catch {
    // ignora erro de storage
  }
}

export function lerBrandLocal(): CompanyBrandConfig {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_BRAND;
  try {
    const presetId = lerPresetAtivo();
    const basePreset = BRAND_PRESETS[presetId];
    const queryPreset = resolveBrandPresetFromQuery(
      new URLSearchParams(window.location.search).get('brand')
    );
    if (queryPreset) {
      return BRAND_PRESETS[queryPreset];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const hasCustomOverride = localStorage.getItem(CUSTOM_OVERRIDE_KEY);
    if (raw && hasCustomOverride) {
      const parsed = JSON.parse(raw) as Partial<CompanyBrandConfig>;
      return {
        ...basePreset,
        ...parsed,
        presetId,
      };
    }
    return basePreset;
  } catch {
    return DEFAULT_COMPANY_BRAND;
  }
}

export function useCompanyBrand(): CompanyBrandConfig {
  const [brand, setBrand] = useState<CompanyBrandConfig>(DEFAULT_COMPANY_BRAND);

  useEffect(() => {
    const queryPreset = resolveBrandPresetFromQuery(
      new URLSearchParams(window.location.search).get('brand')
    );

    if (queryPreset) {
      const applied = aplicarPresetMarca(queryPreset);
      setBrand(applied);
    } else {
      const local = lerBrandLocal();
      setBrand(local);
      aplicarDataBrandHTML(local.presetId, local.tema);
    }

    const handleUpdate = () => {
      const novo = lerBrandLocal();
      setBrand(novo);
      aplicarDataBrandHTML(novo.presetId, novo.tema);
    };

    window.addEventListener('automarket-brand-change', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('automarket-brand-change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return brand;
}

export function useBrandSwitcher() {
  const brand = useCompanyBrand();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchBrand = useCallback((presetId: BrandPresetId) => {
    aplicarPresetMarca(presetId);
  }, []);

  const toggleBrand = useCallback(() => {
    const next: BrandPresetId =
      brand.presetId === 'rodrigo-veiculos' ? 'default' : 'rodrigo-veiculos';
    aplicarPresetMarca(next);
    return next;
  }, [brand.presetId]);

  return {
    brand,
    activePresetId: brand.presetId,
    switchBrand,
    toggleBrand,
    mounted,
  };
}
