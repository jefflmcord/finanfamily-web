'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreditCardList from '@/components/CreditCardList';
import { getCardPurchaseDueDate } from '@/lib/creditCardBilling';
import {
  Wallet, Loader2, PlusCircle, CreditCard, Target, LayoutDashboard, LogOut, X, 
  CheckCircle2, FileText, DollarSign, Layers, PieChart as PieIcon, 
  BarChart3, Trophy, Edit, Trash2, AlertTriangle, Calendar, Filter, Circle, CheckCircle, AlertCircle,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Sparkles, Clock
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

  // Filtros do Dashboard Inicial (Visão Geral)
  const [dashboardYear, setDashboardYear] = useState<number>(new Date().getFullYear());
  const [chartStatusMode, setChartStatusMode] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [selectedChartMonth, setSelectedChartMonth] = useState<number>(new Date().getMonth() + 1);

  // Filtros de Listagem
  const [filterMonth, setFilterMonth] = useState<number | 'ALL'>('ALL');
  const [filterYear, setFilterYear] = useState<number | 'ALL'>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [payingExpenses, setPayingExpenses] = useState(false);

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

  const openDeleteModal = (tx: any, scope: 'single' | 'all' = 'single') => {
    setTxToDelete(tx);
    setDeleteScope(scope);
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

  const updateTransactionStatus = async (tx: any, status: 'PAID' | 'PENDING') => {
    try {
      const payload = {
        description: tx.description,
        amount: tx.amount,
        due_date: tx.due_date ? tx.due_date.split('T')[0] : '',
        category_id: tx.category_id || null,
        account_id: tx.account_id || null,
        payment_method: tx.payment_method || 'BOLETO',
        status
      };

      const res = await fetch(`https://finanfamily-api.onrender.com/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar o lançamento.');
      }
    } catch (err) {
      throw err;
    }
  };

  const payTransaction = async (tx: any) => {
    const res = await fetch(`https://finanfamily-api.onrender.com/api/transactions/${tx.id}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: tx.account_id || accounts[0]?.id || null,
        paid_amount: Number(tx.amount),
        payment_date: new Date().toISOString().split('T')[0],
      }),
    });

    if (!res.ok) {
      let message = 'Erro ao baixar o lançamento.';
      try {
        const data = await res.json();
        message = data.error || message;
      } catch {}
      throw new Error(message);
    }
  };

  // MARCAR COMO PAGO / PENDENTE RÁPIDO
  const handleToggleStatus = async (tx: any) => {
    const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await updateTransactionStatus(tx, newStatus);
      setSelectedExpenseIds(ids => ids.filter(id => id !== String(tx.id)));
      await fetchData();
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

    const cardForTransaction = txType === 'EXPENSE' && txPaymentMethod === 'CARD'
      ? creditCards.find(card => String(card.id) === String(txCardId))
      : null;
    const transactionDueDate = cardForTransaction
      ? getCardPurchaseDueDate(txTransactionDate, Number(cardForTransaction.closing_day), Number(cardForTransaction.due_day))
      : txDueDate;

    try {
      const payload = {
        family_id: resolvedFamilyId,
        description: txDescription.trim(),
        amount: Number(txAmount.toString().replace(',', '.')),
        type: txType,
        payment_method: txPaymentMethod,
        account_id: txAccountId ? txAccountId : (accounts.length > 0 ? accounts[0].id : null),
        credit_card_id: cardForTransaction ? txCardId : null,
        category_id: txCategoryId ? txCategoryId : null,
        transaction_date: txTransactionDate,
        due_date: transactionDueDate,
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

  const getTxYearMonth = (t: any): { year: number; month: number } | null => {
    const raw = t.due_date || t.transaction_date;
    if (!raw || typeof raw !== 'string') return null;
    const clean = raw.split('T')[0];
    const parts = clean.split('-');
    if (parts.length < 2) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return null;
    return { year: y, month: m };
  };

  const availableYears = Array.from(
    new Set([
      2024, 2025, 2026, 2027, 2028, 2029,
      new Date().getFullYear(),
      ...transactions.map(t => getTxYearMonth(t)?.year).filter((y): y is number => typeof y === 'number')
    ])
  ).sort((a, b) => a - b);

  const yearTransactions = transactions.filter(t => {
    const ym = getTxYearMonth(t);
    return ym ? ym.year === dashboardYear : false;
  });

  const yearIncomeTotal = yearTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const yearIncomePaid = yearTransactions
    .filter(t => t.type === 'INCOME' && t.status === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const yearIncomePending = Math.max(0, yearIncomeTotal - yearIncomePaid);

  const yearExpenseTotal = yearTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const yearExpensePaid = yearTransactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const yearExpensePending = Math.max(0, yearExpenseTotal - yearExpensePaid);
  const yearOverdueTransactions = yearTransactions.filter(
    t => t.type === 'EXPENSE' && getTransactionStatus(t) === 'OVERDUE'
  );
  const yearExpenseOverdue = yearOverdueTransactions.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const yearNetProjected = yearIncomeTotal - yearExpenseTotal;
  const yearNetRealized = yearIncomePaid - yearExpensePaid;
  const yearSavingsRate = yearIncomeTotal > 0 ? Math.max(0, ((yearIncomeTotal - yearExpenseTotal) / yearIncomeTotal) * 100) : 0;
  const yearCommitmentRate = yearIncomeTotal > 0 ? Math.min(100, (yearExpenseTotal / yearIncomeTotal) * 100) : 0;
  const yearIncomeReceivedRate = yearIncomeTotal > 0 ? Math.min(100, (yearIncomePaid / yearIncomeTotal) * 100) : 0;
  const yearExpensePaidRate = yearExpenseTotal > 0 ? Math.min(100, (yearExpensePaid / yearExpenseTotal) * 100) : 0;

  const MONTH_SHORT_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MONTH_FULL_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  let runningCumulativeBalance = 0;
  const monthlyChartData = MONTH_SHORT_NAMES.map((shortLabel, index) => {
    const monthNumber = index + 1;
    const monthTxs = yearTransactions.filter(t => getTxYearMonth(t)?.month === monthNumber);

    const incomeTotal = monthTxs
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const incomePaid = monthTxs
      .filter(t => t.type === 'INCOME' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const incomePending = Math.max(0, incomeTotal - incomePaid);

    const expenseTotal = monthTxs
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expensePaid = monthTxs
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expensePending = Math.max(0, expenseTotal - expensePaid);

    const displayIncome =
      chartStatusMode === 'PAID' ? incomePaid : chartStatusMode === 'PENDING' ? incomePending : incomeTotal;
    const displayExpense =
      chartStatusMode === 'PAID' ? expensePaid : chartStatusMode === 'PENDING' ? expensePending : expenseTotal;
    const netBalance = displayIncome - displayExpense;
    runningCumulativeBalance += netBalance;

    return {
      monthNumber,
      shortLabel,
      fullName: MONTH_FULL_NAMES[index],
      incomeTotal,
      incomePaid,
      incomePending,
      expenseTotal,
      expensePaid,
      expensePending,
      displayIncome,
      displayExpense,
      netBalance,
      cumulativeBalance: runningCumulativeBalance,
      txCount: monthTxs.length,
    };
  });

  const maxMonthlyChartValue = Math.max(
    1,
    ...monthlyChartData.map(m => Math.max(m.displayIncome, m.displayExpense))
  );

  const maxAbsMonthlyNet = Math.max(
    1,
    ...monthlyChartData.map(m => Math.abs(m.netBalance))
  );

  const selectedMonthDetail =
    monthlyChartData.find(m => m.monthNumber === selectedChartMonth) || monthlyChartData[new Date().getMonth()] || monthlyChartData[0];

  const CATEGORY_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#a855f7', '#f43f5e', '#6366f1'];
  const expensesByCategory: { [key: string]: number } = {};
  yearTransactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      const catName = t.category_name || 'Outros';
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(t.amount || 0);
    });

  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  let donutAccumulatedPercent = 0;
  const categoryDonutSegments = sortedCategories.map(([catName, amount], idx) => {
    const percentage = yearExpenseTotal > 0 ? (amount / yearExpenseTotal) * 100 : 0;
    const offset = 100 - donutAccumulatedPercent;
    donutAccumulatedPercent += percentage;
    return {
      name: catName,
      amount,
      percentage,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      strokeDasharray: `${percentage} ${Math.max(0, 100 - percentage)}`,
      strokeDashoffset: offset,
    };
  });

  const upcomingAndOverdueExpenses = yearTransactions
    .filter(t => t.type === 'EXPENSE' && getTransactionStatus(t) !== 'PAID')
    .sort((a, b) => new Date(a.due_date || a.transaction_date).getTime() - new Date(b.due_date || b.transaction_date).getTime())
    .slice(0, 5);

  const formatCompactCurrency = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
    return `R$ ${val.toFixed(0)}`;
  };

  const investmentGoals = Array.from<any[]>(
    transactions
      .filter((transaction: any) => typeof transaction.description === 'string' && transaction.description.startsWith('Objetivo:'))
      .reduce((groups, transaction: any) => {
        const goalId = transaction.parent_transaction_id || transaction.id;
        const installments = groups.get(goalId) || [];
        installments.push(transaction);
        groups.set(goalId, installments);
        return groups;
      }, new Map<string, any[]>())
      .values()
  ).map((installments: any[]) => {
    const firstInstallment = installments.find(transaction => Number(transaction.installment_number) === 1) || installments[0];
    const targetAmount = installments.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const paidInstallments = installments.filter(transaction => transaction.status === 'PAID');
    const paidAmount = paidInstallments.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const totalInstallments = Math.max(...installments.map(transaction => Number(transaction.total_installments) || 1));
    const title = String(firstInstallment.description)
      .replace(/^Objetivo:\s*/, '')
      .replace(/\s+\(\d+\s*\/\s*\d+\)$/, '');

    return {
      id: firstInstallment.parent_transaction_id || firstInstallment.id,
      firstInstallment,
      title,
      targetAmount,
      paidAmount,
      paidInstallmentCount: paidInstallments.length,
      totalInstallments,
      progress: targetAmount > 0 ? Math.min(100, (paidAmount / targetAmount) * 100) : 0,
    };
  });

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

  const payableExpenses = filteredTransactions('EXPENSE').filter(t => getTransactionStatus(t) !== 'PAID');
  const selectedPayableExpenses = payableExpenses.filter(t => selectedExpenseIds.includes(String(t.id)));
  const allPayableExpensesSelected = payableExpenses.length > 0 && selectedPayableExpenses.length === payableExpenses.length;

  const handleExpenseSelection = (expenseId: string, selected: boolean) => {
    setSelectedExpenseIds(ids => selected
      ? [...new Set([...ids, expenseId])]
      : ids.filter(id => id !== expenseId));
  };

  const handleSelectAllPayableExpenses = (selected: boolean) => {
    setSelectedExpenseIds(selected ? payableExpenses.map(t => String(t.id)) : []);
  };

  const handlePayExpenses = async (expenses: any[]) => {
    if (expenses.length === 0) return;

    setPayingExpenses(true);
    setError('');

    try {
      const results = await Promise.allSettled(
        expenses.map(payTransaction)
      );
      const paidIds = expenses
        .filter((_, index) => results[index].status === 'fulfilled')
        .map(transaction => String(transaction.id));
      const failedCount = results.length - paidIds.length;

      setSelectedExpenseIds(ids => ids.filter(id => !paidIds.includes(id)));
      if (failedCount > 0) {
        setError(`${paidIds.length} lançamento(s) baixado(s); ${failedCount} não puderam ser atualizados.`);
      }

      await fetchData();
    } finally {
      setPayingExpenses(false);
    }
  };

  const handlePaySelectedExpenses = () => handlePayExpenses(selectedPayableExpenses);

  const renderModernTransactionRow = (t: any, isIncome: boolean) => {
    const status = getTransactionStatus(t);
    const isPaid = status === 'PAID';
    const isOverdue = status === 'OVERDUE';
    const isSelected = selectedExpenseIds.includes(String(t.id));

    return (
      <div key={t.id} className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group ${isPaid ? 'bg-slate-900/40 border-slate-800/50 opacity-60 hover:opacity-100' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
        <div className="flex items-center gap-4 min-w-0">
          {isIncome ? (
            <button
              onClick={() => handleToggleStatus(t)}
              title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
              aria-label={isPaid ? `Marcar ${t.description} como pendente` : `Marcar ${t.description} como pago`}
              className={`flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-500' : isOverdue ? 'text-rose-500 hover:text-rose-400' : 'text-slate-500 hover:text-emerald-400'}`}
            >
              {isPaid ? <CheckCircle className="w-7 h-7" /> : isOverdue ? <AlertCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
            </button>
          ) : isPaid ? (
            <CheckCircle className="w-7 h-7 flex-shrink-0 text-emerald-500" aria-label="Lançamento pago" />
          ) : (
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={payingExpenses}
              onClick={() => handleExpenseSelection(String(t.id), !isSelected)}
              title={isSelected ? 'Desmarcar lançamento' : 'Selecionar para baixa'}
              aria-label={`${isSelected ? 'Desmarcar' : 'Selecionar'} ${t.description} para baixa`}
              className={`flex-shrink-0 transition-colors disabled:opacity-40 ${isSelected ? 'text-emerald-400' : isOverdue ? 'text-rose-500 hover:text-rose-400' : 'text-slate-500 hover:text-emerald-400'}`}
            >
              {isSelected ? <CheckCircle className="w-7 h-7" /> : isOverdue ? <AlertCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
            </button>
          )}
          
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

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className={`text-lg font-black ${isPaid ? 'text-slate-500' : isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(t.amount)}
          </span>
          <div className="flex items-center gap-2">
            {!isIncome && !isPaid && (
              <button
                onClick={() => handlePayExpenses([t])}
                disabled={payingExpenses}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Baixar
              </button>
            )}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-emerald-400 hover:bg-slate-700 transition-colors shadow-sm"><Edit className="w-4 h-4" /></button>
              <button onClick={() => openDeleteModal(t)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-rose-400 hover:bg-slate-700 transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
            </div>
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
        <select value={filterMonth} onChange={e => { setSelectedExpenseIds([]); setFilterMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)); }} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-colors">
          <option value="ALL">Todos os meses</option>
          <option value={1}>Janeiro</option><option value={2}>Fevereiro</option><option value={3}>Março</option>
          <option value={4}>Abril</option><option value={5}>Maio</option><option value={6}>Junho</option>
          <option value={7}>Julho</option><option value={8}>Agosto</option><option value={9}>Setembro</option>
          <option value={10}>Outubro</option><option value={11}>Novembro</option><option value={12}>Dezembro</option>
        </select>
        <select value={filterYear} onChange={e => { setSelectedExpenseIds([]); setFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)); }} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-colors">
          <option value="ALL">Todos os anos</option>
          {[2024, 2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setSelectedExpenseIds([]); setFilterStatus(e.target.value as any); }} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-colors">
          <option value="ALL">Todos os Status</option>
          <option value="PENDING">A Pagar / Pendente</option>
          <option value="OVERDUE">Atrasados</option>
          <option value="PAID">Pagos</option>
        </select>
      </div>
    </div>
  );

  const selectedTransactionCard = creditCards.find(card => String(card.id) === String(txCardId));
  const calculatedCardDueDate = txType === 'EXPENSE' && txPaymentMethod === 'CARD' && selectedTransactionCard
    ? getCardPurchaseDueDate(txTransactionDate, Number(selectedTransactionCard.closing_day), Number(selectedTransactionCard.due_day))
    : '';

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

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8">
          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">{error}</div>}

          {activeModule === 'cadastros' && activeSubMenu === 'geral' && (
            <div className="space-y-8">
              {/* TOP BAR: SAUDAÇÃO + FILTRO DE ANO E VISÃO */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800/90 p-6 rounded-3xl shadow-xl">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Painel Inteligente • Exercício {dashboardYear}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Olá, {userName}!
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Acompanhe a evolução mês a mês das receitas, despesas e indicadores da família.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Seletor de Modo (Previsto+Realizado vs Realizado vs Pendente) */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-2xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setChartStatusMode('ALL')}
                      className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        chartStatusMode === 'ALL'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Total (Previsto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartStatusMode('PAID')}
                      className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        chartStatusMode === 'PAID'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Realizado
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartStatusMode('PENDING')}
                      className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        chartStatusMode === 'PENDING'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Em Aberto
                    </button>
                  </div>

                  {/* Filtro de Ano com navegação rápida */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-2xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setDashboardYear(y => y - 1)}
                      title="Ano anterior"
                      aria-label="Ano anterior"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 px-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <select
                        aria-label="Filtrar dashboard por ano"
                        value={dashboardYear}
                        onChange={e => setDashboardYear(Number(e.target.value))}
                        className="bg-transparent text-sm font-extrabold text-white outline-none cursor-pointer pr-1"
                      >
                        {availableYears.map(y => (
                          <option key={y} value={y} className="bg-slate-900 text-white">
                            Ano {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDashboardYear(y => y + 1)}
                      title="Próximo ano"
                      aria-label="Próximo ano"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. CARDS MODERNOS DE INDICADORES (KPIs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Saldo em Contas */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 hover:border-slate-700 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Saldo em Contas
                    </span>
                    <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {formatCurrency(totalBalance)}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {accounts.length} {accounts.length === 1 ? 'conta ativa' : 'contas ativas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubMenu('contas')}
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      Ver contas <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card 2: Total a Receber no Ano */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-slate-800/90 hover:border-emerald-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Total a Receber ({dashboardYear})
                    </span>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                    {formatCurrency(yearIncomeTotal)}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${yearIncomeReceivedRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-emerald-400/90">
                        Recebido: {formatCurrency(yearIncomePaid)}
                      </span>
                      <span className="text-slate-400">
                        Falta: {formatCurrency(yearIncomePending)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Total a Pagar no Ano */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 border border-slate-800/90 hover:border-rose-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Total a Pagar ({dashboardYear})
                    </span>
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                    {formatCurrency(yearExpenseTotal)}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${yearExpensePaidRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-300">
                        Pago: {formatCurrency(yearExpensePaid)}
                      </span>
                      <span className="text-amber-400">
                        Em aberto: {formatCurrency(yearExpensePending)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Resultado & Taxa de Poupança */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/25 border border-slate-800/90 hover:border-indigo-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Balanço & Poupança
                    </span>
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                        yearNetProjected >= 0
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                  </div>
                  <p
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      yearNetProjected >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(yearNetProjected)}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Poupança:{' '}
                      <strong className={yearSavingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}>
                        {yearSavingsRate.toFixed(1)}%
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      Comprometido:{' '}
                      <strong className={yearCommitmentRate <= 80 ? 'text-slate-200' : 'text-rose-400'}>
                        {yearCommitmentRate.toFixed(0)}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. GRÁFICO PRINCIPAL MÊS A MÊS: TOTAL A RECEBER VS TOTAL A PAGAR (COM FILTRO POR ANO) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-white">
                          Total a Receber vs Total a Pagar — Mês a Mês ({dashboardYear})
                        </h2>
                        <p className="text-xs text-slate-400">
                          Comparativo mensal de entradas e saídas ao longo do ano selecionado. Clique em um mês para inspecionar.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Legenda + Filtro rápido de Ano no próprio Gráfico */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-2 text-slate-300">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Total a Receber
                      </span>
                      <span className="flex items-center gap-2 text-slate-300">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-rose-600 to-rose-400 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        Total a Pagar
                      </span>
                    </div>

                    <select
                      aria-label="Selecionar ano do gráfico mensal"
                      value={dashboardYear}
                      onChange={e => setDashboardYear(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3.5 py-2 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>
                          Ano: {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Área do Gráfico de Barras Agrupadas (Jan a Dez) + Painel Lateral do Mês Selecionado */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                  {/* Colunas dos 12 Meses */}
                  <div className="xl:col-span-8 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
                    <div className="relative h-64 sm:h-72 flex flex-col justify-between">
                      {/* Linhas de Grade de Referência */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
                        {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                          <div key={idx} className="flex items-center gap-2 w-full">
                            <span className="text-[10px] font-semibold text-slate-500 w-14 text-right shrink-0">
                              {formatCompactCurrency(maxMonthlyChartValue * ratio)}
                            </span>
                            <div className="flex-1 border-b border-dashed border-slate-800/80" />
                          </div>
                        ))}
                      </div>

                      {/* Barras Mês a Mês */}
                      <div className="relative z-10 flex-1 flex items-end justify-between gap-1.5 sm:gap-3 pl-16 pr-1 pt-4 pb-1">
                        {monthlyChartData.map(m => {
                          const incomeHeightPercent =
                            m.displayIncome > 0
                              ? Math.max(4, Math.round((m.displayIncome / maxMonthlyChartValue) * 100))
                              : 0;
                          const expenseHeightPercent =
                            m.displayExpense > 0
                              ? Math.max(4, Math.round((m.displayExpense / maxMonthlyChartValue) * 100))
                              : 0;
                          const isSelected = selectedChartMonth === m.monthNumber;

                          return (
                            <div
                              key={m.monthNumber}
                              onClick={() => setSelectedChartMonth(m.monthNumber)}
                              onMouseEnter={() => setSelectedChartMonth(m.monthNumber)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedChartMonth(m.monthNumber);
                                }
                              }}
                              aria-label={`${m.fullName} de ${dashboardYear}: A receber ${formatCurrency(m.displayIncome)}, A pagar ${formatCurrency(m.displayExpense)}`}
                              className={`group flex-1 h-full flex flex-col justify-end items-center cursor-pointer rounded-xl px-1 py-1 transition-all ${
                                isSelected
                                  ? 'bg-slate-800/60 ring-1 ring-emerald-500/40'
                                  : 'hover:bg-slate-900/60'
                              }`}
                            >
                              {/* Par de Barras */}
                              <div className="w-full flex-1 flex items-end justify-center gap-1 sm:gap-1.5">
                                {/* Barra A Receber */}
                                <div className="w-2.5 sm:w-3.5 h-full flex items-end">
                                  <div
                                    style={{ height: `${incomeHeightPercent}%` }}
                                    title={`${m.fullName} - A Receber: ${formatCurrency(m.displayIncome)}`}
                                    className={`w-full rounded-t-md transition-all duration-500 ${
                                      incomeHeightPercent > 0
                                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-110 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                                        : 'h-[2px] bg-slate-800'
                                    }`}
                                  />
                                </div>

                                {/* Barra A Pagar */}
                                <div className="w-2.5 sm:w-3.5 h-full flex items-end">
                                  <div
                                    style={{ height: `${expenseHeightPercent}%` }}
                                    title={`${m.fullName} - A Pagar: ${formatCurrency(m.displayExpense)}`}
                                    className={`w-full rounded-t-md transition-all duration-500 ${
                                      expenseHeightPercent > 0
                                        ? 'bg-gradient-to-t from-rose-600 to-rose-400 group-hover:brightness-110 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                                        : 'h-[2px] bg-slate-800'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rótulos dos Meses (Eixo X) + Indicador de Saldo do Mês */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-3 pl-16 pr-1 pt-2 border-t border-slate-800/80">
                      {monthlyChartData.map(m => {
                        const isSelected = selectedChartMonth === m.monthNumber;
                        const hasActivity = m.displayIncome > 0 || m.displayExpense > 0;
                        return (
                          <button
                            key={m.monthNumber}
                            type="button"
                            onClick={() => setSelectedChartMonth(m.monthNumber)}
                            className={`flex-1 flex flex-col items-center py-1 rounded-lg transition-colors cursor-pointer ${
                              isSelected ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white font-semibold'
                            }`}
                          >
                            <span className="text-[11px]">{m.shortLabel}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                !hasActivity
                                  ? 'bg-slate-800'
                                  : m.netBalance >= 0
                                  ? 'bg-emerald-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Lateral de Inspeção do Mês Selecionado */}
                  <div className="xl:col-span-4 bg-slate-950 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                          {selectedMonthDetail.fullName} / {dashboardYear}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          {selectedMonthDetail.txCount} lançamento(s)
                        </span>
                      </div>

                      <div className="space-y-3 mt-4">
                        {/* Bloco Receber do Mês */}
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-bold flex items-center gap-1.5">
                              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                              Total a Receber
                            </span>
                            <span className="text-emerald-400 font-black text-sm">
                              {formatCurrency(selectedMonthDetail.incomeTotal)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Recebido: {formatCurrency(selectedMonthDetail.incomePaid)}</span>
                            <span>A receber: {formatCurrency(selectedMonthDetail.incomePending)}</span>
                          </div>
                        </div>

                        {/* Bloco Pagar do Mês */}
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-bold flex items-center gap-1.5">
                              <ArrowDownRight className="w-4 h-4 text-rose-400" />
                              Total a Pagar
                            </span>
                            <span className="text-rose-400 font-black text-sm">
                              {formatCurrency(selectedMonthDetail.expenseTotal)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Pago: {formatCurrency(selectedMonthDetail.expensePaid)}</span>
                            <span>Em aberto: {formatCurrency(selectedMonthDetail.expensePending)}</span>
                          </div>
                        </div>

                        {/* Saldo Líquido do Mês */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] uppercase font-bold text-slate-400">Saldo do Mês</p>
                            <p
                              className={`text-lg font-black ${
                                selectedMonthDetail.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {formatCurrency(selectedMonthDetail.netBalance)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] uppercase font-bold text-slate-400">Acumulado no Ano</p>
                            <p
                              className={`text-sm font-extrabold ${
                                selectedMonthDetail.cumulativeBalance >= 0 ? 'text-sky-400' : 'text-rose-400'
                              }`}
                            >
                              {formatCurrency(selectedMonthDetail.cumulativeBalance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterYear(dashboardYear);
                          setFilterMonth(selectedMonthDetail.monthNumber);
                          setFilterStatus('ALL');
                          setActiveModule('pagar');
                          setActiveSubMenu('contas_pagar');
                        }}
                        className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                      >
                        Ver A Pagar ({selectedMonthDetail.shortLabel})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterYear(dashboardYear);
                          setFilterMonth(selectedMonthDetail.monthNumber);
                          setFilterStatus('ALL');
                          setActiveModule('receber');
                          setActiveSubMenu('contas_receber');
                        }}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                      >
                        Ver A Receber ({selectedMonthDetail.shortLabel})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rodapé Resumo Anual do Gráfico */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                    <p className="text-[11px] text-slate-400 font-semibold">Média Mensal a Receber</p>
                    <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                      {formatCurrency(yearIncomeTotal / 12)}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                    <p className="text-[11px] text-slate-400 font-semibold">Média Mensal a Pagar</p>
                    <p className="text-base font-extrabold text-rose-400 mt-0.5">
                      {formatCurrency(yearExpenseTotal / 12)}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                    <p className="text-[11px] text-slate-400 font-semibold">Resultado Realizado ({dashboardYear})</p>
                    <p className={`text-base font-extrabold mt-0.5 ${yearNetRealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(yearNetRealized)}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                    <p className="text-[11px] text-slate-400 font-semibold">Contas em Atraso ({dashboardYear})</p>
                    <p className={`text-base font-extrabold mt-0.5 ${yearOverdueTransactions.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {yearOverdueTransactions.length} ({formatCurrency(yearExpenseOverdue)})
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. NOVOS GRÁFICOS SECUNDÁRIOS: BALANÇO LÍQUIDO MENSAL + DONUT DE CATEGORIAS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Balanço Líquido Mensal (Superávit vs Défice) */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-sky-400" />
                        Resultado Líquido Mês a Mês ({dashboardYear})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Diferença mensal entre Total a Receber e Total a Pagar (Superávit / Défice)
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <div className="h-44 flex items-center justify-between gap-1.5 sm:gap-2 px-1 relative">
                      {/* Linha Zero Central */}
                      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-700 pointer-events-none" />

                      {monthlyChartData.map(m => {
                        const ratio = Math.min(100, Math.round((Math.abs(m.netBalance) / maxAbsMonthlyNet) * 100));
                        const barHeight = m.netBalance === 0 ? 4 : Math.max(8, Math.round(ratio / 2));
                        const isPositive = m.netBalance >= 0;

                        return (
                          <div
                            key={m.monthNumber}
                            onClick={() => setSelectedChartMonth(m.monthNumber)}
                            title={`${m.fullName}: ${formatCurrency(m.netBalance)}`}
                            className="flex-1 h-full flex flex-col items-center justify-center relative cursor-pointer group"
                          >
                            <div className="w-full h-1/2 flex items-end justify-center pb-[1px]">
                              {isPositive && m.netBalance !== 0 && (
                                <div
                                  style={{ height: `${barHeight * 2}%` }}
                                  className="w-3 sm:w-4 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-110 transition-all"
                                />
                              )}
                            </div>
                            <div className="w-full h-1/2 flex items-start justify-center pt-[1px]">
                              {!isPositive && (
                                <div
                                  style={{ height: `${barHeight * 2}%` }}
                                  className="w-3 sm:w-4 rounded-b-md bg-gradient-to-b from-rose-600 to-rose-400 group-hover:brightness-110 transition-all"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1 pt-2 border-t border-slate-800/80">
                      {monthlyChartData.map(m => (
                        <span key={m.monthNumber} className="flex-1 text-center text-[10px] font-bold text-slate-400">
                          {m.shortLabel}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                      Meses positivos: <strong className="text-white">{monthlyChartData.filter(m => m.netBalance > 0).length}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                      Meses negativos: <strong className="text-white">{monthlyChartData.filter(m => m.netBalance < 0).length}</strong>
                    </span>
                  </div>
                </div>

                {/* Gráfico Donut + Ranking de Despesas por Categoria */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-emerald-400" />
                        Maiores Despesas por Categoria ({dashboardYear})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Para onde está indo o orçamento da família neste ano
                      </p>
                    </div>
                  </div>

                  {categoryDonutSegments.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                      {/* Donut SVG */}
                      <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="transparent"
                            stroke="#1e293b"
                            strokeWidth="4.5"
                          />
                          {categoryDonutSegments.map(seg => (
                            <circle
                              key={seg.name}
                              cx="18"
                              cy="18"
                              r="14"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth="4.5"
                              strokeDasharray={seg.strokeDasharray}
                              strokeDashoffset={seg.strokeDashoffset}
                              className="transition-all duration-700"
                            />
                          ))}
                        </svg>
                        <div className="absolute text-center px-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Saídas</span>
                          <span className="text-xs font-black text-white">
                            {formatCompactCurrency(yearExpenseTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Categorias com Barra de Proporção */}
                      <div className="flex-1 w-full space-y-3">
                        {categoryDonutSegments.map(seg => (
                          <div key={seg.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-white flex items-center gap-2 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: seg.color }}
                                />
                                <span className="truncate">{seg.name}</span>
                              </span>
                              <span className="text-slate-400 shrink-0">
                                {formatCurrency(seg.amount)} ({seg.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, (seg.amount / maxCategoryAmount) * 100)}%`,
                                  backgroundColor: seg.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center">
                      <p className="text-slate-400 text-sm">Nenhuma despesa registada em {dashboardYear}.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. PAINEL DE PRÓXIMOS VENCIMENTOS E COMPROMISSOS PENDENTES */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Próximos Vencimentos & Contas em Aberto ({dashboardYear})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Compromissos pendentes ordenados por data de vencimento
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterYear(dashboardYear);
                      setFilterMonth('ALL');
                      setFilterStatus('PENDING');
                      setActiveModule('pagar');
                      setActiveSubMenu('contas_pagar');
                    }}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    Ver todas as contas a pagar <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {upcomingAndOverdueExpenses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {upcomingAndOverdueExpenses.map(tx => {
                      const st = getTransactionStatus(tx);
                      const isOverdue = st === 'OVERDUE';
                      return (
                        <div
                          key={tx.id}
                          className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                            isOverdue
                              ? 'bg-rose-950/20 border-rose-500/30'
                              : 'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  isOverdue
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}
                              >
                                {isOverdue ? 'Atrasada' : 'A Vencer'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-semibold">
                                {formatDatePT(tx.due_date || tx.transaction_date)}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-white truncate" title={tx.description}>
                              {tx.description}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {tx.category_name || 'Categoria Geral'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-sm font-black text-rose-400">
                              {formatCurrency(tx.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePayExpenses([tx])}
                              disabled={payingExpenses}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Baixar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center">
                    <p className="text-slate-400 text-sm">
                      Nenhuma conta pendente para o ano de {dashboardYear}. Tudo em dia! 🎉
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'cartoes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-extrabold text-white">Cartões de Crédito</h2><button onClick={() => setIsCardModalOpen(true)} className="bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl">+ Novo Cartão</button></div>
              <CreditCardList familyId={familyId} refreshTrigger={creditCards.length + transactions.length} onInvoicePaid={fetchData} />
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

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allPayableExpensesSelected}
                    disabled={payableExpenses.length === 0 || payingExpenses}
                    onChange={e => handleSelectAllPayableExpenses(e.target.checked)}
                    aria-label="Selecionar todos os lançamentos pendentes visíveis"
                    className="h-4 w-4 accent-emerald-500 disabled:opacity-40"
                  />
                  Selecionar lançamentos pendentes
                </label>
                <div className="flex items-center gap-3">
                  {selectedPayableExpenses.length > 0 && (
                    <span className="text-xs text-slate-400">{selectedPayableExpenses.length} selecionado(s)</span>
                  )}
                  <button
                    onClick={handlePaySelectedExpenses}
                    disabled={selectedPayableExpenses.length === 0 || payingExpenses}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {payingExpenses ? 'Processando...' : 'Baixar selecionados'}
                  </button>
                </div>
              </div>

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
                {investmentGoals.length > 0 ? (
                  investmentGoals.map(goal => (
                    <div key={goal.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-white">{goal.title}</p>
                          <p className="text-xs text-slate-400 mt-1">Objetivo de investimento</p>
                        </div>
                        <Trophy className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="border-t border-slate-800 pt-4 flex justify-between items-end gap-4">
                        <div>
                          <p className="text-slate-400 text-xs uppercase">Valor acumulado</p>
                          <p className="font-black text-white text-lg">{formatCurrency(goal.paidAmount)}</p>
                          <p className="text-xs text-slate-500">de {formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <span className="text-lg font-black text-emerald-400">{Math.round(goal.progress)}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Progresso do objetivo ${goal.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(goal.progress)}
                        className="h-2 rounded-full bg-slate-800 overflow-hidden"
                      >
                        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{goal.paidInstallmentCount} de {goal.totalInstallments} parcelas baixadas</span>
                        <button
                          onClick={() => openDeleteModal(goal.firstInstallment, 'all')}
                          title="Excluir objetivo"
                          aria-label={`Excluir objetivo ${goal.title}`}
                          className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">{calculatedCardDueDate ? 'Vencimento da fatura' : 'Vencimento'}</label><input type="date" value={calculatedCardDueDate || txDueDate} onChange={e => setTxDueDate(e.target.value)} readOnly={Boolean(calculatedCardDueDate)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white read-only:opacity-70" /></div>
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