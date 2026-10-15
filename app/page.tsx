'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Laptop,
  CreditCard,
  PieChart,
  Users,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Bell,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* ================= NAVBAR FIXA ================= */}
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Finan<span className="text-emerald-400">Family</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#plataforma" className="hover:text-emerald-400 transition-colors">A Plataforma</a>
            <a href="#casais" className="hover:text-emerald-400 transition-colors">Para Casais</a>
            <a href="#indicadores" className="hover:text-emerald-400 transition-colors">Indicadores</a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION + MOCKUPS (NOTEBOOK & CELULAR) ================= */}
      <section id="plataforma" className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6">
        {/* Brilho de fundo (Glow) */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Web + App Android Sincronizados em Tempo Real</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
            A inteligência financeira da sua família, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">no computador e no bolso.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Abandone as planilhas complicadas. Controle despesas, acompanhe receitas, gerencie faturas de cartões de crédito e planeje o futuro com quem você ama em um único painel automático.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 py-4 rounded-2xl flex items-center justify-center gap-2.5 text-base transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-[1.02]"
            >
              Criar Conta da Família Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#casais"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-4 rounded-2xl border border-slate-800 transition-all text-base"
            >
              Ver como funciona
            </a>
          </div>

          {/* ================= COMPOSIÇÃO VISUAL: NOTEBOOK + SMARTPHONE ================= */}
          <div className="relative max-w-5xl mx-auto mt-8">
            
            {/* 1. MOLDURA DO NOTEBOOK (INTERFACE WEB) */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-t-3xl p-3 sm:p-5 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)]">
              {/* Barra superior do navegador / câmera do notebook */}
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
                <div className="w-12" />
              </div>

              {/* Tela Interna do Sistema no Notebook */}
              <div className="bg-slate-950 rounded-xl border border-slate-800/90 p-4 sm:p-6 text-left grid grid-cols-12 gap-4 sm:gap-6">
                
                {/* Mini Sidebar do Mockup */}
                <div className="hidden md:flex md:col-span-3 flex-col justify-between bg-slate-900/70 rounded-xl p-4 border border-slate-800/60">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="font-bold text-sm text-white">Finan<span className="text-emerald-400">Family</span></span>
                    </div>
                    <div className="bg-emerald-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg text-center">
                      + Novo Lançamento
                    </div>
                    <div className="space-y-1 pt-2 text-xs">
                      <div className="bg-emerald-500/15 text-emerald-400 font-semibold px-3 py-2 rounded-lg border border-emerald-500/20">
                        Visão Geral
                      </div>
                      <div className="text-slate-400 px-3 py-2">Contas a Pagar</div>
                      <div className="text-slate-400 px-3 py-2">Cartões de Crédito</div>
                      <div className="text-slate-400 px-3 py-2">Metas da Família</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      C&J
                    </div>
                    <div className="text-[11px]">
                      <p className="text-white font-semibold">Família Silva</p>
                      <p className="text-slate-500">2 membros ativos</p>
                    </div>
                  </div>
                </div>

                {/* Área Principal do Dashboard no Notebook */}
                <div className="col-span-12 md:col-span-9 space-y-4">
                  {/* Cards de Indicadores do Topo */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Saldo Disponível</span>
                        <Wallet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-base sm:text-xl font-extrabold text-white">R$ 14.850,00</p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                        <ArrowUpRight className="w-3 h-3" /> +18% vs mês anterior
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Receitas do Mês</span>
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-base sm:text-xl font-extrabold text-emerald-400">R$ 12.400,00</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">100% recebidas</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Despesas Totais</span>
                        <ArrowDownRight className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-base sm:text-xl font-extrabold text-rose-400">R$ 6.320,00</p>
                      <span className="text-[10px] text-emerald-400 mt-1 block">Dentro do limite (51%)</span>
                    </div>
                  </div>

                  {/* Gráfico de Barras + Categorias dentro do Notebook */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-bold text-white mb-3">Evolução do Saldo Familiar</p>
                      <div className="h-28 flex items-end gap-2.5 pt-4 px-2">
                        {[40, 55, 48, 70, 82, 95].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              style={{ height: `${h}%` }}
                              className={`w-full rounded-t-md ${
                                i === 5 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-emerald-500/30'
                              }`}
                            />
                            <span className="text-[9px] text-slate-500">
                              {['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2.5">
                      <p className="text-xs font-bold text-white mb-2">Despesas por Categoria</p>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300">Moradia & Contas</span>
                          <span className="text-white font-semibold">R$ 2.800 (44%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[44%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300">Supermercado & Alimentação</span>
                          <span className="text-white font-semibold">R$ 1.950 (31%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full w-[31%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300">Lazer da Família</span>
                          <span className="text-white font-semibold">R$ 870 (14%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[14%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Base inferior do teclado do Notebook */}
            <div className="h-4 bg-slate-800 rounded-b-2xl mx-auto w-[96%] border-t border-slate-700 shadow-2xl" />

            {/* 2. MOCKUP DO CELULAR ANDROID SOBREPOSTO (CANTO DIREITO) */}
            <div className="mt-8 lg:mt-0 lg:absolute lg:-bottom-10 lg:-right-6 w-72 mx-auto bg-slate-950 border-[6px] border-slate-800 rounded-[2.5rem] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-left z-20">
              {/* Câmera frontal (Punch-hole do Android) */}
              <div className="w-16 h-1.5 bg-slate-800 rounded-full mx-auto mb-3" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-tight">App Android</p>
                    <p className="text-[9px] text-emerald-400">Sincronizado</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ao vivo
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 p-3.5 rounded-2xl mb-3 shadow-lg">
                <p className="text-[10px] font-bold uppercase opacity-80">Saldo da Família</p>
                <p className="text-xl font-black">R$ 14.850,00</p>
                <p className="text-[10px] font-semibold mt-1 opacity-90">Meta Viagem: 85% concluída</p>
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Últimos lançamentos no celular</p>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="text-[11px]">
                    <p className="text-white font-semibold">Supermercado</p>
                    <p className="text-[9px] text-slate-400">Lançado por Jéssica • Agora</p>
                  </div>
                  <span className="text-xs font-bold text-rose-400">- R$ 342,90</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="text-[11px]">
                    <p className="text-white font-semibold">Salário Mensal</p>
                    <p className="text-[9px] text-slate-400">Conta Principal • Hoje</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">+ R$ 6.800,00</span>
                </div>
              </div>

              <div className="bg-emerald-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl text-center">
                + Lançamento Rápido
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO: CASAL USANDO O SISTEMA (LIFESTYLE + CONVERSÃO) ================= */}
      <section id="casais" className="py-24 px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Coluna da Imagem do Casal + Indicadores Flutuantes */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80"
                alt="Casal sorrindo usando o notebook e celular para planejar as finanças no FinanFamily"
                className="w-full h-[420px] object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Card Flutuante 1: Notificação de Sincronização do Casal */}
              <div className="absolute top-5 left-5 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Orçamento Compartilhado</p>
                  <p className="text-[11px] text-slate-400">Vocês dois enxergam o mesmo painel em tempo real.</p>
                </div>
              </div>

              {/* Card Flutuante 2: Meta da Família Atingida */}
              <div className="absolute bottom-5 left-5 right-5 bg-slate-950/95 backdrop-blur-md border border-emerald-500/30 p-4 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Meta: Reserva & Viagem em Família</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400">R$ 18.500 / R$ 20.000</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna de Copywriting de Vendas */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span>Harmonia Financeira</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Quando o casal tem clareza financeira, os sonhos saem do papel.
            </h2>

            <p className="text-slate-400 text-base leading-relaxed">
              O maior vilão do orçamento familiar é a falta de visibilidade no dia a dia. Com o <strong className="text-white">FinanFamily</strong>, quando um lança uma compra pelo celular na fila do mercado, o outro já vê o saldo atualizado na tela do notebook instantaneamente.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-base">Ambiente Exclusivo da Sua Família (Multi-Tenant)</h4>
                  <p className="text-slate-400 text-sm">Ao entrar com sua conta Google, seu banco de dados familiar é configurado automaticamente com contas e categorias prontas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-base">Fim do Susto com a Fatura do Cartão</h4>
                  <p className="text-slate-400 text-sm">Acompanhe compras parceladas, limites disponíveis e saiba exatamente quanto vai vencer no próximo mês.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-base">Acesso no Computador e no App Android</h4>
                  <p className="text-slate-400 text-sm">Faça o planejamento mensal detalhado na tela grande do notebook e registre gastos em 5 segundos pelo celular.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-7 py-3.5 rounded-xl items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                Testar Agora com Minha Conta Google
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO: INDICADORES REAIS DO SISTEMA ================= */}
      <section id="indicadores" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Indicadores visuais que mostram para onde vai cada centavo
            </h2>
            <p className="text-slate-400 text-base">
              Você não precisa entender de contabilidade. Nossos painéis transformam seus lançamentos em alertas claros e decisões inteligentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card Indicador 1: Contas a Pagar e Alertas */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Controle de Vencimentos</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Visualize separadamente o que está pago, o que vence na semana e evite pagar juros por esquecimento.
                </p>
              </div>

              {/* Mini UI Demonstrativa */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Energia Elétrica</span>
                  <span className="bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-md font-semibold">Vence Amanhã</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
                  <span className="text-slate-300 font-medium">Escola / Faculdade</span>
                  <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md font-semibold">Pago ✓</span>
                </div>
              </div>
            </div>

            {/* Card Indicador 2: Gestão de Cartões de Crédito */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Raio-X de Cartões de Crédito</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Cadastre todos os cartões da família, acompanhe o limite comprometido e veja a projeção das próximas faturas.
                </p>
              </div>

              {/* Mini UI Demonstrativa */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-white">Nubank Ultravioleta</span>
                  <span className="text-emerald-400 font-bold">Fatura Aberta</span>
                </div>
                <p className="text-lg font-extrabold text-white mb-2">R$ 2.140,00</p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[42%]" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Limite disponível: R$ 5.860,00</p>
              </div>
            </div>

            {/* Card Indicador 3: Balanço e Metas */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Metas & Investimentos</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Defina objetivos claros (trocar de carro, reserva de emergência, viagem) e acompanhe a barra de progresso mês a mês.
                </p>
              </div>

              {/* Mini UI Demonstrativa */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-white">Reserva de Emergência</span>
                  <span className="text-emerald-400 font-bold">80%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className="bg-emerald-400 h-full w-[80%]" />
                </div>
                <p className="text-[11px] text-slate-400">Acumulado: <strong className="text-white">R$ 16.000,00</strong></p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= SEÇÃO DE CONVERSÃO FINAL / PLANOS ================= */}
      <section id="planos" className="py-24 px-6 bg-gradient-to-b from-slate-900/40 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Comece a organizar as finanças da sua família hoje mesmo
          </h2>
          <p className="text-slate-400 text-base mb-12">
            Crie sua conta em menos de 10 segundos usando o Google. Sem precisar cadastrar cartão de crédito.
          </p>

          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(16,185,129,0.12)] max-w-xl mx-auto text-left relative">
            <div className="absolute -top-3.5 right-6 bg-emerald-500 text-slate-950 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
              Acesso Imediato
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2">Plano Família Completo</h3>
            <p className="text-slate-400 text-sm mb-6">
              Tudo o que você precisa para assumir o controle total das contas no computador e no celular.
            </p>

            <div className="space-y-3 mb-8 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Painel Web Completo + Acesso Mobile</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Criação automática de contas e categorias padrão</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Controle ilimitado de Receitas, Despesas e Cartões</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Login rápido e seguro com sua conta Google</span>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)]"
            >
              Criar Minha Conta Grátis Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= RODAPÉ ================= */}
      <footer className="py-10 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">FinanFamily</span>
            <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Acessar Sistema</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Criar Conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}