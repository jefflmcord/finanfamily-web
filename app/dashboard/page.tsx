'use client';

import React, { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Users, Sparkles } from 'lucide-react';
import CreditCardList from '@/components/CreditCardList';
import AccountsManager from '@/components/AccountsManager';
import CategoriesManager from '@/components/CategoriesManager';
import AnnualProvisionsManager from '@/components/AnnualProvisionsManager';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import { getCardPurchaseDueDate } from '@/lib/creditCardBilling';
import {
  ChartStatusMode,
  DashboardModule,
  FamilyAccess,
  FilterPeriod,
  FilterStatus,
  InterfaceTheme,
  MONTH_FULL_NAMES,
  PayableReportRow,
  SettingsSection,
  SettlementEntry,
  UserProfile,
  formatDatePT,
  generatePayableExpensesExcel,
  generatePayableExpensesPdf,
  getTransactionStatus,
  openPayableExpensesPrintWindow,
} from '@/components/dashboard/dashboardUtils';
import {
  DashboardHeader,
  DashboardSidebar,
  SettingsDrawer,
} from '@/components/dashboard/DashboardNavigation';
import DashboardOverviewTab from '@/components/dashboard/DashboardOverviewTab';
import SmartImportModal from '@/components/dashboard/SmartImportModal';
import SupermarketModule from '@/components/dashboard/SupermarketModule';
import HouseholdContractsModule from '@/components/dashboard/HouseholdContractsModule';
import { InternalCrmPanel } from '@/app/relatorio-interno/page';
import {
  InvestmentGoalsSection,
  PayablesSection,
  ReceivablesSection,
} from '@/components/dashboard/DashboardTransactionsAndGoals';
import {
  CreateCardModal,
  CreateTransactionModal,
  DeleteTransactionModal,
  EditTransactionModal,
  NewGoalModal,
  SettlementModal,
  SubscriptionUpgradeModal,
} from '@/components/dashboard/DashboardModals';

const getInterfaceTheme = (): InterfaceTheme =>
  window.localStorage.getItem('@FinanFamily:theme') === 'light' ? 'light' : 'dark';

const subscribeToInterfaceTheme = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener('finanfamily-theme-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('finanfamily-theme-change', onChange);
  };
};

