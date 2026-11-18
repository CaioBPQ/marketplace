'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PerfilRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('automarket-token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-bronze-500" />
    </div>
  );
}
