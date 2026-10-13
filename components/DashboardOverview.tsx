'use client';

import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  Sparkles, 
  ShieldCheck,
  Percent,
  ArrowUpRight,
  Flame,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface CategoryShare {
  name: string;
  color: string;
  total: number;
}

interface InterestItem {
  id: string;
  description: string;
  original_amount: number;
  paid_amount: number;
  interest_amount: number;
  due_date: string;
  payment_date: string;
  category_name?: string;
}

interface DashboardOverviewProps {
  data: {
    month?: number;
    year?: number;
    income: { received: number; projected: number };
    expenses: { 
      fixed: number; 
      variable: number; 
      paidSoFar: number; 
      totalProjected: number;
      investments: number;
    };
    interest?: {
      totalPaid: number;
      count: number;
    };
    projectedBalance: number;
    categoriesDistribution: CategoryShare[];
  };
}

export default function DashboardOverview({ data }: DashboardOverviewProps) {
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [interestItems, setInterestItems] = useState<InterestItem[]>([]);
  const [loadingInterest, setLoadingInterest] = useState(false);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  const { income, expenses, interest, projectedBalance, categoriesDistribution, month = 10, year = 2026 } = data;

  const totalInterestPaid = interest?.totalPaid || 0;
  const overdueCount = interest?.count || 0;

  // Índices
  const commitmentRate = income.projected > 0 
    ? Math.min(100, Math.round((expenses.totalProjected / income.projected) * 100)) 
    : 0;

  const savingsRate = income.projected > 0 
    ? Math.min(100, Math.round((expenses.investments / income.projected) * 100)) 
    : 0;

  const paidPercent = expenses.totalProjected > 0 
    ? Math.min(100, Math.round((expenses.paidSoFar / expenses.totalProjected) * 100)) 
    : 0;

  const donutData = useMemo(() => {
    const totalExpenses = expenses.totalProjected || 1;
    let accumulatedAngle = 0;

    return categoriesDistribution.map((cat) => {
      const percentage = (cat.total / totalExpenses) * 100;
      const angle = (cat.total / totalExpenses) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return {
        ...cat,
        percentage: Math.round(percentage),
        startAngle,
        angle
      };
    });
  }, [categoriesDistribution, expenses.totalProjected]);

  async function openInterestAudit() {
    setInterestModalOpen(true);
    setLoadingInterest(true);
    try {
      const res = await fetch(`${apiUrl}/api/dashboard/interest-metrics?family_id=${familyId}&month=${month}&year=${year}`);
      const list = await res.json();
      if (Array.isArray(list)) setInterestItems(list);
    } catch (err) {
      console.error('Erro ao carregar auditoria de juros:', err);
    } finally {
      setLoadingInterest(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. CARDS DE INDICADORES CONSOLIDADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Entradas */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Entradas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">
              {formatCurrency(income.projected)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Recebido: <strong className="text-emerald-400">{formatCurrency(income.received)}</strong>
            </p>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Saídas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400">
              {formatCurrency(expenses.totalProjected)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Pago: <strong className="text-slate-300">{formatCurrency(expenses.paidSoFar)}</strong>
            </p>
          </div>
        </div>

        {/* Investimentos */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Investido</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-400">
              {formatCurrency(expenses.investments || 0)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Taxa: <strong className="text-blue-300">{savingsRate}% da renda</strong>
            </p>
          </div>
        </div>

        {/* Juros e Multas (Card Especial Clicável) */}
        <div 
          onClick={openInterestAudit}
          className="bg-slate-900/60 border border-amber-500/30 hover:border-amber-500/60 transition-all rounded-2xl p-5 shadow-sm relative overflow-hidden cursor-pointer group"
          title="Clique para auditar o detalhamento dos juros"
        >
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Juros & Multas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">
              {formatCurrency(totalInterestPaid)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 truncate flex items-center gap-1">
              <span>{overdueCount} conta(s) com atraso</span>
              <span className="text-amber-400 underline font-semibold ml-auto text-[10px]">Auditar</span>
            </p>
          </div>
        </div>

        {/* Saldo Livre */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Saldo Livre</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${projectedBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(projectedBalance)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Comprometido: <strong className="text-slate-300">{commitmentRate}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. GRÁFICOS: DISTRIBUIÇÃO E FLUXO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Donut de Categorias */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-400" />
              Distribuição por Categoria
            </h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
              {categoriesDistribution.length} grupos
            </span>
          </div>

          {categoriesDistribution.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhuma despesa apurada para este mês selecionado.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {donutData.map((item, index) => {
                    const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                    const strokeDashoffset = donutData
                      .slice(0, index)
                      .reduce((acc, curr) => acc - curr.percentage, 0);

                    return (
                      <circle
                        key={item.name}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke={item.color || '#3b82f6'}
                        strokeWidth="5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700 hover:opacity-80"
                      />
                    );
                  })}
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs text-slate-500 block">Total</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(expenses.totalProjected)}</span>
                </div>
              </div>

              <div className="space-y-2 w-full max-w-xs">
                {donutData.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400">{cat.percentage}%</span>
                      <strong className="text-white font-medium">{formatCurrency(cat.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de Barras de Equilíbrio */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Equilíbrio do Fluxo Mensal
            </h3>
            <span className="text-xs text-slate-400">Liquidação: {paidPercent}%</span>
          </div>

          <div className="space-y-5 py-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Total de Entradas</span>
                <strong className="text-emerald-400">{formatCurrency(income.projected)}</strong>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Saídas Comprometidas</span>
                <strong className="text-rose-400">{formatCurrency(expenses.totalProjected)} ({commitmentRate}%)</strong>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${commitmentRate > 90 ? 'bg-rose-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, commitmentRate)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Parcelas de Investimento / Metas</span>
                <strong className="text-blue-400">{formatCurrency(expenses.investments)} ({savingsRate}%)</strong>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, savingsRate)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Já pago este mês: <strong className="text-slate-200">{formatCurrency(expenses.paidSoFar)}</strong></span>
            <span>A pagar: <strong className="text-amber-400">{formatCurrency(Math.max(0, expenses.totalProjected - expenses.paidSoFar))}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. INSIGHTS INTELIGENTES */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Diagnóstico Familiar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Saúde do Orçamento
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {commitmentRate <= 70 
                ? 'Excelente equilíbrio! As despesas consomem menos de 70% da renda da família.' 
                : commitmentRate <= 90 
                ? 'Atenção ao limite prudencial: as despesas consomem mais de 70% da renda prevista.' 
                : 'Alerta vermelho: despesas comprometem mais de 90% dos ganhos previstos.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Flame className="w-4 h-4 text-amber-400" />
              Impacto de Juros e Multas
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {totalInterestPaid > 0 
                ? `Foram pagos ${formatCurrency(totalInterestPaid)} apenas em encargos por atraso. Antecipar as datas de vencimento pouparia este valor.` 
                : 'Parabéns! Nenhuma despesa gerou custos adicionais de juros este mês.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              Margem de Segurança
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {projectedBalance > 0 
                ? `Projeção de sobra de ${formatCurrency(projectedBalance)} para imprevistos ou aportes extras.` 
                : `Défice previsto de ${formatCurrency(Math.abs(projectedBalance))}. Reavalie despesas variáveis.`}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DE AUDITORIA DE JUROS */}
      {interestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl flex flex-col max-h-[85vh]">
            <button
              onClick={() => setInterestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1 text-amber-400">
              <Flame className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Auditoria de Juros e Multas Pagos</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Contas pagas com atraso em <strong>{String(month).padStart(2, '0')}/{year}</strong>
            </p>

            {loadingInterest ? (
              <p className="text-xs text-slate-500 py-8 text-center">A carregar detalhes dos juros...</p>
            ) : interestItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhum pagamento registou acréscimo de juros neste período.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 text-xs">
                  {interestItems.map((item) => (
                    <div key={item.id} className="p-3.5 space-y-1 hover:bg-slate-800/30">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-200">{item.description}</span>
                        <span className="font-bold text-amber-400">
                          +{formatCurrency(item.interest_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Original: {formatCurrency(item.original_amount)}</span>
                        <span>Total Pago: {formatCurrency(item.paid_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Vencimento: {formatDate(item.due_date)}</span>
                        <span>•</span>
                        <span>Pago em: {formatDate(item.payment_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">Total de Juros Queimados</span>
                  <span className="text-base font-black text-amber-400">{formatCurrency(totalInterestPaid)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}