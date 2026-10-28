'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Target,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  FileDown,
  Share2,
  X,
  CheckCircle2,
  Calculator,
  Loader2,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import QuickLightningBar from './QuickLightningBar';
import {
  CATEGORY_COLORS,
  ChartStatusMode,
  DashboardModule,
  FilterStatus,
  MONTH_FULL_NAMES,
  MONTH_SHORT_NAMES,
  formatCompactCurrency,
  formatCurrency,
  formatDatePT,
  generateMonthlySummaryPdf,
  getCardPurchaseDueDate,
  getLocalTodayKey,
  getTransactionStatus,
  getTxYearMonth,
} from './dashboardUtils';

interface DashboardOverviewTabProps {
  userName: string;
  accounts: any[];
  categories: any[];
  creditCards: any[];
  transactions: any[];
  dashboardYear: number | 'ALL';
  setDashboardYear: React.Dispatch<React.SetStateAction<number | 'ALL'>>;
  dashboardMonth: number | 'ALL';
  setDashboardMonth: React.Dispatch<React.SetStateAction<number | 'ALL'>>;
  chartStatusMode: ChartStatusMode;
  setChartStatusMode: React.Dispatch<React.SetStateAction<ChartStatusMode>>;
  selectedChartMonth: number;
  setSelectedChartMonth: React.Dispatch<React.SetStateAction<number>>;
  monthlySummaryPeriod: { year: number; month: number };
  setMonthlySummaryPeriod: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  budgetPeriod: { year: number; month: number };
  setBudgetPeriod: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  setActiveModule: (module: DashboardModule) => void;
  setActiveSubMenu: (subMenu: string) => void;
  setDashboardPeriodOverride: (override: { month: number | 'ALL'; year: number | 'ALL' } | null) => void;
  setFilterStatus: (status: FilterStatus) => void;
  canSettleTransactions: boolean;
  payingExpenses: boolean;
  onPayExpenses: (expenses: any[]) => void;
  familyId?: string;
  canCreateTransactions?: boolean;
  onRefreshData?: () => Promise<void> | void;
  onOpenNewTransactionModal?: (type: 'EXPENSE' | 'INCOME') => void;
  onOpenNewCardModal?: () => void;
}

