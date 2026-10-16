'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Loader2, PlusCircle, CreditCard, Target, LayoutDashboard, LogOut, X, 
  CheckCircle2, FileText, DollarSign, Layers, PieChart as PieIcon, 
  BarChart3, Trophy, Edit, Trash2, AlertTriangle, Calendar, Filter, Circle, CheckCircle, AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [activeModule, setActiveModule] = useState<'cadastros' | 'pagar' | 'receber' | 'investimentos'>('cadastros');
  const [activeSubMenu, setActiveSubMenu] = useState<string>('geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Família');
  const [familyId, setFamilyId] = useState<string>('1');

  // Filtros de Listagem
  const [filterMonth, setFilterMonth] = useState<number | 'ALL'>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number | 'ALL'>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');

  // Modal Novo Lançamento
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

  // Modal Cartão & Objetivos
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('10');
  const [cardDueDay, setCardDueDay] = useState('17');
  const [savingCard, setSavingCard] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalMonths, setGoalMonths] = useState('12');
  const [goalStartDate, setGoalStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [savingGoal, setSavingGoal] = useState(false);

  // Modais de Edição e Exclusão
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<any>(null);
  const [deleteScope, setDeleteScope] = useState<'single'|'all'>('single');

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
      const [accRes, catRes, cardRes, txRes] = await Promise.all([
        fetch(`https://finanfamily-api.onrender.com/api/accounts?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/categories?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/credit-cards?family_id=${currentFamilyId}`),
        fetch(`https://finanfamily-api.onrender.com/api/transactions?family_id=${currentFamilyId}`)
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (cardRes.ok) setCreditCards(await cardRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } catch (err) {
      setError('Erro de conexão ao carregar dados.');
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

  const formatDatePT = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const getTransactionStatus = (t: any) => {
    if (t.status === 'PAID') return 'PAID';
    const today = new Date().toISOString().split('T')[0];
    const dueDate = t.due_date ? t.due_date.split('T')[0] : '';
    if (dueDate && dueDate < today) return 'OVERDUE';
    return 'PENDING';
  };

  // APAGAR TRANSAÇÃO
  const handleDeleteTx = async () => {
    if (!txToDelete) return;
    try {
      const parentId = txToDelete.parent_transaction_id || txToDelete.id;
      const url = `https://finanfamily-api.onrender.com/api/transactions/${txToDelete.id}?scope=${deleteScope}&parent_id=${parentId}`;
      
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setTxToDelete(null);
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao apagar.');
      }
    } catch (e) {
      setError('Erro de conexão ao apagar.');
    }
  };

  const openDeleteModal = (tx: any) => {
    setTxToDelete(tx);
    setDeleteScope('single');
    setIsDeleteModalOpen(true);
  };

  // EDITAR TRANSAÇÃO
  const openEditModal = (tx: any) => {
    setEditingTx(tx);
    setTxDescription(tx.description);
    setTxAmount(tx.amount.toString());
    setTxDueDate(tx.due_date ? tx.due_date.split('T')[0] : '');
    setTxCategoryId(tx.category_id || '');
    setTxAccountId(tx.account_id || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    try {
      const payload = {
        description: txDescription.trim(),
        amount: Number(txAmount.toString().replace(',', '.')),
        due_date: txDueDate,
        category_id: txCategoryId || null,
        account_id: txAccountId || null,
        payment_method: txPaymentMethod,
        status: editingTx.status
      };

      const res = await fetch(`https://finanfamily-api.onrender.com/api/transactions/${editingTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingTx(null);
        await fetchData();
      } else {
        setError('Erro ao atualizar transação.');
      }
    } catch (e) {
      setError('Erro de conexão.');
    }
  };

  // MARCAR COMO PAGO / PENDENTE RÁPIDO
  const handleToggleStatus = async (tx: any) => {
    const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
    try {
      const payload = {
        description: tx.description,
        amount: tx.amount,
        due_date: tx.due_date ? tx.due_date.split('T')[0] : '',
        category_id: tx.category_id || null,
        account_id: tx.account_id || null,
        payment_method: tx.payment_method || 'BOLETO',
        status: newStatus
      };

      const res = await fetch(`https://finanfamily-api.onrender.com/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      setError('Erro ao atualizar status.');
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    let resolvedFamilyId = familyId;
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = userObj.family_id || userObj.familyId || familyId;
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
        account_id: txAccountId ? txAccountId : (accounts.length > 0 ? accounts[0].id : null),
        credit_card_id: txCardId ? txCardId : null,
        category_id: txCategoryId ? txCategoryId : null,
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

      if (res.ok) {
        setIsTxModalOpen(false);
        setTxDescription('');
        setTxAmount('');
        setTxTotalInstallments('1');
        setTxStartInstallment('1');
        await fetchData();
      }
    } catch (err) {
      setError('Erro de conexão ao salvar transação.');
    } finally {
      setSavingTx(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardBrand || !cardLimit) return;

    let resolvedFamilyId = familyId;
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = userObj.family_id || userObj.familyId || familyId;
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
          total_limit: Number(cardLimit.toString().replace(',', '.')),
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
      }
    } catch (e) {
      setError('Erro ao salvar cartão.');
    } finally {
      setSavingCard(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetAmount || !goalMonths) return;
    setSavingGoal(true);
    
    let resolvedFamilyId = familyId;
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('@FinanFamily:user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          resolvedFamilyId = userObj.family_id || userObj.familyId || familyId;
        } catch (e) {}
      }
    }

    try {
      const totalVal = Number(goalTargetAmount.toString().replace(',', '.'));
      const invCategory = categories.find(c => c.name.toLowerCase() === 'investimento');

      const payload = {
        family_id: resolvedFamilyId,
        description: `Objetivo: ${goalTitle.trim()}`,
        amount: totalVal,
        type: 'EXPENSE',
        payment_method: 'BOLETO',
        account_id: accounts.length > 0 ? accounts[0].id : null,
        credit_card_id: null,
        category_id: invCategory ? invCategory.id : (categories.length > 0 ? categories[0].id : null),
        transaction_date: goalStartDate,
        due_date: goalStartDate,
        total_installments: Number(goalMonths),
        start_installment: 1,
        status: 'PENDING'
      };

      const res = await fetch('https://finanfamily-api.onrender.com/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsGoalModalOpen(false);
        setGoalTitle('');
        setGoalTargetAmount('');
        setGoalMonths('12');
        setGoalStartDate(new Date().toISOString().split('T')[0]);
        await fetchData();
      }
    } catch (err) {} finally { setSavingGoal(false); }
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

  const goalTransactions = transactions.filter(t => t.description.startsWith('Objetivo:'));

  // Lógica de Filtro para Transações Modernas
  const filteredTransactions = (type: 'EXPENSE' | 'INCOME') => {
    return transactions.filter(t => {
      if (t.type !== type) return false;

      // Filtro de Mês/Ano (Agora suporta 'ALL')
      if (t.due_date) {
        const [year, month] = t.due_date.split('-');
        if (filterYear !== 'ALL' && Number(year) !== filterYear) return false;
        if (filterMonth !== 'ALL' && Number(month) !== filterMonth) return false;
      }

      // Filtro de Status
      if (filterStatus !== 'ALL') {
        const currentStatus = getTransactionStatus(t);
        if (filterStatus !== currentStatus) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const renderModernTransactionRow = (t: any, isIncome: boolean) => {
    const status = getTransactionStatus(t);
    const isPaid = status === 'PAID';
    const isOverdue = status === 'OVERDUE';

    return (
      <div key={t.id} className={`p-5 rounded-2xl border transition-all flex justify-between items-center group ${isPaid ? 'bg-slate-900/40 border-slate-800/50 opacity-60 hover:opacity-100' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleToggleStatus(t)}
            className={`flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-500' : isOverdue ? 'text-rose-500 hover:text-rose-400' : 'text-slate-500 hover:text-emerald-400'}`}
          >
            {isPaid ? <CheckCircle className="w-7 h-7" /> : isOverdue ? <AlertCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
          </button>
          
          <div>
            <p className={`font-bold text-base ${isPaid ? 'text-slate-400 line-through' : 'text-white'}`}>{t.description}</p>
            <div className="flex items-center gap-2 mt-1 text-xs font-medium">
              <span className={`px-2 py-0.5 rounded-md ${isPaid ? 'bg-slate-800 text-slate-400' : isOverdue ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" />
                {formatDatePT(t.due_date)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{t.category_name || 'Categoria Geral'}</span>
              {t.total_installments > 1 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    Parcela {t.installment_number}/{t.total_installments}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className={`text-lg font-black ${isPaid ? 'text-slate-500' : isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(t.amount)}
          </span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEditModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-emerald-400 hover:bg-slate-700 transition-colors shadow-sm"><Edit className="w-4 h-4" /></button>
            <button onClick={() => openDeleteModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-rose-400 hover:bg-slate-700 transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  };

  const renderFilterBar = () => (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2 text-slate-300 font-bold">
        <Filter className="w-5 h-5 text-emerald-400" /> Filtros
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-colors">
          <option value={1}>Janeiro</option><option value={2}>Fevereiro</option><option value={3}>Março</option>
          <option value={4}>Abril</option><option value={5}>Maio</option><option value={6}>Junho</option>
          <option value={7}>Julho</option><option value={8}>Agosto</option><option value={9}>Setembro</option>
          <option value={10}>Outubro</option><option value={11}>Novembro</option><option value={12}>Dezembro</option>
        </select>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-colors">
          {[2024, 2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-colors">
          <option value="ALL">Todos os Status</option>
          <option value="PENDING">A Pagar / Pendente</option>
          <option value="OVERDUE">Atrasados</option>
          <option value="PAID">Pagos</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 h-20 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><Wallet className="w-6 h-6" /></div>
          <span className="font-extrabold text-xl text-white tracking-tight">Finan<span className="text-emerald-400">Family</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button onClick={() => { setActiveModule('cadastros'); setActiveSubMenu('geral'); }} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${activeModule === 'cadastros' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>Cadastros</button>
          <button onClick={() => { setActiveModule('pagar'); setActiveSubMenu('contas_pagar'); }} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${activeModule === 'pagar' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>Contas a Pagar</button>
          <button onClick={() => { setActiveModule('receber'); setActiveSubMenu('contas_receber'); }} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${activeModule === 'receber' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>Contas a Receber</button>
          <button onClick={() => { setActiveModule('investimentos'); setActiveSubMenu('metas'); }} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${activeModule === 'investimentos' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>Investimentos</button>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsTxModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"><PlusCircle className="w-5 h-5" /> Novo Lançamento</button>
          <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-semibold p-2"><LogOut className="w-5 h-5" /> Sair</button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-[calc(100vh-5rem)]">
        <aside className={`fixed md:static inset-y-0 left-0 z-20 w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col p-4 space-y-2 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 md:hidden"><span className="font-bold text-white">Menu</span><button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
          <p className="text-xs uppercase font-extrabold text-slate-500 px-3 pb-1">Menus do Módulo</p>
          {activeModule === 'cadastros' && (
            <>
              <button onClick={() => setActiveSubMenu('geral')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'geral' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><LayoutDashboard className="w-5 h-5" /> Visão Geral</button>
              <button onClick={() => setActiveSubMenu('cartoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'cartoes' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><CreditCard className="w-5 h-5" /> Cartões</button>
              <button onClick={() => setActiveSubMenu('contas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'contas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><Wallet className="w-5 h-5" /> Contas</button>
              <button onClick={() => setActiveSubMenu('categorias')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'categorias' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><Layers className="w-5 h-5" /> Categorias</button>
            </>
          )}
          {activeModule === 'pagar' && <button onClick={() => setActiveSubMenu('contas_pagar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'contas_pagar' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><FileText className="w-5 h-5" /> Lançamentos a Pagar</button>}
          {activeModule === 'receber' && <button onClick={() => setActiveSubMenu('contas_receber')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'contas_receber' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><DollarSign className="w-5 h-5" /> Lançamentos a Receber</button>}
          {activeModule === 'investimentos' && <button onClick={() => setActiveSubMenu('metas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeSubMenu === 'metas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400'}`}><Target className="w-5 h-5" /> Metas & Objetivos</button>}
        </aside>

        <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">{error}</div>}

          {activeModule === 'cadastros' && activeSubMenu === 'geral' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-extrabold text-white">Olá, {userName}! 👋</h1><p className="text-slate-400 text-sm mt-1">Raio-x inteligente.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Saldo</p><p className="text-2xl font-black text-white">{formatCurrency(totalBalance)}</p></div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Receitas</p><p className="text-2xl font-black text-emerald-400">{formatCurrency(totalIncome)}</p></div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Despesas</p><p className="text-2xl font-black text-rose-400">{formatCurrency(totalExpense)}</p></div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Poupança</p><p className={`text-2xl font-black ${savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{savingsRate.toFixed(1)}%</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><PieIcon className="w-5 h-5 text-emerald-400" /> Maiores Despesas por Categoria</h3>
                  {sortedCategories.length > 0 ? (
                    <div className="space-y-4">
                      {sortedCategories.map(([catName, amount], index) => {
                        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                        return (
                          <div key={index} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold"><span className="text-white">{catName}</span><span className="text-slate-400">{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span></div>
                            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (amount / maxCategoryAmount) * 100)}%` }}></div></div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-slate-400 text-sm py-4">Nenhuma despesa registada.</p>}
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-400" /> Comparativo de Fluxo</h3>
                  <div className="space-y-4 py-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-300">Entradas Realizadas</span><span className="text-emerald-400 font-bold">{formatCurrency(totalIncome)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-300">Saídas Realizadas</span><span className="text-rose-400 font-bold">{formatCurrency(totalExpense)}</span></div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center mt-4">
                      <div><p className="text-xs uppercase font-bold text-slate-400">Resultado Líquido</p><p className={`text-lg font-black ${totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(totalIncome - totalExpense)}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'cartoes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-extrabold text-white">Cartões de Crédito</h2><button onClick={() => setIsCardModalOpen(true)} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl">+ Novo Cartão</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {creditCards.map(c => <div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl"><p className="text-lg font-bold text-white">{c.name}</p><p className="text-slate-400 text-sm">Limite: {formatCurrency(c.total_limit)}</p></div>)}
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'contas' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Contas Bancárias</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(acc => <div key={acc.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl"><p className="font-bold text-white text-lg">{acc.name}</p><p className="text-emerald-400 font-black text-xl mt-2">{formatCurrency(acc.balance || acc.current_balance)}</p></div>)}
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'categorias' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Categorias Cadastradas</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="divide-y divide-slate-800">
                  {categories.map(cat => <div key={cat.id} className="py-3 flex justify-between items-center"><span className="text-white font-medium">{cat.name}</span><span className="text-xs uppercase bg-slate-800 text-slate-300 px-3 py-1 rounded-md">{cat.flow_type}</span></div>)}
                </div>
              </div>
            </div>
          )}

          {/* NOVO LAYOUT MODERNIZADO: CONTAS A PAGAR */}
          {activeModule === 'pagar' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Contas a Pagar</h2>
                  <p className="text-slate-400 text-sm mt-1">Controle e organize as suas despesas.</p>
                </div>
                <button onClick={() => { setTxType('EXPENSE'); setIsTxModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Adicionar
                </button>
              </div>

              {renderFilterBar()}

              <div className="space-y-3">
                {filteredTransactions('EXPENSE').length > 0 ? (
                  filteredTransactions('EXPENSE').map(t => renderModernTransactionRow(t, false))
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-white font-bold text-lg">Tudo limpo por aqui!</p>
                    <p className="text-slate-400 text-sm">Nenhuma conta encontrada para estes filtros.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOVO LAYOUT MODERNIZADO: CONTAS A RECEBER */}
          {activeModule === 'receber' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Contas a Receber</h2>
                  <p className="text-slate-400 text-sm mt-1">Monitorize as suas entradas e receitas previstas.</p>
                </div>
                <button onClick={() => { setTxType('INCOME'); setIsTxModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Adicionar
                </button>
              </div>

              {renderFilterBar()}

              <div className="space-y-3">
                {filteredTransactions('INCOME').length > 0 ? (
                  filteredTransactions('INCOME').map(t => renderModernTransactionRow(t, true))
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-white font-bold text-lg">Sem previsões de entrada.</p>
                    <p className="text-slate-400 text-sm">Nenhuma receita encontrada para estes filtros.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeModule === 'investimentos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Metas & Objetivos de Investimento</h2>
                  <p className="text-slate-400 text-sm">Defina objetivos e distribua o valor automaticamente nas contas a pagar na categoria "Investimento".</p>
                </div>
                <button onClick={() => setIsGoalModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg">
                  <PlusCircle className="w-5 h-5" /> Novo Objetivo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goalTransactions.length > 0 ? (
                  goalTransactions.map(t => (
                    <div key={t.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 relative group overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400 mt-1">Vencimento da Parcela: {formatDatePT(t.due_date)}</p>
                        </div>
                        <Trophy className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                        <div><p className="text-slate-400 text-xs uppercase">Valor da Parcela</p><p className="font-black text-white text-lg">{formatCurrency(t.amount)}</p></div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl font-bold">Parcela {t.installment_number}/{t.total_installments}</span>
                      </div>
                      <div className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                         <button onClick={() => openEditModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-emerald-400 hover:bg-slate-700 transition-colors"><Edit className="w-4 h-4" /></button>
                         <button onClick={() => openDeleteModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-rose-400 hover:bg-slate-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                ) : <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3"><Target className="w-12 h-12 text-slate-600 mx-auto" /><p className="text-white font-bold text-lg">Nenhum objetivo cadastrado.</p><p className="text-slate-400 text-sm">Clique em "+ Novo Objetivo" para começar a planear suas conquistas.</p></div>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL DE EXCLUSÃO INTELIGENTE ================= */}
      {isDeleteModalOpen && txToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            <div className="flex items-center gap-3 mb-6 text-rose-400"><AlertTriangle className="w-8 h-8" /><h3 className="text-xl font-extrabold text-white">Apagar Lançamento</h3></div>
            <p className="text-sm text-slate-300 mb-6">Tem certeza que deseja apagar <strong>{txToDelete.description}</strong> no valor de {formatCurrency(txToDelete.amount)}?</p>
            {txToDelete.total_installments > 1 && (
              <div className="mb-6 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Este lançamento faz parte de um parcelamento:</p>
                <label className="flex items-center gap-3 cursor-pointer"><input type="radio" checked={deleteScope === 'single'} onChange={() => setDeleteScope('single')} className="w-4 h-4 text-rose-500 bg-slate-900 border-slate-700" /><span className="text-sm text-white font-medium">Apagar apenas esta parcela ({txToDelete.installment_number}/{txToDelete.total_installments})</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="radio" checked={deleteScope === 'all'} onChange={() => setDeleteScope('all')} className="w-4 h-4 text-rose-500 bg-slate-900 border-slate-700" /><span className="text-sm text-white font-medium">Apagar TODAS as parcelas desta série</span></label>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleDeleteTx} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Apagar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE EDIÇÃO ================= */}
      {isEditModalOpen && editingTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2"><Edit className="w-6 h-6 text-emerald-400" /> Editar Lançamento</h3>
            <form onSubmit={handleUpdateTx} className="space-y-4">
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label><input type="text" required value={txDescription} onChange={e => setTxDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor (R$)</label><input type="number" step="0.01" required value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label><input type="date" required value={txDueDate} onChange={e => setTxDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"><CheckCircle2 className="w-5 h-5" /> Guardar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE NOVO OBJETIVO / META ================= */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setIsGoalModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-2">Novo Objetivo / Meta</h3>
            <p className="text-xs text-slate-400 mb-6">O valor total será dividido automaticamente nas suas Contas a Pagar na categoria "Investimento".</p>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Objetivo</label><input type="text" required placeholder="Ex: Carro Novo, Viagem, Reserva..." value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor Total Desejado (R$)</label><input type="number" step="0.01" required placeholder="40000,00" value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prazo (Meses)</label><input type="number" min="1" max="120" required value={goalMonths} onChange={e => setGoalMonths(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data de Início</label><input type="date" required value={goalStartDate} onChange={e => setGoalStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              </div>
              {goalTargetAmount && goalMonths && Number(goalMonths) > 0 && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-2">💡 Valor estimado por mês: {formatCurrency(Number(goalTargetAmount) / Number(goalMonths))} / mês</div>}
              <button type="submit" disabled={savingGoal} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">{savingGoal ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Programar Investimento</>}</button>
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
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label><input type="text" required placeholder="Ex: Aluguel, Supermercado..." value={txDescription} onChange={e => setTxDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor Total (R$)</label><input type="number" step="0.01" required placeholder="0,00" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Forma Pagamento</label>
                  <select value={txPaymentMethod} onChange={e => setTxPaymentMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"><option value="BOLETO">Boleto / Pix / Dinheiro</option><option value="CARD">Cartão de Crédito</option></select>
                </div>
              </div>
              {txPaymentMethod === 'CARD' ? (
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cartão de Crédito</label><select value={txCardId} onChange={e => setTxCardId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"><option value="">Escolha o cartão...</option>{creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              ) : (
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Conta Bancária</label><select value={txAccountId} onChange={e => setTxAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"><option value="">Selecione a conta...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Total de Parcelas</label><input type="number" min="1" max="48" value={txTotalInstallments} onChange={e => setTxTotalInstallments(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Iniciar da Parcela</label><input type="number" min="1" max="48" value={txStartInstallment} onChange={e => setTxStartInstallment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data Lançamento</label><input type="date" value={txTransactionDate} onChange={e => setTxTransactionDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label><input type="date" value={txDueDate} onChange={e => setTxDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              </div>
              <button type="submit" disabled={savingTx} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">{savingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Lançamento</>}</button>
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
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Cartão</label><input type="text" required placeholder="Ex: Nubank" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Bandeira</label><input type="text" required placeholder="Ex: Mastercard" value={cardBrand} onChange={e => setCardBrand(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Limite Total (R$)</label><input type="text" required placeholder="5000,00" value={cardLimit} onChange={e => setCardLimit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fechamento</label><input type="number" min="1" max="31" value={cardClosingDay} onChange={e => setCardClosingDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label><input type="number" min="1" max="31" value={cardDueDay} onChange={e => setCardDueDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" /></div>
              </div>
              <button type="submit" disabled={savingCard} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">{savingCard ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Cartão</>}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}