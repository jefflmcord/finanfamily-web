'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ArrowUpRight,
  Search,
  Loader2,
  X,
  PieChart as PieChartIcon,
  AlertTriangle,
  Receipt,
  CreditCard,
  Wallet,
  Phone,
  FileText,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import { formatCurrency, formatDatePT } from './dashboardUtils';

export const CONTRACT_GROUPS = [
  'Streaming & Digital',
  'Internet & Telefonia',
  'Moradia & Utilidades',
  'Saúde & Bem-Estar',
  'Educação & Cursos',
  'Seguros & Proteção',
  'Clubes & Outros',
] as const;

export const WARRANTY_CATEGORIES = [
  'Cozinha & Eletros',
  'Lavanderia & Limpeza',
  'Sala, TV & Áudio',
  'Celulares & Informática',
  'Climatização & Casa',
  'Ferramentas & Outros',
] as const;

const GROUP_ICONS: Record<string, string> = {
  'Streaming & Digital': '🎬',
  'Internet & Telefonia': '📡',
  'Moradia & Utilidades': '🏠',
  'Saúde & Bem-Estar': '🩺',
  'Educação & Cursos': '🎓',
  'Seguros & Proteção': '🛡️',
  'Clubes & Outros': '✨',
};

const WARRANTY_ICONS: Record<string, string> = {
  'Cozinha & Eletros': '🧊',
  'Lavanderia & Limpeza': '🧺',
  'Sala, TV & Áudio': '📺',
  'Celulares & Informática': '💻',
  'Climatização & Casa': '❄️',
  'Ferramentas & Outros': '🔧',
};

const QUICK_SERVICES_CATALOG: {
  title: string;
  provider: string;
  group: string;
  suggestedAmount: number;
  cycle: 'MONTHLY' | 'ANNUAL';
}[] = [
  { title: 'Netflix', provider: 'Netflix', group: 'Streaming & Digital', suggestedAmount: 44.9, cycle: 'MONTHLY' },
  { title: 'Spotify Família / Duo', provider: 'Spotify', group: 'Streaming & Digital', suggestedAmount: 34.9, cycle: 'MONTHLY' },
  { title: 'Amazon Prime', provider: 'Amazon', group: 'Streaming & Digital', suggestedAmount: 19.9, cycle: 'MONTHLY' },
  { title: 'YouTube Premium', provider: 'Google', group: 'Streaming & Digital', suggestedAmount: 24.9, cycle: 'MONTHLY' },
  { title: 'Disney+ / Max', provider: 'Streaming', group: 'Streaming & Digital', suggestedAmount: 43.9, cycle: 'MONTHLY' },
  { title: 'iCloud / Google One', provider: 'Nuvem', group: 'Streaming & Digital', suggestedAmount: 14.9, cycle: 'MONTHLY' },
  { title: 'Internet Fibra Casa', provider: 'Provedor Fibra', group: 'Internet & Telefonia', suggestedAmount: 119.9, cycle: 'MONTHLY' },
  { title: 'Plano Celular Família', provider: 'Operadora', group: 'Internet & Telefonia', suggestedAmount: 89.9, cycle: 'MONTHLY' },
  { title: 'Condomínio', provider: 'Administradora', group: 'Moradia & Utilidades', suggestedAmount: 550.0, cycle: 'MONTHLY' },
  { title: 'Aluguel / Financiamento', provider: 'Imobiliária / Banco', group: 'Moradia & Utilidades', suggestedAmount: 1800.0, cycle: 'MONTHLY' },
  { title: 'Energia Elétrica', provider: 'Concessionária', group: 'Moradia & Utilidades', suggestedAmount: 240.0, cycle: 'MONTHLY' },
  { title: 'Água & Saneamento', provider: 'Companhia de Água', group: 'Moradia & Utilidades', suggestedAmount: 110.0, cycle: 'MONTHLY' },
  { title: 'Academia / Treino', provider: 'Academia', group: 'Saúde & Bem-Estar', suggestedAmount: 129.9, cycle: 'MONTHLY' },
  { title: 'Plano de Saúde Familiar', provider: 'Operadora de Saúde', group: 'Saúde & Bem-Estar', suggestedAmount: 890.0, cycle: 'MONTHLY' },
  { title: 'Escola / Colégio / Faculdade', provider: 'Instituição de Ensino', group: 'Educação & Cursos', suggestedAmount: 950.0, cycle: 'MONTHLY' },
  { title: 'Curso de Idiomas / Esporte', provider: 'Escola', group: 'Educação & Cursos', suggestedAmount: 280.0, cycle: 'MONTHLY' },
  { title: 'Seguro Residencial', provider: 'Seguradora', group: 'Seguros & Proteção', suggestedAmount: 480.0, cycle: 'ANNUAL' },
  { title: 'Seguro de Vida Familiar', provider: 'Seguradora', group: 'Seguros & Proteção', suggestedAmount: 65.0, cycle: 'MONTHLY' },
];

