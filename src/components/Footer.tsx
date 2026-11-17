'use client';

import Link from 'next/link';
import { useCompanyBrand } from '@/lib/company-brand';
import {
  Car,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Youtube,
} from 'lucide-react';

export default function Footer() {
  const anoAtual = new Date().getFullYear();
  const brand = useCompanyBrand();

  return (
    <footer className="border-t border-obsidian-border bg-obsidian text-canvas">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-obsidian-border pb-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1: Marca Editorial e Redes Sociais */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.nome}
                  className="h-9 w-9 rounded-editorial object-cover border border-obsidian-border"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-editorial border border-obsidian-border bg-obsidian-soft text-bronze-300">
                  <Car className="h-4 w-4" />
                </span>
              )}
              <span className="font-serif text-2xl font-semibold tracking-tight text-canvas">
                {brand.nome}
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#A39D92]">
              {brand.descricao}
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              {[
                { href: 'https://instagram.com', label: 'Instagram AutoMarket', Icon: Instagram },
                { href: 'https://facebook.com', label: 'Facebook AutoMarket', Icon: Facebook },
                { href: 'https://youtube.com', label: 'YouTube AutoMarket', Icon: Youtube },
                { href: 'https://linkedin.com', label: 'LinkedIn AutoMarket', Icon: Linkedin },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-editorial border border-obsidian-border bg-obsidian-soft text-[#A39D92] transition-colors duration-300 hover:border-bronze-400 hover:text-bronze-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h3 className="eyebrow text-bronze-300">Navegação</h3>
            <ul className="mt-5 space-y-3 text-sm text-[#C7C1B6]">
              <li>
                <Link href="/" className="transition-colors hover:text-canvas">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/veiculos" className="transition-colors hover:text-canvas">
                  Catálogo de Veículos
                </Link>
              </li>
              <li>
                <Link href="/ofertas" className="transition-colors hover:text-canvas">
                  Ofertas Selecionadas
                </Link>
              </li>
              <li>
                <Link href="/concessionarias" className="transition-colors hover:text-canvas">
                  Showroom &amp; Contato
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="transition-colors hover:text-canvas">
                  Nossa Empresa &amp; ESG
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Categorias & Pós-Venda */}
          <div>
            <h3 className="eyebrow text-bronze-300">Segmentos &amp; Pós-Venda</h3>
            <ul className="mt-5 space-y-3 text-sm text-[#C7C1B6]">
              <li>
                <Link href="/veiculos?categoria=SUV" className="transition-colors hover:text-canvas">
                  SUVs &amp; Utilitários
                </Link>
              </li>
              <li>
                <Link href="/veiculos?categoria=SEDAN" className="transition-colors hover:text-canvas">
                  Sedans Executivos
                </Link>
              </li>
              <li>
                <Link href="/veiculos?categoria=HATCH" className="transition-colors hover:text-canvas">
                  Hatches Urbanos
                </Link>
              </li>
              <li>
                <Link href="/veiculos?categoria=PICKUP" className="transition-colors hover:text-canvas">
                  Picapes 4x4
                </Link>
              </li>
              <li>
                <Link href="/servicos" className="transition-colors hover:text-canvas">
                  Revisões &amp; Serviços
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Central & Assistência 24h */}
          <div>
            <h3 className="eyebrow text-bronze-300">Concierge &amp; Suporte</h3>
            <div className="mt-5 space-y-3.5 text-sm text-[#C7C1B6]">
              <div className="rounded-editorial border border-obsidian-border bg-obsidian-soft p-4">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Assistência 24h Nacional
                </span>
                <a
                  href="tel:08007772424"
                  className="mt-1.5 block font-mono text-lg font-medium text-canvas transition-colors hover:text-bronze-300"
                >
                  0800 777 2424
                </a>
                <p className="mt-0.5 text-xs text-[#8C867B]">
                  Guincho, pane elétrica e carro reserva
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <Phone className="h-3.5 w-3.5 shrink-0 text-bronze-300" />
                <span>{brand.telefone} • Atendimento Comercial</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Mail className="h-3.5 w-3.5 shrink-0 text-bronze-300" />
                <span>{brand.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Clock className="h-3.5 w-3.5 shrink-0 text-bronze-300" />
                <span>{brand.horarioFuncionamento}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-bronze-300" />
                <span>
                  {brand.endereco} — {brand.cidade}/{brand.estado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-[#8C867B] sm:flex-row">
          <p>© {anoAtual} {brand.nome}. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/sobre" className="transition-colors hover:text-canvas">
              Nossa História &amp; ESG
            </Link>
            <Link href="/servicos" className="transition-colors hover:text-canvas">
              Central Pós-Venda
            </Link>
            <Link href="/perfil" className="transition-colors hover:text-canvas">
              Minha Conta
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-canvas">
              Painel da Equipe
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
