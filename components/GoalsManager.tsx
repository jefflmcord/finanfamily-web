'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Target, 
  Calendar, 
  ArrowUpRight, 
  Trash2, 
  X, 
  Wallet, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  ShieldCheck,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_months: number;
  start_date: string;
  target_date: string;
  status: string;
  target_account_id?: string;
  target_account_name?: string;
}

interface Account {
  id: string;
  name: string;
}

interface GoalsManagerProps {
  onUpdated: () => void;
}

export default function GoalsManager({ onUpdated }: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Novo Objetivo
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetMonths, setTargetMonths] = useState(12);
  const [originAccountId, setOriginAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Modal Aporte Avulso
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAccount, setContributionAccount] = useState('');
  const [savingContribution, setSavingContribution] = useState(false);

  // Modal de Exclusão com Aviso de Cancelamento de Parcelas
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, accsRes] = await Promise.all([
        authenticatedFetch(`${apiUrl}/api/goals?family_id=${familyId}`).then((r) => r.json()),
        authenticatedFetch(`${apiUrl}/api/accounts?family_id=${familyId}`).then((r) => r.json())
      ]);

      if (Array.isArray(goalsRes)) setGoals(goalsRes);
      if (Array.isArray(accsRes)) {
        setAccounts(accsRes);
        if (accsRes.length > 0) {
          setOriginAccountId(accsRes[0].id);
          setTargetAccountId(accsRes[0].id);
          setContributionAccount(accsRes[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de investimentos:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const totalAccumulated = goals.reduce((acc, g) => acc + Number(g.current_amount || 0), 0);
    const totalTarget = goals.reduce((acc, g) => acc + Number(g.target_amount || 0), 0);
    const totalMonthly = goals.reduce((acc, g) => acc + Number(g.monthly_contribution || 0), 0);
    const globalProgress = totalTarget > 0 ? Math.min(100, (totalAccumulated / totalTarget) * 100) : 0;

    return {
      totalAccumulated,
      totalTarget,
      totalMonthly,
      globalProgress: Math.round(globalProgress)
    };
  }, [goals]);

  const handleTargetAmountChange = (val: string) => {
    setTargetAmount(val);
    const num = Number(val.replace(',', '.'));
    if (num > 0 && targetMonths > 0) {
      setMonthlyContribution((num / targetMonths).toFixed(2));
    }
  };

  const handleMonthsChange = (months: number) => {
    setTargetMonths(months);
    const num = Number(targetAmount.replace(',', '.'));
    if (num > 0 && months > 0) {
      setMonthlyContribution((num / months).toFixed(2));
    }
  };

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoal(true);
    try {
      const target = Number(String(targetAmount).replace(',', '.')) || 0;
      const monthly = Number(String(monthlyContribution).replace(',', '.')) || 0;

      const res = await authenticatedFetch(`${apiUrl}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          title,
          target_amount: target,
          monthly_contribution: monthly,
          target_months: targetMonths,
          account_id: originAccountId || null,
          target_account_id: targetAccountId || null,
          start_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar objetivo');
      }

      setTitle('');
      setTargetAmount('');
      setMonthlyContribution('');
      setIsFormOpen(false);
      await loadData();
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleMakeContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contributingGoal) return;

    setSavingContribution(true);
    try {
      const amount = Number(String(contributionAmount).replace(',', '.')) || 0;

      const res = await authenticatedFetch(`${apiUrl}/api/goals/${contributingGoal.id}/contribution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          amount,
          account_id: contributionAccount || null,
          payment_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao realizar aporte');
      }

      setContributingGoal(null);
      setContributionAmount('');
      await loadData();
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingContribution(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingGoal) return;

    setIsDeleting(true);
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/goals/${deletingGoal.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir');
      }

      setDeletingGoal(null);
      await loadData();
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-8">
      {/* 1. INDICADORES CONSOLIDADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Patrimônio Acumulado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400">
              {formatCurrency(metrics.totalAccumulated)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Saldo total reservado nas contas</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Meta Consolidada</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">
              {formatCurrency(metrics.totalTarget)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Total dos planos traçados</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Aporte Mensal Previsto</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">
              {formatCurrency(metrics.totalMonthly)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Provisionado em Contas a Pagar</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Conclusão Geral</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-indigo-300">
              {metrics.globalProgress}%
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${metrics.globalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Planos e Metas Financeiras
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe a conta de aplicação e o ritmo de acumulação mês a mês.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
          {isFormOpen ? 'Fechar Formulário' : 'Novo Objetivo'}
        </button>
      </div>

      {/* 3. FORMULÁRIO DE NOVO OBJETIVO */}
      {isFormOpen && (
        <div className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            Configurar Novo Objetivo de Investimento
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Defina o objetivo, o valor mensal para o Contas a Pagar e em qual conta o patrimônio será acumulado.
          </p>

          <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Título do Objetivo</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Casa Própria, Reserva de Emergência, Troca de Carro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Valor Alvo (R$)</label>
              <input
                type="text"
                required
                value={targetAmount}
                onChange={(e) => handleTargetAmountChange(e.target.value)}
                placeholder="Ex: 9600,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Prazo (Meses)</label>
              <input
                type="number"
                min={1}
                max={360}
                required
                value={targetMonths}
                onChange={(e) => handleMonthsChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Aporte Mensal Calculado (R$)</label>
              <input
                type="text"
                required
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="800,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Conta de Origem (Débito Mensal)</label>
              <div className="relative">
                <Wallet className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <select
                  value={originAccountId}
                  onChange={(e) => setOriginAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Selecione a conta de saída</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Conta de Destino (Onde o valor será guardado)
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-3" />
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl pl-8 pr-3 py-2.5 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="">Selecione a conta de aplicação</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingGoal}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                {savingGoal ? 'A provisionar...' : 'Confirmar e Provisionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. CARDS DE CADA OBJETIVO */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          A carregar objetivos de investimento...
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
          <PiggyBank className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">Nenhum objetivo registrado ainda</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crie sua primeira meta financeira para definir a conta de destino e acompanhar os aportes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {goals.map((goal) => {
            const current = Number(goal.current_amount || 0);
            const target = Number(goal.target_amount || 1);
            const percent = Math.min(100, Math.round((current / target) * 100));
            const remaining = Math.max(0, target - current);
            const isCompleted = current >= target;

            return (
              <div 
                key={goal.id} 
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isCompleted ? <ShieldCheck className="w-5 h-5" /> : `${percent}%`}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          {goal.title}
                          {isCompleted && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                              Atingido 🎉
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {goal.target_months} meses
                          </span>
                          <span>•</span>
                          <span>{formatCurrency(goal.monthly_contribution)} / mês</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingGoal(goal)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Objetivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {goal.target_account_name && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Conta Destino:</span>
                      <strong className="font-semibold text-white">{goal.target_account_name}</strong>
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        Acumulado: <strong className="text-emerald-400 font-bold">{formatCurrency(current)}</strong>
                      </span>
                      <span className="text-slate-400">
                        Alvo: <strong className="text-slate-200 font-bold">{formatCurrency(target)}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>Restam {formatCurrency(remaining)}</span>
                      <span>Meta prevista: {formatDate(goal.target_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Iniciado em {formatDate(goal.start_date)}</span>
                  </div>

                  <button
                    onClick={() => setContributingGoal(goal)}
                    className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Aporte Avulso
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL DE AVISO E CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingGoal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setDeletingGoal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Excluir Objetivo de Investimento</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Tem certeza de que deseja excluir o objetivo <strong className="text-white">"{deletingGoal.title}"</strong>?
            </p>

            {/* Caixa de Aviso com destaque */}
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3.5 mb-5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="block font-semibold text-rose-200 mb-0.5">Aviso importante:</strong>
                Todas as parcelas futuras provisionadas deste investimento que ainda estiverem em aberto (não pagas) no módulo <strong>Contas a Pagar</strong> serão excluídas automaticamente.
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingGoal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow-md"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Objetivo e Parcelas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE APORTE AVULSO */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <button
              onClick={() => setContributingGoal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              Realizar Aporte Avulso
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Objetivo: <strong className="text-slate-200">{contributingGoal.title}</strong>
              {contributingGoal.target_account_name && (
                <span className="block text-emerald-400 text-[11px] mt-0.5">
                  Destino: {contributingGoal.target_account_name}
                </span>
              )}
            </p>

            <form onSubmit={handleMakeContribution} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor do Aporte Extra (R$)</label>
                <input
                  type="text"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="Ex: 500,00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Debitar de qual Conta?</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <select
                    value={contributionAccount}
                    onChange={(e) => setContributionAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Nenhuma / Em dinheiro</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContribution}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer"
                >
                  {savingContribution ? 'A registar...' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}