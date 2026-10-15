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
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/50 to-sky-100/80 text-slate-900 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* ================= NAVBAR FIXA ================= */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Finan<span className="text-emerald-500">Family</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#plataforma" className="hover:text-emerald-600 transition-colors">A Plataforma</a>
            <a href="#casais" className="hover:text-emerald-600 transition-colors">Para Casais</a>
            <a href="#indicadores" className="hover:text-emerald-600 transition-colors">Indicadores</a>
            <a href="#planos" className="hover:text-emerald-600 transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)]"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION + MOCKUPS (NOTEBOOK & CELULAR) ================= */}
      <section id="plataforma" className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100/80 border border-sky-200 text-sky-700 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Sistema Web + App Android Sincronizados em Tempo Real</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15] mb-6">
            A inteligência financeira da sua família, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-500">no computador e no bolso.</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Abandone as planilhas complicadas. Controle despesas, acompanhe receitas, gerencie faturas de cartões de crédito e planeje o futuro com quem você ama em um único painel automático.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-8 py-4 rounded-2xl flex items-center justify-center gap-2.5 text-base transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
            >
              Criar Conta da Família Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#casais"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold px-8 py-4 rounded-2xl border border-slate-200 transition-all text-base shadow-sm"
            >
              Ver como funciona
            </a>
          </div>

          {/* ================= COMPOSIÇÃO VISUAL: NOTEBOOK + SMARTPHONE (Mantidos Escuros para Contraste) ================= */}
          <div className="relative max-w-5xl mx-auto mt-8">
            
            {/* 1. MOLDURA DO NOTEBOOK (INTERFACE WEB) */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-t-3xl p-3 sm:p-5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] relative z-10">
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

              {/* Tela Interna do Sistema no Notebook (Dark Mode Preservado) */}
              <div className="bg-slate-950 rounded-xl border border-slate-800/90 p-4 sm:p-6 text-left grid grid-cols-12 gap-4 sm:gap-6 text-slate-50">
                
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
                          <span className="text-slate-300">Supermercado</span>
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
            <div className="h-5 bg-slate-300 rounded-b-2xl mx-auto w-[98%] border-b-2 border-slate-400 shadow-2xl relative z-0" />
            <div className="h-1 bg-slate-400 rounded-b-xl mx-auto w-[20%] mx-auto shadow-md" />

            {/* 2. MOCKUP DO CELULAR ANDROID SOBREPOSTO */}
            <div className="mt-8 lg:mt-0 lg:absolute lg:-bottom-12 lg:-right-8 w-72 mx-auto bg-slate-950 border-[6px] border-slate-800 rounded-[2.5rem] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-left z-20">
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
                <p className="text-[10px] font-semibold uppercase text-slate-400">Últimos lançamentos</p>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="text-[11px]">
                    <p className="text-white font-semibold">Supermercado</p>
                    <p className="text-[9px] text-slate-400">Por Jéssica • Agora</p>
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

              <div className="bg-emerald-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl text-center shadow-sm">
                + Lançamento Rápido
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO: CASAL USANDO O SISTEMA ================= */}
      <section id="casais" className="py-24 px-6 bg-white border-y border-sky-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80"
                alt="Casal sorrindo usando o notebook e celular para planejar as finanças"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

              {/* Cards Flutuantes (Claros para combinar com a secção) */}
              <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-2xl shadow-lg flex items-center gap-3 max-w-xs">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Orçamento Compartilhado</p>
                  <p className="text-[11px] text-slate-500 font-medium">Sincronização em tempo real.</p>
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900">Meta: Viagem em Família</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">R$ 18.500 / R$ 20.000</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
              <span>Harmonia Financeira</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Quando o casal tem clareza financeira, os sonhos saem do papel.
            </h2>

            <p className="text-slate-600 text-base leading-relaxed font-medium">
              O maior vilão do orçamento familiar é a falta de visibilidade. Com o <strong className="text-slate-900">FinanFamily</strong>, quando um regista uma compra pelo telemóvel no mercado, o outro vê o saldo atualizado no notebook instantaneamente.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-slate-900 font-bold text-base">Ambiente Exclusivo da Família</h4>
                  <p className="text-slate-600 text-sm">Ao entrar com o Google, o vosso banco de dados é configurado automaticamente com contas conjuntas e categorias.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-slate-900 font-bold text-base">Fim do Susto com a Fatura do Cartão</h4>
                  <p className="text-slate-600 text-sm">Acompanhe compras parceladas, limites e saiba exatamente quanto vai vencer no próximo mês.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-7 py-3.5 rounded-xl items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                Testar Agora com a Minha Conta Google
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO: INDICADORES ================= */}
      <section id="indicadores" className="py-24 px-6 bg-sky-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Indicadores visuais que mostram para onde vai cada centavo
            </h2>
            <p className="text-slate-600 text-base font-medium">
              Você não precisa entender de contabilidade. Os nossos painéis transformam os lançamentos em alertas claros e decisões inteligentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-sky-100 rounded-3xl p-7 flex flex-col justify-between hover:border-sky-300 hover:shadow-xl transition-all shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Controle de Vencimentos</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Visualize separadamente o que está pago, o que vence na semana e evite pagar juros por esquecimento.
                </p>
              </div>
              {/* Mini UI Demonstrativa (Dark para manter identidade do App) */}
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

            <div className="bg-white border border-sky-100 rounded-3xl p-7 flex flex-col justify-between hover:border-sky-300 hover:shadow-xl transition-all shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Raio-X de Cartões</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Cadastre todos os cartões da família, acompanhe o limite comprometido e a projeção de faturas.
                </p>
              </div>
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

            <div className="bg-white border border-sky-100 rounded-3xl p-7 flex flex-col justify-between hover:border-sky-300 hover:shadow-xl transition-all shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 mb-6">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Metas & Investimentos</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Defina objetivos claros (carro, reserva, viagem) e acompanhe a barra de progresso.
                </p>
              </div>
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

      {/* ================= SEÇÃO DE PLANOS ================= */}
      <section id="planos" className="py-24 px-6 bg-gradient-to-b from-sky-50 to-white border-t border-sky-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Comece a organizar as finanças hoje mesmo
          </h2>
          <p className="text-slate-600 text-base mb-12 font-medium">
            Crie a sua conta em menos de 10 segundos utilizando o Google. Sem necessidade de cartão de crédito.
          </p>

          <div className="bg-white border-2 border-emerald-400/40 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(16,185,129,0.15)] max-w-xl mx-auto text-left relative">
            <div className="absolute -top-3.5 right-6 bg-emerald-500 text-white text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Acesso Imediato
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Plano Família Completo</h3>
            <p className="text-slate-500 text-sm mb-6">
              Tudo o que você precisa para assumir o controle no computador e no telemóvel.
            </p>

            <div className="space-y-3 mb-8 text-sm text-slate-700 font-medium">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Painel Web Completo + App Android Sincronizado</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Criação automática de contas bancárias e categorias</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Gestão inteligente de Cartões de Crédito e Faturas</span>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
            >
              Criar Minha Conta Grátis Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= RODAPÉ ================= */}
      <footer className="py-10 px-6 bg-white border-t border-sky-100 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-700">FinanFamily</span>
            <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="/login" className="hover:text-emerald-600 transition-colors">Acessar Sistema</Link>
            <Link href="/login" className="hover:text-emerald-600 transition-colors">Criar Conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}