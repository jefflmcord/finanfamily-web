'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  PiggyBank,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';

type ExpenseType = 'IPTU' | 'IPVA' | 'LICENCIAMENTO' | 'OTHER';
type ProvisionStatus = 'ACTIVE' | 'PAID';

interface Contribution {
  id: number | string;
  amount: number | string;
  contribution_date: string;
}

interface AnnualProvision {
  id: number | string;
  title: string;
  expense_type: ExpenseType;
  target_amount: number | string;
  saved_amount: number | string;
  due_date: string;
  status: ProvisionStatus;
  actual_amount?: number | string | null;
  paid_date?: string | null;
  renewed_from_id?: number | string | null;
  renewed_provision_id?: number | string | null;
  contributions: Contribution[];
}

interface AnnualProvisionsManagerProps {
  canManage: boolean;
}

type ProvisionAction = 'contribution' | 'settle' | 'renew';

const EXPENSE_TYPE_OPTIONS: { value: ExpenseType; label: string }[] = [
  { value: 'IPTU', label: 'IPTU' },
  { value: 'IPVA', label: 'IPVA' },
  { value: 'LICENCIAMENTO', label: 'Licenciamento' },
  { value: 'OTHER', label: 'Outra despesa anual' },
];

const todayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const nextYearDueDate = (dueDateStr: string) => {
  const [year, month, day] = dueDateStr.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return todayDate();
  const today = todayDate();
  let nextYear = year + 1;
  let candidate = '';
  do {
    const lastDay = new Date(Date.UTC(nextYear, month, 0)).getUTCDate();
    candidate = new Date(Date.UTC(nextYear, month - 1, Math.min(day, lastDay)))
      .toISOString()
      .slice(0, 10);
    nextYear += 1;
  } while (candidate <= today);
  return candidate;
};

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const getExpenseTypeLabel = (type: ExpenseType) =>
  EXPENSE_TYPE_OPTIONS.find(option => option.value === type)?.label || 'Despesa anual';

function isExpenseType(value: unknown): value is ExpenseType {
  return typeof value === 'string' && EXPENSE_TYPE_OPTIONS.some(option => option.value === value);
}

function isNumericValue(value: unknown): value is number | string {
  return typeof value === 'number' || (typeof value === 'string' && Number.isFinite(Number(value)));
}

function isContribution(value: unknown): value is Contribution {
  if (typeof value !== 'object' || value === null) return false;
  const contribution = value as Record<string, unknown>;
  return (typeof contribution.id === 'number' || typeof contribution.id === 'string') &&
    isNumericValue(contribution.amount) &&
    typeof contribution.contribution_date === 'string';
}

function isAnnualProvision(value: unknown): value is AnnualProvision {
  if (typeof value !== 'object' || value === null) return false;
  const provision = value as Record<string, unknown>;
  return (typeof provision.id === 'number' || typeof provision.id === 'string') &&
    typeof provision.title === 'string' &&
    isExpenseType(provision.expense_type) &&
    isNumericValue(provision.target_amount) &&
    isNumericValue(provision.saved_amount) &&
    typeof provision.due_date === 'string' &&
    (provision.status === 'ACTIVE' || provision.status === 'PAID') &&
    Array.isArray(provision.contributions) &&
    provision.contributions.every(isContribution);
}

function getMonthsAvailable(dueDate: string): number {
  const [year, month, day] = dueDate.slice(0, 10).split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (due < todayStart) return 0;
  return Math.max(1, (year - today.getFullYear()) * 12 + month - (today.getMonth() + 1) + 1);
}

function getMonthlySuggestion(target: number, saved: number, dueDate: string): number | null {
  const remaining = Math.max(0, target - saved);
  const months = getMonthsAvailable(dueDate);
  if (remaining === 0 || months === 0) return null;
  return Math.ceil((remaining / months) * 100) / 100;
}

