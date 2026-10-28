'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CalendarClock,
  Tag,
  Car,
  FileCheck2,
  ShieldCheck,
  PieChart,
  Share2,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import { DashboardModule, formatCurrency, formatDatePT, getLocalTodayKey } from './dashboardUtils';

interface UnifiedAlertsBellProps {
  accounts: any[];
  categories: any[];
  transactions: any[];
  canReadFamily: boolean;
  onNavigateModule: (module: DashboardModule, subMenu: string) => void;
}

interface UnifiedAlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'BILL' | 'BUDGET' | 'BENEFIT' | 'VEHICLE' | 'CONTRACT' | 'WARRANTY';
  title: string;
  subtitle: string;
  badgeText: string;
  targetModule: DashboardModule;
  targetSubMenu: string;
}

function diffDaysFromToday(dateStr: string | null | undefined, todayKey: string): number | null {
  if (!dateStr) return null;
  const clean = String(dateStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const [y1, m1, d1] = todayKey.split('-').map(Number);
  const [y2, m2, d2] = clean.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

export default function UnifiedAlertsBell({
  accounts,
  categories,
  transactions,
  canReadFamily,
  onNavigateModule,
}: UnifiedAlertsBellProps) {
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadExtraModules = useCallback(async () => {
    if (!canReadFamily) return;
    setLoadingExtra(true);
    try {
      const [vehRes, houseRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/vehicles/overview`).catch(() => null),
        authenticatedFetch(`${API_URL}/api/household/overview`).catch(() => null),
      ]);

      if (vehRes && vehRes.ok) {
        const vehData = await vehRes.json().catch(() => ({}));
        if (Array.isArray(vehData.vehicles)) setVehicles(vehData.vehicles);
      }
      if (houseRes && houseRes.ok) {
        const houseData = await houseRes.json().catch(() => ({}));
        if (Array.isArray(houseData.contracts)) setContracts(houseData.contracts);
        if (Array.isArray(houseData.warranties)) setWarranties(houseData.warranties);
      }
    } finally {
      setLoadingExtra(false);
    }
  }, [canReadFamily]);

  useEffect(() => {
    void loadExtraModules();
  }, [loadExtraModules]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const todayKey = getLocalTodayKey();
  const currentYearMonth = todayKey.slice(0, 7);

  const {
    alerts,
    overdueBills,
    upcoming7dBills,
    benefitCardsSummary,
    whatsappMessage,
  } = useMemo(() => {
    const items: UnifiedAlertItem[] = [];

    // 1. Contas atrasadas e vencendo nos próximos 7 dias
    const unpaidExpenses = transactions.filter(
      tx => tx.type === 'EXPENSE' && tx.status !== 'PAID' && tx.due_date
    );

    const overdue = unpaidExpenses.filter(tx => {
      const diff = diffDaysFromToday(tx.due_date, todayKey);
      return diff !== null && diff < 0;
    });

    const upcoming7d = unpaidExpenses
      .filter(tx => {
        const diff = diffDaysFromToday(tx.due_date, todayKey);
        return diff !== null && diff >= 0 && diff <= 7;
      })
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));

    if (overdue.length > 0) {
      const overdueSum = overdue.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
      items.push({
        id: 'bills-overdue',
        severity: 'critical',
        category: 'BILL',
        title: `${overdue.length} conta(s) em atraso`,
        subtitle: `Total pendente: ${formatCurrency(overdueSum)} • Clique para regularizar`,
        badgeText: 'Atrasado',
        targetModule: 'pagar',
        targetSubMenu: 'contas_pagar',
      });
    }

    if (upcoming7d.length > 0) {
      const upcomingSum = upcoming7d.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
      const dueTodayCount = upcoming7d.filter(
        tx => String(tx.due_date).slice(0, 10) === todayKey
      ).length;
      items.push({
        id: 'bills-upcoming-7d',
        severity: dueTodayCount > 0 ? 'critical' : 'warning',
        category: 'BILL',
        title:
          dueTodayCount > 0
            ? `${dueTodayCount} conta(s) vencem HOJE (+${upcoming7d.length - dueTodayCount} na semana)`
            : `${upcoming7d.length} conta(s) vencem nos próximos 7 dias`,
        subtitle: `Total da semana: ${formatCurrency(upcomingSum)}`,
        badgeText: dueTodayCount > 0 ? 'Vence hoje' : 'Próx. 7 dias',
        targetModule: 'pagar',
        targetSubMenu: 'contas_pagar',
      });
    }

    // 2. Categorias com meta de gastos >= 80% no mês atual
    const expenseCategoriesWithBudget = categories.filter(
      cat => cat.flow_type === 'EXPENSE' && Number(cat.monthly_budget || 0) > 0
    );
    for (const cat of expenseCategoriesWithBudget) {
      const budget = Number(cat.monthly_budget || 0);
      const spentThisMonth = transactions
        .filter(
          tx =>
            tx.type === 'EXPENSE' &&
            String(tx.category_id) === String(cat.id) &&
            String(tx.due_date || '').slice(0, 7) === currentYearMonth
        )
        .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
      const pct = Math.round((spentThisMonth / budget) * 100);
      if (pct >= 80) {
        items.push({
          id: `budget-${cat.id}`,
          severity: pct >= 100 ? 'critical' : 'warning',
          category: 'BUDGET',
          title: `Meta de "${cat.name}" em ${pct}%`,
          subtitle: `${formatCurrency(spentThisMonth)} de ${formatCurrency(budget)} no mês`,
          badgeText: pct >= 100 ? 'Teto estourado' : `${pct}% da meta`,
          targetModule: 'cadastros',
          targetSubMenu: 'geral',
        });
      }
    }

    // 3. Saldo de Vales & Benefícios (Caju, Flash, VR/VA) + ritmo diário
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDaysInMonth = Math.max(1, lastDayOfMonth - now.getDate() + 1);
    const benefitCards = accounts.filter(acc => acc.account_type === 'BENEFIT_CARD');
    const benefitSummaries: Array<{
      name: string;
      balance: number;
      dailyAllowance: number;
      lowBalance: boolean;
    }> = [];

    for (const card of benefitCards) {
      const balance = Number(card.balance || 0);
      const recharge = Number(card.monthly_recharge_amount || 0);
      const dailyAllowance = balance > 0 ? balance / remainingDaysInMonth : 0;
      const lowBalance = balance <= 120 || (recharge > 0 && balance / recharge <= 0.2);

      benefitSummaries.push({
        name: card.name,
        balance,
        dailyAllowance,
        lowBalance,
      });

      items.push({
        id: `benefit-${card.id}`,
        severity: lowBalance ? 'warning' : 'info',
        category: 'BENEFIT',
        title: `Vale ${card.name}: ${formatCurrency(balance)} livre`,
        subtitle: `Ritmo sugerido até o fim do mês: ${formatCurrency(dailyAllowance)}/dia`,
        badgeText: lowBalance ? 'Saldo baixo' : 'Vale ativo',
        targetModule: 'cadastros',
        targetSubMenu: 'contas',
      });
    }

    // 4. Veículos da família (Revisão / óleo por KM ou data, e renovação de seguro)
    for (const v of vehicles) {
      if (v.status && v.status !== 'ACTIVE') continue;
      const odo = Number(v.current_odometer || 0);
      const nextRevKm = v.next_revision_km !== null && v.next_revision_km !== undefined ? Number(v.next_revision_km) : null;
      if (nextRevKm !== null && nextRevKm > 0) {
        const kmRemaining = nextRevKm - odo;
        if (kmRemaining <= 1000) {
          items.push({
            id: `veh-km-${v.id}`,
            severity: kmRemaining <= 0 ? 'critical' : 'warning',
            category: 'VEHICLE',
            title: `${v.nickname}: Revisão / Óleo ${kmRemaining <= 0 ? 'vencida por KM' : `em ${kmRemaining.toLocaleString('pt-BR')} km`}`,
            subtitle: `Hodômetro atual: ${odo.toLocaleString('pt-BR')} km • Meta: ${nextRevKm.toLocaleString('pt-BR')} km`,
            badgeText: kmRemaining <= 0 ? 'Revisão imediata' : 'Próx. revisão',
            targetModule: 'veiculos',
            targetSubMenu: 'frota',
          });
        }
      }

      const revDays = diffDaysFromToday(v.next_revision_date, todayKey);
      if (revDays !== null && revDays <= 30) {
        items.push({
          id: `veh-date-${v.id}`,
          severity: revDays < 0 ? 'critical' : 'warning',
          category: 'VEHICLE',
          title: `${v.nickname}: Revisão agendada para ${formatDatePT(v.next_revision_date)}`,
          subtitle: revDays < 0 ? `Prazo vencido há ${Math.abs(revDays)} dia(s)` : `Faltam ${revDays} dia(s)`,
          badgeText: 'Oficina',
          targetModule: 'veiculos',
          targetSubMenu: 'manutencoes',
        });
      }

      const insDays = diffDaysFromToday(v.insurance_renewal_date, todayKey);
      if (insDays !== null && insDays <= 30) {
        items.push({
          id: `veh-ins-${v.id}`,
          severity: insDays <= 7 ? 'critical' : 'warning',
          category: 'VEHICLE',
          title: `Seguro de ${v.nickname} renova em ${formatDatePT(v.insurance_renewal_date)}`,
          subtitle: `${v.insurance_provider || 'Seguradora'} • ${insDays < 0 ? 'Vencido' : `Em ${insDays} dia(s)`}`,
          badgeText: 'Seguro Auto',
          targetModule: 'veiculos',
          targetSubMenu: 'frota',
        });
      }
    }

    // 5. Contratos & Garantias da Casa
    for (const c of contracts) {
      if (c.status && c.status !== 'ACTIVE') continue;
      const renDays = diffDaysFromToday(c.renewal_date, todayKey);
      if (renDays !== null && renDays >= -7 && renDays <= 30) {
        items.push({
          id: `contract-${c.id}`,
          severity: renDays <= 7 ? 'warning' : 'info',
          category: 'CONTRACT',
          title: `Renovação de "${c.title}" em ${formatDatePT(c.renewal_date)}`,
          subtitle: `Valor atual: ${formatCurrency(Number(c.amount || 0))} • Bom momento para renegociar`,
          badgeText: renDays < 0 ? 'Renovado' : `Em ${renDays}d`,
          targetModule: 'contratos',
          targetSubMenu: 'assinaturas',
        });
      }
    }

    for (const w of warranties) {
      const expDays = diffDaysFromToday(w.warranty_expires_at, todayKey);
      if (expDays !== null && expDays >= 0 && expDays <= 30) {
        items.push({
          id: `warranty-${w.id}`,
          severity: expDays <= 7 ? 'warning' : 'info',
          category: 'WARRANTY',
          title: `Garantia de "${w.product_name}" expira em ${expDays} dia(s)`,
          subtitle: `Válida até ${formatDatePT(w.warranty_expires_at)} (${w.store_name || 'Nota arquivada'})`,
          badgeText: 'Garantia',
          targetModule: 'contratos',
          targetSubMenu: 'garantias',
        });
      }
    }

    // Ordenar: critical -> warning -> info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Construir mensagem de Agenda da Semana para WhatsApp da Família
    const lines: string[] = [];
    lines.push('📅 *Agenda Financeira da Semana — FinanFamily*');
    lines.push('');

    if (overdue.length > 0) {
      const overdueTotal = overdue.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
      lines.push(`🚨 *Atenção — ${overdue.length} conta(s) em atraso (${formatCurrency(overdueTotal)}):*`);
      overdue.slice(0, 5).forEach(tx => {
        lines.push(`• ${tx.description}: *${formatCurrency(Number(tx.amount || 0))}* (venceu ${formatDatePT(tx.due_date)})`);
      });
      lines.push('');
    }

    if (upcoming7d.length > 0) {
      const weekTotal = upcoming7d.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
      lines.push(`📌 *Vencimentos dos próximos 7 dias (${formatCurrency(weekTotal)}):*`);
      upcoming7d.slice(0, 8).forEach(tx => {
        const isToday = String(tx.due_date).slice(0, 10) === todayKey;
        lines.push(
          `• ${isToday ? '🔴 *HOJE*' : formatDatePT(tx.due_date)} — ${tx.description}: *${formatCurrency(
            Number(tx.amount || 0)
          )}*`
        );
      });
      if (upcoming7d.length > 8) {
        lines.push(`• _...e mais ${upcoming7d.length - 8} lançamento(s)_`);
      }
      lines.push('');
    } else {
      lines.push('✅ *Nenhuma conta pendente vencendo nos próximos 7 dias!*');
      lines.push('');
    }

    if (benefitSummaries.length > 0) {
      lines.push('🥗 *Saldo nos Vales & Benefícios:*');
      benefitSummaries.forEach(b => {
        lines.push(
          `• ${b.name}: *${formatCurrency(b.balance)}* (${formatCurrency(b.dailyAllowance)}/dia até o fim do mês)`
        );
      });
      lines.push('');
    }

    const extraAlerts = items.filter(i => i.category !== 'BILL' && i.category !== 'BENEFIT');
    if (extraAlerts.length > 0) {
      lines.push('🔔 *Lembretes da Casa, Metas & Veículos:*');
      extraAlerts.slice(0, 5).forEach(alert => {
        lines.push(`• ${alert.title} (${alert.subtitle})`);
      });
      lines.push('');
    }

    lines.push('_Gerado em 1 clique pelo nosso painel FinanFamily_ 💚');

    return {
      alerts: items,
      overdueBills: overdue,
      upcoming7dBills: upcoming7d,
      benefitCardsSummary: benefitSummaries,
      whatsappMessage: lines.join('\n'),
    };
  }, [accounts, categories, contracts, currentYearMonth, todayKey, transactions, vehicles, warranties]);

  const urgentCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;
  const totalBadgeCount = urgentCount > 0 ? urgentCount : alerts.length;

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const renderCategoryIcon = (cat: UnifiedAlertItem['category'], severity: UnifiedAlertItem['severity']) => {
    const colorClass =
      severity === 'critical'
        ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
        : severity === 'warning'
          ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
          : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';

    const IconComponent =
      cat === 'BILL'
        ? CalendarClock
        : cat === 'BUDGET'
          ? PieChart
          : cat === 'BENEFIT'
            ? Tag
            : cat === 'VEHICLE'
              ? Car
              : cat === 'CONTRACT'
                ? FileCheck2
                : ShieldCheck;

    return (
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
        <IconComponent className="w-4 h-4" />
      </div>
    );
  };

  if (!canReadFamily) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void loadExtraModules();
        }}
        title="Central de Alertas da Família & Agenda no WhatsApp"
        aria-label="Abrir central de alertas da família"
        className={`relative rounded-xl p-2 sm:p-2.5 border transition-all cursor-pointer flex items-center justify-center ${
          open
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : urgentCount > 0
              ? 'bg-slate-800/90 border-amber-500/30 text-amber-300 hover:bg-slate-800'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Bell className="w-5 h-5" />
        {totalBadgeCount > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-extrabold flex items-center justify-center border shadow-md ${
              alerts.some(a => a.severity === 'critical')
                ? 'bg-rose-500 text-white border-slate-950'
                : urgentCount > 0
                  ? 'bg-amber-400 text-slate-950 border-slate-950'
                  : 'bg-emerald-500 text-slate-950 border-slate-950'
            }`}
          >
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-13 w-[calc(100vw-1rem)] sm:w-[430px] max-h-[82vh] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white leading-tight">
                  Radar da Família & Agenda
                </h3>
                <p className="text-[11px] text-slate-400">
                  Contas, Orçamentos, Vales, Frota, Contratos & Garantias
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void loadExtraModules()}
                title="Atualizar alertas"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingExtra ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar central de alertas"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resumo Rápido em Pílulas */}
          <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próx. 7 Dias</p>
              <p className="text-xs font-extrabold text-white mt-0.5">
                {upcoming7dBills.length} conta(s)
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Em Atraso</p>
              <p
                className={`text-xs font-extrabold mt-0.5 ${
                  overdueBills.length > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {overdueBills.length > 0 ? `${overdueBills.length} pendente(s)` : 'Zero atrasos'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vales Ativos</p>
              <p className="text-xs font-extrabold text-amber-300 mt-0.5">
                {benefitCardsSummary.length > 0
                  ? formatCurrency(benefitCardsSummary.reduce((acc, b) => acc + b.balance, 0))
                  : '—'}
              </p>
            </div>
          </div>

          {/* Lista de Alertas */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">Tudo em dia na família!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Nenhuma conta vencendo nos próximos 7 dias, orçamento estourado ou manutenção urgente.
                </p>
              </div>
            ) : (
              alerts.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigateModule(item.targetModule, item.targetSubMenu);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800/60 transition-colors flex items-start gap-3 cursor-pointer group"
                >
                  {renderCategoryIcon(item.category, item.severity)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          item.severity === 'critical'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : item.severity === 'warning'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 mt-2" />
                </button>
              ))
            )}
          </div>

          {/* Rodapé: Agenda da Semana no WhatsApp do Casal / Família */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Agenda da Semana para o Casal / Família
              </span>
              <span className="text-[11px] text-slate-400">1 clique</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4" />
                Mandar no WhatsApp da Família
              </button>
              <button
                type="button"
                onClick={() => void handleCopyWhatsApp()}
                title="Copiar texto do resumo da semana"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
