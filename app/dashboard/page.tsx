'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Loader2, PlusCircle, CreditCard, Target, LayoutDashboard, LogOut, X, 
  CheckCircle2, FileText, DollarSign, Layers, Sparkles, PieChart as PieIcon, 
  BarChart3, Trophy, Edit, Trash2, AlertTriangle
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

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetAmount || !goalMonths) return;
    setSavingGoal(true);
    
    let resolvedFamilyId = familyId;
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

  const renderTransactionRow = (t: any, isIncome: boolean) => (
    <div key={t.id} className="py-4 flex justify-between items-center group">
      <div>
        <p className="font-bold text-white">{t.description}</p>
        <p className="text-xs text-slate-400">
          Vencimento: {formatDatePT(t.due_date)} {t.total_installments > 1 ? `(${t.installment_number}/${t.total_installments})` : ''} • Categoria: {t.category_name || 'Geral'}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`${isIncome ? 'text-emerald-400' : 'text-rose-400'} font-bold text-right`}>{formatCurrency(t.amount)}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openEditModal(t)} className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-emerald-400 hover:bg-slate-700 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => openDeleteModal(t)} className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-rose-400 hover:bg-slate-700 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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

          {activeModule === 'pagar' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-white">Contas a Pagar</h2>
                <button onClick={() => { setTxType('EXPENSE'); setIsTxModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm">+ Adicionar</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactions.filter(t => t.type === 'EXPENSE').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactions.filter(t => t.type === 'EXPENSE').map(t => renderTransactionRow(t, false))}
                  </div>
                ) : <p className="text-slate-400 text-sm py-4">Nenhuma conta a pagar registada.</p>}
              </div>
            </div>
          )}

          {activeModule === 'receber' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-white">Contas a Receber</h2>
                <button onClick={() => { setTxType('INCOME'); setIsTxModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm">+ Adicionar</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactions.filter(t => t.type === 'INCOME').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactions.filter(t => t.type === 'INCOME').map(t => renderTransactionRow(t, true))}
                  </div>
                ) : <p className="text-slate-400 text-sm py-4">Nenhuma conta a receber registada.</p>}
              </div>
            </div>
          )}

          {/* ... Outros modulos (Geral, Cartões, Objetivos) como já estavam ... */}
          {activeModule === 'cadastros' && activeSubMenu === 'geral' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-extrabold text-white">Olá, {userName}! 👋</h1><p className="text-slate-400 text-sm mt-1">Raio-x inteligente.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Saldo</p><p className="text-2xl font-black text-white">{formatCurrency(totalBalance)}</p></div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Receitas</p><p className="text-2xl font-black text-emerald-400">{formatCurrency(totalIncome)}</p></div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Despesas</p><p className="text-2xl font-black text-rose-400">{formatCurrency(totalExpense)}</p></div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2"><p className="text-xs uppercase font-bold text-slate-400">Poupança</p><p className={`text-2xl font-black ${savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{savingsRate.toFixed(1)}%</p></div>
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
            <div className="flex items-center gap-3 mb-6 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-extrabold text-white">Apagar Lançamento</h3>
            </div>
            
            <p className="text-sm text-slate-300 mb-6">
              Tem certeza que deseja apagar <strong>{txToDelete.description}</strong> no valor de {formatCurrency(txToDelete.amount)}?
            </p>

            {txToDelete.total_installments > 1 && (
              <div className="mb-6 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Este lançamento faz parte de um parcelamento:</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" checked={deleteScope === 'single'} onChange={() => setDeleteScope('single')} className="w-4 h-4 text-rose-500 bg-slate-900 border-slate-700" />
                  <span className="text-sm text-white font-medium">Apagar apenas esta parcela ({txToDelete.installment_number}/{txToDelete.total_installments})</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" checked={deleteScope === 'all'} onChange={() => setDeleteScope('all')} className="w-4 h-4 text-rose-500 bg-slate-900 border-slate-700" />
                  <span className="text-sm text-white font-medium">Apagar TODAS as parcelas desta série</span>
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleDeleteTx} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Apagar
              </button>
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
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label>
                <input type="text" required value={txDescription} onChange={e => setTxDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" required value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label>
                  <input type="date" required value={txDueDate} onChange={e => setTxDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                <CheckCircle2 className="w-5 h-5" /> Guardar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* (Mantenha o Modal de Novo Lançamento e Novo Cartão que já existiam aqui em baixo) */}

    </div>
  );
}