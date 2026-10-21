'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  Crown,
  Download,
  Edit3,
  Flame,
  KeyRound,
  Loader2,
  Megaphone,
  MessageCircle,
  Phone,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';

type PlanType = 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'COURTESY';
type BroadcastType = 'INFO' | 'SUCCESS' | 'WARNING';
type FilterTab = 'ALL' | 'HOT_TRIAL' | 'EXPIRED_TRIAL' | 'ACTIVE_TRIAL' | 'PAID' | 'COURTESY' | 'BLOCKED';
type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'ARCHIVED';
type LeadFilterTab = 'ALL' | 'NEW' | 'CONTACTED' | 'REGISTERED' | 'ARCHIVED';

interface TenantReportRow {
  id: string | number;
  name: string;
  registered_at: string | null;
  blocked_at: string | null;
  plan_type?: PlanType;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  admin_notes?: string | null;
  owner_id?: string | number | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone?: string | null;
  members_count?: number;
  accounts_count?: number;
  cards_count?: number;
  transactions_count?: number;
  last_transaction_date?: string | null;
}

interface MarketingLeadRow {
  id: string | number;
  name: string;
  email: string;
  whatsapp: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  download_count: number;
  created_at: string;
  updated_at?: string;
  matched_user_id?: string | number | null;
  matched_family_id?: string | number | null;
  matched_family_name?: string | null;
  matched_plan_type?: PlanType | null;
}

const ADMIN_EMAIL = 'jeffersonluismattosocordeiro@gmail.com';
const MONTHLY_PRICE = 29.9;
const ANNUAL_MONTHLY_EQUIVALENT = 24.9;

const PLAN_LABELS: Record<PlanType, string> = {
  TRIAL: 'Teste Grátis (10d)',
  MONTHLY: 'Mensal (R$ 29,90)',
  ANNUAL: 'Anual (R$ 298,80)',
  COURTESY: 'Cortesia / Parceiro',
};

