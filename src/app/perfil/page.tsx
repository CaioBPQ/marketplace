'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractiveSalesDashboard from '@/components/InteractiveSalesDashboard';
import { Loja, User } from '@/types';
import { formatarPreco, LABELS, STATUS_COLORS } from '@/lib/utils';
import {
  Camera,
  Car,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  User as UserIcon,
  Users,
} from 'lucide-react';

interface PerfilUser extends User {
  createdAt?: string;
  updatedAt?: string;
  loja?: Loja | null;
}

interface PerfilLeadItem {
  id: string;
  status: string;
  origem: string;
  mensagem?: string | null;
  createdAt: string;
  veiculo?: {
    id: string;
    marca: string;
    modelo: string;
    ano: number;
    preco: number;
    precoPromocional?: number | null;
    imagemPrincipal?: string | null;
  } | null;
  loja?: {
    id: string;
    nome: string;
    cidade: string;
    estado: string;
    whatsapp: string;
  } | null;
}

interface AdminStats {
  totalUsuarios: number;
  totalLojas: number;
  totalVeiculos: number;
  totalLeads: number;
  totalAgendamentos: number;
  ultimosUsuarios: {
    id: string;
    nome: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

const ROLE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  ADMIN: {
    label: 'Administrador',
    badgeClass: 'bg-bronze-500/20 text-bronze-300 border border-bronze-400/40',
  },
  LOJISTA: {
    label: 'Lojista / Revenda',
    badgeClass: 'bg-obsidian-soft text-bronze-300 border border-obsidian-border',
  },
  USUARIO: {
    label: 'Comprador / Cliente',
    badgeClass: 'bg-sage-800/70 text-[#B8D7C4] border border-sage-600/40',
  },
};

function redimensionarImagemParaDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 280;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
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
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const [perfil, setPerfil] = useState<PerfilUser | null>(null);
  const [meusLeads, setMeusLeads] = useState<PerfilLeadItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  const carregarPerfil = useCallback(async () => {
    const token = localStorage.getItem('automarket-token');
    if (!token) {
      router.replace('/login?redirect=/perfil');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('automarket-token');
        localStorage.removeItem('automarket-user');
        router.replace('/login?redirect=/perfil');
        return;
      }

      const json = await res.json();
      if (res.ok && json.success && json.data?.user) {
        const u: PerfilUser = json.data.user;
        setPerfil(u);
        setNome(u.nome || '');
        setTelefone(u.telefone || '');
        setAvatarUrl(u.avatarUrl || '');
        setMeusLeads(Array.isArray(json.data.meusLeads) ? json.data.meusLeads : []);
        setAdminStats(json.data.adminStats || null);
      } else {
        toast.error(json.error || 'Erro ao carregar perfil.');
      }
    } catch {
      toast.error('Erro de conexão ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  const handleUploadFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem (PNG, JPG ou WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5 MB.');
      return;
    }

    try {
      const dataUrl = await redimensionarImagemParaDataUrl(file);
      setAvatarUrl(dataUrl);
      toast.success('Foto carregada! Clique em "Salvar Alterações" para confirmar.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao processar imagem.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoverFoto = () => {
    setAvatarUrl('');
    toast('Foto removida. Salve as alterações para aplicar.', { icon: 'ℹ️' });
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();

    if (nome.trim().length < 2) {
      toast.error('O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    if (alterarSenha) {
      if (!senhaAtual) {
        toast.error('Informe sua senha atual.');
        return;
      }
      if (novaSenha.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (novaSenha !== confirmarNovaSenha) {
        toast.error('A confirmação da nova senha não confere.');
        return;
      }
    }

    const token = localStorage.getItem('automarket-token');
    if (!token) {
      router.replace('/login?redirect=/perfil');
      return;
    }

    setSalvando(true);
    try {
      const payload: Record<string, string | null> = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      };

      if (alterarSenha && novaSenha) {
        payload.senhaAtual = senhaAtual;
        payload.novaSenha = novaSenha;
      }

      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Não foi possível atualizar o perfil.');
        return;
      }

      const usuarioAtualizado: PerfilUser = {
        ...perfil,
        ...json.data,
      };
      setPerfil(usuarioAtualizado);

      localStorage.setItem(
        'automarket-user',
        JSON.stringify({
          id: usuarioAtualizado.id,
          nome: usuarioAtualizado.nome,
          email: usuarioAtualizado.email,
          telefone: usuarioAtualizado.telefone,
          role: usuarioAtualizado.role,
          avatarUrl: usuarioAtualizado.avatarUrl,
        })
      );
      window.dispatchEvent(new Event('automarket-auth-change'));

      if (alterarSenha) {
        setAlterarSenha(false);
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarNovaSenha('');
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro de conexão ao salvar perfil.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = async () => {
    setSaindo(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Prossegue com limpeza local
    } finally {
      localStorage.removeItem('automarket-token');
      localStorage.removeItem('automarket-user');
      document.cookie = 'automarket-token=; path=/; max-age=0';
      window.dispatchEvent(new Event('automarket-auth-change'));
      toast.success('Você saiu da sua conta.');
      router.push('/login');
      router.refresh();
    }
  };

  const roleBadge =
    ROLE_LABELS[perfil?.role || 'USUARIO'] || ROLE_LABELS.USUARIO;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-card bg-surface border border-hairline" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-96 rounded-card bg-surface border border-hairline" />
              <div className="lg:col-span-5 h-96 rounded-card bg-surface border border-hairline" />
            </div>
          </div>
        ) : !perfil ? (
          <div className="bg-surface rounded-card p-10 text-center border border-hairline">
            <p className="text-ink-secondary">
              Não foi possível carregar os dados do seu perfil.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-editorial bg-obsidian text-canvas font-semibold text-xs uppercase tracking-wider"
            >
              Fazer Login
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cartão Superior Obsidian */}
            <section className="rounded-card border border-obsidian-border bg-obsidian text-canvas p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={perfil.nome}
                        className="w-24 h-24 rounded-full object-cover border-2 border-bronze-400 bg-obsidian-soft"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-obsidian-soft text-bronze-300 border-2 border-bronze-400/50 flex items-center justify-center font-serif font-semibold text-4xl">
                        {nome?.charAt(0).toUpperCase() || <UserIcon className="w-9 h-9" />}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Alterar foto de perfil"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface text-ink flex items-center justify-center hover:bg-bronze-400 hover:text-canvas transition-colors border-2 border-obsidian"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUploadFoto}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-editorial text-[10px] font-semibold uppercase tracking-[0.14em] ${roleBadge.badgeClass}`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {roleBadge.label}
                      </span>
                      {perfil.createdAt && (
                        <span className="text-xs text-[#A39D92]">
                          Membro desde{' '}
                          {new Date(perfil.createdAt).toLocaleDateString('pt-BR', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-serif font-semibold mt-2">
                      {perfil.nome}
                    </h1>
                    <p className="text-xs text-[#A39D92] flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-bronze-300" />
                      {perfil.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {(perfil.role === 'LOJISTA' || perfil.role === 'ADMIN') && (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-editorial bg-bronze-500 hover:bg-bronze-400 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {perfil.role === 'ADMIN' ? 'Painel Admin & Balanço' : 'Painel da Loja'}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={saindo}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-editorial border border-obsidian-border bg-obsidian-soft hover:border-danger-500 hover:bg-danger-700 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors disabled:opacity-60"
                  >
                    {saindo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    Sair da Conta (Logout)
                  </button>
                </div>
              </div>
            </section>

            {perfil.role === 'ADMIN' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="eyebrow text-bronze-600">
                      Gestão Executiva &amp; Auditoria de Vendedores
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-ink">
                      Dashboard Interativo de Vendas, Balanço &amp; Agendamentos
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/veiculos"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-xs font-semibold uppercase tracking-wider transition-colors self-start"
                  >
                    <Car className="w-3.5 h-3.5 text-bronze-300" />
                    Ver Catálogo &amp; Fotos
                  </Link>
                </div>
                <InteractiveSalesDashboard defaultTab="BALANCO" compactHeader />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Formulário de Edição */}
              <section className="lg:col-span-7 bg-surface rounded-card p-6 sm:p-8 border border-hairline">
                <div className="pb-5 border-b border-hairline">
                  <span className="eyebrow text-bronze-600">Configurações da Conta</span>
                  <h2 className="text-2xl font-serif font-semibold text-ink mt-1">
                    Dados do Perfil
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Atualize seu nome, foto de exibição, telefone e senha de acesso.
                  </p>
                </div>

                <form onSubmit={handleSalvar} className="mt-6 space-y-5">
                  <div className="rounded-editorial bg-canvas border border-hairline p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="eyebrow text-ink">Foto de Perfil</p>
                        <p className="text-xs text-ink-secondary mt-0.5">
                          Envie uma imagem do seu dispositivo ou informe uma URL externa
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-[11px] font-semibold uppercase tracking-wider transition-colors"
                        >
                          <Upload className="w-3 h-3 text-bronze-300" />
                          Enviar Foto
                        </button>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoverFoto}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-editorial border border-danger-500/30 bg-surface hover:bg-danger-50 text-danger-700 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                        Ou cole a URL da imagem (opcional)
                      </label>
                      <input
                        type="text"
                        value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder={
                          avatarUrl.startsWith('data:')
                            ? 'Imagem carregada do dispositivo (clique em Remover para trocar por URL)'
                            : 'https://exemplo.com/minha-foto.jpg'
                        }
                        className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-surface text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                        Telefone / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full pl-10 pr-4 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary mb-1.5">
                      E-mail da Conta
                    </label>
                    <input
                      type="email"
                      disabled
                      value={perfil.email}
                      className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-stone text-ink-muted text-sm cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-3 border-t border-hairline">
                    <button
                      type="button"
                      onClick={() => setAlterarSenha((prev) => !prev)}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-bronze-600 hover:text-ink transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {alterarSenha ? 'Cancelar alteração de senha' : 'Alterar minha senha de acesso'}
                    </button>

                    {alterarSenha && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-editorial bg-canvas border border-hairline">
                        <div>
                          <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                            Senha Atual
                          </label>
                          <input
                            type="password"
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            placeholder="••••••"
                            className="w-full px-3 py-2 rounded-editorial border border-hairline bg-surface text-sm text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                            Nova Senha
                          </label>
                          <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Mín. 6 caracteres"
                            className="w-full px-3 py-2 rounded-editorial border border-hairline bg-surface text-sm text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                            Confirmar Nova
                          </label>
                          <input
                            type="password"
                            value={confirmarNovaSenha}
                            onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                            placeholder="Repita a senha"
                            className="w-full px-3 py-2 rounded-editorial border border-hairline bg-surface text-sm text-ink"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas font-semibold text-xs uppercase tracking-[0.14em] transition-colors disabled:opacity-60"
                    >
                      {salvando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-bronze-300" />
                          Salvar Alterações
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* Painel Lateral Contextual */}
              <aside className="lg:col-span-5 space-y-6">
                {perfil.role === 'USUARIO' && (
                  <div className="bg-surface rounded-card p-6 border border-hairline">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline">
                      <div>
                        <span className="eyebrow text-bronze-600">Histórico</span>
                        <h3 className="font-serif font-semibold text-xl text-ink">
                          Meus Interesses Enviados
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-editorial border border-hairline bg-canvas text-ink text-xs font-semibold tabular-nums">
                        {meusLeads.length}
                      </span>
                    </div>

                    {meusLeads.length > 0 ? (
                      <div className="space-y-3">
                        {meusLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-4 rounded-editorial border border-hairline bg-canvas space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-serif font-semibold text-lg text-ink leading-tight">
                                  {lead.veiculo
                                    ? `${lead.veiculo.marca} ${lead.veiculo.modelo} ${lead.veiculo.ano}`
                                    : 'Veículo'}
                                </p>
                                {lead.veiculo && (
                                  <p className="text-xs font-semibold tabular-nums text-bronze-600 mt-0.5">
                                    {formatarPreco(
                                      lead.veiculo.precoPromocional ||
                                        lead.veiculo.preco
                                    )}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-editorial text-[10px] font-semibold uppercase tracking-wider ${
                                  STATUS_COLORS[lead.status] ||
                                  'bg-stone text-ink'
                                }`}
                              >
                                {LABELS.statusLead[lead.status] || lead.status}
                              </span>
                            </div>

                            {lead.loja && (
                              <p className="text-xs text-ink-secondary flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-bronze-500" />
                                {lead.loja.nome} ({lead.loja.cidade}/{lead.loja.estado})
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-hairline/70">
                              <span className="text-[11px] tabular-nums text-ink-muted">
                                {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                              <div className="flex items-center gap-3">
                                {lead.veiculo && (
                                  <Link
                                    href={`/veiculos/${lead.veiculo.id}`}
                                    className="text-[11px] font-semibold uppercase tracking-wider text-ink hover:text-bronze-600"
                                  >
                                    Ver Veículo
                                  </Link>
                                )}
                                {lead.loja?.whatsapp && (
                                  <a
                                    href={`https://wa.me/${lead.loja.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-sage-700 hover:underline"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="w-9 h-9 text-ink-muted mx-auto mb-2" />
                        <p className="text-sm text-ink-secondary">
                          Você ainda não enviou propostas para veículos.
                        </p>
                        <Link
                          href="/veiculos"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-bronze-600 hover:text-ink"
                        >
                          Explorar veículos disponíveis →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {perfil.role === 'LOJISTA' && (
                  <div className="bg-surface rounded-card p-6 border border-hairline space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-editorial bg-obsidian text-bronze-300 flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="eyebrow text-bronze-600">Loja Vinculada</span>
                        <h3 className="font-serif font-semibold text-xl text-ink">
                          {perfil.loja?.nome || 'Minha Loja Parceira'}
                        </h3>
                        <p className="text-xs text-ink-muted">
                          {perfil.loja
                            ? `${perfil.loja.cidade}/${perfil.loja.estado} • Plano ${
                                LABELS.plano[perfil.loja.plano] || perfil.loja.plano
                              }`
                            : 'Gerencie estoque, leads e assinatura'}
                        </p>
                      </div>
                    </div>

                    {perfil.loja && (
                      <div className="rounded-editorial bg-canvas border border-hairline p-4 space-y-1.5 text-xs text-ink-secondary">
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sage-700" />
                          Assinatura:{' '}
                          <strong className="text-ink">
                            {perfil.loja.assinaturaAtiva ? 'Ativa' : 'Pendente'}
                          </strong>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-bronze-500" />
                          {perfil.loja.endereco}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <Link
                        href="/dashboard/veiculos"
                        className="py-2.5 px-3 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-xs font-semibold uppercase tracking-wider text-center transition-colors"
                      >
                        Meus Veículos
                      </Link>
                      <Link
                        href="/dashboard/loja"
                        className="py-2.5 px-3 rounded-editorial border border-hairline bg-canvas hover:border-ink text-ink text-xs font-semibold uppercase tracking-wider text-center transition-colors"
                      >
                        Editar Loja
                      </Link>
                    </div>
                  </div>
                )}

                {perfil.role === 'ADMIN' && adminStats && (
                  <div className="bg-surface rounded-card p-6 border border-hairline space-y-5">
                    <div className="pb-3 border-b border-hairline">
                      <span className="eyebrow text-bronze-600">Administração</span>
                      <h3 className="font-serif font-semibold text-xl text-ink mt-0.5">
                        Visão Geral da Plataforma
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-hairline border border-hairline rounded-editorial overflow-hidden">
                      <div className="p-4 bg-canvas">
                        <p className="eyebrow text-ink-muted">Usuários</p>
                        <p className="text-2xl font-serif font-bold tabular-nums text-ink mt-1">
                          {adminStats.totalUsuarios}
                        </p>
                      </div>
                      <div className="p-4 bg-canvas">
                        <p className="eyebrow text-ink-muted">Lojas Parceiras</p>
                        <p className="text-2xl font-serif font-bold tabular-nums text-ink mt-1">
                          {adminStats.totalLojas}
                        </p>
                      </div>
                      <div className="p-4 bg-canvas">
                        <p className="eyebrow text-ink-muted">Veículos Ativos</p>
                        <p className="text-2xl font-serif font-bold tabular-nums text-ink mt-1">
                          {adminStats.totalVeiculos}
                        </p>
                      </div>
                      <div className="p-4 bg-canvas">
                        <p className="eyebrow text-ink-muted">Leads / Agend.</p>
                        <p className="text-2xl font-serif font-bold tabular-nums text-ink mt-1">
                          {adminStats.totalLeads} / {adminStats.totalAgendamentos}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="eyebrow text-ink-muted mb-2.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Últimas Contas Cadastradas
                      </p>
                      <div className="divide-y divide-hairline border border-hairline rounded-editorial overflow-hidden">
                        {adminStats.ultimosUsuarios.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between gap-2 text-xs p-3 bg-canvas"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-ink truncate">
                                {u.nome}
                              </p>
                              <p className="text-ink-muted truncate">{u.email}</p>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded-editorial bg-surface border border-hairline text-[10px] font-semibold uppercase tracking-wider text-ink">
                              {u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
