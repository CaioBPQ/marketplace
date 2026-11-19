'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import InteractiveSalesDashboard from '@/components/InteractiveSalesDashboard';
import {
  AESTHETIC_THEMES,
  AestheticThemeKey,
  aplicarPresetMarca,
  BrandPresetId,
  lerBrandLocal,
  salvarBrandLocal,
  useBrandSwitcher,
} from '@/lib/company-brand';
import { Loja } from '@/types';
import {
  Store,
  Save,
  Loader2,
  Palette,
  Upload,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';

function redimensionarLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 260;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao processar logo.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

export default function DashboardLojaPage() {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const { activePresetId } = useBrandSwitcher();

  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [slogan, setSlogan] = useState(
    'Seminovos Selecionados • Linhares - ES'
  );
  const [tema, setTema] = useState<AestheticThemeKey>('RODRIGO_NEON_GREEN');
  const [logoUrl, setLogoUrl] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');

  const carregarDados = useCallback(async () => {
    const localBrand = lerBrandLocal();
    setSlogan(localBrand.slogan);
    setTema(localBrand.tema);
    if (localBrand.logoUrl) setLogoUrl(localBrand.logoUrl);

    setLoading(true);
    try {
      const resLoja = await fetch('/api/lojas?minha=true', {
        credentials: 'include',
      });

      if (resLoja.ok) {
        const jsonLoja = await resLoja.json();
        if (jsonLoja.success && jsonLoja.data) {
          const l: Loja = jsonLoja.data;
          setLoja(l);
          setNome(l.nome || localBrand.nome);
          setCnpj(l.cnpj || '');
          setDescricao(l.descricao || localBrand.descricao);
          setLogoUrl(l.logoUrl || localBrand.logoUrl || '');
          setEndereco(l.endereco || '');
          setCidade(l.cidade || '');
          setEstado(l.estado || '');
          setCep(l.cep || '');
          setTelefone(l.telefone || '');
          setWhatsapp(l.whatsapp || '');
          setEmail(l.email || '');
          setWebsite(l.website || '');
          setHorarioFuncionamento(l.horarioFuncionamento || '');
        }
      }
    } catch {
      toast.error('Erro ao carregar configurações da empresa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleUploadLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await redimensionarLogo(file);
      setLogoUrl(dataUrl);
      toast.success('Logo carregada! Clique em "Salvar Personalização" para aplicar.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar logo.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSelecionarTema = (novoTema: AestheticThemeKey) => {
    setTema(novoTema);
    salvarBrandLocal({ tema: novoTema });
    toast.success(`Estética "${AESTHETIC_THEMES[novoTema].nome}" aplicada!`);
  };

  const handleTrocarPresetWhiteLabel = (presetId: BrandPresetId) => {
    const applied = aplicarPresetMarca(presetId);
    setNome(applied.nome);
    setSlogan(applied.slogan);
    setTema(applied.tema);
    setLogoUrl(applied.logoUrl);
    setEndereco(applied.endereco);
    setCidade(applied.cidade);
    setEstado(applied.estado);
    setCep(applied.cep);
    setTelefone(applied.telefone);
    setWhatsapp(applied.whatsapp);
    setEmail(applied.email);
    setHorarioFuncionamento(applied.horarioFuncionamento);
    setDescricao(applied.descricao);
    toast.success(`Preset White-Label "${applied.nome}" ativado!`);
  };

  const handleSalvarLoja = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch('/api/lojas', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: loja?.id,
          nome: nome.trim(),
          cnpj: cnpj.replace(/\D/g, ''),
          descricao: descricao.trim() || null,
          logoUrl: logoUrl || null,
          endereco: endereco.trim(),
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase().slice(0, 2),
          cep: cep.replace(/\D/g, ''),
          telefone: telefone.replace(/\D/g, ''),
          whatsapp: whatsapp.replace(/\D/g, ''),
          email: email.trim(),
          website: website.trim() || '',
          horarioFuncionamento: horarioFuncionamento.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível atualizar os dados da empresa.');
      }

      setLoja(json.data);
      salvarBrandLocal({
        id: json.data.id,
        nome: nome.trim(),
        slogan: slogan.trim(),
        tema,
        logoUrl,
        endereco: endereco.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase().slice(0, 2),
        cep: cep.replace(/\D/g, ''),
        telefone: telefone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        horarioFuncionamento: horarioFuncionamento.trim(),
        descricao: descricao.trim(),
      });

      toast.success('Identidade e estética da empresa atualizadas em todo o site!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar empresa.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-96 bg-surface rounded-card border border-hairline" />
        <div className="h-64 bg-surface rounded-card border border-hairline" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-hairline">
        <span className="eyebrow text-bronze-600">
          Configuração do Template White-Label, Balanço &amp; Agenda
        </span>
        <h1 className="text-3xl font-serif font-semibold text-ink mt-1">
          Personalização da Empresa, Vendas &amp; Agendamentos
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Personalize o nome, logotipo, paleta estética e dados do showroom da empresa, além de acompanhar o balanço de vendas e agendamentos.
        </p>
      </div>

      {/* Dashboard Interativo de Vendas, Balanço por Período & Agendamentos */}
      <InteractiveSalesDashboard defaultTab="AGENDAMENTOS" compactHeader />

      {/* Formulário de Personalização da Identidade & Estética da Empresa */}
      <form
        onSubmit={handleSalvarLoja}
        className="bg-surface rounded-card p-6 sm:p-8 border border-hairline space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-hairline">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-editorial bg-obsidian text-bronze-300 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <span className="eyebrow text-bronze-600">
                Identidade Visual &amp; Showroom
              </span>
              <h2 className="font-serif font-semibold text-2xl text-ink">
                Personalizar Estética e Dados da Empresa
              </h2>
              <p className="text-xs text-ink-secondary">
                As alterações feitas aqui personalizam automaticamente o cabeçalho, rodapé, hero e páginas públicas do template.
              </p>
            </div>
          </div>
        </div>

        {/* Seletor Rápido de Preset White-Label + Paleta Estética */}
        <div className="rounded-card bg-canvas border border-hairline p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
            <div>
              <span className="eyebrow text-bronze-600 inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Presença White-Label Dinâmica
              </span>
              <h3 className="font-serif font-semibold text-xl text-ink mt-0.5">
                Perfis Prontos de Cliente &amp; Paleta da Marca
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTrocarPresetWhiteLabel('rodrigo-veiculos')}
                className={`px-3.5 py-2 rounded-editorial text-xs font-bold uppercase tracking-wider border transition-all ${
                  activePresetId === 'rodrigo-veiculos'
                    ? 'badge-brand-vibrant shadow-sm'
                    : 'bg-surface border-hairline text-ink hover:border-ink'
                }`}
              >
                Rodrigo Veículos (Linhares-ES)
              </button>
              <button
                type="button"
                onClick={() => handleTrocarPresetWhiteLabel('default')}
                className={`px-3.5 py-2 rounded-editorial text-xs font-semibold uppercase tracking-wider border transition-all ${
                  activePresetId === 'default'
                    ? 'bg-obsidian text-canvas border-obsidian'
                    : 'bg-surface border-hairline text-ink hover:border-ink'
                }`}
              >
                AutoMarket (Padrão)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {(Object.values(AESTHETIC_THEMES) as (typeof AESTHETIC_THEMES)[AestheticThemeKey][]).map(
              (item) => {
                const ativo = tema === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelecionarTema(item.key)}
                    className={`p-3.5 rounded-editorial border text-left transition-all ${
                      ativo
                        ? 'border-obsidian bg-surface ring-2 ring-obsidian/15'
                        : 'border-hairline bg-surface hover:border-ink-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: item. previewBg }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: item.accentPrimary }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: item.accentLight }}
                        />
                      </div>
                      {ativo && (
                        <span className="w-5 h-5 rounded-full bg-obsidian text-canvas flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="font-serif font-semibold text-base text-ink leading-tight">
                      {item.nome}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-1 leading-snug">
                      {item.descricao}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Upload de Logotipo + Nome e Slogan da Empresa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-canvas rounded-editorial border border-hairline p-4">
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-editorial bg-obsidian text-bronze-300 border border-obsidian-border flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-7 h-7" />
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                Logo da Empresa
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-editorial bg-obsidian hover:bg-bronze-500 text-canvas text-[11px] font-semibold uppercase tracking-wider transition-colors"
                >
                  <Upload className="w-3 h-3 text-bronze-300" />
                  Enviar Logo
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="p-1.5 rounded-editorial border border-danger-500/30 text-danger-700 hover:bg-danger-50"
                    title="Remover Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadLogo}
                className="hidden"
              />
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Nome da Empresa (Exibido no Topo/Rodapé) *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: AvantGarde Motors"
                className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-surface text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Slogan / Subtítulo Editorial
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Showroom Multimarcas & Seminovos Periciados"
                className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-surface text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              CNPJ da Empresa (14 dígitos) *
            </label>
            <input
              type="text"
              required
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm font-mono text-ink focus:outline-none focus:border-ink focus:bg-surface"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Horário de Funcionamento do Showroom
            </label>
            <input
              type="text"
              value={horarioFuncionamento}
              onChange={(e) => setHorarioFuncionamento(e.target.value)}
              placeholder="Seg-Sex: 8h às 18h | Sáb: 8h às 13h"
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
            Apresentação Institucional da Empresa (Hero &amp; Rodapé)
          </label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva a história, diferenciais, curadoria e garantias da empresa..."
            className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Endereço do Showroom *
            </label>
            <input
              type="text"
              required
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Cidade *
            </label>
            <input
              type="text"
              required
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:bg-surface"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                UF *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm uppercase text-ink"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                CEP *
              </label>
              <input
                type="text"
                required
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full px-3 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Telefone Comercial *
            </label>
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              WhatsApp de Vendas *
            </label>
            <input
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              E-mail Corporativo *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-editorial border border-hairline bg-canvas text-sm text-ink"
            />
          </div>
        </div>

        <div className="pt-3 flex justify-end border-t border-hairline">
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
                Salvar Personalização da Empresa
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
