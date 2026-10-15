'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  PlusCircle,
  CreditCard,
  Target,
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  LogOut,
  X,
  CheckCircle2,
  Menu
} from 'lucide-react';

interface CategoryData {
  name: string;
  color: string;
  total: number;
}

interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  categories: CategoryData[];
}

interface CategoryItem {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface TransactionItem {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  status: string;
  category_name?: string;
  category_color?: string;
  account_name?: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // Navegação de Módulos (Abas do Menu Lateral)
  const [activeTab, setActiveTab] = useState<'resumo' | 'transacoes' | 'cartoes' | 'metas' | 'config'>('resumo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de Dados Reais do Banco
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [transactionsList, setTransactionsList] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Família');

  // Estados do Modal de Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategoryId, setTxCategoryId] = useState<string>('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('@FinanFamily:token');
    const userStr = localStorage.getItem('@FinanFamily:user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Família');
      } catch (e) {}
    }

    try {
      const [summaryRes, dataRes] = await Promise.all([
        fetch('https://finanfamily-api.onrender.com/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://finanfamily-api.onrender.com/api/dashboard/data', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (summaryRes.status === 401 || summaryRes.status === 403) {
        localStorage.removeItem('@FinanFamily:token');
        router.push('/login');
        return;
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      if (dataRes.ok) {
        const extraData = await dataRes.json();
        setCategoriesList(extraData.categories || []);
        setTransactionsList(extraData.transactions || []);
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Formatar moeda (BRL) blindado contra NaN
  const formatCurrency = (value: any) => {
    const numericValue = Number(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(isNaN(numericValue) ? 0 : numericValue);
  };

  // Salvar Novo Lançamento no Banco
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    setSavingTx(true);
    setError('');
    const token = localStorage.getItem('@FinanFamily:token');

    try {
      const cleanAmount = parseFloat(txAmount.toString().replace(',', '.'));
      const res = await fetch('https://finanfamily-api.onrender.com/api/transactions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: txDescription,
          amount: cleanAmount,
          type: txType,
          category_id: txCategoryId ? Number(txCategoryId) : null,
          date: txDate,
          status: 'paid',
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTxDescription('');
        setTxAmount('');
        setTxCategoryId('');
        await fetchDashboardData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Não foi possível salvar o lançamento.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar lançamento.');
    } finally {
      setSavingTx(false);
    }
  };

  const filteredCategories = categoriesList.filter((c) => c.type === txType);

  const menuItems = [
    { id: 'resumo', name: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transacoes', name: 'Transações', icon: ArrowRightLeft },
    { id: 'cartoes', name: 'Cartões de Crédito', icon: CreditCard },
    { id: 'metas', name: 'Metas da Família', icon: Target },
    { id: 'config', name: 'Configurações', icon: Settings },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Carregando painel da família...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-sans selection:bg-emerald-500/30">
      
      {/* ================= BARRA LATERAL (SIDEBAR DESKTOP & MOBILE) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mr-3">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              Finan<span className="text-emerald-400">Family</span>
            </span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Novo Lançamento
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              localStorage.removeItem('@FinanFamily:token');
              localStorage.removeItem('@FinanFamily:user');
              router.push('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl font-semibold text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* ================= ÁREA DE CONTEÚDO PRINCIPAL ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topo Mobile */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300 p-2">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-lg text-white">
            Finan<span className="text-emerald-400">Family</span>
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto space-y-8">
          
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                Olá, <span className="text-emerald-400">{userName}</span>!
              </h1>
              <p className="text-slate-400 mt-1">
                Aqui está o resumo financeiro de vocês neste mês.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              Novo Lançamento
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* ================= ABA 1: VISÃO GERAL ================= */}
          {activeTab === 'resumo' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2 relative z-10">
                    <span className="font-semibold uppercase tracking-wider">Saldo em Contas</span>
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-white relative z-10">
                    {formatCurrency(summary?.balance)}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span className="font-semibold uppercase tracking-wider">Receitas do Mês</span>
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-emerald-400">
                    {formatCurrency(summary?.income)}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span className="font-semibold uppercase tracking-wider">Despesas do Mês</span>
                    <ArrowDownRight className="w-5 h-5 text-rose-400" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-rose-400">
                    {formatCurrency(summary?.expense)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl lg:col-span-2">
                  <h3 className="text-lg font-bold text-white mb-6">
                    Onde o dinheiro está indo?
                  </h3>

                  {summary?.categories && summary.categories.length > 0 ? (
                    <div className="space-y-5">
                      {summary.categories.map((cat, index) => {
                        const percentage =
                          summary.expense > 0
                            ? Math.round((Number(cat.total) / summary.expense) * 100)
                            : 0;

                        return (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-slate-300 font-medium">{cat.name}</span>
                              <div className="text-right">
                                <span className="text-white font-bold">{formatCurrency(cat.total)}</span>
                                <span className="text-slate-500 ml-2 text-xs">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: cat.color || '#10b981',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                      <p className="text-slate-400 text-sm mb-3">
                        Nenhuma despesa registrada neste mês ainda.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-bold cursor-pointer"
                      >
                        + Registrar primeiro lançamento
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div
                    onClick={() => setActiveTab('cartoes')}
                    className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">Cartões de Crédito</h4>
                    <p className="text-slate-400 text-sm">Gerencie faturas e limites.</p>
                  </div>

                  <div
                    onClick={() => setActiveTab('metas')}
                    className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">Metas da Família</h4>
                    <p className="text-slate-400 text-sm">Acompanhe seus objetivos.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= ABA 2: TRANSAÇÕES ================= */}
          {activeTab === 'transacoes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Histórico de Lançamentos</h3>
              {transactionsList.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {transactionsList.map((tx) => (
                    <div key={tx.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">{tx.description}</p>
                        <p className="text-xs text-slate-400">
                          {tx.category_name || 'Sem categoria'} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span
                        className={`font-extrabold text-base ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">
                  Nenhum lançamento registrado até o momento.
                </p>
              )}
            </div>
          )}

          {/* ================= ABAS 3, 4 e 5: CARTÕES / METAS / CONFIG ================= */}
          {(activeTab === 'cartoes' || activeTab === 'metas' || activeTab === 'config') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">
                {activeTab === 'cartoes' && 'Módulo de Cartões de Crédito'}
                {activeTab === 'metas' && 'Módulo de Metas da Família'}
                {activeTab === 'config' && 'Configurações da Conta e Família'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Use o botão Novo Lançamento para movimentar suas contas ou volte para a Visão Geral.
              </p>
              <button
                onClick={() => setActiveTab('resumo')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm cursor-pointer"
              >
                Voltar para Visão Geral
              </button>
            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL DE NOVO LANÇAMENTO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-extrabold text-white mb-6">Novo Lançamento</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategoryId('');
                  }}
                  className={`py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                    txType === 'expense'
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategoryId('');
                  }}
                  className={`py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                    txType === 'income'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Receita (Entrada)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder={txType === 'expense' ? 'Ex: Supermercado, Luz...' : 'Ex: Salário, Pix...'}
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Categoria
                </label>
                <select
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione uma categoria...</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={savingTx}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {savingTx ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Salvar Lançamento
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}