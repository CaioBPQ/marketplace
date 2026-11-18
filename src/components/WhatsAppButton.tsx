'use client';

import { MessageCircle } from 'lucide-react';
import { useCompanyBrand } from '@/lib/company-brand';

export default function WhatsAppButton() {
  const brand = useCompanyBrand();
  const numero = (
    brand.whatsapp ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '5527998345027'
  ).replace(/\D/g, '');

  const texto = encodeURIComponent(
    `Olá! Vim pelo site ${brand.nome || 'AutoMarket'} e gostaria de falar com um vendedor.`
  );
  const href = `https://wa.me/${numero}?text=${texto}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar pelo WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 focus:outline-none"
    >
      <span className="hidden rounded-editorial border border-hairline bg-surface px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-all duration-300 md:inline-block md:opacity-0 md:group-hover:opacity-100">
        Falar com Vendedor
      </span>
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-sage-700 bg-sage-700 text-canvas shadow-lg transition-transform duration-300 ease-editorial group-hover:scale-105 group-hover:bg-sage-800">
        <span
          aria-hidden="true"
          className="animate-pulse-soft absolute inset-0 rounded-full border border-sage-600/50"
        />
        <MessageCircle className="relative h-5 w-5" />
      </span>
    </a>
  );
}
