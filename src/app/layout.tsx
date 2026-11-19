import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import WhatsAppButton from '@/components/WhatsAppButton';
import AIAssistantWidget from '@/components/AIAssistantWidget';
import BrandThemeSwitcher from '@/components/BrandThemeSwitcher';
import GitHubPagesRuntime from '@/components/GitHubPagesRuntime';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rodrigo Veículos | Linhares - ES • Seminovos Selecionados',
  description:
    'Seminovos periciados e veículos selecionados em Linhares - ES com procedência comprovada, transparência e pós-venda completo.',
  keywords: [
    'Rodrigo Veículos',
    'carros em Linhares ES',
    'seminovos Linhares',
    'comprar carro',
    'financiamento automotivo',
    'AutoMarket White-Label',
  ],
  openGraph: {
    title: 'Rodrigo Veículos | Linhares - ES • Seminovos Selecionados',
    description:
      'Seu próximo carro com procedência verificada, transparência e atendimento consultivo em Linhares - ES.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-brand="rodrigo-veiculos" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-canvas font-sans antialiased text-ink">
        <GitHubPagesRuntime />
        {children}
        <BrandThemeSwitcher />
        <AIAssistantWidget />
        <WhatsAppButton />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--brand-surface-dark)',
              color: 'var(--brand-text-on-dark)',
              borderRadius: '4px',
              border: '1px solid var(--brand-border-dark)',
              padding: '12px 16px',
              fontSize: '13px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
            success: {
              iconTheme: {
                primary: 'var(--brand-accent-light)',
                secondary: 'var(--brand-surface-dark)',
              },
            },
            error: {
              iconTheme: {
                primary: '#D97770',
                secondary: 'var(--brand-surface-dark)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
