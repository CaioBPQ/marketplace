'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegistroDesativadoPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface rounded-card border border-hairline p-8 text-center">
        <div className="w-12 h-12 rounded-editorial bg-obsidian text-bronze-300 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="eyebrow text-bronze-600">Arquitetura Segura • Strapi CMS</span>
        <h1 className="text-2xl font-serif font-semibold text-ink mt-1">
          Cadastro Público Desativado
        </h1>
        <p className="text-xs text-ink-secondary mt-3 leading-relaxed">
          Para sua segurança e comodidade, compradores não precisam criar conta ou senha para
          consultar nosso estoque, simular financiamento ou falar com o Concierge IA e WhatsApp.
          O acesso autenticado é restrito à administração via <strong>Strapi CMS</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/veiculos"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-editorial bg-obsidian text-canvas text-xs font-semibold uppercase tracking-[0.14em] hover:bg-bronze-500 transition-colors"
          >
            Explorar Estoque de Veículos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-editorial border border-hairline bg-canvas text-ink text-xs font-semibold uppercase tracking-[0.12em] hover:border-ink transition-colors"
          >
            Acesso Administrativo (Strapi)
          </Link>
        </div>
      </div>
    </div>
  );
}
