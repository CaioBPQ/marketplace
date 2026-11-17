// ═══════════════════════════════════════════════════════════
// Utilitários Gerais
// ═══════════════════════════════════════════════════════════

// Formata preço em Real brasileiro
export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

// Formata quilometragem
export function formatarKM(km: number): string {
  if (km === 0) return '0 km';
  return `${new Intl.NumberFormat('pt-BR').format(km)} km`;
}

// Gera link de WhatsApp parametrizado para veículo específico
export function gerarLinkWhatsApp(params: {
  numero: string;
  marca: string;
  modelo: string;
  ano: number;
  preco: number;
  veiculoId: string;
}): string {
  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no veículo:\n` +
    `🚗 ${params.marca} ${params.modelo} ${params.ano}\n` +
    `💰 ${formatarPreco(params.preco)}\n` +
    `📋 Ref: ${params.veiculoId}\n\n` +
    `Gostaria de mais informações!`
  );
  const numero = params.numero.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${mensagem}`;
}

// Gera slug URL-friendly
export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Extrai IP do request para rate limiting
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

// Mapas de labels amigáveis
export const LABELS = {
  cambio: {
    MANUAL: 'Manual',
    AUTOMATICO: 'Automático',
    CVT: 'CVT',
    AUTOMATIZADO: 'Automatizado',
  } as Record<string, string>,
  combustivel: {
    GASOLINA: 'Gasolina',
    ETANOL: 'Etanol',
    FLEX: 'Flex',
    DIESEL: 'Diesel',
    ELETRICO: 'Elétrico',
    HIBRIDO: 'Híbrido',
  } as Record<string, string>,
  categoria: {
    SEDAN: 'Sedan',
    SUV: 'SUV',
    HATCH: 'Hatch',
    PICKUP: 'Picape',
    COUPE: 'Coupé',
    CONVERSIVEL: 'Conversível',
    VAN: 'Van',
    MINIVAN: 'Minivan',
  } as Record<string, string>,
  statusLead: {
    NOVO: 'Novo',
    CONTATADO: 'Contatado',
    NEGOCIANDO: 'Negociando',
    CONVERTIDO: 'Convertido',
    PERDIDO: 'Perdido',
  } as Record<string, string>,
  plano: {
    BASICO: 'Básico',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise',
  } as Record<string, string>,
};

// Cores para badges de status (paleta editorial mineral)
export const STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-[#EDE9E0] text-[#161513] border border-[#DED9CE]',
  CONTATADO: 'bg-[#F2E9DA] text-[#624020] border border-[#E2CEB0]',
  NEGOCIANDO: 'bg-[#E8E6E1] text-[#3D3A34] border border-[#C4BEB0]',
  CONVERTIDO: 'bg-[#E0EAE3] text-[#214433] border border-[#BBD0C2]',
  PERDIDO: 'bg-[#F5E4E2] text-[#7C2B25] border border-[#E3C1BD]',
};

// Lista de marcas populares no Brasil
export const MARCAS_POPULARES = [
  'Chevrolet', 'Volkswagen', 'Fiat', 'Toyota', 'Hyundai',
  'Honda', 'Nissan', 'Renault', 'Jeep', 'Ford',
  'BMW', 'Mercedes-Benz', 'Audi', 'Peugeot', 'Citroën',
  'Mitsubishi', 'Kia', 'Caoa Chery', 'Volvo', 'Land Rover',
];