export default function DashboardPage() {
  const router = useRouter();

  const [activeModule, setActiveModule] = useState<DashboardModule>('cadastros');
  const [activeSubMenu, setActiveSubMenu] = useState<string>('geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    birth_date: '',
    bio: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const theme = useSyncExternalStore<InterfaceTheme>(subscribeToInterfaceTheme, getInterfaceTheme, () => 'dark');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgetPeriod, setBudgetPeriod] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Família');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string>('1');
  const [familyAccess, setFamilyAccess] = useState<FamilyAccess | null>(null);

  // Filtros do Dashboard Inicial (Visão Geral)
  const [dashboardYear, setDashboardYear] = useState<number | 'ALL'>(new Date().getFullYear());
  const [dashboardMonth, setDashboardMonth] = useState<number | 'ALL'>('ALL');
  const [monthlySummaryPeriod, setMonthlySummaryPeriod] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });
  const [chartStatusMode, setChartStatusMode] = useState<ChartStatusMode>('ALL');
  const [selectedChartMonth, setSelectedChartMonth] = useState<number>(new Date().getMonth() + 1);

  // Filtros de Listagem
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('CURRENT_YEAR');
  const [dashboardPeriodOverride, setDashboardPeriodOverride] = useState<{
    month: number | 'ALL';
    year: number | 'ALL';
  } | null>(null);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [payableView, setPayableView] = useState<'LIST' | 'KANBAN'>('LIST');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [payingExpenses, setPayingExpenses] = useState(false);
  const [settlementEntries, setSettlementEntries] = useState<SettlementEntry[]>([]);
  const [settlementError, setSettlementError] = useState('');

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
  const [txAmountMode, setTxAmountMode] = useState<'TOTAL' | 'INSTALLMENT'>('TOTAL');
  const [txRepeatMonthly, setTxRepeatMonthly] = useState(false);
  const [txRecurrenceMonths, setTxRecurrenceMonths] = useState('2');

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
  const [savingTransactionEdit, setSavingTransactionEdit] = useState(false);
  const [transactionEditError, setTransactionEditError] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<any>(null);
  const [deleteScope, setDeleteScope] = useState<'single' | 'all'>('single');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartImportDefaultTarget, setSmartImportDefaultTarget] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'light' ? '#f8fafc' : '#020617'
    );
  }, [theme]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [settingsOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('@FinanFamily:theme', nextTheme);
    window.dispatchEvent(new Event('finanfamily-theme-change'));
  };

  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('@FinanFamily:token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('@FinanFamily:user') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    setError('');
    let parsedLocalUser: Record<string, any> | null = null;
    let cacheKey = '@FinanFamily:dashboardCache:default';

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        parsedLocalUser = user;
        if (user?.id) {
          cacheKey = `@FinanFamily:dashboardCache:${user.id}`;
        }
        setUserName(user.name || 'Família');
        setUserEmail(typeof user.email === 'string' ? user.email : '');
        setProfile({
          name: typeof user.name === 'string' ? user.name : '',
          email: typeof user.email === 'string' ? user.email : '',
          phone: typeof user.phone === 'string' ? user.phone : '',
          avatar_url: typeof user.avatar_url === 'string' ? user.avatar_url : '',
          birth_date: typeof user.birth_date === 'string' ? user.birth_date.slice(0, 10) : '',
          bio: typeof user.bio === 'string' ? user.bio : '',
        });
        setUserAvatarUrl(
          typeof user.avatar_url === 'string' && user.avatar_url
            ? user.avatar_url
            : typeof user.picture === 'string' && user.picture
              ? user.picture
              : null
        );
        if (user?.family_id) {
          setFamilyId(String(user.family_id));
          setFamilyAccess(prev =>
            prev || {
              familyId: String(user.family_id),
              role: 'OWNER',
              permissions: {
                family_read: true,
                transactions_create: true,
                transactions_edit: true,
                transactions_delete: true,
                transactions_settle: true,
                accounts_manage: true,
                cards_manage: true,
                categories_manage: true,
                goals_manage: true,
                provisions_manage: true,
                members_manage: true,
              },
            }
          );
        }
      } catch (parseError) {
        console.error('Não foi possível ler o perfil salvo da sessão:', parseError);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && typeof cached === 'object') {
            if (cached.access) {
              setFamilyAccess(cached.access);
              setFamilyId(String(cached.access.familyId));
            }
            if (Array.isArray(cached.accounts)) setAccounts(cached.accounts);
            if (Array.isArray(cached.categories)) setCategories(cached.categories);
            if (Array.isArray(cached.creditCards)) setCreditCards(cached.creditCards);
            if (Array.isArray(cached.transactions)) setTransactions(cached.transactions);
            setLoading(false);
          }
        } else if (parsedLocalUser?.family_id) {
          setLoading(false);
        }
      } catch {
        // Ignore invalid local cache
      }
    }

    setSyncing(true);

    const applyProfileData = (profileData: any) => {
      if (!profileData || typeof profileData !== 'object') return;
      const loadedProfile: UserProfile = {
        name: typeof profileData.name === 'string' ? profileData.name : '',
        email: typeof profileData.email === 'string' ? profileData.email : '',
        phone: typeof profileData.phone === 'string' ? profileData.phone : '',
        avatar_url: typeof profileData.avatar_url === 'string' ? profileData.avatar_url : '',
        birth_date: typeof profileData.birth_date === 'string' ? profileData.birth_date.slice(0, 10) : '',
        bio: typeof profileData.bio === 'string' ? profileData.bio : '',
        has_password: typeof profileData.has_password === 'boolean' ? profileData.has_password : true,
      };
      setProfile(loadedProfile);
      setUserName(loadedProfile.name || 'Família');
      setUserEmail(loadedProfile.email);
      setUserAvatarUrl(loadedProfile.avatar_url || null);

      const mergedUser = { ...(parsedLocalUser || {}), ...profileData };
      localStorage.setItem('@FinanFamily:user', JSON.stringify(mergedUser));
    };

    try {
      const bootstrapRes = await authenticatedFetch(`${API_URL}/api/family/bootstrap`);

      if (bootstrapRes.status !== 404) {
        const bootstrapData = await bootstrapRes.json();
        if (bootstrapData.code === 'TENANT_BLOCKED') {
          sessionStorage.setItem('@FinanFamily:blockedContactPhone', bootstrapData.contact_phone || '(41) 0000-0000');
          router.replace('/acesso-indisponivel');
          return;
        }
        if (!bootstrapRes.ok) {
          throw new Error(bootstrapData.error || 'Não foi possível carregar os dados da família.');
        }

        const accessData = bootstrapData.access;
        setFamilyAccess(accessData);
        setFamilyId(String(accessData.familyId));
        if (bootstrapData.profile) {
          applyProfileData(bootstrapData.profile);
        }

        const nextAccounts = Array.isArray(bootstrapData.accounts) ? bootstrapData.accounts : [];
        const nextCategories = Array.isArray(bootstrapData.categories) ? bootstrapData.categories : [];
        const nextCards = Array.isArray(bootstrapData.creditCards) ? bootstrapData.creditCards : [];
        const nextTransactions = Array.isArray(bootstrapData.transactions) ? bootstrapData.transactions : [];

        setAccounts(nextAccounts);
        setCategories(nextCategories);
        setCreditCards(nextCards);
        setTransactions(nextTransactions);

        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              access: accessData,
              accounts: nextAccounts,
              categories: nextCategories,
              creditCards: nextCards,
              transactions: nextTransactions,
              updatedAt: Date.now(),
            })
          );
        } catch {
          // Ignore storage quota errors
        }
        return;
      }

      // Fallback paralelo caso o servidor ainda esteja atualizando a rota /bootstrap
      const fallbackFamilyId = parsedLocalUser?.family_id ? String(parsedLocalUser.family_id) : '1';
      const [accessRes, profileResponse, accountsRes, categoriesRes, cardsRes, txRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/family/access`),
        authenticatedFetch(`${API_URL}/api/family/profile`),
        authenticatedFetch(`${API_URL}/api/accounts?family_id=${encodeURIComponent(fallbackFamilyId)}`),
        authenticatedFetch(`${API_URL}/api/categories?family_id=${encodeURIComponent(fallbackFamilyId)}`),
        authenticatedFetch(`${API_URL}/api/credit-cards?family_id=${encodeURIComponent(fallbackFamilyId)}`),
        authenticatedFetch(`${API_URL}/api/transactions?family_id=${encodeURIComponent(fallbackFamilyId)}`),
      ]);

      const accessData = await accessRes.json();
      if (accessData.code === 'TENANT_BLOCKED') {
        sessionStorage.setItem('@FinanFamily:blockedContactPhone', accessData.contact_phone || '(41) 0000-0000');
        router.replace('/acesso-indisponivel');
        return;
      }
      if (!accessRes.ok) throw new Error(accessData.error || 'Não foi possível validar suas permissões.');
      setFamilyAccess(accessData);
      setFamilyId(String(accessData.familyId));

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        applyProfileData(profileData);
      }

      if (accessData.role !== 'OWNER' && accessData.permissions?.family_read !== true) {
        setAccounts([]);
        setCategories([]);
        setCreditCards([]);
        setTransactions([]);
        return;
      }

      const [nextAccounts, nextCategories, nextCards, nextTransactions] = await Promise.all([
        accountsRes.json(),
        categoriesRes.json(),
        cardsRes.json(),
        txRes.json(),
      ]);
      if (accountsRes.ok) setAccounts(nextAccounts);
      if (categoriesRes.ok) setCategories(nextCategories);
      if (cardsRes.ok) setCreditCards(nextCards);
      if (txRes.ok) setTransactions(nextTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os dados da família.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let checkingAvailability = false;
    const checkTenantAvailability = async () => {
      if (checkingAvailability || !localStorage.getItem('@FinanFamily:token')) return;
      checkingAvailability = true;
      try {
        const response = await authenticatedFetch(`${API_URL}/api/family/access`);
        const result = await response.json();
        if (result.code === 'TENANT_BLOCKED') {
          sessionStorage.setItem('@FinanFamily:blockedContactPhone', result.contact_phone || '(41) 0000-0000');
          router.replace('/acesso-indisponivel');
        }
      } catch (availabilityError) {
        console.error('Não foi possível verificar a disponibilidade do tenant:', availabilityError);
      } finally {
        checkingAvailability = false;
      }
    };

    const intervalId = window.setInterval(checkTenantAvailability, 30_000);
    window.addEventListener('focus', checkTenantAvailability);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkTenantAvailability);
    };
  }, [router]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileNotice('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/family/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          birth_date: profile.birth_date,
          bio: profile.bio,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar seu perfil.');

      const savedProfile: UserProfile = {
        name: result.name || '',
        email: result.email || '',
        phone: result.phone || '',
        avatar_url: result.avatar_url || '',
        birth_date: typeof result.birth_date === 'string' ? result.birth_date.slice(0, 10) : '',
        bio: result.bio || '',
      };
      setProfile(savedProfile);
      setUserName(savedProfile.name || 'Família');
      setUserEmail(savedProfile.email);
      setUserAvatarUrl(savedProfile.avatar_url || null);

      let storedUser: Record<string, unknown> = {};
      const currentUser = localStorage.getItem('@FinanFamily:user');
      if (currentUser) {
        try {
          const parsedUser: unknown = JSON.parse(currentUser);
          if (parsedUser && typeof parsedUser === 'object' && !Array.isArray(parsedUser)) {
            storedUser = parsedUser as Record<string, unknown>;
          }
        } catch (storageError) {
          console.error('Não foi possível preservar os dados locais da sessão:', storageError);
        }
      }
      localStorage.setItem('@FinanFamily:user', JSON.stringify({ ...storedUser, ...result }));
      setProfileNotice('Perfil atualizado com sucesso.');
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar seu perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const hasFamilyPermission = (permission: string) =>
    familyAccess?.role === 'OWNER' || familyAccess?.permissions[permission] === true;
  const canReadFamily = hasFamilyPermission('family_read');
  const canCreateTransactions = hasFamilyPermission('transactions_create');
  const canEditTransactions = hasFamilyPermission('transactions_edit');
  const canDeleteTransactions = hasFamilyPermission('transactions_delete');
  const canSettleTransactions = hasFamilyPermission('transactions_settle');
  const canManageAccounts = hasFamilyPermission('accounts_manage');
  const canManageCards = hasFamilyPermission('cards_manage');
  const canManageCategories = hasFamilyPermission('categories_manage');
  const canManageGoals = hasFamilyPermission('goals_manage');
  const canManageProvisions = hasFamilyPermission('provisions_manage');

  // APAGAR TRANSAÇÃO
  const handleDeleteTx = async () => {
    if (!txToDelete || !canDeleteTransactions) return;
    try {
      const parentId = txToDelete.parent_transaction_id || txToDelete.id;
      const url = `${API_URL}/api/transactions/${txToDelete.id}?scope=${deleteScope}&parent_id=${parentId}`;

      const res = await authenticatedFetch(url, { method: 'DELETE' });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setTxToDelete(null);
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao apagar.');
      }
    } catch {
      setError('Erro de conexão ao apagar.');
    }
  };

  const openDeleteModal = (tx: any, scope: 'single' | 'all' = 'single') => {
    if (!canDeleteTransactions) return;
    setTxToDelete(tx);
    setDeleteScope(scope);
    setIsDeleteModalOpen(true);
  };

  // EDITAR TRANSAÇÃO
  const openEditModal = (tx: any) => {
    if (!canEditTransactions) return;
    setEditingTx(tx);
    setTxType(tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setTxDescription(tx.description);
    setTxAmount(tx.amount.toString());
    setTxDueDate(tx.due_date ? tx.due_date.split('T')[0] : '');
    setTxCategoryId(tx.category_id || '');
    setTxAccountId(tx.account_id || '');
    setTxPaymentMethod(tx.payment_method || 'BOLETO');
    setTransactionEditError('');
    setError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !canEditTransactions) return;
    const amount = Number(txAmount.toString().replace(',', '.'));
    if (!txDescription.trim() || !Number.isFinite(amount) || amount <= 0 || !txDueDate) {
      setTransactionEditError('Informe uma descrição, valor e vencimento válidos.');
      return;
    }
    const matchingCategories = categories.filter(category => category.flow_type === editingTx.type);
    if (
      matchingCategories.length > 0 &&
      !matchingCategories.some(category => String(category.id) === String(txCategoryId))
    ) {
      setTransactionEditError('Selecione uma categoria válida para este lançamento.');
      return;
    }

    setSavingTransactionEdit(true);
    setTransactionEditError('');
    try {
      const payload = {
        description: txDescription.trim(),
        amount,
        due_date: txDueDate,
        category_id: txCategoryId || null,
        account_id: txAccountId || null,
        payment_method: txPaymentMethod,
        status: editingTx.status,
      };

      const res = await authenticatedFetch(`${API_URL}/api/transactions/${editingTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingTx(null);
        await fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        setTransactionEditError(data.error || 'Erro ao atualizar transação.');
      }
    } catch (updateError) {
      setTransactionEditError(updateError instanceof Error ? updateError.message : 'Erro ao atualizar transação.');
    } finally {
      setSavingTransactionEdit(false);
    }
  };

  const payTransaction = async (
    tx: any,
    accountId = tx.account_id || accounts[0]?.id || null,
    paidAmount = Number(tx.amount)
  ) => {
    if (!canSettleTransactions) throw new Error('Você não tem permissão para baixar lançamentos.');
    const res = await authenticatedFetch(`${API_URL}/api/transactions/${tx.id}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: accountId,
        paid_amount: paidAmount,
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

  const updateTransactionStatus = async (tx: any, status: 'PAID' | 'PENDING') => {
    if (status === 'PAID') {
      await payTransaction(tx);
      return;
    }

    const response = await authenticatedFetch(`${API_URL}/api/transactions/${tx.id}/unpay`, {
      method: 'PATCH',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao estornar o lançamento.');
  };

  // MARCAR COMO PAGO / PENDENTE RÁPIDO
  const handleToggleStatus = async (tx: any) => {
    if (!canSettleTransactions) return;
    const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
    setError('');
    try {
      await updateTransactionStatus(tx, newStatus);
      setSelectedExpenseIds(ids => ids.filter(id => id !== String(tx.id)));
      await fetchData();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Erro ao atualizar status.');
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateTransactions) return;
    if (!txDescription || !txAmount) return;
    const recurrenceMonths = txRepeatMonthly ? Number(txRecurrenceMonths) : 1;
    if (txRepeatMonthly && (!Number.isInteger(recurrenceMonths) || recurrenceMonths < 2 || recurrenceMonths > 120)) {
      setError('Informe uma recorrência entre 2 e 120 meses.');
      return;
    }
    const totalInstallments = txRepeatMonthly ? 1 : Number(txTotalInstallments) || 1;
    const startInstallment = Number(txStartInstallment) || 1;
    if (
      !Number.isInteger(totalInstallments) ||
      totalInstallments < 1 ||
      !Number.isInteger(startInstallment) ||
      startInstallment < 1 ||
      startInstallment > totalInstallments
    ) {
      setError('Informe um intervalo válido de parcelas.');
      return;
    }
    const matchingCategories = categories.filter(category => category.flow_type === txType);
    if (
      matchingCategories.length > 0 &&
      !matchingCategories.some(category => String(category.id) === String(txCategoryId))
    ) {
      setError('Selecione uma categoria para este lançamento.');
      return;
    }

    let resolvedFamilyId = familyId;
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = userObj.family_id || userObj.familyId || familyId;
      } catch (parseError) {
        console.error('Não foi possível ler o perfil salvo da sessão:', parseError);
      }
    }

    setSavingTx(true);
    setError('');

    const cardForTransaction =
      txType === 'EXPENSE' && txPaymentMethod === 'CARD'
        ? creditCards.find(card => String(card.id) === String(txCardId))
        : null;
    const transactionDueDate = cardForTransaction
      ? getCardPurchaseDueDate(
          txTransactionDate,
          Number(cardForTransaction.closing_day),
          Number(cardForTransaction.due_day)
        )
      : txDueDate;
    const enteredAmount = Number(txAmount.toString().replace(',', '.'));
    const transactionAmount =
      !txRepeatMonthly && totalInstallments > 1 && txAmountMode === 'INSTALLMENT'
        ? Math.round(enteredAmount * totalInstallments * 100) / 100
        : enteredAmount;

    try {
      const payload = {
        family_id: resolvedFamilyId,
        description: txDescription.trim(),
        amount: transactionAmount,
        type: txType,
        payment_method: txPaymentMethod,
        account_id: txAccountId ? txAccountId : accounts.length > 0 ? accounts[0].id : null,
        credit_card_id: cardForTransaction ? txCardId : null,
        category_id: txCategoryId ? txCategoryId : null,
        transaction_date: txTransactionDate,
        due_date: transactionDueDate,
        total_installments: totalInstallments,
        start_installment: txRepeatMonthly ? 1 : Number(txStartInstallment) || 1,
        recurrence_months: recurrenceMonths,
        status: 'PENDING',
      };

      const res = await authenticatedFetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsTxModalOpen(false);
        setTxDescription('');
        setTxAmount('');
        setTxCategoryId('');
        setTxTotalInstallments('1');
        setTxStartInstallment('1');
        setTxAmountMode('TOTAL');
        setTxRepeatMonthly(false);
        setTxRecurrenceMonths('2');
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar lançamento.');
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar transação.');
    } finally {
      setSavingTx(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCards) return;
    if (!cardName || !cardBrand || !cardLimit) return;

    let resolvedFamilyId = familyId;
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = userObj.family_id || userObj.familyId || familyId;
      } catch (parseError) {
        console.error('Não foi possível ler o perfil salvo da sessão:', parseError);
      }
    }

    setSavingCard(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/credit-cards`, {
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
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar cartão.');
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar cartão.');
    } finally {
      setSavingCard(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageGoals) return;
    if (!goalTitle || !goalTargetAmount || !goalMonths) return;
    setSavingGoal(true);
    setError('');

    let resolvedFamilyId = familyId;
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('@FinanFamily:user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          resolvedFamilyId = userObj.family_id || userObj.familyId || familyId;
        } catch (parseError) {
          console.error('Não foi possível ler o perfil salvo da sessão:', parseError);
        }
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
        category_id: invCategory ? invCategory.id : categories.length > 0 ? categories[0].id : null,
        transaction_date: goalStartDate,
        due_date: goalStartDate,
        total_installments: Number(goalMonths),
        start_installment: 1,
        status: 'PENDING',
      };

      const res = await authenticatedFetch(`${API_URL}/api/transactions`, {
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
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar objetivo.');
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar objetivo.');
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

  if (!familyAccess || !canReadFamily) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-50">
        <Users className="mb-4 h-12 w-12 text-emerald-400" />
        <h1 className="text-xl font-bold">
          {familyAccess ? 'Acesso às informações não autorizado' : 'Não foi possível validar seu acesso'}
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          {familyAccess
            ? 'Peça ao responsável da família para habilitar a consulta dos dados.'
            : 'Tente entrar novamente. Se o problema continuar, contate o responsável da família.'}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-rose-300">
            {error}
          </p>
        )}
        <button
          onClick={() => {
            localStorage.clear();
            router.push('/login');
          }}
          className="mt-6 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white"
        >
          Sair
        </button>
      </div>
    );
  }

  // Lógica de Filtro para Transações Modernas
  const localToday = new Date();
  const todayKey = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(
    localToday.getDate()
  ).padStart(2, '0')}`;
  const periodStartDate = (() => {
    if (filterPeriod === 'CUSTOM') return customStartDate;
    if (filterPeriod === 'ALL') return '';
    if (filterPeriod === 'CURRENT_MONTH') {
      return `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (filterPeriod === 'LAST_60_DAYS') {
      const start = new Date(localToday.getFullYear(), localToday.getMonth(), localToday.getDate() - 59);
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
        start.getDate()
      ).padStart(2, '0')}`;
    }
    return `${localToday.getFullYear()}-01-01`;
  })();
  const periodEndDate =
    filterPeriod === 'CUSTOM'
      ? customEndDate
      : filterPeriod === 'ALL'
        ? ''
        : filterPeriod === 'CURRENT_YEAR'
          ? `${localToday.getFullYear()}-12-31`
          : filterPeriod === 'CURRENT_MONTH'
            ? `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(
                new Date(localToday.getFullYear(), localToday.getMonth() + 1, 0).getDate()
              ).padStart(2, '0')}`
            : todayKey;
  const customPeriodInvalid =
    !dashboardPeriodOverride &&
    filterPeriod === 'CUSTOM' &&
    (!customStartDate || !customEndDate || customStartDate > customEndDate);

  const filteredTransactions = (type: 'EXPENSE' | 'INCOME') => {
    return transactions
      .filter(t => {
        if (t.type !== type) return false;

        const dueDate = t.due_date ? String(t.due_date).slice(0, 10) : '';
        if (dashboardPeriodOverride && dueDate) {
          const [year, month] = dueDate.split('-').map(Number);
          if (dashboardPeriodOverride.year !== 'ALL' && year !== dashboardPeriodOverride.year) return false;
          if (dashboardPeriodOverride.month !== 'ALL' && month !== dashboardPeriodOverride.month) return false;
        } else if (dashboardPeriodOverride && !dueDate) {
          return false;
        }
        if (customPeriodInvalid) return false;
        if (!dashboardPeriodOverride && periodStartDate && (!dueDate || dueDate < periodStartDate)) return false;
        if (!dashboardPeriodOverride && periodEndDate && (!dueDate || dueDate > periodEndDate)) return false;

        if (filterStatus !== 'ALL') {
          const currentStatus = getTransactionStatus(t);
          if (filterStatus !== currentStatus) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const filteredPayableTransactions = filteredTransactions('EXPENSE');
  const filteredPayableTotal = filteredPayableTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );
  const payableExpenses = filteredPayableTransactions.filter(t => getTransactionStatus(t) !== 'PAID');
  const selectedPayableExpenses = payableExpenses.filter(t => selectedExpenseIds.includes(String(t.id)));
  const allPayableExpensesSelected =
    payableExpenses.length > 0 && selectedPayableExpenses.length === payableExpenses.length;

  const getPayableReportRows = (): PayableReportRow[] =>
    filteredTransactions('EXPENSE').map(transaction => {
      const status = getTransactionStatus(transaction);
      const linkedCard = creditCards.find(card => String(card.id) === String(transaction.credit_card_id));
      const paymentMethod =
        transaction.credit_card_id || transaction.payment_method === 'CARD'
          ? transaction.credit_card_name || linkedCard?.name || 'Cartão de crédito'
          : transaction.account_name || 'Não informada';

      return {
        dueDate: formatDatePT(transaction.due_date),
        description: transaction.description || '',
        category: transaction.category_name || 'Categoria Geral',
        paymentMethod,
        status: status === 'PAID' ? 'Pago' : status === 'OVERDUE' ? 'Atrasado' : 'Pendente',
        amount: Number(transaction.amount || 0),
      };
    });

  const getPayableReportFilters = () => {
    const periodName = dashboardPeriodOverride
      ? `${
          dashboardPeriodOverride.month === 'ALL'
            ? 'Todos os meses'
            : MONTH_FULL_NAMES[dashboardPeriodOverride.month - 1]
        } • ${dashboardPeriodOverride.year === 'ALL' ? 'Todos os anos' : dashboardPeriodOverride.year}`
      : filterPeriod === 'CURRENT_MONTH'
        ? 'Mês atual'
        : filterPeriod === 'CURRENT_YEAR'
          ? 'Ano atual'
          : filterPeriod === 'LAST_60_DAYS'
            ? 'Últimos 60 dias'
            : filterPeriod === 'CUSTOM'
              ? `Período personalizado: ${formatDatePT(periodStartDate)} a ${formatDatePT(periodEndDate)}`
              : 'Todos os períodos';
    const statusName =
      filterStatus === 'ALL'
        ? 'Todos os status'
        : filterStatus === 'PENDING'
          ? 'Pendente'
          : filterStatus === 'OVERDUE'
            ? 'Atrasado'
            : 'Pago';
    return `${periodName} • ${statusName}`;
  };

  const handleExpenseSelection = (expenseId: string, selected: boolean) => {
    setSelectedExpenseIds(ids => (selected ? [...new Set([...ids, expenseId])] : ids.filter(id => id !== expenseId)));
  };

  const handleSelectAllPayableExpenses = (selected: boolean) => {
    setSelectedExpenseIds(selected ? payableExpenses.map(t => String(t.id)) : []);
  };

  const handlePayExpenses = (expenses: any[]) => {
    if (!canSettleTransactions || expenses.length === 0) return;
    setSettlementEntries(
      expenses.map(transaction => ({
        transaction,
        accountId: transaction.account_id || accounts[0]?.id || '',
        paidAmount: String(Number(transaction.amount || 0)),
      }))
    );
    setSettlementError('');
  };

  const submitSettlement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSettleTransactions || settlementEntries.length === 0) return;
    const invalidEntry = settlementEntries.find(
      entry =>
        !entry.accountId ||
        !Number.isFinite(Number(entry.paidAmount)) ||
        Number(entry.paidAmount) < Number(entry.transaction.amount)
    );
    if (invalidEntry) {
      setSettlementError('Selecione a conta e informe um valor pago igual ou superior ao valor do lançamento.');
      return;
    }

    setPayingExpenses(true);
    setSettlementError('');

    try {
      const results = await Promise.allSettled(
        settlementEntries.map(entry => payTransaction(entry.transaction, entry.accountId, Number(entry.paidAmount)))
      );
      const paidIds = settlementEntries
        .filter((_, index) => results[index].status === 'fulfilled')
        .map(entry => String(entry.transaction.id));
      const failedCount = results.length - paidIds.length;

      setSelectedExpenseIds(ids => ids.filter(id => !paidIds.includes(id)));
      setSettlementEntries(entries => entries.filter(entry => !paidIds.includes(String(entry.transaction.id))));
      if (failedCount > 0) {
        setSettlementError(
          `${paidIds.length} lançamento(s) baixado(s); ${failedCount} não puderam ser atualizados.`
        );
      } else {
        setSettlementEntries([]);
      }

      await fetchData();
    } catch (settlementSubmitError) {
      setSettlementError(
        settlementSubmitError instanceof Error ? settlementSubmitError.message : 'Não foi possível concluir a baixa.'
      );
    } finally {
      setPayingExpenses(false);
    }
  };

  const updateSettlementEntry = (
    transactionId: string,
    changes: Partial<{ accountId: string; paidAmount: string }>
  ) => {
    setSettlementEntries(entries =>
      entries.map(entry => (String(entry.transaction.id) === transactionId ? { ...entry, ...changes } : entry))
    );
  };

  const selectedTransactionCard = creditCards.find(card => String(card.id) === String(txCardId));
  const calculatedCardDueDate =
    txType === 'EXPENSE' && txPaymentMethod === 'CARD' && selectedTransactionCard
      ? getCardPurchaseDueDate(
          txTransactionDate,
          Number(selectedTransactionCard.closing_day),
          Number(selectedTransactionCard.due_day)
        )
      : '';

  const filterBarSharedProps = {
    dashboardPeriodOverride,
    filterPeriod,
    customStartDate,
    customEndDate,
    filterStatus,
    customPeriodInvalid,
    onChangeFilterPeriod: (period: FilterPeriod) => {
      setSelectedExpenseIds([]);
      setDashboardPeriodOverride(null);
      setFilterPeriod(period);
    },
    onChangeCustomStartDate: (date: string) => {
      setSelectedExpenseIds([]);
      setCustomStartDate(date);
    },
    onChangeCustomEndDate: (date: string) => {
      setSelectedExpenseIds([]);
      setCustomEndDate(date);
    },
    onChangeFilterStatus: (status: FilterStatus) => {
      setSelectedExpenseIds([]);
      setFilterStatus(status);
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
      <DashboardHeader
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        setActiveSubMenu={setActiveSubMenu}
        setMobileMenuOpen={setMobileMenuOpen}
        familyAccess={familyAccess}
        canCreateTransactions={canCreateTransactions}
        onOpenNewTransaction={() => {
          setTxType(activeModule === 'receber' ? 'INCOME' : 'EXPENSE');
          setIsTxModalOpen(true);
        }}
        onOpenSmartImport={() => {
          setSmartImportDefaultTarget(
            activeModule === 'cadastros' && activeSubMenu === 'cartoes' ? 'CARD' : 'ACCOUNT'
          );
          setIsSmartImportOpen(true);
        }}
        userName={userName}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
        onAvatarError={() => setUserAvatarUrl(null)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={() => {
          localStorage.clear();
          router.push('/login');
        }}
      />

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settingsSection={settingsSection}
        onChangeSection={section => {
          setSettingsSection(section);
          setProfileError('');
          setProfileNotice('');
        }}
        familyAccess={familyAccess}
        userEmail={userEmail}
        profile={profile}
        setProfile={setProfile}
        onSaveProfile={saveProfile}
        savingProfile={savingProfile}
        profileError={profileError}
        profileNotice={profileNotice}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* BODY */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        <DashboardSidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          activeSubMenu={activeSubMenu}
          setActiveSubMenu={setActiveSubMenu}
          canReadFamily={canReadFamily}
          userEmail={userEmail}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10 pb-24 md:pb-10 max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
          {syncing && (
            <div className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/95 px-3.5 py-1.5 text-xs font-bold text-emerald-300 shadow-lg backdrop-blur-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Sincronizando dados...</span>
            </div>
          )}
          {familyAccess?.subscription?.planType === 'TRIAL' && (() => {
            const rawTrialEnd = familyAccess.subscription.trialEndsAt;
            const trialEndMs = rawTrialEnd ? new Date(rawTrialEnd).getTime() : NaN;
            const daysRemaining = Number.isFinite(trialEndMs)
              ? Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24))
              : 10;
            const isUrgent = daysRemaining <= 3;

            return (
              <div
                className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  daysRemaining <= 0
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                    : isUrgent
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    {daysRemaining > 0 ? (
                      <>
                        <strong>Período de Teste Gratuito:</strong> restam{' '}
                        <strong>{daysRemaining} dia(s)</strong> de acesso completo para sua família.
                      </>
                    ) : (
                      <>
                        <strong>Seu período de teste de 10 dias encerrou.</strong> Ative seu plano Mensal (R$ 29,90) ou Anual (12x R$ 24,90) para manter o acesso da família.
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="self-start sm:self-center shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer shadow-sm"
                >
                  {daysRemaining <= 0 ? 'Escolher Plano Agora' : 'Ver Planos / Assinar'}
                </button>
              </div>
            );
          })()}

          {familyAccess?.broadcast?.message && (
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3.5 text-sm font-medium flex items-center justify-between gap-3 ${
                familyAccess.broadcast.type === 'WARNING'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : familyAccess.broadcast.type === 'SUCCESS'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
              }`}
            >
              <span>{familyAccess.broadcast.message}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'geral' && (
            <DashboardOverviewTab
              userName={userName}
              accounts={accounts}
              categories={categories}
              creditCards={creditCards}
              transactions={transactions}
              dashboardYear={dashboardYear}
              setDashboardYear={setDashboardYear}
              dashboardMonth={dashboardMonth}
              setDashboardMonth={setDashboardMonth}
              chartStatusMode={chartStatusMode}
              setChartStatusMode={setChartStatusMode}
              selectedChartMonth={selectedChartMonth}
              setSelectedChartMonth={setSelectedChartMonth}
              monthlySummaryPeriod={monthlySummaryPeriod}
              setMonthlySummaryPeriod={setMonthlySummaryPeriod}
              budgetPeriod={budgetPeriod}
              setBudgetPeriod={setBudgetPeriod}
              setActiveModule={setActiveModule}
              setActiveSubMenu={setActiveSubMenu}
              setDashboardPeriodOverride={setDashboardPeriodOverride}
              setFilterStatus={setFilterStatus}
              canSettleTransactions={canSettleTransactions}
              payingExpenses={payingExpenses}
              onPayExpenses={handlePayExpenses}
              familyId={familyId}
              onOpenNewTransactionModal={type => {
                setTxType(type);
                setIsTxModalOpen(true);
              }}
              onOpenNewCardModal={() => setIsCardModalOpen(true)}
            />
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'cartoes' && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">Cartões de Crédito</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {canCreateTransactions && creditCards.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSmartImportDefaultTarget('CARD');
                        setIsSmartImportOpen(true);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold py-2.5 px-4 rounded-xl text-sm cursor-pointer transition-all"
                    >
                      Importar Fatura (PDF / Print / CSV)
                    </button>
                  )}
                  {canManageCards && (
                    <button
                      onClick={() => setIsCardModalOpen(true)}
                      className="bg-emerald-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                    >
                      + Novo Cartão
                    </button>
                  )}
                </div>
              </div>
              <CreditCardList
                familyId={familyId}
                refreshTrigger={creditCards.length + transactions.length}
                onInvoicePaid={fetchData}
                canManageCards={canManageCards}
                canSettleTransactions={canSettleTransactions}
              />
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'contas' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Contas Bancárias</h2>
              <AccountsManager
                familyId={familyId}
                apiUrl={API_URL}
                onUpdated={fetchData}
                canManage={canManageAccounts}
              />
            </div>
          )}

          {activeModule === 'cadastros' && activeSubMenu === 'categorias' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Categorias Cadastradas</h2>
              <CategoriesManager
                familyId={familyId}
                apiUrl={API_URL}
                onUpdated={fetchData}
                canManage={canManageCategories}
              />
            </div>
          )}

          {activeModule === 'pagar' && (
            <PayablesSection
              filteredPayableTransactions={filteredPayableTransactions}
              filteredPayableTotal={filteredPayableTotal}
              payableExpenses={payableExpenses}
              selectedPayableExpenses={selectedPayableExpenses}
              allPayableExpensesSelected={allPayableExpensesSelected}
              payableView={payableView}
              setPayableView={setPayableView}
              selectedExpenseIds={selectedExpenseIds}
              payingExpenses={payingExpenses}
              canCreateTransactions={canCreateTransactions}
              canSettleTransactions={canSettleTransactions}
              canEditTransactions={canEditTransactions}
              canDeleteTransactions={canDeleteTransactions}
              onPrintPayableExpenses={() =>
                openPayableExpensesPrintWindow(getPayableReportRows(), userName, getPayableReportFilters(), setError)
              }
              onExportPayablePdf={() =>
                generatePayableExpensesPdf(getPayableReportRows(), userName, getPayableReportFilters())
              }
              onExportPayableExcel={() =>
                generatePayableExpensesExcel(getPayableReportRows(), userName, getPayableReportFilters())
              }
              onOpenNewExpenseModal={() => {
                setTxType('EXPENSE');
                setIsTxModalOpen(true);
              }}
              onSelectAllPayableExpenses={handleSelectAllPayableExpenses}
              onPaySelectedExpenses={() => handlePayExpenses(selectedPayableExpenses)}
              onToggleStatus={handleToggleStatus}
              onExpenseSelection={handleExpenseSelection}
              onPayExpenses={handlePayExpenses}
              onEditModal={openEditModal}
              onDeleteModal={openDeleteModal}
              filterBarProps={filterBarSharedProps}
            />
          )}

          {activeModule === 'receber' && (
            <ReceivablesSection
              filteredReceivableTransactions={filteredTransactions('INCOME')}
              selectedExpenseIds={selectedExpenseIds}
              payingExpenses={payingExpenses}
              canCreateTransactions={canCreateTransactions}
              canSettleTransactions={canSettleTransactions}
              canEditTransactions={canEditTransactions}
              canDeleteTransactions={canDeleteTransactions}
              onOpenNewIncomeModal={() => {
                setTxType('INCOME');
                setIsTxModalOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
              onExpenseSelection={handleExpenseSelection}
              onPayExpenses={handlePayExpenses}
              onEditModal={openEditModal}
              onDeleteModal={openDeleteModal}
              filterBarProps={filterBarSharedProps}
            />
          )}

          {activeModule === 'investimentos' && activeSubMenu === 'metas' && (
            <InvestmentGoalsSection
              transactions={transactions}
              canManageGoals={canManageGoals}
              canDeleteTransactions={canDeleteTransactions}
              onOpenNewGoalModal={() => setIsGoalModalOpen(true)}
              onDeleteGoal={firstInstallment => openDeleteModal(firstInstallment, 'all')}
            />
          )}

          {activeModule === 'investimentos' && activeSubMenu === 'provisoes' && canReadFamily && (
            <AnnualProvisionsManager canManage={canManageProvisions} />
          )}

          {activeModule === 'mercado' && canReadFamily && (
            <SupermarketModule
              activeSubMenu={activeSubMenu}
              setActiveSubMenu={setActiveSubMenu}
              accounts={accounts}
              creditCards={creditCards}
              categories={categories}
              onRefreshFinancialData={fetchData}
            />
          )}

          {activeModule === 'contratos' && canReadFamily && (
            <HouseholdContractsModule
              activeSubMenu={activeSubMenu}
              setActiveSubMenu={setActiveSubMenu}
              accounts={accounts}
              creditCards={creditCards}
              categories={categories}
              onRefreshFinancialData={fetchData}
            />
          )}

          {activeModule === 'gestao' && (
            <InternalCrmPanel
              embedded
              activeSectionOverride={activeSubMenu === 'leads' ? 'LEADS' : 'TENANTS'}
              onChangeSection={sec => setActiveSubMenu(sec === 'LEADS' ? 'leads' : 'clientes')}
            />
          )}
        </main>
      </div>

      {canCreateTransactions && activeModule !== 'mercado' && activeModule !== 'contratos' && activeModule !== 'gestao' && (
        <button
          type="button"
          onClick={() => {
            if (activeModule === 'receber') setTxType('INCOME');
            else setTxType('EXPENSE');
            setIsTxModalOpen(true);
          }}
          aria-label="Adicionar lançamento"
          title="Novo lançamento"
          className="fixed right-5 bottom-5 mb-[env(safe-area-inset-bottom)] z-40 md:hidden flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      )}

      <SettlementModal
        settlementEntries={settlementEntries}
        canSettleTransactions={canSettleTransactions}
        payingExpenses={payingExpenses}
        accounts={accounts}
        settlementError={settlementError}
        onClose={() => {
          if (payingExpenses) return;
          setSettlementEntries([]);
          setSettlementError('');
        }}
        onRemoveEntry={txId => setSettlementEntries(entries => entries.filter(item => String(item.transaction.id) !== txId))}
        onUpdateEntry={updateSettlementEntry}
        onSubmit={submitSettlement}
      />

      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        txToDelete={txToDelete}
        canDeleteTransactions={canDeleteTransactions}
        deleteScope={deleteScope}
        setDeleteScope={setDeleteScope}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteTx}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        editingTx={editingTx}
        canEditTransactions={canEditTransactions}
        categories={categories}
        txDescription={txDescription}
        setTxDescription={setTxDescription}
        txCategoryId={txCategoryId}
        setTxCategoryId={setTxCategoryId}
        txAmount={txAmount}
        setTxAmount={setTxAmount}
        txDueDate={txDueDate}
        setTxDueDate={setTxDueDate}
        transactionEditError={transactionEditError}
        savingTransactionEdit={savingTransactionEdit}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateTx}
      />

      <NewGoalModal
        isOpen={isGoalModalOpen}
        canManageGoals={canManageGoals}
        goalTitle={goalTitle}
        setGoalTitle={setGoalTitle}
        goalTargetAmount={goalTargetAmount}
        setGoalTargetAmount={setGoalTargetAmount}
        goalMonths={goalMonths}
        setGoalMonths={setGoalMonths}
        goalStartDate={goalStartDate}
        setGoalStartDate={setGoalStartDate}
        savingGoal={savingGoal}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleSaveGoal}
      />

      <CreateTransactionModal
        isOpen={isTxModalOpen}
        canCreateTransactions={canCreateTransactions}
        categories={categories}
        creditCards={creditCards}
        accounts={accounts}
        txType={txType}
        setTxType={setTxType}
        txDescription={txDescription}
        setTxDescription={setTxDescription}
        txCategoryId={txCategoryId}
        setTxCategoryId={setTxCategoryId}
        txRepeatMonthly={txRepeatMonthly}
        setTxRepeatMonthly={setTxRepeatMonthly}
        txRecurrenceMonths={txRecurrenceMonths}
        setTxRecurrenceMonths={setTxRecurrenceMonths}
        txAmount={txAmount}
        setTxAmount={setTxAmount}
        txPaymentMethod={txPaymentMethod}
        setTxPaymentMethod={setTxPaymentMethod}
        txCardId={txCardId}
        setTxCardId={setTxCardId}
        txAccountId={txAccountId}
        setTxAccountId={setTxAccountId}
        txTotalInstallments={txTotalInstallments}
        setTxTotalInstallments={setTxTotalInstallments}
        txStartInstallment={txStartInstallment}
        setTxStartInstallment={setTxStartInstallment}
        txAmountMode={txAmountMode}
        setTxAmountMode={setTxAmountMode}
        txTransactionDate={txTransactionDate}
        setTxTransactionDate={setTxTransactionDate}
        txDueDate={txDueDate}
        setTxDueDate={setTxDueDate}
        calculatedCardDueDate={calculatedCardDueDate}
        savingTx={savingTx}
        onClose={() => setIsTxModalOpen(false)}
        onSubmit={handleSaveTransaction}
      />

      <CreateCardModal
        isOpen={isCardModalOpen}
        canManageCards={canManageCards}
        cardName={cardName}
        setCardName={setCardName}
        cardBrand={cardBrand}
        setCardBrand={setCardBrand}
        cardLimit={cardLimit}
        setCardLimit={setCardLimit}
        cardClosingDay={cardClosingDay}
        setCardClosingDay={setCardClosingDay}
        cardDueDay={cardDueDay}
        setCardDueDay={setCardDueDay}
        savingCard={savingCard}
        onClose={() => setIsCardModalOpen(false)}
        onSubmit={handleSaveCard}
      />

      <SubscriptionUpgradeModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        userName={userName}
        userEmail={userEmail}
        familyId={familyId}
        contactPhone={familyAccess?.subscription?.contactPhone}
        daysRemaining={
          familyAccess?.subscription?.trialEndsAt
            ? Math.ceil((new Date(familyAccess.subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null
        }
      />

      <SmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        onImported={fetchData}
        accounts={accounts}
        creditCards={creditCards}
        categories={categories}
        canCreateTransactions={canCreateTransactions}
        canSettleTransactions={canSettleTransactions}
        defaultTargetType={smartImportDefaultTarget}
      />
    </div>
  );
}
