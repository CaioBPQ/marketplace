'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import TransparentCheckoutModal from '@/components/TransparentCheckoutModal';
import { Veiculo } from '@/types';
import { formatarKM, formatarPreco, LABELS, MARCAS_POPULARES } from '@/lib/utils';
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle2,
  Car,
  X,
  Loader2,
  Tag,
  Upload,
  ImagePlus,
  Star,
  UserCheck,
  Calendar,
  DollarSign,
  Store,
  Filter,
} from 'lucide-react';

interface VeiculoComLoja extends Veiculo {
  loja?: Veiculo['loja'] & {
    user?: {
      id: string;
      nome: string;
      email: string;
    };
  };
}

interface VeiculoFormState {
  marca: string;
  modelo: string;
  versao: string;
  ano: string;
  anoModelo: string;
  km: string;
  cambio: string;
  combustivel: string;
  categoria: string;
  cor: string;
  portas: string;
  motor: string;
  potencia: string;
  finalPlaca: string;
  preco: string;
  precoPromocional: string;
  precoCusto: string;
  cadastradoPorNome: string;
  descricao: string;
  opcionais: string;
}

const INITIAL_FORM: VeiculoFormState = {
  marca: 'Toyota',
  modelo: '',
  versao: '',
  ano: String(new Date().getFullYear()),
  anoModelo: String(new Date().getFullYear()),
  km: '0',
  cambio: 'AUTOMATICO',
  combustivel: 'FLEX',
  categoria: 'SUV',
  cor: 'Branco',
  portas: '4',
  motor: '',
  potencia: '',
  finalPlaca: '',
  preco: '',
  precoPromocional: '',
  precoCusto: '',
  cadastradoPorNome: '',
  descricao: '',
  opcionais: '',
};

function redimensionarFotoVeiculo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1100;
        const maxHeight = 825;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error(`Arquivo inválido: ${file.name}`));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function extrairGaleriaDoVeiculo(v: Veiculo): string[] {
  const lista: string[] = [];
  if (v.imagemPrincipal) {
    lista.push(v.imagemPrincipal);
  }
  if (v.imagens) {
    try {
      const parsed = JSON.parse(v.imagens);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item && !lista.includes(item)) {
            lista.push(item);
          }
        }
      }
    } catch {
      // ignora JSON inválido
    }
  }
  return lista;
}

