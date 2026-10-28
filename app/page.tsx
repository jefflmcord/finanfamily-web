'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  PieChart,
  Users,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Bell,
  Lock,
  Layers,
  FileSpreadsheet,
  FileDown,
  AlertTriangle,
  PiggyBank,
  Calendar,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Flame,
  Share2,
  Check,
  BookOpen,
  Download,
  Loader2,
  ShoppingCart,
  FileCheck2,
  Upload,
  Smartphone,
  Car,
  Fuel,
} from 'lucide-react';
import { API_URL } from '@/lib/apiClient';
import { generateFinanFamilyEbookPdf } from '@/lib/ebookGenerator';

type HeroPreviewTab = 'overview' | 'kanban' | 'cards' | 'market' | 'contracts' | 'vehicles' | 'family';
type InterfaceTheme = 'dark' | 'light';

const getInterfaceTheme = (): InterfaceTheme =>
  typeof window !== 'undefined' && window.localStorage.getItem('@FinanFamily:theme') === 'light' ? 'light' : 'dark';

const subscribeToInterfaceTheme = (onChange: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onChange);
  window.addEventListener('finanfamily-theme-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('finanfamily-theme-change', onChange);
  };
};

const FAQ_ITEMS = [
  {
    question: 'Como funcionam os 10 dias grátis e os planos de assinatura?',
    answer:
      'Ao criar sua conta, sua família ganha 10 dias de teste grátis com acesso liberado a 100% das funcionalidades (Financeiro, Mercado & Compras, Contratos & Garantias, Gestão de Veículos e Importador Inteligente). Após o período de avaliação, você pode escolher entre o Plano Mensal por R$ 29,90/mês ou o Plano Anual por R$ 298,80/ano (que equivale a apenas R$ 24,90/mês em até 12x no cartão).',
  },
  {
    question: 'Como funciona o Módulo de Supermercado pelo celular?',
    answer:
      'Você monta a lista de compras em casa (ou usa nossos modelos prontos de Compra do Mês, Feira, Limpeza e Churrasco) e, no mercado, ativa o "Modo 1 Mão" no celular. Conforme coloca os itens no carrinho, o sistema soma o total em tempo real, avisa se o preço subiu em relação à última compra e, ao finalizar no caixa, lança a despesa automaticamente no seu orçamento.',
  },
  {
    question: 'Como funciona o Módulo de Gestão de Veículos da Família?',
    answer:
      'Você cadastra os carros ou motos da família, acompanha o consumo real em km/L a cada abastecimento, usa a calculadora Etanol vs. Gasolina na bomba do posto, recebe alertas de troca de óleo/revisão por quilometragem, tem o botão de ligar para o Guincho 24h e pode parcelar o IPVA ou Seguro direto no financeiro.',
  },
  {
    question: 'O que é o Módulo de Contratos, Assinaturas e Cofre de Garantias?',
    answer:
      'É a central que mostra quanto do orçamento da sua família já começa o mês comprometido com serviços recorrentes (Netflix, Internet, Escola, Academia, Seguros), avisa 30 dias antes do vencimento/reajuste de contratos e ainda guarda as Notas Fiscais e prazos de garantia dos eletrodomésticos e aparelhos da casa.',
  },
  {
    question: 'Posso importar faturas em PDF, Print de Tela ou extrato OFX/CSV?',
    answer:
      'Sim! O Importador Inteligente 4-em-1 lê arquivos OFX, planilhas CSV, faturas em PDF e até Prints de Tela (OCR) do aplicativo do seu banco, sugerindo automaticamente a categoria de cada compra.',
  },
  {
    question: 'Como funciona o compartilhamento com meu cônjuge ou familiares?',
    answer:
      'Ao criar sua conta, um ambiente exclusivo da sua família é provisionado automaticamente. Você pode enviar convites por link para seu parceiro(a) ou filhos e definir permissões individuais para cada pessoa.',
  },
  {
    question: 'Meus dados financeiros ficam seguros?',
    answer:
      'Totalmente. Utilizamos isolamento Multi-Tenant por família, criptografia de senhas, autenticação oficial Google OAuth 2.0 e controle rigoroso de permissões em todas as rotas.',
  },
];