export default function AnnualProvisionsManager({ canManage }: AnnualProvisionsManagerProps) {
  const [provisions, setProvisions] = useState<AnnualProvision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProvision, setEditingProvision] = useState<AnnualProvision | null>(null);
  const [title, setTitle] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('IPTU');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [activeAction, setActiveAction] = useState<{
    type: ProvisionAction;
    provision: AnnualProvision;
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionDate, setActionDate] = useState(todayDate);
  const [openRenewAfterSettle, setOpenRenewAfterSettle] = useState(true);
  const [deletingProvision, setDeletingProvision] = useState<AnnualProvision | null>(null);

  const fetchProvisions = useCallback(async () => {
    const response = await authenticatedFetch(`${API_URL}/api/annual-provisions`);
    const data: unknown = await response.json();
    if (!response.ok) {
      const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Não foi possível carregar as provisões anuais.';
      throw new Error(message);
    }
    if (!Array.isArray(data) || !data.every(isAnnualProvision)) {
      throw new Error('A resposta da API de provisões anuais é inválida.');
    }
    return data;
  }, []);

  const loadProvisions = useCallback(async () => {
    try {
      setProvisions(await fetchProvisions());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar as provisões anuais.');
    } finally {
      setLoading(false);
    }
  }, [fetchProvisions]);

  useEffect(() => {
    let isMounted = true;
    void fetchProvisions()
      .then(data => {
        if (isMounted) setProvisions(data);
      })
      .catch(loadError => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar as provisões anuais.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchProvisions]);

  const activeProvisions = useMemo(
    () => provisions.filter(provision => provision.status === 'ACTIVE'),
    [provisions]
  );
  const paidProvisions = useMemo(
    () => provisions.filter(provision => provision.status === 'PAID'),
    [provisions]
  );

  const totalTarget = activeProvisions.reduce((sum, provision) => sum + Number(provision.target_amount || 0), 0);
  const totalSaved = activeProvisions.reduce((sum, provision) => sum + Number(provision.saved_amount || 0), 0);
  const totalRemaining = activeProvisions.reduce(
    (sum, provision) => sum + Math.max(0, Number(provision.target_amount || 0) - Number(provision.saved_amount || 0)),
    0
  );
  const globalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const totalMonthlySuggestion = activeProvisions.reduce((sum, provision) => {
    const suggestion = getMonthlySuggestion(
      Number(provision.target_amount),
      Number(provision.saved_amount),
      provision.due_date
    );
    return sum + (suggestion || 0);
  }, 0);

  const previousPaidProvision = useMemo(() => {
    const normalizedTitle = title.trim().toLocaleLowerCase('pt-BR');
    const candidates = paidProvisions
      .filter(provision =>
        provision.expense_type === expenseType &&
        Number(provision.actual_amount ?? provision.target_amount) > 0
      )
      .sort((a, b) => b.due_date.localeCompare(a.due_date));

    if (normalizedTitle) {
      const exactMatch = candidates.find(
        provision => provision.title.trim().toLocaleLowerCase('pt-BR') === normalizedTitle
      );
      if (exactMatch) return exactMatch;
    }
    return candidates[0] ?? null;
  }, [expenseType, paidProvisions, title]);

  function resetForm() {
    setFormOpen(false);
    setEditingProvision(null);
    setTitle('');
    setExpenseType('IPTU');
    setTargetAmount('');
    setDueDate('');
  }

  function openCreateForm() {
    setError('');
    setNotice('');
    setEditingProvision(null);
    setTitle('');
    setExpenseType('IPTU');
    setTargetAmount('');
    setDueDate('');
    setFormOpen(true);
  }

  function openEditForm(provision: AnnualProvision) {
    setError('');
    setNotice('');
    setEditingProvision(provision);
    setTitle(provision.title);
    setExpenseType(provision.expense_type);
    setTargetAmount(String(provision.target_amount));
    setDueDate(provision.due_date.slice(0, 10));
    setFormOpen(true);
  }

  async function saveProvision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await authenticatedFetch(
        editingProvision
          ? `${API_URL}/api/annual-provisions/${editingProvision.id}`
          : `${API_URL}/api/annual-provisions`,
        {
          method: editingProvision ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            expense_type: expenseType,
            target_amount: Number(targetAmount),
            due_date: dueDate,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar a provisão.');
      resetForm();
      setNotice(editingProvision ? 'Provisão atualizada.' : 'Provisão anual criada.');
      await loadProvisions();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar a provisão.');
    } finally {
      setSaving(false);
    }
  }

  function openAction(type: ProvisionAction, provision: AnnualProvision) {
    setError('');
    setNotice('');
    if (type === 'settle') {
      setActionAmount(String(provision.target_amount));
      setActionDate(todayDate());
      setOpenRenewAfterSettle(true);
    } else if (type === 'renew') {
      setActionAmount(String(provision.actual_amount ?? provision.target_amount));
      setActionDate(nextYearDueDate(provision.due_date));
    } else {
      const suggestion = getMonthlySuggestion(
        Number(provision.target_amount),
        Number(provision.saved_amount),
        provision.due_date
      );
      setActionAmount(suggestion ? String(suggestion) : '');
      setActionDate(todayDate());
    }
    setActiveAction({ type, provision });
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAction) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (activeAction.type === 'contribution') {
        const response = await authenticatedFetch(
          `${API_URL}/api/annual-provisions/${activeAction.provision.id}/contributions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number(actionAmount), contribution_date: actionDate }),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível registrar a reserva.');
        setActiveAction(null);
        setNotice('Valor reservado registrado.');
        await loadProvisions();
        return;
      }

      if (activeAction.type === 'settle') {
        const paidAmountNum = Number(actionAmount);
        const response = await authenticatedFetch(
          `${API_URL}/api/annual-provisions/${activeAction.provision.id}/settle`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual_amount: paidAmountNum, paid_date: actionDate }),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível registrar o pagamento.');

        const settledProvision: AnnualProvision = {
          ...activeAction.provision,
          status: 'PAID',
          actual_amount: paidAmountNum,
          paid_date: actionDate,
        };
        await loadProvisions();

        if (openRenewAfterSettle) {
          setNotice('Pagamento registrado! Confira abaixo a sugestão para renovar o próximo ciclo anual.');
          setActionAmount(String(paidAmountNum));
          setActionDate(nextYearDueDate(activeAction.provision.due_date));
          setActiveAction({ type: 'renew', provision: settledProvision });
        } else {
          setActiveAction(null);
          setNotice('Pagamento registrado e provisão concluída.');
        }
        return;
      }

      if (activeAction.type === 'renew') {
        const response = await authenticatedFetch(
          `${API_URL}/api/annual-provisions/${activeAction.provision.id}/renew`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_amount: Number(actionAmount),
              due_date: actionDate,
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível renovar a provisão.');
        setActiveAction(null);
        setNotice(`Nova provisão anual criada para ${formatDate(data.due_date)} com meta de ${formatCurrency(data.target_amount)}.`);
        await loadProvisions();
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Erro ao registrar a operação.');
    } finally {
      setSaving(false);
    }
  }

  async function removeContribution(provisionId: number | string, contributionId: number | string) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/annual-provisions/${provisionId}/contributions/${contributionId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível remover a reserva.');
      setNotice('Registro de reserva removido.');
      await loadProvisions();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Erro ao remover a reserva.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteProvision() {
    if (!deletingProvision) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/annual-provisions/${deletingProvision.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir a provisão.');
      setDeletingProvision(null);
      setNotice('Provisão anual excluída.');
      await loadProvisions();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir a provisão.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Provisões anuais</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Planeje IPTU, IPVA, licenciamento e outras cobranças previsíveis, reservando um pouco por mês para pagar à vista com tranquilidade.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateForm}
            className="flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-emerald-400"
          >
            <Plus className="h-5 w-5" /> Nova provisão
          </button>
        )}
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-sky-100">
        <PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
        <p>
          As reservas registradas aqui ficam separadas como acompanhamento de meta: <strong>não reduzem o saldo disponível das contas nem entram como despesa de consumo</strong>, evitando contar o dinheiro duas vezes no orçamento.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wide">Total-alvo ativo</p>
            <Target className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{formatCurrency(totalTarget)}</p>
          <p className="mt-1 text-xs text-slate-500">{activeProvisions.length} provisão(ões) em andamento</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wide">Já reservado</p>
            <PiggyBank className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{formatCurrency(totalSaved)}</p>
          <p className="mt-1 text-xs text-slate-500">Soma dos valores guardados nas metas ativas</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wide">Saldo restante</p>
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-300">{formatCurrency(totalRemaining)}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${globalProgress}%` }} />
            </div>
            <span className="text-xs font-bold text-indigo-300">{globalProgress}%</span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wide">Sugestão mensal</p>
            <CalendarDays className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-300">{formatCurrency(totalMonthlySuggestion)}</p>
          <p className="mt-1 text-xs text-slate-500">Reserva mensal recomendada até os vencimentos</p>
        </article>
      </section>

      {formOpen && canManage && (
        <form onSubmit={saveProvision} className="space-y-4 rounded-3xl border border-emerald-500/25 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-white">{editingProvision ? 'Editar provisão' : 'Nova provisão anual'}</h3>
              <p className="mt-1 text-xs text-slate-400">
                Escolha o tipo de despesa, informe quando costuma vencer e defina o valor estimado (você pode ajustá-lo a qualquer momento, inclusive se decidir parcelar).
              </p>
            </div>
            <button type="button" onClick={resetForm} aria-label="Fechar formulário" className="rounded-lg p-1 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Tipo de despesa</span>
              <select
                required
                value={expenseType}
                onChange={event => {
                  const selectedOption = EXPENSE_TYPE_OPTIONS.find(option => option.value === event.target.value);
                  if (selectedOption) setExpenseType(selectedOption.value);
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
              >
                {EXPENSE_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Identificação</span>
              <input
                required
                maxLength={120}
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Ex.: IPTU da casa, IPVA do carro"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Valor estimado (R$)</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={targetAmount}
                onChange={event => setTargetAmount(event.target.value)}
                placeholder="Ex.: 1200,00"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
              />
              {previousPaidProvision && !editingProvision && (
                <button
                  type="button"
                  onClick={() => {
                    const suggestedVal = previousPaidProvision.actual_amount ?? previousPaidProvision.target_amount;
                    setTargetAmount(String(suggestedVal));
                    if (!title.trim()) {
                      setTitle(previousPaidProvision.title);
                    }
                    if (!dueDate && previousPaidProvision.due_date) {
                      setDueDate(nextYearDueDate(previousPaidProvision.due_date));
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-left text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Sugestão do ano anterior ({previousPaidProvision.title}):{' '}
                    <strong>{formatCurrency(previousPaidProvision.actual_amount ?? previousPaidProvision.target_amount)}</strong> — usar como ponto de partida
                  </span>
                </button>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Vencimento</span>
              <input
                required
                type="date"
                min={todayDate()}
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
              />
            </label>
          </div>
          {targetAmount && dueDate && Number(targetAmount) > 0 && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200">
              Sugestão mensal: <strong>{formatCurrency(getMonthlySuggestion(Number(targetAmount), editingProvision ? Number(editingProvision.saved_amount) : 0, dueDate) || 0)} por mês</strong> ({getMonthsAvailable(dueDate)} mês(es) até o vencimento).
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="min-h-11 rounded-xl px-4 font-semibold text-slate-300 hover:bg-slate-800">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 font-bold text-slate-950 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {editingProvision ? 'Salvar alterações' : 'Criar provisão'}
            </button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-amber-300" />
          <h3 className="text-lg font-bold text-white">Em andamento</h3>
        </div>
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900 p-10">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        ) : activeProvisions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <PiggyBank className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 font-bold text-white">Nenhuma provisão ativa</p>
            <p className="mt-1 text-sm text-slate-400">Cadastre uma despesa anual para começar a acompanhar sua meta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {activeProvisions.map(provision => {
              const target = Number(provision.target_amount);
              const saved = Number(provision.saved_amount);
              const remaining = Math.max(0, target - saved);
              const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
              const monthsLeft = getMonthsAvailable(provision.due_date);
              const monthlySuggestion = getMonthlySuggestion(target, saved, provision.due_date);
              const overdue = monthsLeft === 0;
              return (
                <article key={provision.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-300">{getExpenseTypeLabel(provision.expense_type)}</span>
                      <h4 className="mt-1 text-lg font-bold text-white">{provision.title}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <>
                          <button type="button" onClick={() => openEditForm(provision)} aria-label={`Editar ${provision.title}`} title="Editar provisão" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setDeletingProvision(provision)} aria-label={`Excluir ${provision.title}`} title="Excluir provisão" className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <CalendarDays className="ml-1 h-5 w-5 text-slate-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                    <div>
                      <p className="text-[11px] uppercase text-slate-400">Reservado</p>
                      <p className="mt-0.5 text-base font-black text-emerald-300 sm:text-lg">{formatCurrency(saved)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-slate-400">Saldo restante</p>
                      <p className="mt-0.5 text-base font-bold text-amber-200 sm:text-lg">{formatCurrency(remaining)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase text-slate-400">Total-alvo</p>
                      <p className="mt-0.5 text-base font-bold text-white sm:text-lg">{formatCurrency(target)}</p>
                    </div>
                  </div>
                  <div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={`Progresso da provisão ${provision.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between gap-2 text-xs text-slate-400">
                      <span>{progress.toFixed(0)}% concluído</span>
                      <span>Vence em {formatDate(provision.due_date)}{monthsLeft > 0 ? ` (${monthsLeft} mês${monthsLeft > 1 ? 'es' : ''})` : ''}</span>
                    </div>
                  </div>
                  {monthlySuggestion !== null ? (
                    <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                      Sugestão mensal: reserve cerca de <strong>{formatCurrency(monthlySuggestion)} / mês</strong> para pagar à vista no vencimento.
                    </p>
                  ) : overdue ? (
                    <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">Vencimento passou. Atualize a data ou registre o pagamento.</p>
                  ) : (
                    <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Meta de reserva alcançada! Confira o valor real quando a cobrança chegar.</p>
                  )}
                  {provision.contributions?.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-800 pt-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Últimas reservas registradas</p>
                      {provision.contributions.slice(0, 4).map(contribution => (
                        <div key={contribution.id} className="flex items-center justify-between text-xs text-slate-400">
                          <span>{formatDate(contribution.contribution_date)}</span>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-200">{formatCurrency(contribution.amount)}</strong>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => removeContribution(provision.id, contribution.id)}
                                disabled={saving}
                                title="Remover este registro de reserva"
                                aria-label={`Remover reserva de ${formatCurrency(contribution.amount)}`}
                                className="rounded p-0.5 text-slate-500 hover:text-rose-400 disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {canManage && (
                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => openAction('contribution', provision)}
                        className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <CircleDollarSign className="h-4 w-4" /> Registrar reserva
                      </button>
                      <button
                        type="button"
                        onClick={() => openAction('settle', provision)}
                        className="min-h-10 rounded-xl bg-slate-800 px-3 text-sm font-bold text-slate-200 hover:bg-slate-700"
                      >
                        Fechar ciclo / Pagamento
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {paidProvisions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-white">Ciclos concluídos (Pagas)</h3>
          <div className="space-y-3">
            {paidProvisions.map(provision => (
              <article key={provision.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                      {getExpenseTypeLabel(provision.expense_type)}
                    </span>
                    <p className="font-bold text-white">{provision.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Pago em {formatDate(provision.paid_date)} · Valor real pago: <strong className="text-slate-200">{formatCurrency(provision.actual_amount)}</strong> (estimado: {formatCurrency(provision.target_amount)} · reservado: {formatCurrency(provision.saved_amount)})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && (
                    provision.renewed_provision_id ? (
                      <span className="text-xs font-semibold text-emerald-300">Próximo ciclo já provisionado</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAction('renew', provision)}
                        disabled={saving}
                        className="flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-500/10 px-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Renovar para o próximo ano
                      </button>
                    )
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setDeletingProvision(provision)}
                      aria-label={`Excluir ${provision.title}`}
                      title="Excluir histórico desta provisão"
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeAction && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="presentation">
          <form
            onSubmit={submitAction}
            role="dialog"
            aria-modal="true"
            aria-labelledby="annual-provision-action-title"
            className="relative w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <button type="button" onClick={() => setActiveAction(null)} aria-label="Fechar" className="absolute right-5 top-5 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div>
              <h3 id="annual-provision-action-title" className="pr-8 text-xl font-extrabold text-white">
                {activeAction.type === 'contribution'
                  ? 'Registrar valor reservado'
                  : activeAction.type === 'settle'
                    ? 'Fechar ciclo anual (Pagamento)'
                    : 'Renovar para o próximo ano'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{activeAction.provision.title}</p>
            </div>

            {activeAction.type === 'renew' && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">
                Sugerimos como ponto de partida o valor efetivamente pago neste ciclo (<strong>{formatCurrency(activeAction.provision.actual_amount ?? activeAction.provision.target_amount)}</strong>), mas você pode ajustá-lo livremente abaixo.
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">
                {activeAction.type === 'contribution'
                  ? 'Valor reservado neste mês (R$)'
                  : activeAction.type === 'settle'
                    ? 'Valor real efetivamente pago (R$)'
                    : 'Novo valor estimado da provisão (R$)'}
              </span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={actionAmount}
                onChange={event => setActionAmount(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
              />
              {activeAction.type === 'contribution' && (() => {
                const suggestion = getMonthlySuggestion(
                  Number(activeAction.provision.target_amount),
                  Number(activeAction.provision.saved_amount),
                  activeAction.provision.due_date
                );
                return suggestion ? (
                  <button
                    type="button"
                    onClick={() => setActionAmount(String(suggestion))}
                    className="mt-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    Usar sugestão mensal: {formatCurrency(suggestion)}
                  </button>
                ) : null;
              })()}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">
                {activeAction.type === 'contribution'
                  ? 'Data da reserva'
                  : activeAction.type === 'settle'
                    ? 'Data do pagamento'
                    : 'Próximo vencimento'}
              </span>
              <input
                required
                type="date"
                min={activeAction.type === 'renew' ? todayDate() : undefined}
                max={activeAction.type !== 'renew' ? todayDate() : undefined}
                value={actionDate}
                onChange={event => setActionDate(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
              />
            </label>

            {activeAction.type === 'settle' && (
              <>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={openRenewAfterSettle}
                    onChange={event => setOpenRenewAfterSettle(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 accent-emerald-500"
                  />
                  <span>
                    Oferecer renovação para o ano seguinte logo após confirmar, usando o valor pago como sugestão inicial.
                  </span>
                </label>
                <p className="text-xs text-slate-400">
                  Concluir a provisão fecha o ciclo anual da meta. Para baixar o dinheiro do saldo bancário, registre o gasto em Contas a Pagar.
                </p>
              </>
            )}

            {activeAction.type === 'renew' && actionAmount && actionDate && Number(actionAmount) > 0 && (
              <p className="text-xs text-slate-400">
                Nova sugestão mensal estimada:{' '}
                <strong className="text-emerald-300">
                  {formatCurrency(getMonthlySuggestion(Number(actionAmount), 0, actionDate) || 0)} / mês
                </strong>
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 font-bold text-slate-950 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {activeAction.type === 'contribution'
                ? 'Salvar reserva'
                : activeAction.type === 'settle'
                  ? 'Registrar pagamento e fechar ciclo'
                  : 'Confirmar renovação anual'}
            </button>
          </form>
        </div>
      )}

      {deletingProvision && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-provision-title"
            className="w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h3 id="delete-provision-title" className="text-lg font-extrabold text-white">
              Excluir provisão anual
            </h3>
            <p className="text-sm text-slate-300">
              Tem certeza de que deseja excluir a provisão <strong>{deletingProvision.title}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingProvision(null)}
                className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirmDeleteProvision}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