const PLAN_BADGE_CLASSES: Record<PlanType, string> = {
  TRIAL: 'bg-sky-500/10 text-sky-300 border border-sky-500/25',
  MONTHLY: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  ANNUAL: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  COURTESY: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
};

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo Lead',
  CONTACTED: 'Contatado',
  CONVERTED: 'Convertido',
  ARCHIVED: 'Arquivado',
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function InternalTenantReportPage() {
  const [activeMainSection, setActiveMainSection] = useState<'TENANTS' | 'LEADS'>('TENANTS');
  const [tenants, setTenants] = useState<TenantReportRow[]>([]);
  const [leads, setLeads] = useState<MarketingLeadRow[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('INFO');
  const [loading, setLoading] = useState(true);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingBroadcast, setSavingBroadcast] = useState(false);
  const [updatingTenant, setUpdatingTenant] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  // Filtros e Busca de Clientes
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  // Filtros e Busca de Leads do E-book
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadFilter, setLeadFilter] = useState<LeadFilterTab>('ALL');

  // Modal CRM / Edição Comercial & Suporte
  const [selectedTenant, setSelectedTenant] = useState<TenantReportRow | null>(null);
  const [crmPlanType, setCrmPlanType] = useState<PlanType>('TRIAL');
  const [crmTrialEndsAt, setCrmTrialEndsAt] = useState('');
  const [crmSubscriptionEndsAt, setCrmSubscriptionEndsAt] = useState('');
  const [crmOwnerPhone, setCrmOwnerPhone] = useState('');
  const [crmAdminNotes, setCrmAdminNotes] = useState('');
  const [savingCrm, setSavingCrm] = useState(false);

  // Reset de senha no Modal
  const [tempPassword, setTempPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Modal / Menu de WhatsApp Rápido (Tenants e Leads)
  const [whatsAppTenant, setWhatsAppTenant] = useState<TenantReportRow | null>(null);
  const [whatsAppLead, setWhatsAppLead] = useState<MarketingLeadRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}/api/internal/tenants`);
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 403) setForbidden(true);
          throw new Error(result.error || 'Não foi possível carregar o relatório.');
        }
        if (!cancelled) {
          setTenants(Array.isArray(result.tenants) ? result.tenants : []);
          setLeads(Array.isArray(result.leads) ? result.leads : []);
          setContactPhone(result.contactPhone || '');
          setBroadcastMessage(result.broadcastMessage || '');
          setBroadcastType((result.broadcastType as BroadcastType) || 'INFO');
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o relatório.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReport();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatRegistrationDate = (value: string | null) => {
    if (!value) return 'Data não registrada';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Data inválida'
      : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  const formatShortDate = (value?: string | null) => {
    if (!value) return '—';
    const clean = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      return `${d}/${m}/${y}`;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getTrialInfo = (tenant: TenantReportRow) => {
    const plan: PlanType = tenant.plan_type || 'TRIAL';
    if (plan === 'COURTESY') {
      return {
        label: 'Isento (Cortesia)',
        badgeClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
        expired: false,
        daysRemaining: 999,
      };
    }

    if (plan === 'MONTHLY' || plan === 'ANNUAL') {
      if (!tenant.subscription_ends_at) {
        return {
          label: 'Assinatura ativa',
          badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
          expired: false,
          daysRemaining: 30,
        };
      }
      const endMs = new Date(`${tenant.subscription_ends_at.slice(0, 10)}T23:59:59`).getTime();
      const diffDays = Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return {
          label: `Venceu em ${formatShortDate(tenant.subscription_ends_at)} (${Math.abs(diffDays)}d atrás)`,
          badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
          expired: true,
          daysRemaining: diffDays,
        };
      }
      if (diffDays <= 5) {
        return {
          label: `Vence em ${diffDays}d (${formatShortDate(tenant.subscription_ends_at)})`,
          badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
          expired: false,
          daysRemaining: diffDays,
        };
      }
      return {
        label: `Até ${formatShortDate(tenant.subscription_ends_at)}`,
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
        expired: false,
        daysRemaining: diffDays,
      };
    }

    const registeredMs = tenant.registered_at ? new Date(tenant.registered_at).getTime() : NaN;
    const trialEndsMs = tenant.trial_ends_at
      ? new Date(tenant.trial_ends_at).getTime()
      : !Number.isNaN(registeredMs)
        ? registeredMs + 10 * 24 * 60 * 60 * 1000
        : NaN;

    if (Number.isNaN(trialEndsMs)) {
      return { label: 'Sem data', badgeClass: 'bg-slate-800 text-slate-400', expired: false, daysRemaining: 0 };
    }

    const remainingDays = Math.ceil((trialEndsMs - Date.now()) / (1000 * 60 * 60 * 24));
    const elapsedDays = !Number.isNaN(registeredMs)
      ? Math.max(1, Math.floor((Date.now() - registeredMs) / (1000 * 60 * 60 * 24)) + 1)
      : Math.max(1, 11 - remainingDays);

    if (remainingDays > 2) {
      return {
        label: `Dia ${Math.min(elapsedDays, 10)}/10 (${remainingDays}d restantes)`,
        badgeClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
        expired: false,
        daysRemaining: remainingDays,
      };
    }
    if (remainingDays >= 0) {
      return {
        label: remainingDays === 0 ? 'Último dia de teste!' : `Faltam ${remainingDays}d (Até ${formatShortDate(new Date(trialEndsMs).toISOString())})`,
        badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        expired: false,
        daysRemaining: remainingDays,
      };
    }
    return {
      label: `Teste vencido há ${Math.abs(remainingDays)}d`,
      badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      expired: true,
      daysRemaining: remainingDays,
    };
  };

  const isHotLead = (tenant: TenantReportRow) => {
    const isAdmin = tenant.owner_email?.toLowerCase() === ADMIN_EMAIL;
    if (isAdmin || tenant.blocked_at) return false;
    const plan = tenant.plan_type || 'TRIAL';
    if (plan !== 'TRIAL') return false;
    const txCount = Number(tenant.transactions_count || 0);
    const cardsCount = Number(tenant.cards_count || 0);
    const membersCount = Number(tenant.members_count || 1);
    return txCount >= 1 || cardsCount >= 1 || membersCount > 1;
  };

  // KPIs Executivos do Negócio
  const kpis = useMemo(() => {
    const customerTenants = tenants.filter(t => t.owner_email?.toLowerCase() !== ADMIN_EMAIL);
    const monthlySubscribers = customerTenants.filter(t => !t.blocked_at && t.plan_type === 'MONTHLY').length;
    const annualSubscribers = customerTenants.filter(t => !t.blocked_at && t.plan_type === 'ANNUAL').length;
    const paidSubscribers = monthlySubscribers + annualSubscribers;

    const mrr = monthlySubscribers * MONTHLY_PRICE + annualSubscribers * ANNUAL_MONTHLY_EQUIVALENT;
    const arr = mrr * 12;

    const activeTrialCount = customerTenants.filter(
      t => !t.blocked_at && (t.plan_type || 'TRIAL') === 'TRIAL' && !getTrialInfo(t).expired
    ).length;

    const expiredTrialCount = customerTenants.filter(
      t => !t.blocked_at && (t.plan_type || 'TRIAL') === 'TRIAL' && getTrialInfo(t).expired
    ).length;

    const hotLeadsCount = customerTenants.filter(t => isHotLead(t)).length;
    const blockedCount = customerTenants.filter(t => Boolean(t.blocked_at)).length;
    const courtesyCount = customerTenants.filter(t => !t.blocked_at && t.plan_type === 'COURTESY').length;

    const conversionRate = customerTenants.length > 0
      ? Math.round((paidSubscribers / customerTenants.length) * 100)
      : 0;

    const totalTransactions = tenants.reduce((acc, t) => acc + Number(t.transactions_count || 0), 0);

    const newEbookLeadsCount = leads.filter(l => l.status === 'NEW').length;
    const registeredEbookLeadsCount = leads.filter(l => Boolean(l.matched_family_id) || l.status === 'CONVERTED').length;

    return {
      totalCustomers: customerTenants.length,
      monthlySubscribers,
      annualSubscribers,
      paidSubscribers,
      mrr,
      arr,
      activeTrialCount,
      expiredTrialCount,
      hotLeadsCount,
      blockedCount,
      courtesyCount,
      conversionRate,
      totalTransactions,
      totalEbookLeads: leads.length,
      newEbookLeadsCount,
      registeredEbookLeadsCount,
    };
  }, [tenants, leads]);

  const filteredTenants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tenants.filter(tenant => {
      const isAdmin = tenant.owner_email?.toLowerCase() === ADMIN_EMAIL;
      const plan = tenant.plan_type || 'TRIAL';
      const trialInfo = getTrialInfo(tenant);

      if (activeFilter === 'HOT_TRIAL' && !isHotLead(tenant)) return false;
      if (activeFilter === 'EXPIRED_TRIAL' && (isAdmin || tenant.blocked_at || plan !== 'TRIAL' || !trialInfo.expired)) {
        return false;
      }
      if (activeFilter === 'ACTIVE_TRIAL' && (isAdmin || tenant.blocked_at || plan !== 'TRIAL' || trialInfo.expired)) {
        return false;
      }
      if (activeFilter === 'PAID' && (tenant.blocked_at || (plan !== 'MONTHLY' && plan !== 'ANNUAL'))) {
        return false;
      }
      if (activeFilter === 'COURTESY' && plan !== 'COURTESY') return false;
      if (activeFilter === 'BLOCKED' && !tenant.blocked_at) return false;

      if (!query) return true;
      const haystack = [
        tenant.name,
        tenant.owner_name,
        tenant.owner_email,
        tenant.owner_phone,
        tenant.admin_notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [tenants, searchTerm, activeFilter]);

  const filteredLeads = useMemo(() => {
    const query = leadSearchTerm.trim().toLowerCase();
    return leads.filter(lead => {
      if (leadFilter === 'NEW' && lead.status !== 'NEW') return false;
      if (leadFilter === 'CONTACTED' && lead.status !== 'CONTACTED') return false;
      if (leadFilter === 'REGISTERED' && !lead.matched_family_id && lead.status !== 'CONVERTED') return false;
      if (leadFilter === 'ARCHIVED' && lead.status !== 'ARCHIVED') return false;

      if (!query) return true;
      const haystack = [lead.name, lead.email, lead.whatsapp, lead.notes, lead.matched_family_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [leads, leadSearchTerm, leadFilter]);

  const saveContactPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPhone(true);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/internal/contact-phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_phone: contactPhone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar o telefone.');
      setContactPhone(result.contactPhone);
      setActionMessage('Telefone de contato para bloqueados atualizado com sucesso.');
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o telefone.');
    } finally {
      setSavingPhone(false);
    }
  };

  const saveBroadcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingBroadcast(true);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/internal/broadcast`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage, type: broadcastType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar o comunicado.');
      setBroadcastMessage(result.broadcastMessage);
      setBroadcastType(result.broadcastType);
      setActionMessage(
        result.broadcastMessage
          ? 'Comunicado global publicado no topo do Dashboard de todas as famílias.'
          : 'Comunicado global removido.'
      );
    } catch (saveErr) {
      setActionError(saveErr instanceof Error ? saveErr.message : 'Não foi possível salvar o comunicado.');
    } finally {
      setSavingBroadcast(false);
    }
  };

  const setTenantBlocked = async (tenant: TenantReportRow) => {
    const familyId = String(tenant.id);
    const blocked = !tenant.blocked_at;
    if (blocked && !window.confirm(`Bloquear ${tenant.name}? Todos os membros perderão o acesso.`)) return;
    setUpdatingTenant(familyId);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/internal/tenants/${encodeURIComponent(familyId)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocked }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível alterar o acesso do tenant.');
      setTenants(current =>
        current.map(item => (String(item.id) === familyId ? { ...item, blocked_at: result.blocked_at } : item))
      );
      setActionMessage(blocked ? 'Tenant bloqueado.' : 'Acesso do tenant liberado.');
    } catch (updateError) {
      setActionError(
        updateError instanceof Error ? updateError.message : 'Não foi possível alterar o acesso do tenant.'
      );
    } finally {
      setUpdatingTenant(null);
    }
  };

  const handleQuickCommercialAction = async (
    tenant: TenantReportRow,
    payload: {
      extend_trial_days?: number;
      activate_cycle?: 'MONTHLY' | 'ANNUAL';
      plan_type?: PlanType;
    },
    successLabel: string
  ) => {
    const familyId = String(tenant.id);
    setUpdatingTenant(familyId);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/internal/tenants/${encodeURIComponent(familyId)}/commercial`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível atualizar o plano.');
      setTenants(current =>
        current.map(item =>
          String(item.id) === familyId
            ? {
                ...item,
                plan_type: result.plan_type,
                trial_ends_at: result.trial_ends_at,
                subscription_ends_at: result.subscription_ends_at,
                admin_notes: result.admin_notes,
                blocked_at: result.blocked_at,
              }
            : item
        )
      );
      setActionMessage(successLabel);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar dados comerciais.');
    } finally {
      setUpdatingTenant(null);
    }
  };

  const handleUpdateLead = async (
    lead: MarketingLeadRow,
    payload: { status?: LeadStatus; notes?: string },
    successText?: string
  ) => {
    const leadId = String(lead.id);
    setUpdatingLeadId(leadId);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/internal/leads/${encodeURIComponent(leadId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível atualizar o lead.');
      setLeads(current =>
        current.map(item =>
          String(item.id) === leadId
            ? { ...item, status: result.status, notes: result.notes, updated_at: result.updated_at }
            : item
        )
      );
      if (successText) setActionMessage(successText);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar lead.');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleDeleteLead = async (lead: MarketingLeadRow) => {
    if (!window.confirm(`Remover o lead "${lead.name}" (${lead.email})?`)) return;
    const leadId = String(lead.id);
    setUpdatingLeadId(leadId);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/internal/leads/${encodeURIComponent(leadId)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Não foi possível excluir o lead.');
      setLeads(current => current.filter(item => String(item.id) !== leadId));
      setActionMessage(`Lead "${lead.name}" removido.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao remover lead.');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const openCrmModal = (tenant: TenantReportRow) => {
    setSelectedTenant(tenant);
    setCrmPlanType(tenant.plan_type || 'TRIAL');
    setCrmTrialEndsAt(tenant.trial_ends_at ? tenant.trial_ends_at.slice(0, 10) : '');
    setCrmSubscriptionEndsAt(tenant.subscription_ends_at ? tenant.subscription_ends_at.slice(0, 10) : '');
    setCrmOwnerPhone(tenant.owner_phone || '');
    setCrmAdminNotes(tenant.admin_notes || '');
    setTempPassword('');
  };

  const saveCrmDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTenant) return;
    const familyId = String(selectedTenant.id);
    setSavingCrm(true);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/internal/tenants/${encodeURIComponent(familyId)}/commercial`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_type: crmPlanType,
            trial_ends_at: crmTrialEndsAt ? `${crmTrialEndsAt}T23:59:59.000Z` : undefined,
            subscription_ends_at: crmSubscriptionEndsAt || null,
            owner_phone: crmOwnerPhone,
            admin_notes: crmAdminNotes,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar os dados do cliente.');

      setTenants(current =>
        current.map(item =>
          String(item.id) === familyId
            ? {
                ...item,
                plan_type: result.plan_type,
                trial_ends_at: result.trial_ends_at,
                subscription_ends_at: result.subscription_ends_at,
                admin_notes: result.admin_notes,
                owner_phone: result.owner_phone,
              }
            : item
        )
      );
      setActionMessage(`Dados comerciais de "${selectedTenant.name}" atualizados.`);
      setSelectedTenant(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao salvar dados comerciais.');
    } finally {
      setSavingCrm(false);
    }
  };

  const handleResetOwnerPassword = async () => {
    if (!selectedTenant || !tempPassword.trim()) return;
    const familyId = String(selectedTenant.id);
    setResettingPassword(true);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/internal/tenants/${encodeURIComponent(familyId)}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_password: tempPassword.trim() }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível redefinir a senha.');
      setActionMessage(result.message || 'Senha temporária definida com sucesso!');
      setTempPassword('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao redefinir a senha.');
    } finally {
      setResettingPassword(false);
    }
  };

  const exportTenantsCsv = () => {
    const headers = [
      'ID',
      'Familia',
      'Responsavel',
      'Email',
      'Telefone',
      'Data Cadastro',
      'Plano',
      'Status Teste/Assinatura',
      'Status Acesso',
      'Membros',
      'Contas',
      'Cartoes',
      'Lancamentos',
      'Ultimo Lancamento',
      'Notas Internas',
    ];
    const rows = filteredTenants.map(t => [
      String(t.id),
      t.name,
      t.owner_name || '',
      t.owner_email || '',
      t.owner_phone || '',
      formatRegistrationDate(t.registered_at),
      PLAN_LABELS[t.plan_type || 'TRIAL'],
      getTrialInfo(t).label,
      t.blocked_at ? 'Bloqueado' : 'Ativo',
      String(t.members_count ?? 1),
      String(t.accounts_count ?? 0),
      String(t.cards_count ?? 0),
      String(t.transactions_count ?? 0),
      t.last_transaction_date || '',
      (t.admin_notes || '').replace(/\r?\n/g, ' '),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanfamily-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportLeadsCsv = () => {
    const headers = [
      'ID',
      'Nome',
      'Email',
      'WhatsApp',
      'Origem',
      'Status Comercial',
      'Criou Conta no Sistema',
      'Downloads',
      'Data Captura',
      'Notas',
    ];
    const rows = filteredLeads.map(l => [
      String(l.id),
      l.name,
      l.email,
      l.whatsapp,
      l.source,
      LEAD_STATUS_LABELS[l.status] || l.status,
      l.matched_family_name ? `Sim (${l.matched_family_name})` : 'Ainda nao',
      String(l.download_count),
      formatRegistrationDate(l.created_at),
      (l.notes || '').replace(/\r?\n/g, ' '),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanfamily-leads-ebook-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildWhatsAppUrl = (phone: string | null | undefined, message: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    const normalizedPhone = digits.length >= 10 && !digits.startsWith('55') ? `55${digits}` : digits;
    const encoded = encodeURIComponent(message);
    return normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={activeMainSection === 'TENANTS' ? exportTenantsCsv : exportLeadsCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:border-emerald-500/40 hover:text-white cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              {activeMainSection === 'TENANTS' ? 'Exportar Clientes (CSV)' : 'Exportar Leads do E-book (CSV)'}
            </button>
          </div>
        </div>

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 shadow-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Backoffice & CRM SaaS • FinanFamily
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Central de Gestão do Negócio
              </h1>
            </div>
          </div>
          <p className="mt-2.5 text-sm text-slate-400 max-w-3xl">
            Gerencie seus clientes em período de teste (10 dias), acompanhe os leads captados pelo E-book na Landing Page,
            controle assinaturas Mensais (R$ 29,90) e Anuais (R$ 298,80) e acione contatos no WhatsApp com 1 clique.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" /> Carregando central de gestão...
          </div>
        ) : error ? (
          <div
            role="alert"
            className={`rounded-2xl border p-5 text-sm ${
              forbidden
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
            }`}
          >
            {forbidden ? 'Esta conta não tem autorização para acessar o relatório.' : error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* ================= CARDS EXECUTIVOS (KPIs DO SAAS) ================= */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <span>MRR (Receita Mensal)</span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="mt-2 text-2xl font-black text-white">
                  {formatCurrencyBRL(kpis.mrr)}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>ARR: <strong className="text-slate-200">{formatCurrencyBRL(kpis.arr)}</strong></span>
                  <span className="text-emerald-400 font-bold">{kpis.paidSubscribers} pagantes</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-400">
                  <span>Funil Teste (10 Dias)</span>
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">{kpis.activeTrialCount}</p>
                  <span className="text-xs font-semibold text-slate-400">em teste</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-rose-400 font-bold">
                    {kpis.expiredTrialCount} vencidos
                  </span>
                  <span className="text-slate-400">
                    Conv.: <strong className="text-white">{kpis.conversionRate}%</strong>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400">
                  <span>Leads Quentes Trial</span>
                  <Flame className="h-4 w-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-amber-300">{kpis.hotLeadsCount}</p>
                  <span className="text-xs font-semibold text-slate-400">usando o app</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Já cadastraram contas, cartões ou membros.
                </p>
              </div>

              <div
                onClick={() => setActiveMainSection('LEADS')}
                className="rounded-2xl border border-teal-500/25 bg-slate-900 p-5 shadow-lg cursor-pointer hover:border-teal-400/50 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-teal-300">
                  <span>Leads do E-book</span>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">{kpis.totalEbookLeads}</p>
                  <span className="text-xs font-semibold text-teal-400">
                    ({kpis.newEbookLeadsCount} novos)
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Criaram conta: <strong className="text-emerald-400">{kpis.registeredEbookLeadsCount}</strong>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span>Base Total & Uso</span>
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">{kpis.totalCustomers}</p>
                  <span className="text-xs font-semibold text-slate-400">famílias</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{kpis.totalTransactions} lanç.</span>
                  <span className="text-rose-400 font-semibold">{kpis.blockedCount} bloq.</span>
                </div>
              </div>
            </section>

            {/* ================= CONFIGURAÇÕES RÁPIDAS (TELEFONE + BROADCAST) ================= */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Telefone exibido para tenants bloqueados</h2>
                    <p className="text-xs text-slate-400">
                      Aparece na tela de bloqueio quando a família precisa regularizar o plano.
                    </p>
                  </div>
                </div>
                <form onSubmit={saveContactPhone} className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    required
                    type="tel"
                    maxLength={30}
                    value={contactPhone}
                    onChange={event => setContactPhone(event.target.value)}
                    aria-label="Telefone de contato"
                    placeholder="(41) 0000-0000"
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                  >
                    {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingPhone ? 'Salvando...' : 'Salvar telefone'}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Comunicado Global no Dashboard</h2>
                      <p className="text-xs text-slate-400">
                        Exibe um aviso no topo do painel de todas as famílias (deixe vazio para ocultar).
                      </p>
                    </div>
                  </div>
                </div>
                <form onSubmit={saveBroadcast} className="flex flex-col gap-2.5 sm:flex-row">
                  <select
                    value={broadcastType}
                    onChange={e => setBroadcastType(e.target.value as BroadcastType)}
                    aria-label="Tipo do comunicado"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  >
                    <option value="INFO">Informativo (Azul)</option>
                    <option value="SUCCESS">Novidade (Verde)</option>
                    <option value="WARNING">Alerta / Manutenção (Âmbar)</option>
                  </select>
                  <input
                    type="text"
                    maxLength={400}
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    placeholder="Ex.: Novidade! Agora você pode exportar relatórios em PDF e Excel..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={savingBroadcast}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-60 cursor-pointer"
                  >
                    {savingBroadcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Publicar
                  </button>
                </form>
              </div>
            </section>

            {(actionMessage || actionError) && (
              <div
                role={actionError ? 'alert' : 'status'}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold flex items-center justify-between ${
                  actionError
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                <span>{actionError || actionMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActionMessage('');
                    setActionError('');
                  }}
                  className="text-xs underline opacity-80 hover:opacity-100"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* ================= SELETOR DE VISÃO: CLIENTES VS LEADS DO E-BOOK ================= */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setActiveMainSection('TENANTS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeMainSection === 'TENANTS'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Famílias Cadastradas ({tenants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainSection('LEADS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeMainSection === 'LEADS'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Leads do E-book ({leads.length})</span>
                {kpis.newEbookLeadsCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeMainSection === 'LEADS'
                        ? 'bg-slate-950 text-emerald-400'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {kpis.newEbookLeadsCount} novo(s)
                  </span>
                )}
              </button>
            </div>

            {activeMainSection === 'TENANTS' ? (
              /* ================= TABELA CRM DE TENANTS ================= */
              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                <div className="border-b border-slate-800 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por família, nome, e-mail, telefone ou nota..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-xs font-semibold text-slate-400">
                      Exibindo <strong className="text-white">{filteredTenants.length}</strong> de{' '}
                      <strong className="text-white">{tenants.length}</strong> cadastros
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { id: 'ALL', label: `Todos (${tenants.length})` },
                        { id: 'HOT_TRIAL', label: `🔥 Leads Quentes (${kpis.hotLeadsCount})` },
                        { id: 'EXPIRED_TRIAL', label: `⏰ Teste Vencido (${kpis.expiredTrialCount})` },
                        { id: 'ACTIVE_TRIAL', label: `🧪 Em Teste ≤10d (${kpis.activeTrialCount})` },
                        { id: 'PAID', label: `💎 Assinantes (${kpis.paidSubscribers})` },
                        { id: 'COURTESY', label: `🎁 Cortesia (${kpis.courtesyCount})` },
                        { id: 'BLOCKED', label: `🚫 Bloqueados (${kpis.blockedCount})` },
                      ] as { id: FilterTab; label: string }[]
                    ).map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveFilter(tab.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          activeFilter === tab.id
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-left text-sm">
                    <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th scope="col" className="px-4 py-3.5 font-bold">Família & Contato</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Engajamento & Uso</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Plano Atual</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Prazo (Teste / Assinatura)</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Status</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Ações Rápidas & CRM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredTenants.map(tenant => {
                        const familyId = String(tenant.id);
                        const isBlocked = Boolean(tenant.blocked_at);
                        const isAdminTenant = tenant.owner_email?.toLowerCase() === ADMIN_EMAIL;
                        const isUpdating = updatingTenant === familyId;
                        const plan: PlanType = tenant.plan_type || 'TRIAL';
                        const trialInfo = getTrialInfo(tenant);
                        const hotLead = isHotLead(tenant);
                        const txCount = Number(tenant.transactions_count || 0);
                        const cardsCount = Number(tenant.cards_count || 0);
                        const membersCount = Number(tenant.members_count || 1);

                        return (
                          <tr key={tenant.id} className="text-slate-200 hover:bg-slate-950/40 transition-colors">
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{tenant.name}</span>
                                {hotLead && (
                                  <span
                                    title="Família em período de teste usando ativamente o sistema"
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-300"
                                  >
                                    <Flame className="h-3 w-3" /> Lead Quente
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {tenant.owner_name || 'Não identificado'} •{' '}
                                <span className="text-slate-400">{tenant.owner_email || '—'}</span>
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                <span>Cad.: {formatRegistrationDate(tenant.registered_at)}</span>
                                {tenant.owner_phone && (
                                  <span className="text-emerald-400 font-semibold">📱 {tenant.owner_phone}</span>
                                )}
                              </div>
                              {tenant.admin_notes && (
                                <p className="mt-1.5 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-[11px] text-amber-200/90 max-w-xs truncate">
                                  📝 {tenant.admin_notes}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                                <span className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-300">
                                  👥 {membersCount} {membersCount === 1 ? 'membro' : 'membros'}
                                </span>
                                <span
                                  className={`rounded-lg border px-2 py-0.5 ${
                                    txCount > 0
                                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  📊 {txCount} lanç.
                                </span>
                                <span className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-300">
                                  💳 {cardsCount} cartões
                                </span>
                              </div>
                              <p className="mt-1.5 text-[11px] text-slate-400">
                                {tenant.last_transaction_date
                                  ? `Último lanç.: ${formatShortDate(tenant.last_transaction_date)}`
                                  : 'Nenhum lançamento ainda'}
                              </p>
                            </td>

                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              {isAdminTenant ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
                                  <Crown className="h-3.5 w-3.5" /> Admin Vitalício
                                </span>
                              ) : (
                                <div className="space-y-1.5">
                                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${PLAN_BADGE_CLASSES[plan]}`}>
                                    {PLAN_LABELS[plan]}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleQuickCommercialAction(
                                          tenant,
                                          { activate_cycle: 'MONTHLY' },
                                          `Plano Mensal (R$ 29,90) ativado para ${tenant.name}.`
                                        )
                                      }
                                      title="Ativar Plano Mensal (+30 dias)"
                                      className="rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                                    >
                                      +Mensal
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleQuickCommercialAction(
                                          tenant,
                                          { activate_cycle: 'ANNUAL' },
                                          `Plano Anual (R$ 298,80) ativado para ${tenant.name}.`
                                        )
                                      }
                                      title="Ativar Plano Anual (+1 ano)"
                                      className="rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                                    >
                                      +Anual
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              {isAdminTenant ? (
                                <span className="text-xs text-slate-400">Sem vencimento</span>
                              ) : (
                                <div className="space-y-1.5">
                                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${trialInfo.badgeClass}`}>
                                    {trialInfo.label}
                                  </span>
                                  {plan === 'TRIAL' && (
                                    <div>
                                      <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() =>
                                          handleQuickCommercialAction(
                                            tenant,
                                            { extend_trial_days: 5 },
                                            `+5 dias de teste liberados para ${tenant.name}.`
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-sky-500/20 hover:text-sky-300 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                                      >
                                        <CalendarPlus className="h-3 w-3" /> +5 dias de teste
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  isBlocked ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
                                }`}
                              >
                                {isBlocked ? 'Bloqueado' : 'Ativo'}
                              </span>
                            </td>

                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {!isAdminTenant && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setWhatsAppTenant(tenant)}
                                      title="Abordar cliente no WhatsApp com mensagem pronta"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                      WhatsApp
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openCrmModal(tenant)}
                                      title="Gerenciar Plano, Notas CRM e Senha"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                      CRM / Suporte
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  disabled={isUpdating || isAdminTenant}
                                  onClick={() => setTenantBlocked(tenant)}
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60 cursor-pointer ${
                                    isBlocked
                                      ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                                      : 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                                  }`}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isBlocked ? (
                                    <Unlock className="h-3.5 w-3.5" />
                                  ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                  )}
                                  {isAdminTenant ? 'Conta administrativa' : isBlocked ? 'Desbloquear' : 'Bloquear'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredTenants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                            Nenhum tenant encontrado para o filtro selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              /* ================= TABELA DE LEADS DO E-BOOK ================= */
              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                <div className="border-b border-slate-800 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={leadSearchTerm}
                        onChange={e => setLeadSearchTerm(e.target.value)}
                        placeholder="Buscar lead por nome, e-mail ou WhatsApp..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-xs font-semibold text-slate-400">
                      Exibindo <strong className="text-white">{filteredLeads.length}</strong> de{' '}
                      <strong className="text-white">{leads.length}</strong> leads captados
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { id: 'ALL', label: `Todos (${leads.length})` },
                        { id: 'NEW', label: `🆕 Novos (${leads.filter(l => l.status === 'NEW').length})` },
                        { id: 'CONTACTED', label: `💬 Contatados (${leads.filter(l => l.status === 'CONTACTED').length})` },
                        { id: 'REGISTERED', label: `✅ Criaram Conta (${kpis.registeredEbookLeadsCount})` },
                        { id: 'ARCHIVED', label: `📦 Arquivados (${leads.filter(l => l.status === 'ARCHIVED').length})` },
                      ] as { id: LeadFilterTab; label: string }[]
                    ).map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setLeadFilter(tab.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          leadFilter === tab.id
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th scope="col" className="px-4 py-3.5 font-bold">Lead & Contato</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Data & Downloads</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Cruzamento FinanFamily</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Status Comercial</th>
                        <th scope="col" className="px-4 py-3.5 font-bold">Ações de Conversão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredLeads.map(lead => {
                        const isUpdating = updatingLeadId === String(lead.id);
                        return (
                          <tr key={lead.id} className="text-slate-200 hover:bg-slate-950/40 transition-colors">
                            <td className="px-4 py-4 align-top">
                              <p className="font-bold text-white">{lead.name}</p>
                              <p className="text-xs text-slate-400">{lead.email}</p>
                              <p className="text-xs font-semibold text-emerald-400 mt-1">📱 {lead.whatsapp}</p>
                            </td>

                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              <p className="text-xs text-slate-200">{formatRegistrationDate(lead.created_at)}</p>
                              <span className="mt-1 inline-block rounded-lg bg-slate-950 border border-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                                📥 {lead.download_count}x baixado
                              </span>
                            </td>

                            <td className="px-4 py-4 align-top">
                              {lead.matched_family_id ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Já criou conta!
                                  </span>
                                  <p className="text-xs text-slate-300">
                                    {lead.matched_family_name} ({PLAN_LABELS[lead.matched_plan_type || 'TRIAL']})
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-xs font-bold text-amber-300">
                                  ⏳ Ainda não criou conta
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-4 align-top">
                              <select
                                value={lead.status}
                                disabled={isUpdating}
                                onChange={e =>
                                  handleUpdateLead(
                                    lead,
                                    { status: e.target.value as LeadStatus },
                                    `Status de ${lead.name} alterado para ${LEAD_STATUS_LABELS[e.target.value as LeadStatus]}.`
                                  )
                                }
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-500"
                              >
                                <option value="NEW">🆕 Novo Lead</option>
                                <option value="CONTACTED">💬 Contatado no WhatsApp</option>
                                <option value="CONVERTED">✅ Convertido em Cliente</option>
                                <option value="ARCHIVED">📦 Arquivado</option>
                              </select>
                            </td>

                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setWhatsAppLead(lead)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Chamar no WhatsApp
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleDeleteLead(lead)}
                                  title="Excluir lead"
                                  className="rounded-lg border border-rose-500/25 p-2 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                            Nenhum lead do e-book encontrado para o filtro selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL DE WHATSAPP PARA LEADS DO E-BOOK ================= */}
      {whatsAppLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-400">Converter Lead do E-book (10 Passos)</p>
                <h3 className="text-lg font-extrabold text-white">{whatsAppLead.name}</h3>
                <p className="text-xs text-slate-400">
                  {whatsAppLead.email} • 📱 {whatsAppLead.whatsapp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppLead(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                {
                  title: '1. Abordagem Consultiva Pós-Download do E-book',
                  text: `Olá ${whatsAppLead.name}! Tudo bem? Aqui é o Jefferson, fundador do FinanFamily. Vi que você acabou de baixar nosso E-book "10 Passos para Organizar a Vida Financeira da Família". Conseguiu abrir o material certinho?\n\nSe quiser colocar os 10 passos em prática sem precisar montar planilhas, você tem 10 dias de teste grátis liberados no FinanFamily!`,
                },
                {
                  title: '2. Convite Direto para Ativar os 10 Dias Grátis',
                  text: `Olá ${whatsAppLead.name}! Tudo bem? Passando para saber o que achou do guia dos 10 Passos Financeiros. Quer que eu te ajude a ativar seus 10 dias grátis no FinanFamily para testar o quadro Kanban de contas, controle de cartões e a projeção de 12 meses com sua família?`,
                },
                {
                  title: '3. Oferta Especial Plano Anual (12x R$ 24,90)',
                  text: `Olá ${whatsAppLead.name}! Como você baixou nosso guia oficial do FinanFamily, quero te convidar para testar a plataforma completa por 10 dias grátis. Após o teste, temos o Plano Mensal por R$ 29,90/mês ou o Plano Anual por R$ 298,80 (que fica apenas 12x de R$ 24,90 no cartão). Vamos começar seu teste gratuito hoje?`,
                },
              ].map(template => (
                <div
                  key={template.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{template.title}</span>
                    <a
                      href={buildWhatsAppUrl(whatsAppLead.whatsapp, template.text)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (whatsAppLead.status === 'NEW') {
                          handleUpdateLead(whatsAppLead, { status: 'CONTACTED' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar e Marcar Contatado
                    </a>
                  </div>
                  <p className="text-slate-400 leading-relaxed whitespace-pre-line">{template.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE TEMPLATES DE WHATSAPP (CLIENTES) ================= */}
      {whatsAppTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-400">Abordagem Comercial WhatsApp</p>
                <h3 className="text-lg font-extrabold text-white">{whatsAppTenant.name}</h3>
                <p className="text-xs text-slate-400">
                  Responsável: {whatsAppTenant.owner_name || 'Cliente'} ({whatsAppTenant.owner_phone || 'Sem telefone cadastrado'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppTenant(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                {
                  title: '1. Boas-vindas ao Teste Grátis (10 dias)',
                  text: `Olá ${whatsAppTenant.owner_name || ''}! Tudo bem? Aqui é o Jefferson, fundador do FinanFamily. Vi que você criou a conta da ${whatsAppTenant.name}. Seus 10 dias de teste grátis já estão liberados! Se precisar de qualquer ajuda para configurar suas contas, cartões ou convidar sua família, pode contar comigo.`,
                },
                {
                  title: '2. Reta Final dos 10 Dias de Teste',
                  text: `Olá ${whatsAppTenant.owner_name || ''}! Passando para lembrar que o período de teste grátis de 10 dias da ${whatsAppTenant.name} no FinanFamily está chegando ao fim. Gostaria de continuar com o Plano Mensal (R$ 29,90/mês) ou aproveitar o Plano Anual com desconto por R$ 298,80 (em até 12x de R$ 24,90 no cartão)?`,
                },
                {
                  title: '3. Teste de 10 Dias Encerrado (Oferta de Ativação)',
                  text: `Olá ${whatsAppTenant.owner_name || ''}! O período de avaliação gratuita de 10 dias do FinanFamily encerrou. Para manter o painel da ${whatsAppTenant.name} ativo sem perder seus lançamentos, você pode escolher:\n• Plano Mensal: R$ 29,90/mês\n• Plano Anual: R$ 298,80/ano (12x de R$ 24,90 no cartão)\nQual opção prefere para eu gerar seu link de pagamento?`,
                },
                {
                  title: '4. Lembrete de Renovação de Assinatura',
                  text: `Olá ${whatsAppTenant.owner_name || ''}! Tudo bem? Passando para avisar que a assinatura do FinanFamily da ${whatsAppTenant.name} está próxima da renovação. Posso enviar o link/Pix para mantermos seu acesso ativo?`,
                },
              ].map(template => (
                <div
                  key={template.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{template.title}</span>
                    <a
                      href={buildWhatsAppUrl(whatsAppTenant.owner_phone, template.text)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar no WhatsApp
                    </a>
                  </div>
                  <p className="text-slate-400 leading-relaxed whitespace-pre-line">{template.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CRM / SUPORTE DA FAMÍLIA ================= */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-400">Ficha Comercial & Suporte</p>
                <h3 className="text-xl font-extrabold text-white">{selectedTenant.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedTenant.owner_name} • {selectedTenant.owner_email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveCrmDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Plano Comercial
                  </label>
                  <select
                    value={crmPlanType}
                    onChange={e => setCrmPlanType(e.target.value as PlanType)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="TRIAL">Teste Grátis (10 dias)</option>
                    <option value="MONTHLY">Plano Mensal (R$ 29,90/mês)</option>
                    <option value="ANNUAL">Plano Anual (R$ 298,80/ano)</option>
                    <option value="COURTESY">Cortesia / Parceiro (Isento)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    WhatsApp / Telefone do Cliente
                  </label>
                  <input
                    type="tel"
                    maxLength={30}
                    value={crmOwnerPhone}
                    onChange={e => setCrmOwnerPhone(e.target.value)}
                    placeholder="(41) 99999-9999"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Fim do Teste Grátis
                  </label>
                  <input
                    type="date"
                    value={crmTrialEndsAt}
                    onChange={e => setCrmTrialEndsAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Vencimento da Assinatura Paga
                  </label>
                  <input
                    type="date"
                    value={crmSubscriptionEndsAt}
                    onChange={e => setCrmSubscriptionEndsAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Anotações Internas (CRM / Pagamentos / Histórico)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={crmAdminNotes}
                  onChange={e => setCrmAdminNotes(e.target.value)}
                  placeholder="Ex.: Pagou plano anual no cartão em 21/10. Cliente veio por indicação..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCrm}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 cursor-pointer"
                >
                  {savingCrm ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Salvar Dados Comerciais
                </button>
              </div>
            </form>

            {/* Suporte: Redefinição de Senha do Cliente */}
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-300 mb-2">
                <KeyRound className="h-4 w-4" />
                <span>Suporte Rápido: Definir Senha Temporária</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Caso o responsável ({selectedTenant.owner_email}) não consiga acessar, defina uma senha provisória abaixo:
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={e => setTempPassword(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  disabled={resettingPassword || tempPassword.trim().length < 6}
                  onClick={handleResetOwnerPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs font-extrabold text-amber-300 hover:bg-amber-500/25 disabled:opacity-50 cursor-pointer"
                >
                  {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Redefinir Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
