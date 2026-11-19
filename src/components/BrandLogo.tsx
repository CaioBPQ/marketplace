'use client';

import { Car } from 'lucide-react';
import {
  resolvePublicAssetUrl,
  useCompanyBrand,
} from '@/lib/company-brand';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showLocationBadge?: boolean;
}

/**
 * Monograma vetorial SVG fiel ao logotipo da Rodrigo Veículos
 * (Emblema verde neon #00E600 -> #00B300 + "R" esportivo branco).
 */
export function RodrigoMonogramSVG({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rodrigoGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF00" />
          <stop offset="45%" stopColor="#00E600" />
          <stop offset="100%" stopColor="#009E00" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="14" fill="url(#rodrigoGreenGrad)" />
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="97"
        rx="12.5"
        stroke="#031403"
        strokeOpacity="0.18"
        strokeWidth="2"
      />
      {/* Perna esquerda inclinada característica do logotipo Rodrigo Veículos */}
      <path
        d="M17 34 L31 34 L48 63 L41 63 L45 70 L53 84 L38 84 L21 55 L26 55 Z"
        fill="#FFFFFF"
      />
      {/* Corpo principal do R geométrico inclinado */}
      <path
        d="M24 16 L59 16 C75 16 83 25 83 37 C83 46 77 53 68 56 L84 84 L68 84 L52 56 L42 56 L36 45 L56 45 C63 45 67 42 67 37 C67 32 63 29 56 29 L32 29 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default function BrandLogo({
  variant = 'light',
  size = 'md',
  showLocationBadge = false,
}: BrandLogoProps) {
  const brand = useCompanyBrand();
  const isRodrigo = brand.presetId === 'rodrigo-veiculos';

  const iconDim =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  const hasCustomUploadedLogo =
    Boolean(brand.logoUrl) &&
    brand.logoUrl !== '/images/logo-rodrigo-veiculos.png';

  const textMainColor = variant === 'dark' ? 'text-white' : 'text-ink';
  const textSubColor =
    variant === 'dark'
      ? isRodrigo
        ? 'text-[#00E600]'
        : 'text-bronze-300'
      : isRodrigo
      ? 'text-[#007A00]'
      : 'text-bronze-600';

  if (isRodrigo) {
    return (
      <div className="inline-flex items-center gap-3 select-none">
        {hasCustomUploadedLogo ? (
          <img
            src={resolvePublicAssetUrl(brand.logoUrl)}
            alt={brand.nome}
            className={`${iconDim} rounded-editorial object-cover border border-hairline shrink-0`}
          />
        ) : (
          <RodrigoMonogramSVG className={`${iconDim} shrink-0 shadow-sm`} />
        )}

        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span
              className={`font-display font-black uppercase tracking-[0.04em] ${
                size === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : size === 'sm'
                  ? 'text-base'
                  : 'text-lg sm:text-xl'
              } ${textMainColor}`}
            >
              {brand.nomeTop || 'RODRIGO'}
            </span>
            {showLocationBadge && (
              <span className="hidden sm:inline-flex items-center rounded-editorial badge-brand-vibrant px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]">
                Linhares - ES
              </span>
            )}
          </div>
          <span
            className={`mt-0.5 text-[9px] font-medium uppercase tracking-[0.34em] ${textSubColor}`}
          >
            {brand.nomeSub || 'VEÍCULOS'}
          </span>
        </div>
      </div>
    );
  }

  // Preset Default: AutoMarket Select Editorial
  return (
    <div className="inline-flex items-center gap-3 select-none">
      {brand.logoUrl ? (
        <img
          src={resolvePublicAssetUrl(brand.logoUrl)}
          alt={brand.nome}
          className={`${iconDim} rounded-editorial object-cover border border-hairline shrink-0`}
        />
      ) : (
        <span
          className={`flex ${iconDim} items-center justify-center rounded-editorial border shrink-0 transition-colors duration-300 ${
            variant === 'dark'
              ? 'border-obsidian-border bg-obsidian-soft text-bronze-300'
              : 'border-obsidian bg-obsidian text-bronze-300'
          }`}
        >
          <Car className="h-4 w-4" />
        </span>
      )}
      <span
        className={`font-serif font-semibold tracking-tight ${
          size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
        } ${textMainColor}`}
      >
        {brand.nome}
      </span>
    </div>
  );
}
