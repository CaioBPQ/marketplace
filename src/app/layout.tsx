import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import WhatsAppButton from '@/components/WhatsAppButton';
import AIAssistantWidget from '@/components/AIAssistantWidget';
import GitHubPagesRuntime from '@/components/GitHubPagesRuntime';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoMarket | Curadoria Automotiva & Marketplace Premium',
  description:
    'Seminovos periciados e veículos selecionados das melhores lojas parceiras do Brasil, com curadoria rigorosa, transparência e pós-venda completo.',
  keywords: [
    'carros seminovos',
    'carros premium',
    'marketplace automotivo',
    'comprar carro',
    'lojas parceiras',
    'financiamento automotivo',
    'AutoMarket',
  ],
  openGraph: {
    title: 'AutoMarket | Curadoria Automotiva & Marketplace Premium',
    description:
      'Seu próximo carro com procedência verificada, transparência e atendimento consultivo nas melhores lojas do Brasil.',
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
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-canvas font-sans antialiased text-ink">
        <GitHubPagesRuntime />
        {children}
        <AIAssistantWidget />
        <WhatsAppButton />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#121211',
              color: '#F6F4EF',
              borderRadius: '4px',
              border: '1px solid #2D2B27',
              padding: '12px 16px',
              fontSize: '13px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#CFAF82',
                secondary: '#121211',
              },
            },
            error: {
              iconTheme: {
                primary: '#D97770',
                secondary: '#121211',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
