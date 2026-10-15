'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Loader2,
  PlusCircle,
  CreditCard,
  Target,
  LayoutDashboard,
  LogOut,
  X,
  CheckCircle2,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Trophy
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Módulos Superiores (Header)
  const [activeModule, setActiveModule] = useState<'cadastros' | 'pagar' | 'receber' | 'investimentos'>('cadastros');
  // Submenus da Sidebar Esquerda
  const [activeSubMenu, setActiveSubMenu] = useState<string>('geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de Dados da API
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Família');
  const [familyId, setFamilyId] = useState<string | number>('1');

  // Modal de Novo Lançamento Avançado
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState('BOLETO');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCardId, setTxCardId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txTransactionDate, setTxTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txDueDate, setTxDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txTotalInstallments, setTxTotalInstallments] = useState('1');
  const [txStartInstallment, setTxStartInstallment] = useState('1');

  // Modal de Novo Cartão de Crédito
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('10');
  const [cardDueDay, setCardDueDay] = useState('17');
  const [savingCard, setSavingCard] = useState(false);

  // Modal de Novo Objetivo / Meta de Investimento
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalMonths, setGoalMonths] = useState('12');
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('@FinanFamily:token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('@FinanFamily:user') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    let currentFamilyId = '1';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Família');
        currentFamilyId = String(user.family_id || user.familyId || '1');
        setFamilyId(currentFamilyId);
      } catch (e) {}
    }

    try {
      const [accRes, catRes, cardRes, txRes, goalRes] = await Promise.all([
        fetch(`https://finanfamily-api.onrender.com/api/accounts?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/categories?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/credit-cards?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/transactions?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/goals?family_id=${currentFamilyId}`),
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (cardRes.ok) setCreditCards(await cardRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (goalRes.ok) setGoals(await goalRes.json());
    } catch (err) {
      setError('Erro de conexão ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (val: any) => {
    const n = Number(val);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(n) ? 0 : n);
  };

  // Salvar Lançamento
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    let resolvedFamilyId = Number(familyId || 1);
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = Number(userObj.family_id || userObj.familyId || familyId || 1);
      } catch (e) {}
    }

    setSavingTx(true);
    setError('');

    try {
      const payload = {
        family_id: resolvedFamilyId,
        description: txDescription.trim(),
        amount: Number(txAmount.toString().replace(',', '.')),
        type: txType,
        payment_method: txPaymentMethod,
        account_id: txAccountId ? Number(txAccountId) : (accounts.length > 0 ? Number(accounts[0].id) : null),
        credit_card_id: txCardId ? Number(txCardId) : null,
        category_id: txCategoryId ? Number(txCategoryId) : null,
        transaction_date: txTransactionDate,
        due_date: txDueDate,
        total_installments: Number(txTotalInstallments) || 1,
        start_installment: Number(txStartInstallment) || 1,
        status: 'PENDING'
      };

      const res = await fetch('https://finanfamily-api.onrender.com/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsTxModalOpen(false);
        setTxDescription('');
        setTxAmount('');
        setTxTotalInstallments('1');
        setTxStartInstallment('1');
        await fetchData();
      } else {
        setError(data.error || 'Erro ao salvar lançamento no servidor.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar transação.');
    } finally {
      setSavingTx(false);
    }
  };

  // Cadastrar Cartão de Crédito
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardBrand || !cardLimit) return;

    let resolvedFamilyId = Number(familyId || 1);
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = Number(userObj.family_id || userObj.familyId || familyId || 1);
      } catch (e) {}
    }

    setSavingCard(true);
    try {
      const res = await fetch('https://finanfamily-api.onrender.com/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: resolvedFamilyId,
          name: cardName,
          brand: cardBrand,
          total_limit: cardLimit,
          closing_day: Number(cardClosingDay),
          due_day: Number(cardDueDay),
        }),
      });

      if (res.ok) {
        setIsCardModalOpen(false);
        setCardName('');
        setCardBrand('');
        setCardLimit('');
        await fetchData();
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao cadastrar cartão.');
      }
    } catch (e) {
      setError('Erro ao salvar cartão.');
    } finally {
      setSavingCard(false);
    }
  };

  // Cadastrar Objetivo/Meta através da rota dedicada /api/goals
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetAmount || !goalMonths) return;

    let resolvedFamilyId = 1;
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = Number(userObj.family_id || userObj.familyId || familyId || 1);
      } catch (e) {
        resolvedFamilyId = Number(familyId || 1);
      }
    } else {
      resolvedFamilyId = Number(familyId || 1);
    }

    setSavingGoal(true);
    setError('');

    try {
      const payload = {
        family_id: resolvedFamilyId,
        title: goalTitle.trim(),
        target_amount: Number(goalTargetAmount.toString().replace(',', '.')),
        months: Number(goalMonths) || 1
      };

      const res = await fetch('https://finanfamily-api.onrender.com/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsGoalModalOpen(false);
        setGoalTitle('');
        setGoalTargetAmount('');
        setGoalMonths('12');
        await fetchData();
      } else {
        setError(data.error || 'Erro ao criar objetivo.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar objetivo.');
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">A carregar inteligência financeira...</p>
      </div>
    );
  }

  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance || curr.current_balance || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const expensesByCategory: { [key: string]: number } = {};
  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      const catName = t.category_name || 'Outros';
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(t.amount || 0);
    });

  const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
      
      {/* ================= HEADER SUPERIOR ================= */}
      <header className="bg-slate-900 border-b border-slate-800 h-20 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">
            Finan<span className="text-emerald-400">Family</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setActiveModule('cadastros'); setActiveSubMenu('geral'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'cadastros' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cadastros
          </button>
          <button
            onClick={() => { setActiveModule('pagar'); setActiveSubMenu('contas_pagar'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'pagar' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contas a Pagar
          </button>
          <button
            onClick={() => { setActiveModule('receber'); setActiveSubMenu('contas_receber'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'receber' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => { setActiveModule('investimentos'); setActiveSubMenu('metas'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'investimentos' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Investimentos
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <PlusCircle className="w-5 h-5" /> Novo Lançamento
          </button>
          <button
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-semibold p-2 cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </header>

      {/* ================= CORPO COM SIDEBAR ================= */}
      <div className="flex flex-1 min-h-[calc(100vh-5rem)]">
        
        <aside className={`fixed md:static inset-y-0 left-0 z-20 w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col p-4 space-y-2 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 md:hidden">
            <span className="font-bold text-white">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <p className="text-xs uppercase font-extrabold text-slate-500 px-3 pb-1">Menus do Módulo</p>

          {activeModule === 'cadastros' && (
            <>
              <button onClick={() => setActiveSubMenu('geral')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'geral' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <LayoutDashboard className="w-5 h-5" /> Visão Geral & Insights
              </button>
              <button onClick={() => setActiveSubMenu('cartoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'cartoes' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <CreditCard className="w-5 h-5" /> Cartões de Crédito
              </button>
              <button onClick={() => setActiveSubMenu('contas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'contas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <Wallet className="w-5 h-5" /> Contas Bancárias
              </button>
              <button onClick={() => setActiveSubMenu('categorias')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'categorias' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <Layers className="w-5 h-5" /> Categorias
              </button>
            </>
          )}

          {activeModule === 'pagar' && (
            <button onClick={() => setActiveSubMenu('contas_pagar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'contas_pagar' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
              <FileText className="w-5 h-5" /> Lançamentos a Pagar
            </button>
          )}

          {activeModule === 'receber' && (
            <button onClick={() => setActiveSubMenu('contas_receber')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'contas_receber' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
              <DollarSign className="w-5 h-5" /> Lançamentos a Receber
            </button>
          )}

          {activeModule === 'investimentos' && (
            <button onClick={() => setActiveSubMenu('metas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'metas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
              <Target className="w-5 h-5" /> Metas & Objetivos
            </button>
          )}
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'geral' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Olá, {userName}! 👋</h1>
                <p className="text-slate-400 text-sm mt-1">Raio-x inteligente da saúde financeira da sua família.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2">
                  <p className="text-xs uppercase font-bold text-slate-400">Saldo em Contas</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2">
                  <p className="text-xs uppercase font-bold text-slate-400">Receitas do Mês</p>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2">
                  <p className="text-xs uppercase font-bold text-slate-400">Despesas do Mês</p>
                  <p className="text-2xl font-black text-rose-400">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2">
                  <p className="text-xs uppercase font-bold text-slate-400">Taxa de Poupança</p>
                  <p className={`text-2xl font-black ${savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {savingsRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MÓDULO: INVESTIMENTOS (METAS & OBJETIVOS) */}
          {activeModule === 'investimentos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Metas & Objetivos de Investimento</h2>
                  <p className="text-slate-400 text-sm">Defina objetivos e distribua o valor automaticamente nas contas a pagar.</p>
                </div>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <PlusCircle className="w-5 h-5" /> Novo Objetivo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transactions.filter(t => t.description.startsWith('Objetivo:')).length > 0 ? (
                  transactions
                    .filter(t => t.description.startsWith('Objetivo:'))
                    .map(t => (
                      <div key={t.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-lg font-bold text-white">{t.description}</p>
                            <p className="text-xs text-slate-400 mt-1">Vencimento da Parcela: {t.due_date}</p>
                          </div>
                          <Trophy className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                          <div>
                            <p className="text-slate-400 text-xs uppercase">Valor da Parcela</p>
                            <p className="font-black text-white text-lg">{formatCurrency(t.amount)}</p>
                          </div>
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl font-bold">
                            Parcela {t.installment_number}/{t.total_installments}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                    <Target className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-white font-bold text-lg">Nenhum objetivo cadastrado.</p>
                    <p className="text-slate-400 text-sm">Clique em "+ Novo Objetivo" para começar a planear suas conquistas.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'cartoes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-white">Cartões de Crédito</h2>
                <button onClick={() => setIsCardModalOpen(true)} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl">+ Novo Cartão</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {creditCards.map(c => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                    <p className="text-lg font-bold text-white">{c.name}</p>
                    <p className="text-slate-400 text-sm">Limite: {formatCurrency(c.total_limit)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'contas' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Contas Bancárias</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                    <p className="font-bold text-white text-lg">{acc.name}</p>
                    <p className="text-emerald-400 font-black text-xl mt-2">{formatCurrency(acc.balance || acc.current_balance)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'categorias' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Categorias Cadastradas</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="divide-y divide-slate-800">
                  {categories.map(cat => (
                    <div key={cat.id} className="py-3 flex justify-between items-center">
                      <span className="text-white font-medium">{cat.name}</span>
                      <span className="text-xs uppercase bg-slate-800 text-slate-300 px-3 py-1 rounded-md">{cat.flow_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeModule === 'pagar' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-white">Contas a Pagar</h2>
                <button onClick={() => { setTxType('EXPENSE'); setIsTxModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm">
                  + Adicionar Conta a Pagar
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactions.filter(t => t.type === 'EXPENSE').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactions.filter(t => t.type === 'EXPENSE').map(t => (
                      <div key={t.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400">Vencimento: {t.due_date} {t.total_installments > 1 ? `(${t.installment_number}/${t.total_installments})` : ''}</p>
                        </div>
                        <span className="text-rose-400 font-bold">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm py-4">Nenhuma conta a pagar registada.</p>
                )}
              </div>
            </div>
          )}

          {activeModule === 'receber' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-white">Contas a Receber</h2>
                <button onClick={() => { setTxType('INCOME'); setIsTxModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm">
                  + Adicionar Conta a Receber
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactions.filter(t => t.type === 'INCOME').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactions.filter(t => t.type === 'INCOME').map(t => (
                      <div key={t.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400">Data: {t.transaction_date}</p>
                        </div>
                        <span className="text-emerald-400 font-bold">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm py-4">Nenhuma conta a receber registada.</p>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL DE NOVO OBJETIVO / META ================= */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setIsGoalModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-2">Novo Objetivo / Meta</h3>
            <p className="text-xs text-slate-400 mb-6">O valor total será dividido automaticamente nas suas Contas a Pagar mensais.</p>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Objetivo</label>
                <input type="text" required placeholder="Ex: Carro Novo, Viagem, Reserva..." value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor Total Desejado (R$)</label>
                <input type="number" step="0.01" required placeholder="40000,00" value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prazo em Meses (Parcelas)</label>
                <input type="number" min="1" max="120" required value={goalMonths} onChange={e => setGoalMonths(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              {goalTargetAmount && goalMonths && Number(goalMonths) > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  💡 Valor estimado por mês: {formatCurrency(Number(goalTargetAmount) / Number(goalMonths))} / mês
                </div>
              )}

              <button type="submit" disabled={savingGoal} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                {savingGoal ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Criar Objetivo & Gerar Parcelas</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE NOVO LANÇAMENTO ================= */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button onClick={() => setIsTxModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-6">Novo Lançamento</h3>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button type="button" onClick={() => setTxType('EXPENSE')} className={`py-2 rounded-lg font-bold text-sm cursor-pointer ${txType === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>Contas a Pagar</button>
                <button type="button" onClick={() => setTxType('INCOME')} className={`py-2 rounded-lg font-bold text-sm cursor-pointer ${txType === 'INCOME' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>Contas a Receber</button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label>
                <input type="text" required placeholder="Ex: Aluguel, Supermercado..." value={txDescription} onChange={e => setTxDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor Total (R$)</label>
                  <input type="number" step="0.01" required placeholder="0,00" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Forma Pagamento</label>
                  <select value={txPaymentMethod} onChange={e => setTxPaymentMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                    <option value="BOLETO">Boleto / Pix / Dinheiro</option>
                    <option value="CARD">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              {txPaymentMethod === 'CARD' ? (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cartão de Crédito</label>
                  <select value={txCardId} onChange={e => setTxCardId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                    <option value="">Escolha o cartão...</option>
                    {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Conta Bancária</label>
                  <select value={txAccountId} onChange={e => setTxAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                    <option value="">Selecione a conta...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Total de Parcelas</label>
                  <input type="number" min="1" max="48" value={txTotalInstallments} onChange={e => setTxTotalInstallments(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Iniciar da Parcela</label>
                  <input type="number" min="1" max="48" value={txStartInstallment} onChange={e => setTxStartInstallment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data Lançamento</label>
                  <input type="date" value={txTransactionDate} onChange={e => setTxTransactionDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label>
                  <input type="date" value={txDueDate} onChange={e => setTxDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>

              <button type="submit" disabled={savingTx} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                {savingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Lançamento</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CARTÃO ================= */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setIsCardModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-6">Cadastrar Cartão</h3>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Cartão</label>
                <input type="text" required placeholder="Ex: Nubank" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Bandeira</label>
                <input type="text" required placeholder="Ex: Mastercard" value={cardBrand} onChange={e => setCardBrand(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Limite Total (R$)</label>
                <input type="text" required placeholder="5000,00" value={cardLimit} onChange={e => setCardLimit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fechamento</label>
                  <input type="number" min="1" max="31" value={cardClosingDay} onChange={e => setCardClosingDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label>
                  <input type="number" min="1" max="31" value={cardDueDay} onChange={e => setCardDueDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <button type="submit" disabled={savingCard} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                {savingCard ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Cartão</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}