export default function LandingPage() {
  const [activePreviewTab, setActivePreviewTab] = useState<HeroPreviewTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estado da Isca Digital (E-book 10 Passos)
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState('');

  const theme = useSyncExternalStore<InterfaceTheme>(subscribeToInterfaceTheme, getInterfaceTheme, () => 'dark');

  useEffect(() => {
    fetch(`${API_URL}/?warmup=1`, { method: 'GET', keepalive: true }).catch(() => {});
  }, []);

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleDownloadEbook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');

    const cleanEmail = leadEmail.trim().toLowerCase();
    const digits = leadWhatsapp.replace(/\D/g, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLeadError('Informe um e-mail válido para receber e baixar o e-book.');
      return;
    }
    if (digits.length < 10) {
      setLeadError('Informe seu WhatsApp completo com DDD.');
      return;
    }

    setSubmittingLead(true);
    try {
      await fetch(`${API_URL}/api/public/leads/ebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim() || 'Visitante',
          email: cleanEmail,
          whatsapp: leadWhatsapp.trim(),
        }),
      });
    } catch {
      // Mesmo se o servidor estiver acordando, liberamos o PDF imediatamente para não travar a conversão
    } finally {
      generateFinanFamilyEbookPdf(leadName.trim() || 'Sua Família');
      setLeadSuccess(true);
      setSubmittingLead(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('@FinanFamily:theme', nextTheme);
    document.documentElement.classList.toggle('theme-light', nextTheme === 'light');
    window.dispatchEvent(new Event('finanfamily-theme-change'));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ================= NAVBAR FIXA ================= */}
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Finan<span className="text-emerald-400">Family</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS 2.0
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#plataforma" className="hover:text-emerald-400 transition-colors">
              Painel Interativo
            </a>
            <a
              href="#ebook"
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 font-extrabold"
            >
              <BookOpen className="w-4 h-4" />
              E-book Grátis
            </a>
            <a href="#recursos" className="hover:text-emerald-400 transition-colors">
              Funcionalidades
            </a>
            <a href="#casais" className="hover:text-emerald-400 transition-colors">
              Para Famílias
            </a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">
              Planos
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-bold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login?mode=register"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
            >
              <span>Testar 10 Dias Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(prev => !prev)}
              aria-label="Abrir menu"
              className="lg:hidden p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-slate-900 px-6 py-5 space-y-4">
            <div className="flex flex-col space-y-3 text-sm font-semibold text-slate-200">
              <a href="#plataforma" onClick={() => setMobileNavOpen(false)} className="py-1 hover:text-emerald-400">
                Painel Interativo
              </a>
              <a href="#recursos" onClick={() => setMobileNavOpen(false)} className="py-1 hover:text-emerald-400">
                Funcionalidades
              </a>
              <a href="#casais" onClick={() => setMobileNavOpen(false)} className="py-1 hover:text-emerald-400">
                Para Famílias
              </a>
              <a href="#como-funciona" onClick={() => setMobileNavOpen(false)} className="py-1 hover:text-emerald-400">
                Como Funciona
              </a>
              <a
                href="#ebook"
                onClick={() => setMobileNavOpen(false)}
                className="py-1 text-emerald-400 font-bold flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> E-book Grátis (10 Passos)
              </a>
              <a href="#planos" onClick={() => setMobileNavOpen(false)} className="py-1 hover:text-emerald-400">
                Planos & Preços
              </a>
              <a href="#faq" onClick={() => setMobileNavOpen(false)} className="py-1 hover:text-emerald-400">
                Dúvidas Frequentes
              </a>
            </div>
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-xl border border-slate-700 text-sm font-bold text-white"
              >
                Já tenho conta (Entrar)
              </Link>
              <Link
                href="/login?mode=register"
                className="w-full text-center py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-extrabold"
              >
                Testar 10 Dias Grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION + PREVIEW INTERATIVO ================= */}
      <section id="plataforma" className="relative pt-32 pb-20 md:pt-36 md:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Glows de fundo */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-emerald-500/15 via-sky-500/10 to-indigo-500/10 blur-3xl rounded-full" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>10 dias grátis com acesso total • A partir de R$ 24,90/mês no plano anual</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12] mb-6">
            A inteligência financeira da sua família,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
              com clareza e visão de futuro.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-3xl mx-auto mb-9 leading-relaxed font-medium">
            Abandone as planilhas soltas. Controle contas no Kanban, projete seu saldo para 12 meses, faça a{' '}
            <strong className="text-emerald-300">lista de supermercado no celular com calculadora em tempo real</strong>
            , gerencie <strong className="text-emerald-300">contratos, streamings e garantias da casa</strong> e importe
            faturas em <strong className="text-emerald-300">PDF, Print ou OFX</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/login?mode=register"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 py-4 rounded-2xl flex items-center justify-center gap-2.5 text-base transition-all shadow-[0_8px_30px_rgba(16,185,129,0.35)] hover:scale-[1.02]"
            >
              Começar 10 Dias Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#ebook"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-emerald-300 font-extrabold px-7 py-4 rounded-2xl border border-emerald-500/40 flex items-center justify-center gap-2 transition-all text-base shadow-sm"
            >
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Baixar E-book Grátis (10 Passos)
            </a>
          </div>

          {/* Métricas rápidas de confiança */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-400 mb-12">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 10 dias grátis para testar tudo
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mercado Mobile + Contratos & Garantias
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Importação PDF, Print (OCR) e OFX
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Até 12x no cartão no plano anual
            </span>
          </div>

          {/* ================= MOCKUP INTERATIVO COM ABAS ================= */}
          <div className="max-w-5xl mx-auto">
            {/* Seletor de Abas do Preview */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
              {(
                [
                  { id: 'overview', label: 'Visão Geral & Projeção 12m', icon: TrendingUp },
                  { id: 'kanban', label: 'Kanban & Baixa em Lote', icon: Layers },
                  { id: 'market', label: 'Mercado & Carrinho Mobile', icon: ShoppingCart },
                  { id: 'contracts', label: 'Contratos & Garantias', icon: FileCheck2 },
                  { id: 'vehicles', label: 'Veículos & Combustível', icon: Car },
                  { id: 'cards', label: 'Cartões & Orçamentos', icon: CreditCard },
                  { id: 'family', label: 'Provisões & Família', icon: Users },
                ] as { id: HeroPreviewTab; label: string; icon: any }[]
              ).map(tab => {
                const Icon = tab.icon;
                const active = activePreviewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePreviewTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Moldura do Notebook */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-t-3xl p-3 sm:p-5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] relative z-10">
              {/* Barra do Navegador */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  finanfamily.com.br/dashboard
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Multi-Tenant Ativo
                </div>
              </div>

              {/* Tela Interna do Sistema */}
              <div className="bg-slate-950 rounded-xl border border-slate-800/90 p-4 sm:p-6 text-left grid grid-cols-12 gap-4 sm:gap-6 text-slate-50 min-h-[370px]">
                {/* Sidebar do Mockup */}
                <div className="hidden md:flex md:col-span-3 flex-col justify-between bg-slate-900/70 rounded-xl p-4 border border-slate-800/60">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="font-bold text-sm text-white">
                        Finan<span className="text-emerald-400">Family</span>
                      </span>
                    </div>
                    <div className="bg-emerald-500 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-lg text-center">
                      + Novo Lançamento
                    </div>
                    <div className="space-y-1 pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('overview')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'overview'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Visão Geral & 12m
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('kanban')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'kanban'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Contas a Pagar (Kanban)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('market')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'market'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🛒 Mercado & Compras
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('contracts')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'contracts'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🛡️ Contratos & Garantias
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('vehicles')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'vehicles'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🚗 Veículos & Combustível
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('cards')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'cards'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Cartões & Orçamentos
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTab('family')}
                        className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          activePreviewTab === 'family'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Provisões & Família
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      F&S
                    </div>
                    <div className="text-[11px]">
                      <p className="text-white font-semibold">Família Silva</p>
                      <p className="text-slate-400">3 membros • Sincronizado</p>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Dinâmico da Aba Selecionada */}
                <div className="col-span-12 md:col-span-9 space-y-4">
                  {activePreviewTab === 'overview' && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                          <span className="text-[11px] text-slate-400 block">Saldo em Contas</span>
                          <p className="text-sm sm:text-base font-extrabold text-white mt-1">R$ 18.450,00</p>
                          <span className="text-[10px] text-sky-400 mt-1 block">3 contas ativas</span>
                        </div>
                        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                          <span className="text-[11px] text-slate-400 block">A Receber (Mês)</span>
                          <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">R$ 14.200,00</p>
                          <span className="text-[10px] text-emerald-400/80 mt-1 block">100% recebido</span>
                        </div>
                        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                          <span className="text-[11px] text-slate-400 block">A Pagar (Mês)</span>
                          <p className="text-sm sm:text-base font-extrabold text-rose-400 mt-1">R$ 6.840,00</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">Comprometido: 48%</span>
                        </div>
                        <div className="bg-slate-900/90 border border-amber-500/20 p-3 rounded-xl">
                          <span className="text-[11px] text-amber-300 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Dinheiro Queimado
                          </span>
                          <p className="text-sm sm:text-base font-extrabold text-amber-400 mt-1">R$ 0,00</p>
                          <span className="text-[10px] text-emerald-400 mt-1 block">Zero juros pagos!</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-7 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs font-bold text-white">Projeção do Saldo Futuro (12 meses)</p>
                              <p className="text-[10px] text-slate-400">Baseado no saldo atual + contas a vencer</p>
                            </div>
                            <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Em 12m: R$ 46.800
                            </span>
                          </div>
                          <div className="h-28 flex items-end gap-2 pt-3 px-1">
                            {[38, 44, 52, 49, 61, 68, 74, 79, 85, 90, 95, 100].map((h, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  style={{ height: `${h}%` }}
                                  className={`w-full rounded-t-sm ${
                                    i === 11
                                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                      : 'bg-emerald-500/35'
                                  }`}
                                />
                                <span className="text-[8px] text-slate-400">
                                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-5 bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">Comprometimento da Renda</p>
                            <p className="text-[10px] text-slate-400">Indicador de saúde financeira da família</p>
                          </div>
                          <div className="my-2 text-center">
                            <p className="text-2xl font-black text-emerald-400">48,1%</p>
                            <p className="text-xs font-bold text-emerald-300">Nível Moderado & Saudável</p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] border-t border-slate-800 pt-2.5">
                            <span className="text-slate-400">Taxa de Poupança:</span>
                            <strong className="text-emerald-400">51,9% (+R$ 7.360)</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activePreviewTab === 'kanban' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                            2 selecionados
                          </span>
                          <span className="text-slate-400">Baixa em lote com cálculo de encargos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">PDF</span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">XLSX</span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950">
                            Baixar selecionados
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-rose-500/25 bg-slate-900/60 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-rose-400">Atrasado (1)</span>
                            <span className="text-slate-400">R$ 189,90</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-500/30 space-y-1">
                            <p className="text-xs font-bold text-white">Internet Fibra</p>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-rose-400">Venceu ontem</span>
                              <span className="font-bold text-rose-400">R$ 189,90</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-amber-500/25 bg-slate-900/60 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-amber-400">A pagar (2)</span>
                            <span className="text-slate-400">R$ 3.450,00</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <p className="text-xs font-bold text-white">Condomínio & Água</p>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-amber-300">Dia 10/11</span>
                              <span className="font-bold text-white">R$ 950,00</span>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <p className="text-xs font-bold text-white">Colégio dos Filhos</p>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-amber-300">Dia 15/11</span>
                              <span className="font-bold text-white">R$ 2.500,00</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-500/25 bg-slate-900/60 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-400">Pago (2)</span>
                            <span className="text-slate-400">R$ 3.200,00</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70 space-y-1 opacity-75">
                            <p className="text-xs font-bold text-slate-300 line-through">Financiamento Imóvel</p>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-emerald-400">Pago via Itaú</span>
                              <span className="font-bold text-slate-400">R$ 2.800,00</span>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70 space-y-1 opacity-75">
                            <p className="text-xs font-bold text-slate-300 line-through">Energia Elétrica</p>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-emerald-400">Pago via Nubank</span>
                              <span className="font-bold text-slate-400">R$ 400,00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'cards' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Faturas & Limites de Cartões</p>
                          <span className="text-[10px] font-bold text-sky-400">Fechamento Automático</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Nubank Ultravioleta</span>
                            <span className="text-emerald-400 font-bold">Fecha dia 10 • Vence 17</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-sky-400 h-full w-[38%]" />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Fatura atual: R$ 3.800,00</span>
                            <span>Livre: R$ 6.200,00</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Itaú Personnalité Visa</span>
                            <span className="text-emerald-400 font-bold">Fecha dia 05 • Vence 12</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full w-[22%]" />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Fatura atual: R$ 2.200,00</span>
                            <span>Livre: R$ 7.800,00</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Orçamento Mensal por Categoria</p>
                          <span className="text-[10px] font-bold text-amber-300">Alertas em 80%</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-white">Supermercado</span>
                              <span className="text-slate-400">R$ 1.500 / R$ 2.000</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[75%]" />
                            </div>
                            <p className="text-[10px] text-emerald-400 mt-1">75% do limite utilizado</p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-white">Restaurantes & Delivery</span>
                              <span className="text-slate-400">R$ 850 / R$ 1.000</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full w-[85%]" />
                            </div>
                            <p className="text-[10px] text-amber-300 mt-1">
                              Atenção: você já usou 85% do limite mensal
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'market' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                            Modo 1 Mão no Corredor (Mobile)
                          </p>
                          <span className="text-[10px] font-bold text-emerald-400">Orçamento: R$ 800</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-300 line-through">Arroz Branco 5kg</p>
                            <p className="text-[10px] text-slate-400">2x R$ 28,90 • Mercearia</p>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-400">R$ 57,80</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">Azeite Extra Virgem 500ml</p>
                            <p className="text-[10px] text-amber-300">Subiu +8% vs última compra</p>
                          </div>
                          <span className="text-xs font-extrabold text-white">R$ 39,90</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-300">Subtotal no Carrinho</span>
                          <span className="text-sm font-black text-emerald-400">R$ 462,40 (57%)</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white">Fechamento 1-Clique no Caixa</p>
                            <ShoppingCart className="w-4 h-4 text-sky-400" />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Ao finalizar a compra no celular, o valor real gasto já vira lançamento no seu Cartão ou
                            Conta Bancária e salva o histórico de preços dos produtos.
                          </p>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Economia vs Orçamento:</span>
                              <strong className="text-emerald-400">+ R$ 337,60 poupados</strong>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Lançado em:</span>
                              <strong className="text-sky-400">Nubank Ultravioleta</strong>
                            </div>
                          </div>
                        </div>
                        <div className="bg-emerald-500 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-lg text-center">
                          ✓ Compra Finalizada e Lançada no Financeiro
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'contracts' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Contratos Fixos & Assinaturas</p>
                          <span className="text-[10px] font-bold text-amber-300">Custo Anual: R$ 8.613</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Seguro Residencial Porto</span>
                            <span className="text-amber-300 font-bold">Renova em 14d</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Índice IPCA • Fidelidade até Nov/2026</span>
                            <span className="text-white font-bold">R$ 89,90/mês</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Internet Fibra 600 Mega + Streamings</span>
                            <span className="text-emerald-400 font-bold">Ativo</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Gera 12 parcelas no financeiro em 1 clique</span>
                            <span className="text-white font-bold">R$ 219,80/mês</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Cofre de Garantias & Notas Fiscais</p>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Geladeira Inverter Samsung</span>
                            <span className="text-emerald-400 font-bold">248 dias restantes</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            NF-e #0049182 • Fast Shop • Garantia Estendida Ativa
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Smart TV 65&quot; 4K LG</span>
                            <span className="text-amber-300 font-bold">Vence em 19 dias!</span>
                          </div>
                          <p className="text-[10px] text-amber-300/90">
                            Alerta preventivo antes do término da garantia de fábrica
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'vehicles' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-emerald-400" />
                            Jeep Compass • ABC-1D23
                          </p>
                          <span className="text-[10px] font-bold text-sky-400">Média: 11,4 km/L</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Odômetro: 39.420 km</span>
                            <span className="text-amber-300 font-bold">Revisão em 580 km</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Próx. troca de óleo aos 40.000 km • Alerta Preventivo Ativo
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-emerald-300">Calculadora na Bomba (70%)</span>
                            <span className="text-emerald-400 font-extrabold">Etanol Compensa!</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Etanol R$ 3,79 vs Gasolina R$ 5,79 (Paridade: 65,4%)
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">IPVA, Seguro Auto & Guincho 24h</p>
                          <Fuel className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">IPVA + Licenciamento 2026</span>
                            <span className="text-emerald-400 font-bold">5x R$ 980,00</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Parcelas geradas em Contas a Pagar com 1 clique
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Porto Seguro Auto • Apólice Ativa</span>
                            <span className="text-rose-300 font-bold">📞 Guincho 24h</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Botão de emergência 1-toque no celular + Alerta de renovação
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'family' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Provisões Anuais (IPVA, IPTU, Matrícula)</p>
                          <PiggyBank className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">IPVA + Seguro Auto 2027</span>
                            <span className="text-emerald-400 font-bold">R$ 450/mês</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full w-[66%]" />
                          </div>
                          <p className="text-[10px] text-slate-400">Reservado: R$ 3.600 de R$ 5.400</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white">Viagem de Férias da Família</span>
                            <span className="text-emerald-400 font-bold">80% concluído</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-sky-400 h-full w-[80%]" />
                          </div>
                          <p className="text-[10px] text-slate-400">Acumulado: R$ 12.000 de R$ 15.000</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Membros & Permissões da Família</p>
                          <Users className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">Jefferson (Responsável)</p>
                              <p className="text-[10px] text-slate-400">Acesso Total • Proprietário</p>
                            </div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                              OWNER
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">Camila (Cônjuge)</p>
                              <p className="text-[10px] text-slate-400">Criar, Editar e Baixar Lançamentos</p>
                            </div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300">
                              MEMBRO
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Base inferior do Notebook */}
            <div className="h-4 bg-slate-800 rounded-b-2xl mx-auto w-[96%] border-b border-slate-700 shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ================= ISCA DIGITAL EM DESTAQUE: E-BOOK GRATUITO (10 PASSOS) ================= */}
      <section
        id="ebook"
        className="py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 border-t border-slate-800/80 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_25px_80px_rgba(16,185,129,0.16)] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Coluna Esquerda: Abordagem Confrontante + Mockup 3D do E-book */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Chega de trabalhar o mês inteiro só para pagar boletos</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Cansado de lutar contra as dívidas e{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-400 to-teal-300">
                  ver o dinheiro da família sumir todo mês?
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                O salário cai na conta e em poucos dias já desapareceu entre faturas de cartão, parcelamentos e juros?
                Viver no limite não precisa ser o destino da sua casa. Baixe gratuitamente o nosso guia de resgate
                financeiro com os{' '}
                <strong className="text-white">10 Passos Práticos para Arrumar sua Vida Financeira</strong> e retome o
                controle hoje mesmo.
              </p>

              {/* Card visual simulando a capa do E-book + Tópicos de impacto */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-2">
                <div className="sm:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative">
                  <div className="w-2 h-full bg-emerald-500/50 absolute left-0 inset-y-0 rounded-l-2xl" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-2">
                    E-BOOK GRATUITO • FINANFAMILY
                  </span>
                  <p className="text-lg font-black text-white leading-snug mb-3">
                    10 Passos para Organizar a Vida Financeira da Família
                  </p>
                  <p className="text-[11px] text-slate-400 mb-4">
                    O plano de ação direto ao ponto para sair do sufoco das dívidas e fazer o dinheiro sobrar.
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <FileDown className="w-3.5 h-3.5" /> PDF Completo • Download na Hora
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-2.5 text-sm text-slate-200">
                  {[
                    'Onde o seu dinheiro está vazando: como estancar juros, multas e gastos invisíveis',
                    'Como sair da bola de neve do cartão de crédito e dos parcelamentos acumulados',
                    'O plano prático para alinhar o casal em 15 minutos sem brigas por dinheiro',
                    'Como blindar sua casa contra IPVA, IPTU e despesas que destroem o começo do ano',
                    'Como sair do vermelho e projetar sobra real nos próximos 12 meses',
                  ].map(topic => (
                    <div key={topic} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Formulário de Captura de Lead */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
              {leadSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Seu E-book foi gerado com sucesso!</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    O download do arquivo <strong className="text-emerald-400">Ebook-10-Passos-FinanFamily.pdf</strong>{' '}
                    começou automaticamente no seu dispositivo.
                  </p>
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => generateFinanFamilyEbookPdf(leadName.trim() || 'Sua Família')}
                      className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      Baixar o PDF Novamente
                    </button>
                    <Link
                      href="/login?mode=register"
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      Colocar em Prática: Testar 10 Dias Grátis
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDownloadEbook} className="space-y-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                      100% Gratuito • Leitura de 5 Minutos
                    </span>
                    <h3 className="text-lg font-extrabold text-white">
                      Dê o primeiro passo para arrumar suas finanças
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Informe seu nome, e-mail e WhatsApp abaixo para liberar o download imediato do E-book em PDF.
                    </p>
                  </div>

                  {leadError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
                      {leadError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Seu Nome
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      placeholder="Como podemos te chamar?"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Seu Melhor E-mail
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={160}
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Seu WhatsApp (com DDD)
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={20}
                      value={leadWhatsapp}
                      onChange={e => setLeadWhatsapp(formatPhoneInput(e.target.value))}
                      placeholder="(41) 99999-9999"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:scale-[1.01] disabled:opacity-60 cursor-pointer"
                  >
                    {submittingLead ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Preparando seu PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Quero Arrumar Minha Vida Financeira (PDF)
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    Seus dados estão seguros. Zero spam.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= BENTO GRID: FUNCIONALIDADES EXCLUSIVAS ================= */}
      <section id="recursos" className="py-24 px-4 sm:px-6 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
              <span>Muito além do básico</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ferramentas de inteligência financeira feitas para a vida real da família
            </h2>
            <p className="text-slate-400 text-base">
              Cada detalhe do FinanFamily foi desenhado para eliminar o trabalho manual e responder rapidamente:
              &quot;Quanto temos livre este mês e como estaremos daqui a um ano?&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Projeção de Saldo para 12 Meses</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Saiba exatamente qual será o menor saldo projetado do ano combinando o saldo bancário atual com todas
                  as parcelas e contas futuras.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Menor saldo nos próx. 12m</span>
                  <span className="text-base font-black text-emerald-400">R$ 8.420,00 (Sempre no azul)</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Detector de &quot;Dinheiro Queimado&quot;</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Pagou uma conta com atraso? Ao informar o valor pago na baixa, o sistema calcula automaticamente os
                  juros, multas e encargos para você estancar desperdícios.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Multas e Juros no Ano</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 font-extrabold">
                  Rastreado automaticamente
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Cálculo Automático de Faturas</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Informe o dia de fechamento e vencimento do cartão: o sistema lança cada compra ou parcelamento na
                  fatura correta e mostra o gráfico de pizza por categoria.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Compra após o fechamento?</span>
                <span className="text-sky-400 font-bold">Vai p/ próxima fatura sozinho</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Provisões Anuais & Objetivos</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Prepare-se para IPVA, IPTU, material escolar e férias diluindo o valor em parcelas mensais na
                  categoria &quot;Investimento&quot;.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white font-bold">Provisão IPVA + IPTU</span>
                  <span className="text-emerald-400 font-bold">100% planejado</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-4/5" />
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Convites & Permissões por Membro</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Convide membros da família e escolha exatamente o que cada pessoa pode fazer: visualizar, lançar,
                  editar, excluir ou baixar contas.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Controle de Acesso</span>
                <span className="text-purple-300 font-bold">9 permissões granulares</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fechamento em PDF, Excel e WhatsApp</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Exporte relatórios filtrados em PDF ou Excel (.xlsx) e compartilhe o Resumo Mensal da Família direto
                  no grupo de WhatsApp de casa.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <FileDown className="w-4 h-4 text-emerald-400" /> PDF & XLSX
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Share2 className="w-3.5 h-3.5" /> Resumo 1-clique
                </span>
              </div>
            </div>

            {/* Card 7: Módulo Mercado Mobile */}
            <div className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold uppercase text-emerald-300">
                Novo • Mobile-First
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Supermercado & Carrinho Mobile (1 Mão)</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Monte a lista com modelos prontos, use no celular pelo corredor com uma só mão, acompanhe o subtotal
                  em tempo real, compare a inflação dos produtos e lance a compra no financeiro em 1 clique.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Modo Corredor 1 Mão
                </span>
                <span className="text-emerald-400 font-bold">Histórico de Preços</span>
              </div>
            </div>

            {/* Card 8: Módulo Contratos, Assinaturas e Garantias */}
            <div className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold uppercase text-emerald-300">
                Novo • Patrimônio
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Contratos, Streamings & Cofre de Garantias</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Controle assinaturas, seguros e serviços fixos com alerta de renovação/reajuste anual, gere 12
                  parcelas no financeiro em 1 clique e guarde Notas Fiscais e garantias dos eletrodomésticos da casa.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Alertas de Renovação</span>
                <span className="text-cyan-400 font-bold">Cofre de Garantias NF-e</span>
              </div>
            </div>

            {/* Card 9: Importador 4-em-1 */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Importador 4-em-1: PDF, Print, OFX e CSV</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Suba a fatura em PDF do banco, envie um print da tela do aplicativo (OCR inteligente) ou importe
                  arquivos OFX/CSV com sugestão automática de categoria para cada compra.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Leitura Automática</span>
                <span className="text-rose-400 font-bold">PDF • Imagem • OFX • CSV</span>
              </div>
            </div>

            {/* Card 10: Gestão de Veículos da Família */}
            <div className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden md:col-span-2 lg:col-span-3">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold uppercase text-emerald-300">
                Novo • Frota & Combustível
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                    <Car className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Gestão de Veículos da Família (Combustível, IPVA, Seguro & Manutenção)
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Cadastre os carros e motos da casa, calcule na hora se compensa Etanol ou Gasolina na bomba do
                    posto, descubra o consumo real em km/L, receba alertas de troca de óleo/revisão por quilometragem,
                    tenha o botão de emergência do Guincho 24h e gere as parcelas de IPVA e Seguro no financeiro em 1
                    clique.
                  </p>
                </div>
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Consumo & Bomba</span>
                    <span className="text-sm font-black text-emerald-400 mt-1 block">km/L + Regra 70%</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Alertas de Oficina</span>
                    <span className="text-sm font-black text-amber-400 mt-1 block">Revisão por KM</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">IPVA & Seguro Auto</span>
                    <span className="text-sm font-black text-sky-400 mt-1 block">Parcelamento 1-clique</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Socorro Mobile</span>
                    <span className="text-sm font-black text-rose-400 mt-1 block">📞 Guincho 24h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO: PARA CASAIS E FAMÍLIAS ================= */}
      <section id="casais" className="py-24 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80"
                alt="Casal sorrindo enquanto planeja as finanças"
                className="w-full h-[440px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              <div className="absolute top-5 left-5 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl shadow-lg flex items-center gap-3 max-w-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Orçamento Compartilhado</p>
                  <p className="text-[11px] text-slate-400 font-medium">Sincronização imediata entre o casal.</p>
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Meta: Viagem em Família</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400">R$ 18.500 / R$ 20.000 (92%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span>Harmonia Financeira</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Quando a família tem clareza financeira, os sonhos saem do papel.
            </h2>

            <p className="text-slate-400 text-base leading-relaxed">
              O maior vilão do orçamento familiar é a falta de visibilidade. Com o{' '}
              <strong className="text-white">FinanFamily</strong>, quando alguém registra uma compra ou baixa um
              boleto, toda a família acompanha o saldo atualizado em tempo real.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-base">Visão em Lista ou Quadro Kanban</h3>
                  <p className="text-slate-400 text-sm">
                    Alterne entre a lista compacta e o quadro Kanban (Atrasado, A Pagar e Pago) e dê baixa em várias
                    contas de uma só vez.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-base">Limites Mensais por Categoria</h3>
                  <p className="text-slate-400 text-sm">
                    Defina tetos de gastos para Supermercado, Lazer ou Delivery e receba alertas visuais antes de
                    estourar o orçamento do mês.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-base">Modo Escuro e Modo Claro</h3>
                  <p className="text-slate-400 text-sm">
                    Interface adaptável ao gosto de cada membro da família, tanto no computador quanto no celular.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-7 py-3.5 rounded-xl items-center gap-2 transition-all shadow-lg"
              >
                Testar 10 Dias Grátis com Minha Família
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMO FUNCIONA EM 3 PASSOS ================= */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Comece em menos de 1 minuto
            </h2>
            <p className="text-slate-400 text-base">
              Sem configurações complicadas. Aproveite 10 dias grátis para testar todos os recursos com a sua família.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-base mb-5">
                1
              </span>
              <h3 className="text-lg font-bold text-white mb-2">Ative seus 10 dias grátis</h3>
              <p className="text-slate-400 text-sm">
                Entre com sua conta Google ou e-mail. Seu ambiente familiar isolado já nasce pronto com todos os
                recursos liberados para teste.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-base mb-5">
                2
              </span>
              <h3 className="text-lg font-bold text-white mb-2">Cadastre contas, cartões e metas</h3>
              <p className="text-slate-400 text-sm">
                Adicione seus bancos, cartões de crédito e limites por categoria. Lance despesas fixas ou parceladas em
                segundos.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-base mb-5">
                3
              </span>
              <h3 className="text-lg font-bold text-white mb-2">Convide a família e escolha seu plano</h3>
              <p className="text-slate-400 text-sm">
                Compartilhe o acesso com quem você ama e, após os 10 dias de teste grátis, continue no plano mensal ou
                anual com desconto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO DE PLANOS ================= */}
      <section id="planos" className="py-24 px-4 sm:px-6 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>10 Dias de Teste Grátis em Qualquer Plano</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Investimento simples e transparente para toda a família
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-14">
            Teste 100% dos recursos gratuitamente por <strong className="text-white">10 dias</strong>. Após o período de
            testes, escolha entre a flexibilidade do plano mensal ou a economia do plano anual em até 12x.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto text-left items-stretch">
            {/* PLANO MENSAL */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 sm:p-9 flex flex-col justify-between shadow-xl relative transition-all">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Flexibilidade Mensal
                  </span>
                  <span className="text-xs font-bold text-emerald-400">10 dias grátis</span>
                </div>

                <h3 className="text-2xl font-extrabold text-white">Plano Mensal</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Ideal para começar sem fidelidade e renovar mês a mês.
                </p>

                <div className="my-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-slate-400">R$</span>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">29,90</span>
                    <span className="text-sm font-semibold text-slate-400">/mês</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-2">
                    Grátis nos primeiros 10 dias • Cobrança mensal após o período de testes
                  </p>
                </div>

                <div className="space-y-3 mb-8 text-sm text-slate-200 font-medium">
                  {[
                    '10 dias de teste grátis com acesso completo',
                    'Painel Web compartilhado + Convite de membros',
                    'Projeção de saldo futuro para 12 meses + Kanban',
                    '🛒 Módulo Mercado & Carrinho Mobile (Modo 1 Mão)',
                    '🛡️ Módulo Contratos, Assinaturas & Cofre de Garantias',
                    '🚗 Módulo Gestão de Veículos (Combustível, IPVA, Seguro & Revisões)',
                    '📸 Importador 4-em-1 (Faturas PDF, Print OCR, OFX e CSV)',
                    'Gestão inteligente de Cartões, Orçamentos e Provisões',
                    'Exportação em PDF, Excel (.xlsx) e Resumo WhatsApp',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/login?mode=register"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base transition-all border border-slate-700"
              >
                Começar 10 Dias Grátis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* PLANO ANUAL (MAIS VANTAJOSO) */}
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 sm:p-9 flex flex-col justify-between shadow-[0_20px_60px_rgba(16,185,129,0.16)] relative transition-all">
              <div className="absolute -top-3.5 right-6 bg-emerald-500 text-slate-950 text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                Mais Escolhido • Economize 17%
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Plano Anual (Até 12x no Cartão)
                  </span>
                  <span className="text-xs font-bold text-emerald-400">10 dias grátis</span>
                </div>

                <h3 className="text-2xl font-extrabold text-white">Plano Anual Família</h3>
                <p className="text-slate-400 text-sm mt-1">
                  O melhor custo-benefício para planejar o ano inteiro da família com desconto.
                </p>

                <div className="my-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-emerald-400">12x de R$</span>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">24,90</span>
                    <span className="text-sm font-semibold text-slate-400">/mês</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold mt-2">
                    Total de <strong className="text-white">R$ 298,80/ano</strong> (parcelável em até 12x no cartão)
                  </p>
                  <p className="text-xs text-emerald-400 font-bold mt-1">
                    Grátis nos primeiros 10 dias • Economia de R$ 60,00 por ano
                  </p>
                </div>

                <div className="space-y-3 mb-8 text-sm text-slate-200 font-medium">
                  {[
                    '10 dias de teste grátis com acesso completo',
                    'Tudo do Plano Mensal incluso sem restrições',
                    'Parcelamento em até 12x de R$ 24,90 no cartão',
                    '🛒 Módulo Mercado Mobile + Histórico de Inflação da Casa',
                    '🛡️ Módulo Contratos Fixos + Cofre de Garantias NF-e',
                    '🚗 Módulo Gestão de Veículos (km/L, IPVA, Seguro & Revisões)',
                    '📸 Importador 4-em-1 (Faturas PDF, Print OCR, OFX e CSV)',
                    'Projeção de saldo de 12 meses + Detector de juros',
                    'Exportação ilimitada em PDF, Excel (.xlsx) e WhatsApp',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/login?mode=register"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:scale-[1.01]"
              >
                Testar 10 Dias Grátis no Plano Anual
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Comece agora com <strong>10 dias grátis</strong>. Após o período de testes: <strong>R$ 29,90/mês</strong>{' '}
              ou <strong>R$ 298,80/ano</strong> (12x de R$ 24,90 no cartão).
            </span>
          </div>
        </div>
      </section>

      {/* ================= FAQ (PERGUNTAS FREQUENTES) ================= */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Perguntas Frequentes</h2>
            <p className="text-slate-400 text-sm">Tire suas dúvidas sobre o período de testes, planos e recursos.</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={item.question}
                  className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= RODAPÉ ================= */}
      <footer className="py-12 px-4 sm:px-6 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-sm">FinanFamily</span>
            <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-semibold">
            <a href="#plataforma" className="hover:text-emerald-400 transition-colors">
              Plataforma
            </a>
            <a href="#recursos" className="hover:text-emerald-400 transition-colors">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">
              Planos
            </a>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Entrar
            </Link>
            <Link href="/login?mode=register" className="hover:text-emerald-400 transition-colors">
              Testar 10 Dias Grátis
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