interface HouseholdContract {
  id: string | number;
  title: string;
  provider: string | null;
  contract_group: string;
  billing_cycle: 'MONTHLY' | 'ANNUAL';
  amount: number;
  billing_day: number;
  renewal_date: string | null;
  payment_method: string;
  credit_card_id: string | null;
  account_id: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELED';
  support_phone: string | null;
  notes: string | null;
}

interface HouseholdWarranty {
  id: string | number;
  product_name: string;
  brand_model: string | null;
  room_category: string;
  store_name: string | null;
  purchase_date: string;
  purchase_amount: number;
  warranty_months: number;
  extended_warranty_months: number;
  warranty_expires_at: string;
  invoice_number: string | null;
  serial_number: string | null;
  support_contact: string | null;
  notes: string | null;
}

interface HouseholdContractsModuleProps {
  activeSubMenu: string;
  setActiveSubMenu: (sub: string) => void;
  accounts: any[];
  creditCards: any[];
  categories: any[];
  onRefreshFinancialData: () => void;
}

export default function HouseholdContractsModule({
  activeSubMenu,
  setActiveSubMenu,
  accounts,
  creditCards,
  categories,
  onRefreshFinancialData,
}: HouseholdContractsModuleProps) {
  const [contracts, setContracts] = useState<HouseholdContract[]>([]);
  const [warranties, setWarranties] = useState<HouseholdWarranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtros de Contratos
  const [contractFilter, setContractFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [contractSearch, setContractSearch] = useState('');
  const [showQuickCatalog, setShowQuickCatalog] = useState(false);

  // Modal Novo Contrato / Assinatura
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cProvider, setCProvider] = useState('');
  const [cGroup, setCGroup] = useState<string>('Streaming & Digital');
  const [cCycle, setCCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [cAmount, setCAmount] = useState('');
  const [cDay, setCDay] = useState('10');
  const [cRenewalDate, setCRenewalDate] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cNotes, setCNotes] = useState('');
  const [savingContract, setSavingContract] = useState(false);

  // Modal Lançar Contrato no Financeiro
  const [launchContract, setLaunchContract] = useState<HouseholdContract | null>(null);
  const [launchMonths, setLaunchMonths] = useState('1');
  const [launchTarget, setLaunchTarget] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');
  const [launchAccountId, setLaunchAccountId] = useState('');
  const [launchCardId, setLaunchCardId] = useState('');
  const [launchCategoryId, setLaunchCategoryId] = useState('');
  const [submittingLaunch, setSubmittingLaunch] = useState(false);

  // Modal Nova Garantia / Bem da Casa
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [wProductName, setWProductName] = useState('');
  const [wBrandModel, setWBrandModel] = useState('');
  const [wCategory, setWCategory] = useState<string>('Cozinha & Eletros');
  const [wStoreName, setWStoreName] = useState('');
  const [wPurchaseDate, setWPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [wPurchaseAmount, setWPurchaseAmount] = useState('');
  const [wFactoryMonths, setWFactoryMonths] = useState('12');
  const [wExtendedMonths, setWExtendedMonths] = useState('0');
  const [wInvoiceNumber, setWInvoiceNumber] = useState('');
  const [wSerialNumber, setWSerialNumber] = useState('');
  const [wSupportContact, setWSupportContact] = useState('');
  const [wNotes, setWNotes] = useState('');
  const [savingWarranty, setSavingWarranty] = useState(false);
  const [warrantySearch, setWarrantySearch] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/household/overview`);
      if (!response.ok) throw new Error('Não foi possível carregar os contratos e garantias.');
      const data = await response.json();
      setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      setWarranties(Array.isArray(data.warranties) ? data.warranties : []);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao carregar dados.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // KPIs de Assinaturas & Contratos
  const contractKpis = useMemo(() => {
    let monthlyCommitted = 0;
    let annualSavedFromPaused = 0;
    let renewingSoonCount = 0;

    for (const c of contracts) {
      const monthlyEquivalent = c.billing_cycle === 'ANNUAL' ? c.amount / 12 : c.amount;
      if (c.status === 'ACTIVE') {
        monthlyCommitted += monthlyEquivalent;
        if (c.renewal_date) {
          const daysToRenew = Math.ceil(
            (new Date(`${c.renewal_date}T23:59:59`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysToRenew >= -5 && daysToRenew <= 30) {
            renewingSoonCount += 1;
          }
        }
      } else {
        annualSavedFromPaused += monthlyEquivalent * 12;
      }
    }

    return {
      monthlyCommitted: Math.round(monthlyCommitted * 100) / 100,
      annualProjection: Math.round(monthlyCommitted * 12 * 100) / 100,
      annualSavedFromPaused: Math.round(annualSavedFromPaused * 100) / 100,
      activeCount: contracts.filter(c => c.status === 'ACTIVE').length,
      pausedCount: contracts.filter(c => c.status !== 'ACTIVE').length,
      renewingSoonCount,
    };
  }, [contracts]);

  // KPIs de Garantias
  const warrantyKpis = useMemo(() => {
    let totalPatrimonyValue = 0;
    let activeWarranties = 0;
    let expiringSoon = 0;

    for (const w of warranties) {
      totalPatrimonyValue += Number(w.purchase_amount || 0);
      const daysLeft = Math.ceil(
        (new Date(`${w.warranty_expires_at}T23:59:59`).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysLeft >= 0) {
        activeWarranties += 1;
        if (daysLeft <= 45) expiringSoon += 1;
      }
    }

    return {
      totalPatrimonyValue: Math.round(totalPatrimonyValue * 100) / 100,
      activeWarranties,
      expiringSoon,
    };
  }, [warranties]);

  const handleOpenQuickService = (svc: (typeof QUICK_SERVICES_CATALOG)[number]) => {
    setCTitle(svc.title);
    setCProvider(svc.provider);
    setCGroup(svc.group);
    setCCycle(svc.cycle);
    setCAmount(String(svc.suggestedAmount.toFixed(2)));
    setCDay('10');
    setCRenewalDate('');
    setCPhone('');
    setCNotes('');
    setIsContractModalOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) return;
    setSavingContract(true);
    setFeedback(null);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/household/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cTitle.trim(),
          provider: cProvider.trim() || null,
          contract_group: cGroup,
          billing_cycle: cCycle,
          amount: Number(cAmount) || 0,
          billing_day: Number(cDay) || 10,
          renewal_date: cRenewalDate || null,
          support_phone: cPhone.trim() || null,
          notes: cNotes.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar assinatura/contrato.');

      setIsContractModalOpen(false);
      setCTitle('');
      setCProvider('');
      setCAmount('');
      setCRenewalDate('');
      setCPhone('');
      setCNotes('');
      await fetchOverview();
      setFeedback({ type: 'success', text: `"${result.title}" adicionado ao controle da casa!` });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar contrato.',
      });
    } finally {
      setSavingContract(false);
    }
  };

  const handleToggleContractStatus = async (contract: HouseholdContract) => {
    const nextStatus = contract.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/household/contracts/${contract.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!response.ok) throw new Error('Erro ao atualizar status.');
      await fetchOverview();
      const annualImpact =
        (contract.billing_cycle === 'ANNUAL' ? contract.amount : contract.amount * 12);
      setFeedback({
        type: 'success',
        text:
          nextStatus === 'PAUSED'
            ? `"${contract.title}" pausado/cancelado! Economia anual estimada de ${formatCurrency(annualImpact)}.`
            : `"${contract.title}" reativado.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao atualizar contrato.',
      });
    }
  };

  const handleDeleteContract = async (id: string | number) => {
    try {
      await authenticatedFetch(`${API_URL}/api/household/contracts/${id}`, { method: 'DELETE' });
      await fetchOverview();
      setFeedback({ type: 'success', text: 'Contrato/assinatura removido.' });
    } catch {
      setFeedback({ type: 'error', text: 'Não foi possível excluir.' });
    }
  };

  const openLaunchFinancialModal = (contract: HouseholdContract) => {
    setLaunchContract(contract);
    setLaunchMonths(contract.billing_cycle === 'ANNUAL' ? '1' : '1');
    setLaunchAccountId(accounts[0]?.id ? String(accounts[0].id) : '');
    setLaunchCardId(creditCards[0]?.id ? String(creditCards[0].id) : '');
    const defaultCat = categories.find(c => c.flow_type === 'EXPENSE');
    setLaunchCategoryId(defaultCat ? String(defaultCat.id) : '');
  };

  const handleConfirmLaunchFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchContract) return;
    setSubmittingLaunch(true);
    setFeedback(null);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/household/contracts/${launchContract.id}/launch-financial`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            months: Number(launchMonths) || 1,
            payment_target: launchTarget,
            account_id: launchTarget === 'ACCOUNT' ? launchAccountId : null,
            credit_card_id: launchTarget === 'CARD' ? launchCardId : null,
            category_id: launchCategoryId || null,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao lançar no financeiro.');
      setLaunchContract(null);
      onRefreshFinancialData();
      setFeedback({ type: 'success', text: result.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao lançar no financeiro.',
      });
    } finally {
      setSubmittingLaunch(false);
    }
  };

  const handleSaveWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wProductName.trim()) return;
    setSavingWarranty(true);
    setFeedback(null);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/household/warranties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: wProductName.trim(),
          brand_model: wBrandModel.trim() || null,
          room_category: wCategory,
          store_name: wStoreName.trim() || null,
          purchase_date: wPurchaseDate,
          purchase_amount: Number(wPurchaseAmount) || 0,
          warranty_months: Number(wFactoryMonths) || 12,
          extended_warranty_months: Number(wExtendedMonths) || 0,
          invoice_number: wInvoiceNumber.trim() || null,
          serial_number: wSerialNumber.trim() || null,
          support_contact: wSupportContact.trim() || null,
          notes: wNotes.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao cadastrar garantia.');

      setIsWarrantyModalOpen(false);
      setWProductName('');
      setWBrandModel('');
      setWStoreName('');
      setWPurchaseAmount('');
      setWInvoiceNumber('');
      setWSerialNumber('');
      setWSupportContact('');
      setWNotes('');
      await fetchOverview();
      setFeedback({
        type: 'success',
        text: `Garantia de "${result.product_name}" salva até ${formatDatePT(result.warranty_expires_at)}!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar garantia.',
      });
    } finally {
      setSavingWarranty(false);
    }
  };

  const handleDeleteWarranty = async (id: string | number) => {
    try {
      await authenticatedFetch(`${API_URL}/api/household/warranties/${id}`, { method: 'DELETE' });
      await fetchOverview();
      setFeedback({ type: 'success', text: 'Garantia removida do cofre.' });
    } catch {
      setFeedback({ type: 'error', text: 'Não foi possível remover a garantia.' });
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (contractFilter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (contractFilter === 'INACTIVE' && c.status === 'ACTIVE') return false;
      if (contractSearch.trim()) {
        const q = contractSearch.trim().toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          (c.provider || '').toLowerCase().includes(q) ||
          c.contract_group.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contracts, contractFilter, contractSearch]);

  const filteredWarranties = useMemo(() => {
    return warranties.filter(w => {
      if (!warrantySearch.trim()) return true;
      const q = warrantySearch.trim().toLowerCase();
      return (
        w.product_name.toLowerCase().includes(q) ||
        (w.brand_model || '').toLowerCase().includes(q) ||
        (w.store_name || '').toLowerCase().includes(q) ||
        (w.invoice_number || '').toLowerCase().includes(q)
      );
    });
  }, [warranties, warrantySearch]);

  const groupBreakdown = useMemo(() => {
    const map = new Map<string, { monthlyTotal: number; count: number }>();
    let totalMonthly = 0;

    for (const c of contracts) {
      if (c.status !== 'ACTIVE') continue;
      const monthly = c.billing_cycle === 'ANNUAL' ? c.amount / 12 : c.amount;
      const grp = c.contract_group || 'Streaming & Digital';
      const cur = map.get(grp) || { monthlyTotal: 0, count: 0 };
      cur.monthlyTotal += monthly;
      cur.count += 1;
      map.set(grp, cur);
      totalMonthly += monthly;
    }

    return Array.from(map.entries())
      .map(([group, info]) => ({
        group,
        icon: GROUP_ICONS[group] || '✨',
        monthlyTotal: Math.round(info.monthlyTotal * 100) / 100,
        annualTotal: Math.round(info.monthlyTotal * 12 * 100) / 100,
        count: info.count,
        percentage:
          totalMonthly > 0 ? Math.round((info.monthlyTotal / totalMonthly) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  }, [contracts]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        Carregando Contratos, Assinaturas & Cofre de Garantias...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Contratos, Assinaturas & Garantias
              </h1>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Patrimônio & Custo Fixo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Controle assinaturas recorrentes, datas de reajuste de contratos e prazos de garantia dos eletros da casa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubMenu('assinaturas');
              setIsContractModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-lg transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova Assinatura / Contrato
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubMenu('garantias');
              setIsWarrantyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-emerald-300 transition-all cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            Nova Garantia / Bem
          </button>
        </div>
      </div>

      {/* SELETOR DE ABAS */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-1.5 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveSubMenu('assinaturas')}
          className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubMenu !== 'garantias' && activeSubMenu !== 'analise_contratos'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          <span>Assinaturas & Contratos ({contracts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubMenu('garantias')}
          className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubMenu === 'garantias'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Cofre de Garantias ({warranties.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubMenu('analise_contratos')}
          className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubMenu === 'analise_contratos'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <PieChartIcon className="h-4 w-4" />
          <span>Raio-X do Custo Fixo</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs sm:text-sm font-semibold ${
            feedback.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-80 hover:opacity-100 ml-3"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ==================== ABA 1: ASSINATURAS & CONTRATOS RECORRENTES ==================== */}
      {activeSubMenu !== 'garantias' && activeSubMenu !== 'analise_contratos' && (
        <div className="space-y-5">
          {/* KPIs DE IMPACTO NO ORÇAMENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-5 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Custo Fixo Mensal (Ativos)
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(contractKpis.monthlyCommitted)}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                {contractKpis.activeCount} contrato(s) / assinatura(s) ativa(s)
              </span>
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-slate-900 p-5 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Impacto em 12 Meses (Anual)
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(contractKpis.annualProjection)}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                Quanto esses serviços consomem por ano
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Economia Anual (Cancelados/Pausados)
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-emerald-400">
                {formatCurrency(contractKpis.annualSavedFromPaused)}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                {contractKpis.renewingSoonCount > 0 ? (
                  <strong className="text-amber-300">
                    ⏰ {contractKpis.renewingSoonCount} contrato(s) renovando em ≤30d
                  </strong>
                ) : (
                  `${contractKpis.pausedCount} serviço(s) pausado(s) ou cancelado(s)`
                )}
              </span>
            </div>
          </div>

          {/* BOTÃO CATÁLOGO RÁPIDO DE SERVIÇOS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Adição Rápida de Serviços & Contratos da Casa
                </h3>
                <p className="text-xs text-slate-400">
                  Toque em qualquer serviço abaixo para cadastrar em segundos ou crie um personalizado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCatalog(prev => !prev)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-extrabold text-emerald-300 transition-colors cursor-pointer"
              >
                {showQuickCatalog ? 'Ocultar Sugestões' : 'Ver +18 Serviços Comuns'}
              </button>
            </div>

            {showQuickCatalog && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_SERVICES_CATALOG.map(svc => (
                  <button
                    key={svc.title}
                    type="button"
                    onClick={() => handleOpenQuickService(svc)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-emerald-500/40 px-3 py-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                  >
                    <span>{GROUP_ICONS[svc.group] || '✨'}</span>
                    <span>{svc.title}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ({formatCurrency(svc.suggestedAmount)})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FILTROS E BUSCA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ['ACTIVE', `Ativos (${contractKpis.activeCount})`],
                  ['INACTIVE', `Pausados / Cancelados (${contractKpis.pausedCount})`],
                  ['ALL', `Todos (${contracts.length})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setContractFilter(id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    contractFilter === id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={contractSearch}
                onChange={e => setContractSearch(e.target.value)}
                placeholder="Buscar Netflix, Internet, Seguro..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* LISTA DE CONTRATOS E ASSINATURAS */}
          {filteredContracts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-white">
                Nenhum contrato ou assinatura listado neste filtro.
              </p>
              <p className="text-xs text-slate-400">
                Cadastre seus serviços de streaming, internet, escola, academia, condomínio e seguros para enxergar o custo fixo real da família.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContracts.map(contract => {
                const monthlyEq =
                  contract.billing_cycle === 'ANNUAL' ? contract.amount / 12 : contract.amount;
                const annualEq =
                  contract.billing_cycle === 'ANNUAL' ? contract.amount : contract.amount * 12;
                const daysToRenew = contract.renewal_date
                  ? Math.ceil(
                      (new Date(`${contract.renewal_date}T23:59:59`).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <div
                    key={contract.id}
                    className={`rounded-2xl border p-5 transition-all space-y-4 ${
                      contract.status === 'ACTIVE'
                        ? 'border-slate-800 bg-slate-900'
                        : 'border-slate-800/60 bg-slate-900/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-lg">
                          {GROUP_ICONS[contract.contract_group] || '✨'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-extrabold text-white truncate">
                              {contract.title}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                contract.status === 'ACTIVE'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {contract.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {contract.contract_group}
                            {contract.provider ? ` • ${contract.provider}` : ''} • Todo dia{' '}
                            <strong>{contract.billing_day}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-white">
                          {formatCurrency(contract.amount)}
                          <span className="text-[11px] font-semibold text-slate-400">
                            /{contract.billing_cycle === 'ANNUAL' ? 'ano' : 'mês'}
                          </span>
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {contract.billing_cycle === 'ANNUAL'
                            ? `Equivale a ${formatCurrency(monthlyEq)}/mês`
                            : `${formatCurrency(annualEq)}/ano`}
                        </span>
                      </div>
                    </div>

                    {daysToRenew !== null && (
                      <div
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                          daysToRenew <= 30
                            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                            : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        <span>
                          📅 Renovação / Reajuste: <strong>{formatDatePT(contract.renewal_date || '')}</strong>
                        </span>
                        {daysToRenew <= 30 && daysToRenew >= 0 && (
                          <span className="font-extrabold">Faltam {daysToRenew}d!</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {contract.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => openLaunchFinancialModal(contract)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1.5 text-xs font-extrabold text-emerald-300 transition-colors cursor-pointer"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Lançar no Financeiro
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleContractStatus(contract)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                        >
                          {contract.status === 'ACTIVE' ? (
                            <>
                              <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
                              Pausar / Cancelar
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
                              Reativar
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteContract(contract.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir contrato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== ABA 2: COFRE DE GARANTIAS & BENS DA CASA ==================== */}
      {activeSubMenu === 'garantias' && (
        <div className="space-y-5">
          {/* KPIs DE GARANTIAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Garantias Vigentes
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                {warrantyKpis.activeWarranties}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                De {warranties.length} bem(ns) cadastrado(s)
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Valor em Bens Registrados
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(warrantyKpis.totalPatrimonyValue)}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                Soma dos valores de Nota Fiscal
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Vencendo nos Próximos 45 Dias
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-amber-300">
                {warrantyKpis.expiringSoon}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                Bom momento para acionar assistência se houver defeito
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={warrantySearch}
                onChange={e => setWarrantySearch(e.target.value)}
                placeholder="Buscar Geladeira, TV, Celular, Nota Fiscal..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsWarrantyModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Aparelho / Garantia
            </button>
          </div>

          {filteredWarranties.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-white">
                Nenhum eletrodoméstico ou bem cadastrado no Cofre de Garantias.
              </p>
              <p className="text-xs text-slate-400">
                Registre a data de compra, loja, número da Nota Fiscal e meses de garantia dos aparelhos da casa para nunca perder um prazo de cobertura.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWarranties.map(w => {
                const daysLeft = Math.ceil(
                  (new Date(`${w.warranty_expires_at}T23:59:59`).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                );
                const expired = daysLeft < 0;
                const urgent = !expired && daysLeft <= 45;

                return (
                  <div
                    key={w.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-lg">
                          {WARRANTY_ICONS[w.room_category] || '🛡️'}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {w.room_category}
                          </span>
                          <h3 className="text-base font-extrabold text-white">{w.product_name}</h3>
                          {(w.brand_model || w.store_name) && (
                            <p className="text-xs text-slate-400">
                              {[w.brand_model, w.store_name].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                          expired
                            ? 'bg-slate-800 text-slate-400'
                            : urgent
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {expired
                          ? 'Garantia Expirada'
                          : urgent
                            ? `Vence em ${daysLeft}d`
                            : `Ativa (${daysLeft}d)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Compra / Valor</span>
                        <strong className="text-slate-200">
                          {formatDatePT(w.purchase_date)} • {formatCurrency(w.purchase_amount)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Garantia até</span>
                        <strong className={expired ? 'text-slate-400' : 'text-emerald-400'}>
                          {formatDatePT(w.warranty_expires_at)} (
                          {w.warranty_months + w.extended_warranty_months}m)
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {w.invoice_number && (
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-emerald-400" />
                            NF: <strong className="text-slate-200">{w.invoice_number}</strong>
                          </span>
                        )}
                        {w.support_contact && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-sky-400" />
                            {w.support_contact}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteWarranty(w.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover garantia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== ABA 3: RAIO-X DO CUSTO FIXO DA CASA ==================== */}
      {activeSubMenu === 'analise_contratos' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-400" />
              Distribuição do Custo Fixo por Categoria
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Entenda quanto do orçamento da família já começa o mês comprometido com Moradia, Streaming, Educação, Saúde e Seguros.
            </p>
          </div>

          {groupBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
              Cadastre suas assinaturas e contratos ativos para visualizar o Raio-X do custo fixo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupBreakdown.map(row => (
                <div
                  key={row.group}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{row.icon}</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{row.group}</h3>
                        <p className="text-xs text-slate-400">
                          {row.count} contrato(s) • {formatCurrency(row.annualTotal)}/ano
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-white">
                        {formatCurrency(row.monthlyTotal)}/mês
                      </p>
                      <span className="text-xs font-extrabold text-emerald-400">
                        {row.percentage}% do custo fixo
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, row.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL: NOVO CONTRATO / ASSINATURA ==================== */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">Nova Assinatura ou Contrato Fixo</h3>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Nome do Serviço / Contrato</span>
                  <input
                    type="text"
                    required
                    value={cTitle}
                    onChange={e => setCTitle(e.target.value)}
                    placeholder="Ex.: Netflix, Internet Fibra, Seguro..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Grupo</span>
                  <select
                    value={cGroup}
                    onChange={e => setCGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    {CONTRACT_GROUPS.map(g => (
                      <option key={g} value={g}>
                        {GROUP_ICONS[g]} {g}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Valor (R$)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={cAmount}
                    onChange={e => setCAmount(e.target.value)}
                    placeholder="44.90"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Ciclo</span>
                  <select
                    value={cCycle}
                    onChange={e => setCCycle(e.target.value as 'MONTHLY' | 'ANNUAL')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Dia Venc.</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cDay}
                    onChange={e => setCDay(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Fornecedor / Empresa (opcional)
                  </span>
                  <input
                    type="text"
                    value={cProvider}
                    onChange={e => setCProvider(e.target.value)}
                    placeholder="Ex.: Vivo, Unimed, Porto Seguro..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Data de Renovação / Reajuste (opcional)
                  </span>
                  <input
                    type="date"
                    value={cRenewalDate}
                    onChange={e => setCRenewalDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContract}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  {savingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Salvar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: LANÇAR CONTRATO NO FINANCEIRO ==================== */}
      {launchContract && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Lançar &ldquo;{launchContract.title}&rdquo; no Financeiro
                </h3>
                <p className="text-xs text-slate-400">
                  Gere automaticamente as parcelas em Contas a Pagar ou no Cartão
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLaunchContract(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLaunchFinancial} className="space-y-3.5">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-300">
                  Quantos meses deseja gerar de uma vez?
                </span>
                <select
                  value={launchMonths}
                  onChange={e => setLaunchMonths(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                >
                  <option value="1">Apenas o mês atual (1 lançamento)</option>
                  <option value="3">Próximos 3 meses (Trimestre)</option>
                  <option value="6">Próximos 6 meses (Semestre)</option>
                  <option value="12">Próximos 12 meses (Ano completo)</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLaunchTarget('ACCOUNT')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-extrabold cursor-pointer ${
                    launchTarget === 'ACCOUNT'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Wallet className="h-4 w-4" /> Boleto / Conta
                </button>
                <button
                  type="button"
                  onClick={() => setLaunchTarget('CARD')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-extrabold cursor-pointer ${
                    launchTarget === 'CARD'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Cartão de Crédito
                </button>
              </div>

              {launchTarget === 'ACCOUNT' ? (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Conta Bancária</span>
                  <select
                    value={launchAccountId}
                    onChange={e => setLaunchAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Cartão de Crédito</span>
                  <select
                    value={launchCardId}
                    onChange={e => setLaunchCardId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  >
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLaunchContract(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingLaunch}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  {submittingLaunch ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Gerar Lançamento(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NOVO BEM / GARANTIA DA CASA ==================== */}
      {isWarrantyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">Cadastrar Aparelho no Cofre de Garantias</h3>
              <button
                type="button"
                onClick={() => setIsWarrantyModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarranty} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Produto / Eletrodoméstico</span>
                  <input
                    type="text"
                    required
                    value={wProductName}
                    onChange={e => setWProductName(e.target.value)}
                    placeholder="Ex.: Geladeira Frost Free, Smart TV 65..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Ambiente / Categoria</span>
                  <select
                    value={wCategory}
                    onChange={e => setWCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    {WARRANTY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {WARRANTY_ICONS[cat]} {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Marca / Modelo (opcional)</span>
                  <input
                    type="text"
                    value={wBrandModel}
                    onChange={e => setWBrandModel(e.target.value)}
                    placeholder="Ex.: Brastemp Inverse / Samsung QLED"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Loja onde comprou (opcional)</span>
                  <input
                    type="text"
                    value={wStoreName}
                    onChange={e => setWStoreName(e.target.value)}
                    placeholder="Ex.: Amazon, Fast Shop, Magazine Luiza..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="block space-y-1 col-span-1 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-300">Data da Compra</span>
                  <input
                    type="date"
                    required
                    value={wPurchaseDate}
                    onChange={e => setWPurchaseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs sm:text-sm text-white"
                  />
                </label>
                <label className="block space-y-1 col-span-1 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-300">Valor Pago (R$)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={wPurchaseAmount}
                    onChange={e => setWPurchaseAmount(e.target.value)}
                    placeholder="3490.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Garantia Fábrica (Meses)</span>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={wFactoryMonths}
                    onChange={e => setWFactoryMonths(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Garantia Estendida (Meses)</span>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={wExtendedMonths}
                    onChange={e => setWExtendedMonths(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Nº da Nota Fiscal / Pedido</span>
                  <input
                    type="text"
                    value={wInvoiceNumber}
                    onChange={e => setWInvoiceNumber(e.target.value)}
                    placeholder="Ex.: NF 0049281"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Telefone Assistência / Seguro</span>
                  <input
                    type="text"
                    value={wSupportContact}
                    onChange={e => setWSupportContact(e.target.value)}
                    placeholder="Ex.: 0800 970 0999"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWarrantyModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingWarranty}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  {savingWarranty ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Salvar no Cofre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