export default function DashboardVeiculosPage() {
  const fotosInputRef = useRef<HTMLInputElement | null>(null);

  const [veiculos, setVeiculos] = useState<VeiculoComLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioLogadoNome, setUsuarioLogadoNome] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Filtros de visualização do catálogo
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ESTOQUE' | 'VENDIDOS'>('TODOS');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('TODOS');

  // Modal Adicionar / Editar Veículo
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<VeiculoFormState>(INITIAL_FORM);
  const [fotosUpload, setFotosUpload] = useState<string[]>([]);
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Modal Registrar Venda
  const [veiculoParaVenda, setVeiculoParaVenda] = useState<VeiculoComLoja | null>(null);
  const [vendedorVendaNome, setVendedorVendaNome] = useState('');
  const [valorVendaInput, setValorVendaInput] = useState('');
  const [custoVendaInput, setCustoVendaInput] = useState('');
  const [dataVendaInput, setDataVendaInput] = useState('2026-11-17');
  const [registrandoVenda, setRegistrandoVenda] = useState(false);

  // Modal Destaque Stripe
  const [veiculoDestacar, setVeiculoDestacar] = useState<Veiculo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('automarket-user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.nome) setUsuarioLogadoNome(parsed.nome);
        if (parsed?.role === 'ADMIN') setIsAdmin(true);
      }
    } catch {
      // ignora erro de leitura local
    }
  }, []);

  const carregarVeiculos = useCallback(async () => {
    const token = localStorage.getItem('automarket-token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/veiculos?minhas=true&limite=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setVeiculos(json.data);
      } else {
        toast.error(json.error || 'Erro ao carregar veículos.');
      }
    } catch {
      toast.error('Erro de conexão ao buscar veículos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarVeiculos();
  }, [carregarVeiculos]);

  const vendedoresDisponiveis = useMemo(() => {
    const nomes = new Set<string>();
    for (const v of veiculos) {
      const cad = v.cadastradoPorNome || v.loja?.user?.nome || v.loja?.nome;
      if (cad) nomes.add(cad);
      if (v.vendidoPorNome) nomes.add(v.vendidoPorNome);
    }
    if (usuarioLogadoNome) nomes.add(usuarioLogadoNome);
    return Array.from(nomes);
  }, [veiculos, usuarioLogadoNome]);

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter((v) => {
      if (filtroStatus === 'ESTOQUE' && v.vendido) return false;
      if (filtroStatus === 'VENDIDOS' && !v.vendido) return false;
      if (filtroVendedor !== 'TODOS') {
        const cad = v.cadastradoPorNome || v.loja?.user?.nome || v.loja?.nome || '';
        const vend = v.vendidoPorNome || '';
        if (cad !== filtroVendedor && vend !== filtroVendedor) return false;
      }
      return true;
    });
  }, [veiculos, filtroStatus, filtroVendedor]);

  const abrirNovoModal = () => {
    setEditandoId(null);
    setForm({
      ...INITIAL_FORM,
      cadastradoPorNome: usuarioLogadoNome || 'Ricardo Silva',
    });
    setFotosUpload([]);
    setModalFormOpen(true);
  };

  const abrirEdicaoModal = (v: VeiculoComLoja) => {
    setEditandoId(v.id);
    let opcionaisStr = '';
    if (v.opcionais) {
      try {
        const parsed = JSON.parse(v.opcionais);
        opcionaisStr = Array.isArray(parsed) ? parsed.join(', ') : v.opcionais;
      } catch {
        opcionaisStr = v.opcionais;
      }
    }

    const galeria = extrairGaleriaDoVeiculo(v);
    setFotosUpload(galeria);

    setForm({
      marca: v.marca,
      modelo: v.modelo,
      versao: v.versao || '',
      ano: String(v.ano),
      anoModelo: v.anoModelo ? String(v.anoModelo) : String(v.ano),
      km: String(v.km),
      cambio: v.cambio,
      combustivel: v.combustivel,
      categoria: v.categoria,
      cor: v.cor || '',
      portas: v.portas ? String(v.portas) : '4',
      motor: v.motor || '',
      potencia: v.potencia || '',
      finalPlaca: v.finalPlaca || '',
      preco: String(v.preco),
      precoPromocional: v.precoPromocional ? String(v.precoPromocional) : '',
      precoCusto: v.precoCusto
        ? String(v.precoCusto)
        : String(Math.round(v.preco * 0.81)),
      cadastradoPorNome:
        v.cadastradoPorNome || v.loja?.user?.nome || usuarioLogadoNome || '',
      descricao: v.descricao || '',
      opcionais: opcionaisStr,
    });
    setModalFormOpen(true);
  };

  const handleSelecionarFotosDispositivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const listaArquivos = Array.from(files);
    if (fotosUpload.length + listaArquivos.length > 12) {
      toast.error('Você pode adicionar no máximo 12 fotos por veículo.');
      e.target.value = '';
      return;
    }

    setProcessandoFotos(true);
    try {
      const novasDataUrls: string[] = [];
      for (const file of listaArquivos) {
        if (!file.type.startsWith('image/')) {
          toast.error(`O arquivo "${file.name}" não é uma imagem válida.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`A foto "${file.name}" excede o limite de 10 MB.`);
          continue;
        }
        const dataUrl = await redimensionarFotoVeiculo(file);
        novasDataUrls.push(dataUrl);
      }

      if (novasDataUrls.length > 0) {
        setFotosUpload((prev) => [...prev, ...novasDataUrls]);
        toast.success(
          novasDataUrls.length === 1
            ? '1 foto adicionada à galeria do veículo!'
            : `${novasDataUrls.length} fotos adicionadas à galeria do veículo!`
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao processar fotos selecionadas.'
      );
    } finally {
      setProcessandoFotos(false);
      e.target.value = '';
    }
  };

  const handleDefinirFotoCapa = (index: number) => {
    if (index === 0) return;
    setFotosUpload((prev) => {
      const selecionada = prev[index];
      const restantes = prev.filter((_, i) => i !== index);
      return [selecionada, ...restantes];
    });
    toast.success('Foto definida como capa principal do anúncio.');
  };

  const handleRemoverFoto = (index: number) => {
    setFotosUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSalvarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('automarket-token');
    if (!token) return;

    if (fotosUpload.length === 0) {
      toast.error('Envie pelo menos 1 foto do veículo do seu dispositivo.');
      return;
    }

    setSalvando(true);
    try {
      const opcionaisArray = form.opcionais
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const precoNum = Number(form.preco);
      const custoNum = form.precoCusto
        ? Number(form.precoCusto)
        : Math.round(precoNum * 0.81);

      const payload: Record<string, unknown> = {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        versao: form.versao.trim() || undefined,
        ano: Number(form.ano),
        anoModelo: form.anoModelo ? Number(form.anoModelo) : undefined,
        km: Number(form.km),
        cambio: form.cambio,
        combustivel: form.combustivel,
        categoria: form.categoria,
        cor: form.cor.trim() || undefined,
        portas: form.portas ? Number(form.portas) : 4,
        motor: form.motor.trim() || undefined,
        potencia: form.potencia.trim() || undefined,
        finalPlaca: form.finalPlaca.trim().slice(0, 1) || undefined,
        preco: precoNum,
        precoPromocional: form.precoPromocional
          ? Number(form.precoPromocional)
          : null,
        precoCusto: custoNum,
        cadastradoPorNome:
          form.cadastradoPorNome.trim() || usuarioLogadoNome || 'Vendedor',
        imagemPrincipal: fotosUpload[0] || '',
        imagens: JSON.stringify(fotosUpload),
        descricao: form.descricao.trim() || undefined,
        opcionais:
          opcionaisArray.length > 0 ? JSON.stringify(opcionaisArray) : undefined,
      };

      const url = editandoId ? `/api/veiculos/${editandoId}` : '/api/veiculos';
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar veículo.');
      }

      toast.success(
        editandoId
          ? 'Veículo e galeria de fotos atualizados!'
          : 'Veículo cadastrado com sucesso no catálogo!'
      );
      setModalFormOpen(false);
      carregarVeiculos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar veículo.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalRegistrarVenda = (v: VeiculoComLoja) => {
    setVeiculoParaVenda(v);
    setVendedorVendaNome(
      v.cadastradoPorNome || v.loja?.user?.nome || usuarioLogadoNome || 'Ricardo Silva'
    );
    setValorVendaInput(String(v.precoPromocional || v.preco));
    setCustoVendaInput(
      String(v.precoCusto ?? Math.round(v.preco * 0.81))
    );
    setDataVendaInput('2026-11-17');
  };

  const handleConfirmarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veiculoParaVenda) return;

    const token = localStorage.getItem('automarket-token');
    if (!token) return;

    setRegistrandoVenda(true);
    try {
      const res = await fetch(`/api/veiculos/${veiculoParaVenda.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendido: true,
          vendidoPorNome: vendedorVendaNome.trim() || 'Vendedor',
          valorVenda: Number(valorVendaInput) || veiculoParaVenda.preco,
          precoCusto: Number(custoVendaInput) || Math.round(veiculoParaVenda.preco * 0.81),
          dataVenda: `${dataVendaInput}T12:00:00.000-03:00`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          `Venda registrada para ${vendedorVendaNome.trim() || 'o vendedor'}!`
        );
        setVeiculoParaVenda(null);
        carregarVeiculos();
      } else {
        toast.error(json.error || 'Erro ao registrar venda.');
      }
    } catch {
      toast.error('Erro de conexão ao registrar venda.');
    } finally {
      setRegistrandoVenda(false);
    }
  };

  const handleReativarVeiculo = async (v: VeiculoComLoja) => {
    const token = localStorage.getItem('automarket-token');
    if (!token) return;

    try {
      const res = await fetch(`/api/veiculos/${v.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendido: false }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Veículo reativado no estoque disponível.');
        carregarVeiculos();
      } else {
        toast.error(json.error || 'Erro ao reativar veículo.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  const handleExcluir = async (v: Veiculo) => {
    if (!confirm(`Deseja realmente remover ${v.marca} ${v.modelo}?`)) return;
    const token = localStorage.getItem('automarket-token');
    if (!token) return;

    try {
      const res = await fetch(`/api/veiculos/${v.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Veículo removido do catálogo.');
        carregarVeiculos();
      } else {
        toast.error(json.error || 'Erro ao excluir veículo.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-hairline">
        <div>
          <span className="eyebrow text-bronze-600">
            {isAdmin ? 'Auditoria Global de Catálogo & Vendedores' : 'Inventário da Loja'}
          </span>
          <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
            {isAdmin ? 'Catálogo Completo & Rastreio por Vendedor' : 'Meus Veículos'}
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Adicione diversas fotos diretamente do seu computador, acompanhe qual vendedor cadastrou e quem realizou cada venda.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovoModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-bronze-300" />
          Novo Veículo (Upload de Fotos)
        </button>
      </div>

      {/* Barra de Filtros por Status e Vendedor */}
      <div className="bg-surface rounded-card p-4 border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted mr-1">
            <Filter className="w-3.5 h-3.5 text-bronze-500" />
            Status:
          </span>
          {(
            [
              { id: 'TODOS', label: `Todos (${veiculos.length})` },
              {
                id: 'ESTOQUE',
                label: `Em Estoque (${veiculos.filter((v) => !v.vendido).length})`,
              },
              {
                id: 'VENDIDOS',
                label: `Vendidos (${veiculos.filter((v) => v.vendido).length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroStatus(tab.id)}
              className={`px-3 py-1.5 rounded-editorial text-xs font-semibold uppercase tracking-wider transition-colors ${
                filtroStatus === tab.id
                  ? 'bg-obsidian text-canvas'
                  : 'bg-canvas border border-hairline text-ink-secondary hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted whitespace-nowrap">
            Filtrar Vendedor:
          </label>
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="px-3 py-1.5 rounded-editorial border border-hairline bg-canvas text-xs font-semibold text-ink"
          >
            <option value="TODOS">Todos os Vendedores</option>
            {vendedoresDisponiveis.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-72 bg-surface rounded-card border border-hairline animate-pulse"
            />
          ))}
        </div>
      ) : veiculosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {veiculosFiltrados.map((v) => {
            const galeria = extrairGaleriaDoVeiculo(v);
            const vendedorCadastro =
              v.cadastradoPorNome || v.loja?.user?.nome || v.loja?.nome || 'Vendedor';
            const custo = v.precoCusto ?? Math.round(v.preco * 0.81);
            const valorFinal = v.valorVenda ?? v.precoPromocional ?? v.preco;

            return (
              <div
                key={v.id}
                className="bg-surface rounded-card overflow-hidden border border-hairline flex flex-col justify-between transition-colors hover:border-[#ABA394]"
              >
                <div>
                  <div className="relative h-48 bg-stone border-b border-hairline">
                    <img
                      src={
                        v.imagemPrincipal ||
                        galeria[0] ||
                        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'
                      }
                      alt={`${v.marca} ${v.modelo}`}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {v.destaque && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-editorial border border-bronze-400/40 bg-obsidian/90 text-bronze-300 text-[10px] font-semibold uppercase tracking-wider">
                          <Sparkles className="w-2.5 h-2.5" />
                          Destaque
                        </span>
                      )}
                      {v.vendido ? (
                        <span className="px-2.5 py-0.5 rounded-editorial bg-danger-700 text-canvas text-[10px] font-semibold uppercase tracking-wider">
                          Vendido
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-editorial bg-sage-700 text-canvas text-[10px] font-semibold uppercase tracking-wider">
                          Em Estoque
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-editorial bg-obsidian/85 text-canvas text-[10px] font-semibold tabular-nums">
                      {galeria.length} {galeria.length === 1 ? 'foto' : 'fotos'}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-bronze-600">{v.marca}</span>
                      {v.loja?.nome && (
                        <span className="text-[11px] text-ink-muted inline-flex items-center gap-1 truncate">
                          <Store className="w-3 h-3 text-bronze-500 shrink-0" />
                          {v.loja.nome}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-semibold text-2xl text-ink leading-tight mt-0.5">
                      {v.modelo}
                    </h3>
                    <p className="text-xs text-ink-muted truncate mt-0.5">
                      {v.versao || LABELS.categoria[v.categoria]}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-ink-secondary mt-2.5 tabular-nums">
                      <span>{v.ano}</span>
                      <span>•</span>
                      <span>{formatarKM(v.km)}</span>
                      <span>•</span>
                      <span>{LABELS.cambio[v.cambio] || v.cambio}</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-hairline flex items-baseline justify-between gap-2">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                          {v.vendido ? 'Valor da Venda (Entrada)' : 'Preço Anunciado'}
                        </span>
                        <span className="text-2xl font-serif font-bold tabular-nums text-ink">
                          {formatarPreco(valorFinal)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                          Custo (Saída)
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-ink-secondary">
                          {formatarPreco(custo)}
                        </span>
                      </div>
                    </div>

                    {/* Rastreabilidade do Vendedor */}
                    <div className="mt-3 p-2.5 rounded-editorial bg-canvas border border-hairline space-y-1 text-xs">
                      <p className="flex items-center justify-between gap-2">
                        <span className="text-ink-muted inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-bronze-500" />
                          Adicionado por:
                        </span>
                        <strong className="text-ink truncate">{vendedorCadastro}</strong>
                      </p>
                      {v.vendido && (
                        <>
                          <p className="flex items-center justify-between gap-2 pt-1 border-t border-hairline/70">
                            <span className="text-ink-muted inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-sage-700" />
                              Vendido por:
                            </span>
                            <strong className="text-sage-700 truncate">
                              {v.vendidoPorNome || vendedorCadastro}
                            </strong>
                          </p>
                          {v.dataVenda && (
                            <p className="flex items-center justify-between gap-2 text-[11px] text-ink-muted">
                              <span>Data da venda:</span>
                              <span className="tabular-nums font-medium text-ink">
                                {new Date(v.dataVenda).toLocaleDateString('pt-BR')}
                              </span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-hairline space-y-2.5">
                  {!v.destaque && !v.vendido && (
                    <button
                      type="button"
                      onClick={() => setVeiculoDestacar(v)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-editorial bg-bronze-500 hover:bg-bronze-600 text-canvas font-semibold text-[11px] uppercase tracking-[0.12em] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Destacar Anúncio (R$ 49,90)
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEdicaoModal(v)}
                      className="inline-flex items-center justify-center gap-1 py-2 rounded-editorial border border-hairline bg-canvas hover:border-ink text-ink font-semibold text-xs transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        v.vendido
                          ? handleReativarVeiculo(v)
                          : abrirModalRegistrarVenda(v)
                      }
                      className={`inline-flex items-center justify-center gap-1 py-2 rounded-editorial border font-semibold text-xs transition-colors ${
                        v.vendido
                          ? 'bg-sage-50 border-sage-600/30 text-sage-800 hover:bg-sage-100'
                          : 'bg-bronze-50 border-bronze-200 text-bronze-800 hover:bg-bronze-100'
                      }`}
                    >
                      {v.vendido ? (
                        <>
                          <Tag className="w-3 h-3" />
                          Reativar
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Vendido
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluir(v)}
                      className="inline-flex items-center justify-center gap-1 py-2 rounded-editorial border border-danger-500/30 bg-danger-50 hover:bg-danger-500 hover:text-white text-danger-700 font-semibold text-xs transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-card p-12 text-center border border-hairline">
          <Car className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <h3 className="text-2xl font-serif font-semibold text-ink">
            Nenhum veículo encontrado para este filtro
          </h3>
          <p className="text-sm text-ink-secondary mt-1 mb-5">
            Adicione um novo veículo com fotos do seu computador ou limpe os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={abrirNovoModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-editorial bg-obsidian text-canvas font-semibold text-xs uppercase tracking-[0.14em]"
          >
            <Plus className="w-4 h-4 text-bronze-300" />
            Cadastrar Novo Veículo
          </button>
        </div>
      )}

      {/* Modal Adicionar / Editar Veículo com Upload Múltiplo de Fotos */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-hairline max-w-3xl w-full overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-obsidian text-canvas border-b border-obsidian-border">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze-300 block">
                  Catálogo & Galeria de Fotos
                </span>
                <h2 className="text-2xl font-serif font-semibold">
                  {editandoId ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalFormOpen(false)}
                className="p-1.5 rounded-editorial border border-obsidian-border text-[#A39D92] hover:text-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarVeiculo} className="p-6 space-y-5">
              {/* Seção de Upload de Múltiplas Fotos do Dispositivo */}
              <div className="rounded-card border border-hairline bg-canvas p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="eyebrow text-bronze-600">
                      Galeria de Fotos do Veículo *
                    </span>
                    <h3 className="font-serif font-semibold text-xl text-ink">
                      Upload de Fotos do Computador ({fotosUpload.length}/12)
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      Selecione várias fotos de uma só vez direto do seu computador ou celular (JPG, PNG ou WEBP).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fotosInputRef.current?.click()}
                    disabled={processandoFotos}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-xs font-semibold uppercase tracking-[0.12em] transition-colors shrink-0 disabled:opacity-60"
                  >
                    {processandoFotos ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-bronze-300" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-bronze-300" />
                        Selecionar Fotos
                      </>
                    )}
                  </button>

                  <input
                    ref={fotosInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleSelecionarFotosDispositivo}
                    className="hidden"
                  />
                </div>

                {fotosUpload.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {fotosUpload.map((fotoUrl, index) => (
                      <div
                        key={`${index}-${fotoUrl.slice(0, 28)}`}
                        className={`group relative rounded-editorial overflow-hidden border bg-surface ${
                          index === 0
                            ? 'border-bronze-500 ring-2 ring-bronze-500/30'
                            : 'border-hairline'
                        }`}
                      >
                        <div className="aspect-[16/10] bg-stone relative">
                          <img
                            src={fotoUrl}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-editorial bg-obsidian/90 text-bronze-300 text-[9px] font-semibold uppercase tracking-wider">
                              <Star className="w-2.5 h-2.5 fill-bronze-300" />
                              Capa Principal
                            </span>
                          )}
                        </div>
                        <div className="p-2 flex items-center justify-between gap-1 bg-surface border-t border-hairline">
                          {index === 0 ? (
                            <span className="text-[10px] font-semibold text-bronze-600 truncate">
                              1ª Foto (Capa)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDefinirFotoCapa(index)}
                              className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary hover:text-bronze-600 truncate"
                            >
                              Definir Capa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoverFoto(index)}
                            title="Remover foto"
                            className="p-1 rounded text-danger-700 hover:bg-danger-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {fotosUpload.length < 12 && (
                      <button
                        type="button"
                        onClick={() => fotosInputRef.current?.click()}
                        className="aspect-[16/10] rounded-editorial border border-dashed border-hairline hover:border-bronze-500 bg-surface flex flex-col items-center justify-center gap-1.5 text-ink-secondary hover:text-ink transition-colors p-3"
                      >
                        <ImagePlus className="w-5 h-5 text-bronze-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          + Adicionar Fotos
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fotosInputRef.current?.click()}
                    className="w-full py-8 px-4 rounded-editorial border-2 border-dashed border-hairline hover:border-bronze-500 bg-surface flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-canvas border border-hairline flex items-center justify-center text-bronze-500">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      Clique aqui para escolher diversas fotos do veículo no seu computador
                    </p>
                    <p className="text-xs text-ink-muted">
                      Você pode selecionar várias imagens ao mesmo tempo (frente, traseira, interior, motor)
                    </p>
                  </button>
                )}
              </div>

              {/* Vendedor Responsável & Marca / Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Vendedor Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.cadastradoPorNome}
                    onChange={(e) =>
                      setForm({ ...form, cadastradoPorNome: e.target.value })
                    }
                    placeholder="Ex: Ricardo Silva"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Marca *
                  </label>
                  <select
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  >
                    {MARCAS_POPULARES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    placeholder="Ex: Corolla, Civic, Compass"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Versão
                </label>
                <input
                  type="text"
                  value={form.versao}
                  onChange={(e) => setForm({ ...form, versao: e.target.value })}
                  placeholder="Ex: 2.0 XEi Dynamic Force Flex CVT"
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Ano Fab. *
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2030}
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Ano Modelo
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={form.anoModelo}
                    onChange={(e) => setForm({ ...form, anoModelo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    KM *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Portas
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={5}
                    value={form.portas}
                    onChange={(e) => setForm({ ...form, portas: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Categoria *
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  >
                    {Object.entries(LABELS.categoria).map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Câmbio *
                  </label>
                  <select
                    value={form.cambio}
                    onChange={(e) => setForm({ ...form, cambio: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  >
                    {Object.entries(LABELS.cambio).map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Combustível *
                  </label>
                  <select
                    value={form.combustivel}
                    onChange={(e) => setForm({ ...form, combustivel: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  >
                    {Object.entries(LABELS.combustivel).map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    value={form.cor}
                    onChange={(e) => setForm({ ...form, cor: e.target.value })}
                    placeholder="Branco"
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Motor
                  </label>
                  <input
                    type="text"
                    value={form.motor}
                    onChange={(e) => setForm({ ...form, motor: e.target.value })}
                    placeholder="2.0 Turbo"
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Potência
                  </label>
                  <input
                    type="text"
                    value={form.potencia}
                    onChange={(e) => setForm({ ...form, potencia: e.target.value })}
                    placeholder="177cv"
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Final Placa
                  </label>
                  <input
                    type="text"
                    maxLength={1}
                    value={form.finalPlaca}
                    onChange={(e) => setForm({ ...form, finalPlaca: e.target.value })}
                    placeholder="7"
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    placeholder="149900"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Preço Promocional (opcional)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step="0.01"
                    value={form.precoPromocional}
                    onChange={(e) =>
                      setForm({ ...form, precoPromocional: e.target.value })
                    }
                    placeholder="144900"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Custo de Aquisição / Saída (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precoCusto}
                    onChange={(e) =>
                      setForm({ ...form, precoCusto: e.target.value })
                    }
                    placeholder="Ex: 120000"
                    className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Opcionais (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={form.opcionais}
                  onChange={(e) => setForm({ ...form, opcionais: e.target.value })}
                  placeholder="Ar Digital, Multimídia, Bancos em Couro, Teto Solar"
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descreva o estado de conservação, revisões e diferenciais..."
                  className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="px-4 py-2.5 rounded-editorial border border-hairline text-xs font-semibold uppercase tracking-wider text-ink-secondary hover:border-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || processandoFotos}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] disabled:opacity-60"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : editandoId ? (
                    'Salvar Alterações'
                  ) : (
                    'Cadastrar Veículo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Venda do Veículo (Atribuição de Vendedor + Entrada/Saída) */}
      {veiculoParaVenda && (
        <div className="fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-hairline max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-obsidian text-canvas border-b border-obsidian-border">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze-300 block">
                  Fechamento de Negócio
                </span>
                <h2 className="text-xl font-serif font-semibold">
                  Registrar Venda do Veículo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVeiculoParaVenda(null)}
                className="p-1.5 rounded-editorial border border-obsidian-border text-[#A39D92] hover:text-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarVenda} className="p-6 space-y-4">
              <div className="p-3.5 rounded-editorial bg-canvas border border-hairline">
                <p className="eyebrow text-bronze-600">{veiculoParaVenda.marca}</p>
                <p className="font-serif font-semibold text-xl text-ink">
                  {veiculoParaVenda.modelo} ({veiculoParaVenda.ano})
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Adicionado ao catálogo por:{' '}
                  <strong className="text-ink">
                    {veiculoParaVenda.cadastradoPorNome ||
                      veiculoParaVenda.loja?.user?.nome ||
                      veiculoParaVenda.loja?.nome}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Vendedor que realizou a venda *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    list="lista-vendedores-venda"
                    value={vendedorVendaNome}
                    onChange={(e) => setVendedorVendaNome(e.target.value)}
                    placeholder="Nome do vendedor"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
                  />
                  <datalist id="lista-vendedores-venda">
                    {vendedoresDisponiveis.map((vNome) => (
                      <option key={vNome} value={vNome} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Valor da Venda / Entrada (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-sage-700 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={1000}
                      step="0.01"
                      value={valorVendaInput}
                      onChange={(e) => setValorVendaInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm tabular-nums text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                    Custo / Saída (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={custoVendaInput}
                    onChange={(e) => setCustoVendaInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm tabular-nums text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Data da Venda *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-bronze-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={dataVendaInput}
                    onChange={(e) => setDataVendaInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm tabular-nums text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setVeiculoParaVenda(null)}
                  className="px-4 py-2.5 rounded-editorial border border-hairline text-xs font-semibold uppercase tracking-wider text-ink-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registrandoVenda}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-editorial bg-sage-700 hover:bg-sage-800 text-canvas font-semibold text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {registrandoVenda ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {veiculoDestacar && (
        <TransparentCheckoutModal
          isOpen={Boolean(veiculoDestacar)}
          onClose={() => setVeiculoDestacar(null)}
          tipo="DESTAQUE_VEICULO"
          veiculoId={veiculoDestacar.id}
          titulo={`Destaque de Anúncio: ${veiculoDestacar.marca} ${veiculoDestacar.modelo}`}
          valor={49.9}
          onSuccess={() => {
            setVeiculoDestacar(null);
            carregarVeiculos();
          }}
        />
      )}
    </div>
  );
}
