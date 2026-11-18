import { Suspense } from 'react';
import initialSnapshot from '@/lib/initial-db-snapshot.json';
import VeiculoDetalhesClient from './VeiculoDetalhesClient';

export function generateStaticParams() {
  const ids = initialSnapshot.veiculos.map((v) => ({ id: v.id }));
  return [...ids, { id: 'item' }];
}

export default function VeiculoDetalhesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <VeiculoDetalhesClient />
    </Suspense>
  );
}
