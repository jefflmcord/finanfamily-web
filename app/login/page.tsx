'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  PieChart, 
  Wallet, 
  CreditCard, 
  Target, 
  ShieldCheck, 
  LayoutDashboard
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight text-white">
              Finan<span className="text-emerald-400">Family</span>
            </span>
          </div>
          <nav>
            {/* LINK ATUALIZADO PARA O LOGIN */}
            <Link 
              href="/login" 
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-2.5 rounded-full transition-all"
            >
              Acessar Sistema
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            A inteligência financeira <br /> da sua família.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Abandone as planilhas complexas. Controle despesas, acompanhe receitas, gerencie cartões de crédito e planeje o futuro da sua família em um único lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* LINK ATUALIZADO PARA O LOGIN */}
            <Link 
              href="/login" 
              className="flex items-center justify-center w-full sm:w-auto gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg px-8 py-4 rounded-full transition-all shadow-[0_0_40px_8px_rgba(16,185,129,0.2)]"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="py-24 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">O controle total em suas mãos</h2>
            <p className="text-slate-400">Tudo o que você precisa para uma gestão familiar transparente e eficiente.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/30 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dashboard Analítico</h3>
              <p className="text-slate-400 leading-relaxed">
                Tenha uma visão clara do seu saldo atual, saldo projetado e distribuição de gastos por categoria em tempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/30 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gestão de Cartões</h3>
              <p className="text-slate-400 leading-relaxed">
                Controle múltiplos cartões de crédito, acompanhe faturas em aberto e saiba exatamente para onde seu limite está indo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/30 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Metas e Investimentos</h3>
              <p className="text-slate-400 leading-relaxed">
                Crie metas financeiras e registre investimentos. Proteja o futuro da sua família com um planejamento sólido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MORE DETAILS ================= */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Adeus surpresas no fim do mês.
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              O FinanFamily foi desenhado para eliminar a ansiedade financeira. Você cadastra suas contas a pagar e a receber, e o nosso sistema cruza os dados para te mostrar exatamente como você vai terminar o mês.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-300">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                Interface limpa e livre de distrações
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <PieChart className="w-6 h-6 text-emerald-400" />
                Relatórios visuais e intuitivos
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <Wallet className="w-6 h-6 text-emerald-400" />
                Alertas de contas a vencer
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-slate-800 rounded-xl w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-slate-800 rounded-xl" />
                  <div className="h-32 bg-slate-800 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-slate-500" />
            <span className="text-slate-400 font-medium">FinanFamily</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} FinanFamily. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}