export default function DashboardOverviewTab({
  userName,
  accounts,
  categories,
  creditCards,
  transactions,
  dashboardYear,
  setDashboardYear,
  dashboardMonth,
  setDashboardMonth,
  chartStatusMode,
  setChartStatusMode,
  selectedChartMonth,
  setSelectedChartMonth,
  monthlySummaryPeriod,
  setMonthlySummaryPeriod,
  budgetPeriod,
  setBudgetPeriod,
  setActiveModule,
  setActiveSubMenu,
  setDashboardPeriodOverride,
  setFilterStatus,
  canSettleTransactions,
  payingExpenses,
  onPayExpenses,
  familyId = '1',
  canCreateTransactions = true,
  onRefreshData,
  onOpenNewTransactionModal,
  onOpenNewCardModal,
}: DashboardOverviewTabProps) {
  const [monthlySummaryMessage, setMonthlySummaryMessage] = useState('');
  const [hoveredCreditCardCategory, setHoveredCreditCardCategory] = useState<string | null>(null);
  const [selectedCreditCardCategory, setSelectedCreditCardCategory] = useState<string | null>(null);
  const [hoveredProjectionPointIndex, setHoveredProjectionPointIndex] = useState<number | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simTitle, setSimTitle] = useState('Geladeira / Compra Parcelada');
  const [simTotalAmount, setSimTotalAmount] = useState('');
  const [simInstallments, setSimInstallments] = useState(6);
  const [simStartOffset, setSimStartOffset] = useState<0 | 1>(0);
  const [simLaunching, setSimLaunching] = useState(false);
  const [simLaunchFeedback, setSimLaunchFeedback] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(`@FinanFamily:onboardingDismissed:${familyId}`) === '1';
  });

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`@FinanFamily:onboardingDismissed:${familyId}`, '1');
    }
  };

  const reopenOnboarding = () => {
    setOnboardingDismissed(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`@FinanFamily:onboardingDismissed:${familyId}`);
    }
  };

  const onboardingSteps = [
    {
      id: 'account',
      title: '1. Configurar Conta e Saldo',
      description: 'Ajuste o saldo atual ou cadastre o banco da família.',
      completed:
        accounts.length > 1 ||
        (accounts.length === 1 &&
          (Number(accounts[0].balance) !== 0 ||
            Number(accounts[0].initial_balance) !== 0 ||
            (Boolean(accounts[0].bank_name) && accounts[0].bank_name !== 'Conta Principal'))),
      ctaLabel: 'Configurar Conta',
      onAction: () => {
        setActiveModule('cadastros');
        setActiveSubMenu('contas');
      },
    },
    {
      id: 'income',
      title: '2. Lançar Receita do Mês',
      description: 'Registre o salário ou entradas previstas da casa.',
      completed: transactions.some(t => t.type === 'INCOME'),
      ctaLabel: '+ Lançar Receita',
      onAction: () => {
        if (onOpenNewTransactionModal) onOpenNewTransactionModal('INCOME');
        else setActiveModule('receber');
      },
    },
    {
      id: 'expense',
      title: '3. Lançar Contas a Pagar',
      description: 'Adicione suas despesas fixas, variáveis ou boletos.',
      completed: transactions.some(t => t.type === 'EXPENSE'),
      ctaLabel: '+ Lançar Despesa',
      onAction: () => {
        if (onOpenNewTransactionModal) onOpenNewTransactionModal('EXPENSE');
        else setActiveModule('pagar');
      },
    },
    {
      id: 'card',
      title: '4. Cadastrar Cartão de Crédito',
      description: 'Controle limites, fechamento e faturas automaticamente.',
      completed: creditCards.length > 0,
      ctaLabel: '+ Novo Cartão',
      onAction: () => {
        if (onOpenNewCardModal) onOpenNewCardModal();
        else {
          setActiveModule('cadastros');
          setActiveSubMenu('cartoes');
        }
      },
    },
    {
      id: 'budget',
      title: '5. Definir Teto de Gastos',
      description: 'Coloque metas mensais nas categorias para não estourar.',
      completed: categories.some(c => Number(c.budget_amount) > 0),
      ctaLabel: 'Definir Tetos',
      onAction: () => {
        setActiveModule('cadastros');
        setActiveSubMenu('categorias');
      },
    },
  ];

  const completedOnboardingCount = onboardingSteps.filter(step => step.completed).length;
  const onboardingProgressPct = Math.round((completedOnboardingCount / onboardingSteps.length) * 100);

  const bankAccounts = accounts.filter(a => a.account_type !== 'BENEFIT_CARD');
  const benefitAccounts = accounts.filter(a => a.account_type === 'BENEFIT_CARD');
  const totalBalance = bankAccounts.reduce((acc, curr) => acc + Number(curr.balance || curr.current_balance || 0), 0);
  const totalBenefitBalance = benefitAccounts.reduce(
    (acc, curr) => acc + Number(curr.balance || curr.current_balance || 0),
    0
  );

  const availableYears = Array.from(
    new Set([
      2024,
      2025,
      2026,
      2027,
      2028,
      2029,
      new Date().getFullYear(),
      ...transactions.map(t => getTxYearMonth(t)?.year).filter((y): y is number => typeof y === 'number'),
    ])
  ).sort((a, b) => a - b);

  const yearTransactions = transactions.filter(t => {
    const ym = getTxYearMonth(t);
    if (!ym) return false;
    if (dashboardYear !== 'ALL' && ym.year !== dashboardYear) return false;
    if (dashboardMonth !== 'ALL' && ym.month !== dashboardMonth) return false;
    return true;
  });

  const dashboardPeriodLabel = `${
    dashboardMonth === 'ALL' ? 'Todos os meses' : MONTH_FULL_NAMES[dashboardMonth - 1]
  } • ${dashboardYear === 'ALL' ? 'Todos os anos' : dashboardYear}`;

  const averageMonthsInPeriod =
    dashboardMonth !== 'ALL'
      ? 1
      : dashboardYear !== 'ALL'
        ? 12
        : Math.max(
            1,
            new Set(
              yearTransactions
                .map(t => {
                  const ym = getTxYearMonth(t);
                  return ym ? `${ym.year}-${ym.month}` : '';
                })
                .filter(Boolean)
            ).size
          );

  // Projeção do saldo futuro (12 meses)
  const projectionToday = new Date();
  projectionToday.setHours(0, 0, 0, 0);
  const projectionTodayKey = `${projectionToday.getFullYear()}-${String(projectionToday.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(projectionToday.getDate()).padStart(2, '0')}`;
  const projectionStartMonth = new Date(projectionToday.getFullYear(), projectionToday.getMonth(), 1);
  const projectionMonths = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(projectionStartMonth.getFullYear(), projectionStartMonth.getMonth() + index, 1);
    return {
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      label: monthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      netChange: 0,
      projectedBalance: 0,
    };
  });
  const projectionMonthIndexes = new Map(projectionMonths.map((month, index) => [month.key, index]));
  const projectionPendingTransactions = transactions.filter(
    transaction =>
      transaction.status !== 'PAID' &&
      (transaction.type === 'INCOME' || transaction.type === 'EXPENSE') &&
      typeof transaction.due_date === 'string' &&
      Number.isFinite(Number(transaction.amount))
  );
  let projectionIncludedTransactionCount = 0;
  projectionPendingTransactions.forEach(transaction => {
    const dueDate = transaction.due_date.slice(0, 10);
    const dueMonth = dueDate < projectionTodayKey ? projectionMonths[0].key : dueDate.slice(0, 7);
    const monthIndex = projectionMonthIndexes.get(dueMonth);
    if (monthIndex === undefined) return;
    projectionIncludedTransactionCount += 1;
    const direction = transaction.type === 'INCOME' ? 1 : -1;
    projectionMonths[monthIndex].netChange += direction * Number(transaction.amount || 0);
  });
  let runningProjectedBalance = totalBalance;
  projectionMonths.forEach(month => {
    runningProjectedBalance += month.netChange;
    month.projectedBalance = runningProjectedBalance;
  });
  const projectionValues = [totalBalance, ...projectionMonths.map(month => month.projectedBalance)];
  const lowestProjectedBalance = Math.min(...projectionValues);
  const lowestProjectedMonthIndex = projectionValues.indexOf(lowestProjectedBalance) - 1;
  const lowestProjectedLabel =
    lowestProjectedMonthIndex < 0 ? 'Saldo atual' : projectionMonths[lowestProjectedMonthIndex].label;

  // Simulador "Posso Comprar?" na projeção de 12 meses
  const parsedSimAmount = Number(simTotalAmount.replace(/\./g, '').replace(',', '.')) || 0;
  const activeSimInstallments = Math.max(1, Math.min(24, Number(simInstallments) || 1));
  const simInstallmentValue = parsedSimAmount > 0 ? Math.round((parsedSimAmount / activeSimInstallments) * 100) / 100 : 0;
  const hasActiveSimulation = simulatorOpen && parsedSimAmount > 0;

  const simulatedProjectionValues = projectionValues.map((baseVal, index) => {
    if (!hasActiveSimulation || index === 0) return baseVal;
    const monthIndex = index - 1;
    if (monthIndex < simStartOffset) return baseVal;
    const paidInstallmentsSoFar = Math.min(activeSimInstallments, monthIndex - simStartOffset + 1);
    return baseVal - paidInstallmentsSoFar * simInstallmentValue;
  });

  const simLowestBalance = Math.min(...simulatedProjectionValues.slice(1));
  const simLowestMonthIndex = simulatedProjectionValues.slice(1).indexOf(simLowestBalance);
  const simLowestMonthLabel = projectionMonths[simLowestMonthIndex]?.label || lowestProjectedLabel;

  const projectionChartWidth = 760;
  const projectionChartHeight = 280;
  const projectionChartLeft = 64;
  const projectionChartRight = 744;
  const projectionChartTop = 24;
  const projectionChartBottom = 220;
  const combinedChartValues = hasActiveSimulation
    ? [...projectionValues, ...simulatedProjectionValues]
    : projectionValues;
  const projectionChartMin = Math.min(...combinedChartValues);
  const projectionChartMax = Math.max(...combinedChartValues);
  const projectionChartPadding = Math.max(
    (projectionChartMax - projectionChartMin) * 0.15,
    Math.abs(projectionChartMax) * 0.04,
    100
  );
  const projectionChartDomainMin = projectionChartMin - projectionChartPadding;
  const projectionChartDomainMax = projectionChartMax + projectionChartPadding;
  const projectionChartPoints = projectionValues.map((balance, index) => {
    const x = projectionChartLeft + (index / 12) * (projectionChartRight - projectionChartLeft);
    const y =
      projectionChartBottom -
      ((balance - projectionChartDomainMin) / (projectionChartDomainMax - projectionChartDomainMin)) *
        (projectionChartBottom - projectionChartTop);
    return { x, y, balance };
  });
  const simulatedChartPoints = simulatedProjectionValues.map((balance, index) => {
    const x = projectionChartLeft + (index / 12) * (projectionChartRight - projectionChartLeft);
    const y =
      projectionChartBottom -
      ((balance - projectionChartDomainMin) / (projectionChartDomainMax - projectionChartDomainMin)) *
        (projectionChartBottom - projectionChartTop);
    return { x, y, balance };
  });
  const projectionLinePath = projectionChartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const simulatedLinePath = simulatedChartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const projectionAreaPath = `${projectionLinePath} L ${
    projectionChartPoints[projectionChartPoints.length - 1].x
  } ${projectionChartBottom} L ${projectionChartPoints[0].x} ${projectionChartBottom} Z`;
  const projectionChartTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const value = projectionChartDomainMax - ratio * (projectionChartDomainMax - projectionChartDomainMin);
    const y = projectionChartTop + ratio * (projectionChartBottom - projectionChartTop);
    return { value, y };
  });

  const handleLaunchSimulatedPurchase = async () => {
    if (!hasActiveSimulation || simLaunching) return;
    setSimLaunching(true);
    setSimLaunchFeedback(null);
    try {
      const todayKey = getLocalTodayKey();
      const firstCard = creditCards[0];
      const firstBank = bankAccounts[0];
      const expenseCategory = categories.find(c => c.flow_type === 'EXPENSE');

      let dueDate = todayKey;
      if (simStartOffset === 1) {
        const [y, m, d] = todayKey.split('-').map(Number);
        const nextMonthDate = new Date(y, m, Math.min(d, 28));
        dueDate = nextMonthDate.toISOString().slice(0, 10);
      } else if (firstCard) {
        dueDate =
          getCardPurchaseDueDate(
            todayKey,
            Number(firstCard.closing_day),
            Number(firstCard.due_day)
          ) || todayKey;
      }

      const res = await authenticatedFetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: simTitle.trim() || 'Compra simulada',
          amount: parsedSimAmount,
          type: 'EXPENSE',
          transaction_date: todayKey,
          due_date: dueDate,
          category_id: expenseCategory?.id || null,
          credit_card_id: firstCard ? firstCard.id : null,
          account_id: !firstCard && firstBank ? firstBank.id : null,
          payment_method: firstCard ? 'CARD' : 'BOLETO',
          total_installments: activeSimInstallments,
          start_installment: 1,
          recurrence_months: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível lançar a compra simulada.');

      setSimLaunchFeedback('Compra lançada com sucesso no fluxo financeiro!');
      setSimTotalAmount('');
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setSimLaunchFeedback(err instanceof Error ? err.message : 'Erro ao lançar compra.');
    } finally {
      setSimLaunching(false);
    }
  };

  // Indicadores do período
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

  const creditCardExpensesByCategory = yearTransactions
    .filter(t => t.type === 'EXPENSE' && (t.credit_card_id || t.payment_method === 'CARD'))
    .reduce((totals: Record<string, number>, transaction) => {
      const categoryName = transaction.category_name || 'Categoria Geral';
      totals[categoryName] = (totals[categoryName] || 0) + Number(transaction.amount || 0);
      return totals;
    }, {});
  const creditCardCategoryTotals = Object.entries(creditCardExpensesByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((first, second) => second.amount - first.amount);
  const creditCardExpenseTotal = creditCardCategoryTotals.reduce((total, category) => total + category.amount, 0);
  let creditCardPieEnd = 0;
  const creditCardPieSlices = creditCardCategoryTotals.map((category, index) => {
    const start = creditCardPieEnd;
    creditCardPieEnd += creditCardExpenseTotal > 0 ? (category.amount / creditCardExpenseTotal) * 100 : 0;
    return {
      ...category,
      start,
      end: creditCardPieEnd,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
  });

  const yearMoneyBurned = yearTransactions
    .filter(transaction => transaction.type === 'EXPENSE' && transaction.status === 'PAID')
    .reduce(
      (total, transaction) =>
        total + Math.max(0, Number(transaction.paid_amount ?? transaction.amount) - Number(transaction.amount || 0)),
      0
    );
  const yearOverdueTransactions = yearTransactions.filter(
    t => t.type === 'EXPENSE' && getTransactionStatus(t) === 'OVERDUE'
  );
  const yearExpenseOverdue = yearOverdueTransactions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const yearNetProjected = yearIncomeTotal - yearExpenseTotal;
  const yearNetRealized = yearIncomePaid - yearExpensePaid;

  const monthlyBudgets = categories
    .filter(category => category.flow_type === 'EXPENSE' && Number(category.budget_amount) > 0)
    .map(category => {
      const spent = transactions
        .filter(transaction => {
          const yearMonth = getTxYearMonth(transaction);
          return (
            transaction.type === 'EXPENSE' &&
            String(transaction.category_id) === String(category.id) &&
            yearMonth?.year === budgetPeriod.year &&
            yearMonth.month === budgetPeriod.month
          );
        })
        .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
      return {
        ...category,
        category_id: category.id,
        category_name: category.name,
        amount: Number(category.budget_amount),
        spent,
      };
    });

  const yearSavingsRate =
    yearIncomeTotal > 0 ? Math.max(0, ((yearIncomeTotal - yearExpenseTotal) / yearIncomeTotal) * 100) : 0;
  const yearCommitmentRate = yearIncomeTotal > 0 ? Math.min(100, (yearExpenseTotal / yearIncomeTotal) * 100) : 0;
  const yearIncomeReceivedRate = yearIncomeTotal > 0 ? Math.min(100, (yearIncomePaid / yearIncomeTotal) * 100) : 0;
  const yearExpensePaidRate = yearExpenseTotal > 0 ? Math.min(100, (yearExpensePaid / yearExpenseTotal) * 100) : 0;

  // Resumo mensal da família
  const monthlySummaryTransactions = transactions.filter(transaction => {
    const yearMonth = getTxYearMonth(transaction);
    return yearMonth?.year === monthlySummaryPeriod.year && yearMonth.month === monthlySummaryPeriod.month;
  });
  const monthlySummaryIncomeTransactions = monthlySummaryTransactions.filter(t => t.type === 'INCOME');
  const monthlySummaryExpenseTransactions = monthlySummaryTransactions.filter(t => t.type === 'EXPENSE');
  const monthlySummaryIncome = monthlySummaryIncomeTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );
  const monthlySummaryReceived = monthlySummaryIncomeTransactions
    .filter(transaction => transaction.status === 'PAID')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const monthlySummaryExpenses = monthlySummaryExpenseTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );
  const monthlySummaryPaidExpenses = monthlySummaryExpenseTransactions
    .filter(transaction => transaction.status === 'PAID')
    .reduce((total, transaction) => total + Number(transaction.paid_amount ?? transaction.amount ?? 0), 0);
  const monthlySummaryPendingIncome = Math.max(0, monthlySummaryIncome - monthlySummaryReceived);
  const monthlySummaryPendingExpenses = Math.max(
    0,
    monthlySummaryExpenses -
      monthlySummaryExpenseTransactions
        .filter(transaction => transaction.status === 'PAID')
        .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
  );
  const monthlySummaryOverdueTransactions = monthlySummaryTransactions.filter(
    transaction => transaction.status !== 'PAID' && getTransactionStatus(transaction) === 'OVERDUE'
  );
  const monthlySummaryOverdue = monthlySummaryOverdueTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );
  const monthlySummaryNetProjected = monthlySummaryIncome - monthlySummaryExpenses;
  const monthlySummaryNetRealized = monthlySummaryReceived - monthlySummaryPaidExpenses;
  const monthlySummaryTopCategories = Object.entries(
    monthlySummaryExpenseTransactions.reduce((totals: Record<string, number>, transaction) => {
      const category = transaction.category_name || 'Categoria Geral';
      totals[category] = (totals[category] || 0) + Number(transaction.amount || 0);
      return totals;
    }, {})
  )
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3);
  const monthlySummaryLabel = `${MONTH_FULL_NAMES[monthlySummaryPeriod.month - 1]} ${monthlySummaryPeriod.year}`;
  const monthlySummaryShareText = [
    `FinanFamily — Resumo mensal da família`,
    `Família: ${userName}`,
    `Período: ${monthlySummaryLabel}`,
    '',
    `Receitas: ${formatCurrency(monthlySummaryIncome)} (recebido: ${formatCurrency(
      monthlySummaryReceived
    )}; a receber: ${formatCurrency(monthlySummaryPendingIncome)})`,
    `Despesas: ${formatCurrency(monthlySummaryExpenses)} (pagas: ${formatCurrency(
      monthlySummaryPaidExpenses
    )}; em aberto: ${formatCurrency(monthlySummaryPendingExpenses)})`,
    `Resultado previsto: ${formatCurrency(monthlySummaryNetProjected)}`,
    `Resultado realizado: ${formatCurrency(monthlySummaryNetRealized)}`,
    `Lançamentos em atraso: ${monthlySummaryOverdueTransactions.length} (${formatCurrency(monthlySummaryOverdue)})`,
    ...(monthlySummaryTopCategories.length > 0
      ? [
          '',
          'Principais categorias de despesas:',
          ...monthlySummaryTopCategories.map(([category, amount]) => `• ${category}: ${formatCurrency(amount)}`),
        ]
      : []),
  ].join('\n');

  const changeMonthlySummaryPeriod = (monthOffset: number) => {
    setMonthlySummaryPeriod(current => {
      const nextMonth = new Date(current.year, current.month - 1 + monthOffset, 1);
      return { year: nextMonth.getFullYear(), month: nextMonth.getMonth() + 1 };
    });
    setMonthlySummaryMessage('');
  };

  const handleExportMonthlySummaryPdf = () => {
    generateMonthlySummaryPdf({
      userName,
      monthlySummaryLabel,
      monthlySummaryPeriod,
      monthlySummaryIncome,
      monthlySummaryReceived,
      monthlySummaryPendingIncome,
      monthlySummaryExpenses,
      monthlySummaryPaidExpenses,
      monthlySummaryPendingExpenses,
      monthlySummaryNetProjected,
      monthlySummaryNetRealized,
      monthlySummaryOverdueCount: monthlySummaryOverdueTransactions.length,
      monthlySummaryOverdue,
      monthlySummaryTopCategories,
    });
  };

  const shareMonthlySummary = async () => {
    setMonthlySummaryMessage('');
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Resumo mensal da família — ${monthlySummaryLabel}`,
          text: monthlySummaryShareText,
        });
        setMonthlySummaryMessage('Resumo compartilhado.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(monthlySummaryShareText);
        setMonthlySummaryMessage('Resumo copiado. Você já pode colá-lo para compartilhar.');
      } else {
        setMonthlySummaryMessage(
          'O compartilhamento não está disponível neste navegador. Baixe o PDF para enviar o resumo.'
        );
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') return;
      console.error('Não foi possível compartilhar o resumo mensal:', shareError);
      setMonthlySummaryMessage('Não foi possível compartilhar o resumo. Tente baixar o PDF.');
    }
  };

  const changeBudgetPeriod = (monthOffset: number) => {
    setBudgetPeriod(current => {
      const nextMonth = new Date(current.year, current.month - 1 + monthOffset, 1);
      return { year: nextMonth.getFullYear(), month: nextMonth.getMonth() + 1 };
    });
  };

  // Gráfico mensal
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

  const maxMonthlyChartValue = Math.max(1, ...monthlyChartData.map(m => Math.max(m.displayIncome, m.displayExpense)));
  const maxAbsMonthlyNet = Math.max(1, ...monthlyChartData.map(m => Math.abs(m.netBalance)));

  const selectedMonthNumber = dashboardMonth === 'ALL' ? selectedChartMonth : dashboardMonth;
  const selectedMonthDetail =
    monthlyChartData.find(m => m.monthNumber === selectedMonthNumber) ||
    monthlyChartData[new Date().getMonth()] ||
    monthlyChartData[0];
  const visibleMonthlyChartData =
    dashboardMonth === 'ALL'
      ? monthlyChartData
      : monthlyChartData.filter(month => month.monthNumber === dashboardMonth);

  const commitmentIncomeTotal = yearTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const commitmentExpenseTotal = yearTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthlyCommitmentRate =
    commitmentIncomeTotal > 0 ? (commitmentExpenseTotal / commitmentIncomeTotal) * 100 : null;
  const commitmentLevel =
    monthlyCommitmentRate === null
      ? null
      : monthlyCommitmentRate <= 30
        ? { label: 'Baixo', color: 'text-emerald-300' }
        : monthlyCommitmentRate <= 50
          ? { label: 'Moderado', color: 'text-yellow-300' }
          : monthlyCommitmentRate <= 70
            ? { label: 'Elevado', color: 'text-orange-400' }
            : { label: 'Muito alto', color: 'text-rose-400' };
  const commitmentNeedleAngle = 180 - Math.min(Math.max(monthlyCommitmentRate ?? 0, 0), 100) * 1.8;
  const commitmentNeedleRadians = (commitmentNeedleAngle * Math.PI) / 180;
  const commitmentNeedleX = 130 + 100 * Math.cos(commitmentNeedleRadians);
  const commitmentNeedleY = 130 - 100 * Math.sin(commitmentNeedleRadians);

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
    .sort(
      (a, b) =>
        new Date(a.due_date || a.transaction_date).getTime() - new Date(b.due_date || b.transaction_date).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* TOP BAR: SAUDAÇÃO + FILTRO DE ANO E VISÃO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800/90 p-4 sm:p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel Inteligente • {dashboardPeriodLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Olá, {userName}!</h1>
          <p className="text-slate-400 text-sm">
            Acompanhe a evolução mês a mês das receitas, despesas e indicadores da família.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Modo (Previsto+Realizado vs Realizado vs Pendente) */}
          <div className="w-full sm:w-auto flex items-center justify-between bg-slate-950 border border-slate-800 p-1 rounded-2xl text-[11px] sm:text-xs font-bold">
            <button
              type="button"
              onClick={() => setChartStatusMode('ALL')}
              className={`px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
                chartStatusMode === 'ALL' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Total (Previsto)
            </button>
            <button
              type="button"
              onClick={() => setChartStatusMode('PAID')}
              className={`px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
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
              className={`px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
                chartStatusMode === 'PENDING'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Em Aberto
            </button>
          </div>

          {/* Filtro de Ano com navegação rápida */}
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-1 bg-slate-950 border border-slate-800 rounded-2xl p-1.5">
            <select
              aria-label="Filtrar dashboard por mês"
              value={dashboardMonth}
              onChange={e => {
                const month = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setDashboardMonth(month);
                if (month !== 'ALL') setSelectedChartMonth(month);
              }}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer px-2 py-2"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                Todos os meses
              </option>
              {MONTH_FULL_NAMES.map((month, index) => (
                <option key={month} value={index + 1} className="bg-slate-900 text-white">
                  {month}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDashboardYear(y => (y === 'ALL' ? y : y - 1))}
              title="Ano anterior"
              aria-label="Ano anterior"
              disabled={dashboardYear === 'ALL'}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                aria-label="Filtrar dashboard por ano"
                value={dashboardYear}
                onChange={e => setDashboardYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-transparent text-sm font-extrabold text-white outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  Todos os anos
                </option>
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    Ano {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setDashboardYear(y => (y === 'ALL' ? y : y + 1))}
              title="Próximo ano"
              aria-label="Próximo ano"
              disabled={dashboardYear === 'ALL'}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {onboardingDismissed && completedOnboardingCount < onboardingSteps.length && (
            <button
              type="button"
              onClick={reopenOnboarding}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-colors cursor-pointer"
            >
              Primeiros Passos ({completedOnboardingCount}/{onboardingSteps.length})
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE LANÇAMENTO RELÂMPAGO EM 1 LINHA (ESTILO WHATSAPP) */}
      <QuickLightningBar
        accounts={accounts}
        creditCards={creditCards}
        categories={categories}
        canCreateTransactions={canCreateTransactions}
        onTransactionCreated={() => {
          if (onRefreshData) return onRefreshData();
        }}
      />

      {/* CHECKLIST DE PRIMEIROS PASSOS (ONBOARDING GUIADO) */}
      {!onboardingDismissed && (
        <div className="bg-slate-900/95 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Primeiros Passos da Família • {completedOnboardingCount} de {onboardingSteps.length} concluídos ({onboardingProgressPct}%)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {completedOnboardingCount === onboardingSteps.length
                  ? 'Parabéns! Sua família já está com o painel 100% configurado!'
                  : 'Comece por aqui para organizar as finanças da casa em 5 minutos'}
              </h2>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="w-28 sm:w-36 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${onboardingProgressPct}%` }}
                />
              </div>
              <button
                type="button"
                onClick={dismissOnboarding}
                className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {completedOnboardingCount === onboardingSteps.length ? 'Concluir' : 'Ocultar'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {onboardingSteps.map(step => (
              <div
                key={step.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                  step.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-xs font-extrabold ${
                        step.completed ? 'text-emerald-300 line-through' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{step.description}</p>
                </div>

                {step.completed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={step.onAction}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/30 font-extrabold text-xs transition-all cursor-pointer"
                  >
                    {step.ctaLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. CARDS MODERNOS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Saldo em Contas */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 hover:border-slate-700 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Saldo em Contas</span>
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formatCurrency(totalBalance)}</p>
          {benefitAccounts.length > 0 && (
            <p className="text-xs font-extrabold text-amber-300 mt-1.5">
              🍱 + {formatCurrency(totalBenefitBalance)} em Vales (Caju/VR)
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {bankAccounts.length} {bankAccounts.length === 1 ? 'banco' : 'bancos'}
              {benefitAccounts.length > 0 ? ` • ${benefitAccounts.length} vale(s)` : ''}
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
              Total a Receber ({dashboardPeriodLabel})
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
              <span className="text-emerald-400/90">Recebido: {formatCurrency(yearIncomePaid)}</span>
              <span className="text-slate-400">Falta: {formatCurrency(yearIncomePending)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total a Pagar no Ano */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 border border-slate-800/90 hover:border-rose-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Total a Pagar ({dashboardPeriodLabel})
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
              <span className="text-slate-300">Pago: {formatCurrency(yearExpensePaid)}</span>
              <span className="text-amber-400">Em aberto: {formatCurrency(yearExpensePending)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Resultado & Taxa de Poupança */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/25 border border-slate-800/90 hover:border-indigo-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Balanço & Poupança</span>
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

        {/* Card 5: Juros, multas e encargos pagos */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800/90 hover:border-amber-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Dinheiro queimado ({dashboardPeriodLabel})
            </span>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
            {formatCurrency(yearMoneyBurned)}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            Juros, multas e encargos pagos
          </div>
        </div>
      </div>

      {/* RESUMO MENSAL DA FAMÍLIA */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-slate-800/90 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100">
                  Resumo mensal da família
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Um fechamento compacto das receitas, despesas e resultado do mês.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => changeMonthlySummaryPeriod(-1)}
                aria-label="Mês anterior no resumo"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-28 px-2 text-center text-sm font-bold capitalize text-slate-200">
                {monthlySummaryLabel}
              </span>
              <button
                type="button"
                onClick={() => changeMonthlySummaryPeriod(1)}
                aria-label="Próximo mês no resumo"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleExportMonthlySummaryPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700"
            >
              <FileDown className="h-4 w-4" />
              Baixar PDF
            </button>
            <button
              type="button"
              onClick={shareMonthlySummary}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Receitas previstas</p>
            <strong className="mt-1 block text-lg font-black text-emerald-400">
              {formatCurrency(monthlySummaryIncome)}
            </strong>
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(monthlySummaryReceived)} recebidas • {formatCurrency(monthlySummaryPendingIncome)} a
              receber
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Despesas previstas</p>
            <strong className="mt-1 block text-lg font-black text-rose-400">
              {formatCurrency(monthlySummaryExpenses)}
            </strong>
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(monthlySummaryPaidExpenses)} pagas • {formatCurrency(monthlySummaryPendingExpenses)} em
              aberto
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Resultado previsto</p>
            <strong
              className={`mt-1 block text-lg font-black ${
                monthlySummaryNetProjected >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(monthlySummaryNetProjected)}
            </strong>
            <p className="mt-1 text-xs text-slate-500">Receitas previstas menos despesas previstas</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Resultado realizado</p>
            <strong
              className={`mt-1 block text-lg font-black ${
                monthlySummaryNetRealized >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(monthlySummaryNetRealized)}
            </strong>
            <p className="mt-1 text-xs text-slate-500">Recebimentos menos valores efetivamente pagos</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Principais despesas por categoria
            </h3>
            {monthlySummaryTopCategories.length > 0 ? (
              <ol className="mt-2 space-y-2">
                {monthlySummaryTopCategories.map(([category, amount], index) => (
                  <li key={category} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-slate-300">
                      {index + 1}. {category}
                    </span>
                    <strong className="shrink-0 text-slate-100">{formatCurrency(amount)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Nenhuma despesa registrada neste mês.</p>
            )}
          </div>
          <div className="flex flex-col justify-between gap-3 md:items-end md:text-right">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Atenção</h3>
              <p className="mt-2 text-sm text-slate-300">
                {monthlySummaryOverdueTransactions.length > 0
                  ? `${monthlySummaryOverdueTransactions.length} lançamento(s) em atraso, totalizando ${formatCurrency(
                      monthlySummaryOverdue
                    )}.`
                  : 'Nenhum lançamento vencido em aberto neste mês.'}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {monthlySummaryTransactions.length} lançamento(s) no período • Família: {userName}
            </p>
          </div>
        </div>
        {monthlySummaryMessage && (
          <p role="status" className="mt-4 text-xs font-medium text-emerald-300">
            {monthlySummaryMessage}
          </p>
        )}
      </section>

      {/* ORÇAMENTO MENSAL POR CATEGORIA */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800/90 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100">
                Orçamento mensal por categoria
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Limites configurados no cadastro de categorias; o acompanhamento varia por mês.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => changeBudgetPeriod(-1)}
              aria-label="Mês anterior no orçamento"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-28 px-2 text-center text-sm font-bold capitalize text-slate-200">
              {MONTH_FULL_NAMES[budgetPeriod.month - 1]} {budgetPeriod.year}
            </span>
            <button
              type="button"
              onClick={() => changeBudgetPeriod(1)}
              aria-label="Próximo mês no orçamento"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {monthlyBudgets.map(budget => {
            const limit = Number(budget.amount || 0);
            const spent = Number(budget.spent || 0);
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOverBudget = percentage >= 100;
            const isNearLimit = percentage >= 80;
            const statusText = isOverBudget
              ? `Limite ultrapassado em ${formatCurrency(spent - limit)}`
              : isNearLimit
                ? 'Atenção: você já usou 80% ou mais do limite'
                : `${percentage.toFixed(0)}% do limite utilizado`;
            const statusColor = isOverBudget
              ? 'text-rose-300'
              : isNearLimit
                ? 'text-amber-300'
                : 'text-emerald-300';

            return (
              <article key={budget.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-bold text-slate-100">{budget.category_name}</h3>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatCurrency(spent)} / {formatCurrency(limit)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"
                      role="progressbar"
                      aria-label={`Orçamento de ${budget.category_name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.round(percentage))}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <p className={`mt-1.5 text-xs font-semibold ${statusColor}`}>{statusText}</p>
                  </div>
                </div>
              </article>
            );
          })}
          {monthlyBudgets.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-center text-sm text-slate-500">
              Defina os limites mensais no cadastro das categorias de despesas para acompanhar seus gastos aqui.
            </p>
          )}
        </div>
      </section>

      {/* GASTOS COM CARTÃO DE CRÉDITO */}
      <section className="mt-5 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/20 border border-slate-800/90 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                Gastos com cartão de crédito
              </h2>
              <p className="text-xs text-slate-400 mt-1">{dashboardPeriodLabel}</p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-400 tracking-tight">
            {formatCurrency(creditCardExpenseTotal)}
          </p>
        </div>

        {creditCardPieSlices.length > 0 ? (
          <div className="mt-5 flex justify-center">
            <div className="relative w-full max-w-[440px]">
              <svg
                viewBox="0 0 200 200"
                role="group"
                aria-label={`Gráfico de pizza dos gastos com cartão de crédito por categoria. Total ${formatCurrency(
                  creditCardExpenseTotal
                )}.`}
                className="block w-full overflow-visible drop-shadow-xl"
                onMouseLeave={() => setHoveredCreditCardCategory(null)}
              >
                {creditCardPieSlices.map(({ category, amount, color, start, end }) => {
                  const startAngle = (start / 100) * 360 - 90;
                  const endAngle = (end / 100) * 360 - 90;
                  const startRadians = (startAngle * Math.PI) / 180;
                  const endRadians = (endAngle * Math.PI) / 180;
                  const startX = 100 + 98 * Math.cos(startRadians);
                  const startY = 100 + 98 * Math.sin(startRadians);
                  const endX = 100 + 98 * Math.cos(endRadians);
                  const endY = 100 + 98 * Math.sin(endRadians);
                  const percentage = creditCardExpenseTotal > 0 ? (amount / creditCardExpenseTotal) * 100 : 0;
                  const path =
                    percentage >= 99.999
                      ? undefined
                      : `M 100 100 L ${startX} ${startY} A 98 98 0 ${percentage > 50 ? 1 : 0} 1 ${endX} ${endY} Z`;
                  const accessibleLabel = `${category}: ${formatCurrency(amount)}, ${percentage.toFixed(1)}%`;
                  const interactionProps = {
                    onMouseEnter: () => setHoveredCreditCardCategory(category),
                    onClick: () => setSelectedCreditCardCategory(category),
                    onFocus: () => setHoveredCreditCardCategory(category),
                    onBlur: () => setHoveredCreditCardCategory(null),
                    onKeyDown: (event: React.KeyboardEvent<SVGElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedCreditCardCategory(category);
                      }
                    },
                    tabIndex: 0,
                    role: 'button' as const,
                    'aria-label': accessibleLabel,
                    className:
                      'cursor-pointer stroke-slate-950/70 stroke-[0.7] transition-[filter] duration-150 hover:brightness-125 focus:brightness-125 focus:outline-none',
                  };

                  return path ? (
                    <path key={category} d={path} fill={color} {...interactionProps} />
                  ) : (
                    <circle key={category} cx="100" cy="100" r="98" fill={color} {...interactionProps} />
                  );
                })}
              </svg>
              {hoveredCreditCardCategory &&
                (() => {
                  const slice = creditCardPieSlices.find(item => item.category === hoveredCreditCardCategory);
                  if (!slice) return null;
                  const percentage = creditCardExpenseTotal > 0 ? (slice.amount / creditCardExpenseTotal) * 100 : 0;
                  return (
                    <div
                      role="status"
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-center shadow-2xl"
                    >
                      <p className="max-w-52 truncate text-sm font-bold text-white">{slice.category}</p>
                      <p className="mt-1 text-sm font-black text-sky-300">{formatCurrency(slice.amount)}</p>
                      <p className="text-xs text-slate-400">{percentage.toFixed(1)}% dos gastos no cartão</p>
                    </div>
                  );
                })()}
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-500">Nenhum gasto com cartão de crédito neste período.</p>
        )}
      </section>

      {selectedCreditCardCategory &&
        (() => {
          const categoryTransactions = yearTransactions
            .filter(
              transaction =>
                transaction.type === 'EXPENSE' &&
                Boolean(transaction.credit_card_id || transaction.payment_method === 'CARD') &&
                (transaction.category_name || 'Categoria Geral') === selectedCreditCardCategory
            )
            .sort((first, second) =>
              String(second.transaction_date || second.due_date || '').localeCompare(
                String(first.transaction_date || first.due_date || '')
              )
            );
          const categoryTotal = categoryTransactions.reduce(
            (total, transaction) => total + Number(transaction.amount || 0),
            0
          );

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              onMouseDown={event => {
                if (event.target === event.currentTarget) setSelectedCreditCardCategory(null);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="credit-card-category-dialog-title"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-6"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 id="credit-card-category-dialog-title" className="text-lg font-bold text-white">
                      Gastos com cartão • {selectedCreditCardCategory}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">{dashboardPeriodLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCreditCardCategory(null)}
                    aria-label="Fechar lançamentos da categoria"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="text-sm text-slate-400">{categoryTransactions.length} lançamento(s)</span>
                  <strong className="text-lg font-black text-sky-400">{formatCurrency(categoryTotal)}</strong>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {categoryTransactions.length > 0 ? (
                    categoryTransactions.map(transaction => {
                      const linkedCard = creditCards.find(
                        card => String(card.id) === String(transaction.credit_card_id)
                      );
                      return (
                        <article
                          key={transaction.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-200">{transaction.description}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDatePT(transaction.transaction_date || transaction.due_date)}
                              {linkedCard ? ` • ${linkedCard.name}` : ''}
                              {transaction.installment_number && transaction.total_installments > 1
                                ? ` • Parcela ${transaction.installment_number}/${transaction.total_installments}`
                                : ''}
                            </p>
                          </div>
                          <strong className="shrink-0 text-sm text-slate-100">
                            {formatCurrency(transaction.amount)}
                          </strong>
                        </article>
                      );
                    })
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Não há lançamentos para esta categoria no período selecionado.
                    </p>
                  )}
                </div>
              </section>
            </div>
          );
        })()}

      {/* PROJEÇÃO DO SALDO FUTURO */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-slate-800/90 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100">
                  Projeção do saldo futuro
                </h2>
                <p className="mt-1 text-xs text-slate-400">Estimativa para os próximos 12 meses</p>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-xs text-slate-500">
              Calculada a partir do saldo atual das contas e dos lançamentos pendentes por vencimento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSimulatorOpen(prev => !prev);
                setSimLaunchFeedback(null);
              }}
              className={`rounded-xl border px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                simulatorOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
              }`}
            >
              <Calculator className="w-4 h-4" />
              {simulatorOpen ? 'Fechar Simulador "Posso Comprar?"' : 'Simular Compra ("Posso Comprar?")'}
            </button>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              {projectionIncludedTransactionCount} lançamento(s) pendente(s) no período
            </span>
          </div>
        </div>

        {/* PAINEL DO SIMULADOR "POSSO COMPRAR?" */}
        {simulatorOpen && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-slate-950/90 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  <Calculator className="w-3.5 h-3.5" />
                  Simulador de Decisão em Casal — &ldquo;Posso Comprar?&rdquo;
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Teste o impacto de uma compra parcelada ou à vista nos próximos 12 meses antes de passar o cartão.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Geladeira R$ 3.600 (10x)', title: 'Geladeira Nova', amount: '3600', inst: 10 },
                  { label: 'Viagem R$ 2.400 (6x)', title: 'Viagem em Família', amount: '2400', inst: 6 },
                  { label: 'Celular R$ 1.800 (12x)', title: 'Celular Novo', amount: '1800', inst: 12 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimTitle(preset.title);
                      setSimTotalAmount(preset.amount);
                      setSimInstallments(preset.inst);
                      setSimLaunchFeedback(null);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  O que pretendem comprar?
                </label>
                <input
                  type="text"
                  value={simTitle}
                  onChange={e => setSimTitle(e.target.value)}
                  placeholder="Ex: Geladeira, TV, Viagem..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Valor Total da Compra (R$)
                </label>
                <input
                  type="text"
                  value={simTotalAmount}
                  onChange={e => setSimTotalAmount(e.target.value)}
                  placeholder="Ex: 3500,00"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-bold text-amber-300 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Parcelamento
                </label>
                <select
                  aria-label="Quantidade de parcelas da simulação"
                  value={simInstallments}
                  onChange={e => setSimInstallments(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(n => (
                    <option key={n} value={n} className="bg-slate-900 text-white">
                      {n}x {parsedSimAmount > 0 ? `de ${formatCurrency(parsedSimAmount / n)}` : 'parcelas'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Primeira Parcela Cai Quando?
                </label>
                <select
                  aria-label="Início do pagamento da simulação"
                  value={simStartOffset}
                  onChange={e => setSimStartOffset(Number(e.target.value) as 0 | 1)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={0} className="bg-slate-900 text-white">
                    Neste mês ({projectionMonths[0]?.label})
                  </option>
                  <option value={1} className="bg-slate-900 text-white">
                    Próximo mês ({projectionMonths[1]?.label})
                  </option>
                </select>
              </div>
            </div>

            {hasActiveSimulation && (
              <div
                className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  simLowestBalance < 0
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : simLowestBalance < Math.max(500, totalBalance * 0.15)
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        simLowestBalance < 0
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : simLowestBalance < Math.max(500, totalBalance * 0.15)
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {simLowestBalance < 0
                        ? '🔴 Alto Risco — Entra no Vermelho'
                        : simLowestBalance < Math.max(500, totalBalance * 0.15)
                          ? '🟡 Atenção — Margem Apertada'
                          : '🟢 Compra Segura para o Caixa'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {activeSimInstallments}x de {formatCurrency(simInstallmentValue)}/mês
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200">
                    {simLowestBalance < 0 ? (
                      <>
                        Com essa compra, o menor saldo da família cairia de{' '}
                        <strong>{formatCurrency(lowestProjectedBalance)}</strong> para{' '}
                        <strong className="text-rose-400">{formatCurrency(simLowestBalance)}</strong> em{' '}
                        <strong className="capitalize">{simLowestMonthLabel}</strong>. Recomendamos aumentar o número de parcelas ou aguardar.
                      </>
                    ) : (
                      <>
                        O menor saldo projetado nos próximos 12 meses passará de{' '}
                        <strong>{formatCurrency(lowestProjectedBalance)}</strong> para{' '}
                        <strong className="text-amber-300">{formatCurrency(simLowestBalance)}</strong> em{' '}
                        <strong className="capitalize">{simLowestMonthLabel}</strong> (linha tracejada amarela no gráfico abaixo).
                      </>
                    )}
                  </p>
                </div>

                {canCreateTransactions && (
                  <button
                    type="button"
                    disabled={simLaunching}
                    onClick={() => void handleLaunchSimulatedPurchase()}
                    className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    {simLaunching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Lançando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar e Lançar {activeSimInstallments}x
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {simLaunchFeedback && (
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {simLaunchFeedback}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo atual</p>
            <strong className="mt-1 block text-lg font-black text-slate-100">{formatCurrency(totalBalance)}</strong>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saldo em 12 meses</p>
            <strong
              className={`mt-1 block text-lg font-black ${
                runningProjectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(runningProjectedBalance)}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Menor saldo projetado</p>
            <strong
              className={`mt-1 block text-lg font-black ${
                lowestProjectedBalance >= 0 ? 'text-amber-300' : 'text-rose-400'
              }`}
            >
              {formatCurrency(lowestProjectedBalance)}
            </strong>
            <span className="text-[11px] capitalize text-slate-500">{lowestProjectedLabel}</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${projectionChartWidth} ${projectionChartHeight}`}
            role="group"
            aria-label={`Projeção mensal do saldo: saldo atual ${formatCurrency(
              totalBalance
            )}, saldo ao final de 12 meses ${formatCurrency(runningProjectedBalance)}.`}
            className="min-w-[640px] w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="future-balance-area" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={runningProjectedBalance >= totalBalance ? '#34d399' : '#fb7185'}
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor={runningProjectedBalance >= totalBalance ? '#34d399' : '#fb7185'}
                  stopOpacity="0.01"
                />
              </linearGradient>
            </defs>
            {projectionChartTicks.map((tick, index) => (
              <g key={index}>
                <line
                  x1={projectionChartLeft}
                  x2={projectionChartRight}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="#334155"
                  strokeDasharray="4 6"
                  strokeOpacity="0.65"
                />
                <text x="2" y={tick.y + 4} fill="#94a3b8" fontSize="11">
                  {formatCompactCurrency(tick.value)}
                </text>
              </g>
            ))}
            <path d={projectionAreaPath} fill="url(#future-balance-area)" />
            <path
              d={projectionLinePath}
              fill="none"
              stroke={runningProjectedBalance >= totalBalance ? '#34d399' : '#fb7185'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {hasActiveSimulation && (
              <>
                <path
                  d={simulatedLinePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.75"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {simulatedChartPoints.map((simPt, idx) => (
                  <circle
                    key={`sim-${idx}`}
                    cx={simPt.x}
                    cy={simPt.y}
                    r={idx === simulatedChartPoints.length - 1 ? 4.5 : 2.5}
                    fill="#f59e0b"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    pointerEvents="none"
                  />
                ))}
              </>
            )}
            {projectionChartPoints.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="transparent"
                  className="cursor-pointer focus-visible:stroke-indigo-300 focus-visible:stroke-2"
                  tabIndex={0}
                  role="img"
                  aria-label={`${
                    index === 0 ? 'Hoje' : projectionMonths[index - 1].label
                  }: saldo projetado ${formatCurrency(point.balance)}`}
                  onMouseEnter={() => setHoveredProjectionPointIndex(index)}
                  onMouseLeave={() => setHoveredProjectionPointIndex(null)}
                  onFocus={() => setHoveredProjectionPointIndex(index)}
                  onBlur={() => setHoveredProjectionPointIndex(null)}
                >
                  <title>
                    {index === 0 ? 'Hoje' : projectionMonths[index - 1].label}: {formatCurrency(point.balance)}
                  </title>
                </circle>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={index === projectionChartPoints.length - 1 ? 5 : 3}
                  fill={runningProjectedBalance >= totalBalance ? '#34d399' : '#fb7185'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  pointerEvents="none"
                />
                {index > 0 && (
                  <text
                    x={point.x}
                    y="250"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    className="capitalize"
                  >
                    {projectionMonths[index - 1].label}
                  </text>
                )}
              </g>
            ))}
            {hoveredProjectionPointIndex !== null &&
              (() => {
                const point = projectionChartPoints[hoveredProjectionPointIndex];
                const tooltipWidth = 190;
                const tooltipHeight = 48;
                const tooltipX = Math.max(
                  projectionChartLeft,
                  Math.min(point.x - tooltipWidth / 2, projectionChartRight - tooltipWidth)
                );
                const tooltipY =
                  point.y - tooltipHeight - 12 >= projectionChartTop ? point.y - tooltipHeight - 12 : point.y + 12;
                const tooltipLabel =
                  hoveredProjectionPointIndex === 0
                    ? 'Hoje'
                    : projectionMonths[hoveredProjectionPointIndex - 1].label;

                return (
                  <g pointerEvents="none">
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipWidth}
                      height={tooltipHeight}
                      rx="10"
                      fill="#0f172a"
                      stroke="#475569"
                    />
                    <text x={tooltipX + 12} y={tooltipY + 18} fill="#94a3b8" fontSize="11" className="capitalize">
                      {tooltipLabel}
                    </text>
                    <text
                      x={tooltipX + 12}
                      y={tooltipY + 37}
                      fill={point.balance >= 0 ? '#34d399' : '#fb7185'}
                      fontSize="13"
                      fontWeight="700"
                    >
                      Saldo projetado: {formatCurrency(point.balance)}
                    </text>
                  </g>
                );
              })()}
            <text x={projectionChartLeft} y="273" fill="#64748b" fontSize="10">
              Hoje
            </text>
            <text x={projectionChartRight} y="273" textAnchor="end" fill="#64748b" fontSize="10">
              12 meses
            </text>
          </svg>
        </div>
      </section>

      {/* Indicador mensal de comprometimento financeiro */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">Comprometimento financeiro</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Percentual da receita prevista comprometido com contas a pagar no período selecionado.
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Calendar className="w-4 h-4 text-emerald-400" />
            {dashboardPeriodLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 260 160"
              className="w-full max-w-sm"
              role="img"
              aria-label={
                monthlyCommitmentRate === null
                  ? `Sem receita prevista para calcular o comprometimento em ${dashboardPeriodLabel}`
                  : `Comprometimento financeiro de ${monthlyCommitmentRate.toFixed(
                      1
                    )} por cento em ${dashboardPeriodLabel}`
              }
            >
              <defs>
                <linearGradient
                  id="commitment-gauge-gradient"
                  x1="30"
                  y1="0"
                  x2="230"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#bbf7d0" />
                  <stop offset="30%" stopColor="#4ade80" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="70%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                d="M 30 130 A 100 100 0 0 1 230 130"
                fill="none"
                stroke="url(#commitment-gauge-gradient)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {monthlyCommitmentRate !== null && (
                <>
                  <line
                    x1="130"
                    y1="130"
                    x2={commitmentNeedleX}
                    y2={commitmentNeedleY}
                    stroke="#f8fafc"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="130" cy="130" r="8" fill="#f8fafc" />
                  <circle cx="130" cy="130" r="3" fill="#0f172a" />
                </>
              )}
              <text x="27" y="153" fill="#94a3b8" fontSize="11">
                0%
              </text>
              <text x="211" y="153" fill="#94a3b8" fontSize="11">
                100%+
              </text>
            </svg>
            {monthlyCommitmentRate === null ? (
              <p className="text-sm font-bold text-amber-300 text-center -mt-1">
                {commitmentExpenseTotal > 0 ? 'Sem receita prevista para calcular' : 'Sem movimentações previstas'}
              </p>
            ) : (
              <div className="text-center -mt-1">
                <p className="text-3xl font-black text-white">{monthlyCommitmentRate.toFixed(1)}%</p>
                <p className={`text-sm font-bold ${commitmentLevel?.color}`}>
                  Nível {commitmentLevel?.label}
                  {monthlyCommitmentRate > 100 ? ' • despesas superam a receita' : ''}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/15 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Previsto a receber</p>
              <p className="text-xl font-black text-emerald-400 mt-2">{formatCurrency(commitmentIncomeTotal)}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-rose-500/15 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Previsto a pagar</p>
              <p className="text-xl font-black text-rose-400 mt-2">{formatCurrency(commitmentExpenseTotal)}</p>
            </div>
            <p className="sm:col-span-2 text-xs leading-relaxed text-slate-500">
              Calculado sobre os totais previstos no período, incluindo lançamentos pagos e pendentes. As faixas são
              indicativas: baixo até 30%, moderado até 50%, elevado até 70% e muito alto acima de 70%.
            </p>
          </div>
        </div>
      </section>

      {/* 2. GRÁFICO PRINCIPAL MÊS A MÊS: TOTAL A RECEBER VS TOTAL A PAGAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Total a Receber vs Total a Pagar — Mês a Mês ({dashboardPeriodLabel})
                </h2>
                <p className="text-xs text-slate-400">
                  Comparativo de entradas e saídas no período selecionado. Clique em um mês para inspecionar.
                </p>
              </div>
            </div>
          </div>

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
              onChange={e => setDashboardYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3.5 py-2 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL">Todos os anos</option>
              {availableYears.map(y => (
                <option key={y} value={y}>
                  Ano: {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          <div className="xl:col-span-8 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
            <div className="relative h-64 sm:h-72 flex flex-col justify-between">
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

              <div className="relative z-10 flex-1 flex items-end justify-between gap-1.5 sm:gap-3 pl-16 pr-1 pt-4 pb-1">
                {visibleMonthlyChartData.map(m => {
                  const incomeHeightPercent =
                    m.displayIncome > 0 ? Math.max(4, Math.round((m.displayIncome / maxMonthlyChartValue) * 100)) : 0;
                  const expenseHeightPercent =
                    m.displayExpense > 0
                      ? Math.max(4, Math.round((m.displayExpense / maxMonthlyChartValue) * 100))
                      : 0;
                  const isSelected = selectedMonthNumber === m.monthNumber;

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
                      aria-label={`${m.fullName} de ${
                        dashboardYear === 'ALL' ? 'todos os anos' : dashboardYear
                      }: A receber ${formatCurrency(m.displayIncome)}, A pagar ${formatCurrency(m.displayExpense)}`}
                      className={`group flex-1 h-full flex flex-col justify-end items-center cursor-pointer rounded-xl px-1 py-1 transition-all ${
                        isSelected ? 'bg-slate-800/60 ring-1 ring-emerald-500/40' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-full flex-1 flex items-end justify-center gap-1 sm:gap-1.5">
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

            <div className="flex items-center justify-between gap-1.5 sm:gap-3 pl-16 pr-1 pt-2 border-t border-slate-800/80">
              {visibleMonthlyChartData.map(m => {
                const isSelected = selectedMonthNumber === m.monthNumber;
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
                        !hasActivity ? 'bg-slate-800' : m.netBalance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-4 bg-slate-950 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {selectedMonthDetail.fullName} / {dashboardYear === 'ALL' ? 'Todos os anos' : dashboardYear}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {selectedMonthDetail.txCount} lançamento(s)
                </span>
              </div>

              <div className="space-y-3 mt-4">
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
                  setDashboardPeriodOverride({
                    year: dashboardYear,
                    month: dashboardMonth === 'ALL' ? selectedMonthDetail.monthNumber : dashboardMonth,
                  });
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
                  setDashboardPeriodOverride({
                    year: dashboardYear,
                    month: dashboardMonth === 'ALL' ? selectedMonthDetail.monthNumber : dashboardMonth,
                  });
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] text-slate-400 font-semibold">Média Mensal a Receber</p>
            <p className="text-base font-extrabold text-emerald-400 mt-0.5">
              {formatCurrency(yearIncomeTotal / averageMonthsInPeriod)}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] text-slate-400 font-semibold">Média Mensal a Pagar</p>
            <p className="text-base font-extrabold text-rose-400 mt-0.5">
              {formatCurrency(yearExpenseTotal / averageMonthsInPeriod)}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] text-slate-400 font-semibold">Resultado Realizado ({dashboardPeriodLabel})</p>
            <p className={`text-base font-extrabold mt-0.5 ${yearNetRealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(yearNetRealized)}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] text-slate-400 font-semibold">Contas em Atraso ({dashboardPeriodLabel})</p>
            <p
              className={`text-base font-extrabold mt-0.5 ${
                yearOverdueTransactions.length > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {yearOverdueTransactions.length} ({formatCurrency(yearExpenseOverdue)})
            </p>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICOS SECUNDÁRIOS: BALANÇO LÍQUIDO MENSAL + DONUT DE CATEGORIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                Resultado Líquido por Mês ({dashboardPeriodLabel})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Diferença mensal entre Total a Receber e Total a Pagar (Superávit / Défice)
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="h-44 flex items-center justify-between gap-1.5 sm:gap-2 px-1 relative">
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-700 pointer-events-none" />

              {visibleMonthlyChartData.map(m => {
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
              {visibleMonthlyChartData.map(m => (
                <span key={m.monthNumber} className="flex-1 text-center text-[10px] font-bold text-slate-400">
                  {m.shortLabel}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Meses positivos:{' '}
              <strong className="text-white">{visibleMonthlyChartData.filter(m => m.netBalance > 0).length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              Meses negativos:{' '}
              <strong className="text-white">{visibleMonthlyChartData.filter(m => m.netBalance < 0).length}</strong>
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-emerald-400" />
                Maiores Despesas por Categoria ({dashboardPeriodLabel})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Para onde está indo o orçamento da família no período</p>
            </div>
          </div>

          {categoryDonutSegments.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
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
                  <span className="text-xs font-black text-white">{formatCompactCurrency(yearExpenseTotal)}</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                {categoryDonutSegments.map(seg => (
                  <div key={seg.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
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
              <p className="text-slate-400 text-sm">Nenhuma despesa registada em {dashboardPeriodLabel}.</p>
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
              Próximos Vencimentos & Contas em Aberto ({dashboardPeriodLabel})
            </h3>
            <p className="text-xs text-slate-400">Compromissos pendentes ordenados por data de vencimento</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDashboardPeriodOverride({
                year: dashboardYear,
                month: dashboardMonth,
              });
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
                    isOverdue ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isOverdue ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
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
                    <span className="text-sm font-black text-rose-400">{formatCurrency(tx.amount)}</span>
                    {canSettleTransactions && (
                      <button
                        type="button"
                        onClick={() => onPayExpenses([tx])}
                        disabled={payingExpenses}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Baixar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm">
              Nenhuma conta pendente em {dashboardPeriodLabel}. Tudo em dia! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
