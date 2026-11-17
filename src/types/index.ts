// ═══════════════════════════════════════════════════════════
// Tipos TypeScript do AutoMarket
// ═══════════════════════════════════════════════════════════

// Tipos base do banco de dados
export interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  versao?: string | null;
  ano: number;
  anoModelo?: number | null;
  km: number;
  cambio: string;
  combustivel: string;
  categoria: string;
  cor?: string | null;
  portas?: number | null;
  motor?: string | null;
  potencia?: string | null;
  finalPlaca?: string | null;
  preco: number;
  precoPromocional?: number | null;
  precoCusto?: number | null;
  valorVenda?: number | null;
  destaque: boolean;
  vendido: boolean;
  dataVenda?: string | null;
  cadastradoPorId?: string | null;
  cadastradoPorNome?: string | null;
  vendidoPorId?: string | null;
  vendidoPorNome?: string | null;
  imagemPrincipal?: string | null;
  imagens?: string | null;
  descricao?: string | null;
  opcionais?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  lojaId: string;
  loja?: Loja;
}

export interface Loja {
  id: string;
  nome: string;
  cnpj: string;
  descricao?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: number | null;
  longitude?: number | null;
  telefone: string;
  whatsapp: string;
  email: string;
  website?: string | null;
  horarioFuncionamento?: string | null;
  plano: string;
  assinaturaAtiva: boolean;
  ativo: boolean;
  userId: string;
  totalVeiculos?: number;
}

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem?: string | null;
  origem: string;
  status: string;
  createdAt: string;
  veiculoId: string;
  userId?: string | null;
  lojaId: string;
  veiculo?: Veiculo;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco?: number | null;
  precoPromocional?: number | null;
  duracao?: string | null;
  icone?: string | null;
  imagemUrl?: string | null;
  ativo: boolean;
  destaque: boolean;
  lojaId: string;
  loja?: { nome: string };
}

export interface AgendamentoServico {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataPreferida: string;
  horarioPreferido: string;
  veiculoInfo?: string | null;
  observacoes?: string | null;
  status: string;
  tipo: string;
  createdAt: string;
  servicoId?: string | null;
  servico?: {
    id: string;
    nome: string;
    categoria: string;
  } | null;
  lojaId: string;
  loja?: {
    id: string;
    nome: string;
    cidade?: string;
    estado?: string;
  } | null;
}

export interface TransacaoPagamento {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  stripePaymentIntentId: string;
  plano?: string | null;
  veiculoId?: string | null;
  lojaId: string;
  webhookConfirmado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  telefone?: string | null;
  role: string;
  avatarUrl?: string | null;
}

// Tipos de resposta da API
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

// Filtros de busca
export interface FiltrosVeiculo {
  marca?: string;
  modelo?: string;
  anoMin?: number;
  anoMax?: number;
  precoMin?: number;
  precoMax?: number;
  kmMin?: number;
  kmMax?: number;
  cambio?: string;
  combustivel?: string;
  categoria?: string;
  cor?: string;
  destaque?: boolean;
  ofertas?: boolean;
  lojaId?: string;
  ordenar?: 'preco_asc' | 'preco_desc' | 'ano_desc' | 'km_asc' | 'recentes';
  pagina?: number;
  limite?: number;
  busca?: string;
}

// Contagens para filtros facetados
export interface ContagensFiltros {
  marcas: { nome: string; count: number }[];
  cambios: { nome: string; count: number }[];
  combustiveis: { nome: string; count: number }[];
  categorias: { nome: string; count: number }[];
  precoRange: { min: number; max: number };
  anoRange: { min: number; max: number };
  kmRange: { min: number; max: number };
  total: number;
}
