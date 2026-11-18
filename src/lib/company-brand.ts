'use client';

import { useEffect, useState } from 'react';

export type AestheticThemeKey =
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
  BRONZE_EDITORIAL: {
    key: 'BRONZE_EDITORIAL',
    nome: 'Bronze Editorial',
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
  nome: string;
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

export const DEFAULT_COMPANY_BRAND: CompanyBrandConfig = {
  nome: 'AutoMarket Select',
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
};

const STORAGE_KEY = 'automarket-company-brand-v2';

export function aplicarTemaEsteticoCSS(temaKey: AestheticThemeKey) {
  if (typeof document === 'undefined') return;
  const tema =
    AESTHETIC_THEMES[temaKey] || AESTHETIC_THEMES.BRONZE_EDITORIAL;
  document.documentElement.style.setProperty(
    '--accent-bronze',
    tema.accentPrimary
  );
  document.documentElement.style.setProperty(
    '--accent-bronze-light',
    tema.accentLight
  );
}

export function salvarBrandLocal(config: Partial<CompanyBrandConfig>) {
  if (typeof window === 'undefined') return;
  try {
    const atual = lerBrandLocal();
    const atualizado: CompanyBrandConfig = { ...atual, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
    aplicarTemaEsteticoCSS(atualizado.tema);
    window.dispatchEvent(new Event('automarket-brand-change'));
  } catch {
    // ignora erro de storage
  }
}

export function lerBrandLocal(): CompanyBrandConfig {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_BRAND;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANY_BRAND;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_COMPANY_BRAND,
      ...parsed,
    };
  } catch {
    return DEFAULT_COMPANY_BRAND;
  }
}

export function useCompanyBrand(): CompanyBrandConfig {
  const [brand, setBrand] = useState<CompanyBrandConfig>(DEFAULT_COMPANY_BRAND);

  useEffect(() => {
    const local = lerBrandLocal();
    setBrand(local);
    aplicarTemaEsteticoCSS(local.tema);

    // Sincroniza com a loja principal do banco de dados
    fetch('/api/lojas')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const lojaPrincipal = json.data[0];
          const atualLocal = lerBrandLocal();
          const sincronizado: CompanyBrandConfig = {
            ...atualLocal,
            id: lojaPrincipal.id,
            nome: lojaPrincipal.nome || atualLocal.nome,
            logoUrl: lojaPrincipal.logoUrl || atualLocal.logoUrl || '',
            endereco: lojaPrincipal.endereco || atualLocal.endereco,
            cidade: lojaPrincipal.cidade || atualLocal.cidade,
            estado: lojaPrincipal.estado || atualLocal.estado,
            cep: lojaPrincipal.cep || atualLocal.cep,
            telefone: lojaPrincipal.telefone || atualLocal.telefone,
            whatsapp: lojaPrincipal.whatsapp || atualLocal.whatsapp,
            email: lojaPrincipal.email || atualLocal.email,
            horarioFuncionamento:
              lojaPrincipal.horarioFuncionamento ||
              atualLocal.horarioFuncionamento,
            descricao: lojaPrincipal.descricao || atualLocal.descricao,
          };
          setBrand(sincronizado);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sincronizado));
        }
      })
      .catch(() => {
        // mantém config local
      });

    const handleUpdate = () => {
      const novo = lerBrandLocal();
      setBrand(novo);
      aplicarTemaEsteticoCSS(novo.tema);
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
