'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Building2,
  Pencil,
  Utensils,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

export interface Account {
  id: string;
  name: string;
  bank_name: string;
  agency: string | null;
  account_number: string;
  pix_key: string | null;
  initial_balance: number;
  balance: number;
  account_type?: 'BANK' | 'BENEFIT_CARD';
  benefit_category?: string | null;
  monthly_recharge_amount?: number;
  recharge_day?: number | null;
}

interface AccountsManagerProps {
  familyId: string;
  apiUrl: string;
  onUpdated: () => void;
  canManage: boolean;
}

const POPULAR_BENEFIT_PROVIDERS = [
  'Caju',
  'Flash',
  'iFood Benefícios',
  'Alelo',
  'Ticket',
  'Pluxee (Sodexo)',
  'VR Benefícios',
  'Swile',
];

const BENEFIT_CATEGORIES = [
  { id: 'VA_VR_FLEX', label: 'VA + VR Flexível (Mercado & Restaurante)' },
  { id: 'VALE_ALIMENTACAO', label: 'Vale-Alimentação (Supermercado)' },
  { id: 'VALE_REFEICAO', label: 'Vale-Refeição (Restaurantes & Delivery)' },
  { id: 'COMBUSTIVEL_SAUDE', label: 'Auxílio Combustível / Saúde / Outros' },
];

export default function AccountsManager({ familyId, apiUrl, onUpdated, canManage }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountType, setAccountType] = useState<'BANK' | 'BENEFIT_CARD'>('BANK');
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [benefitCategory, setBenefitCategory] = useState('VA_VR_FLEX');
  const [monthlyRechargeAmount, setMonthlyRechargeAmount] = useState('');
  const [rechargeDay, setRechargeDay] = useState('1');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [rechargingId, setRechargingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/accounts?family_id=${familyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar as contas.');
      if (Array.isArray(data)) setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas bancárias.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function resetForm() {
    setEditingAccount(null);
    setBankName('');
    setAgency('');
    setAccountNumber('');
    setPixKey('');
    setInitialBalance('');
    setBenefitCategory('VA_VR_FLEX');
    setMonthlyRechargeAmount('');
    setRechargeDay('1');
  }

  function handleEdit(account: Account) {
    setEditingAccount(account);
    const isBenefit = account.account_type === 'BENEFIT_CARD';
    setAccountType(isBenefit ? 'BENEFIT_CARD' : 'BANK');
    setBankName(account.bank_name || account.name);
    setAgency(account.agency || '');
    setAccountNumber(account.account_number || '');
    setPixKey(account.pix_key || '');
    setInitialBalance(String(account.initial_balance ?? 0));
    setBenefitCategory(account.benefit_category || 'VA_VR_FLEX');
    setMonthlyRechargeAmount(
      account.monthly_recharge_amount && Number(account.monthly_recharge_amount) > 0
        ? String(account.monthly_recharge_amount)
        : ''
    );
    setRechargeDay(account.recharge_day ? String(account.recharge_day) : '1');
    setError('');
    setNotice('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const balance = Number(initialBalance || 0);
      if (!Number.isFinite(balance)) throw new Error('Informe um saldo inicial válido.');
      const res = await authenticatedFetch(
        `${apiUrl}/api/accounts${editingAccount ? `/${editingAccount.id}` : ''}`,
        {
          method: editingAccount ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_type: accountType,
            bank_name: bankName.trim(),
            agency: accountType === 'BANK' ? agency.trim() : '',
            account_number:
              accountType === 'BENEFIT_CARD'
                ? accountNumber.trim() || 'Vale Alimentação/Refeição'
                : accountNumber.trim(),
            pix_key: accountType === 'BANK' ? pixKey.trim() : '',
            initial_balance: balance,
            benefit_category: accountType === 'BENEFIT_CARD' ? benefitCategory : null,
            monthly_recharge_amount:
              accountType === 'BENEFIT_CARD' ? Number(monthlyRechargeAmount || 0) : 0,
            recharge_day: accountType === 'BENEFIT_CARD' ? Number(rechargeDay || 1) : null,
          }),
        }
      );

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || 'Não foi possível salvar.');
      }

      setNotice(d.message || 'Salvo com sucesso!');
      resetForm();
      await loadAccounts();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cadastro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRechargeBenefit(account: Account) {
    const defaultVal = Number(account.monthly_recharge_amount || 0);
    const input = window.prompt(
      `Qual valor de recarga deseja creditar no saldo de "${account.bank_name}"?`,
      defaultVal > 0 ? String(defaultVal) : '1000'
    );
    if (input === null) return;
    const numericVal = Number(input.replace(',', '.'));
    if (!Number.isFinite(numericVal) || numericVal <= 0) {
      setError('Informe um valor de recarga maior que zero.');
      return;
    }

    setRechargingId(account.id);
    setError('');
    setNotice('');
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/accounts/${account.id}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao creditar recarga.');
      setNotice(data.message || 'Recarga creditada com sucesso!');
      await loadAccounts();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao creditar recarga.');
    } finally {
      setRechargingId(null);
    }
  }

  async function handleDelete(account: Account) {
    if (!confirm(`Deseja realmente excluir "${account.name}"?`)) return;
    setError('');
    setNotice('');
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/accounts/${account.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível excluir a conta.');
      await loadAccounts();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta bancária.');
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));
  };

  const bankAccounts = accounts.filter(a => a.account_type !== 'BENEFIT_CARD');
  const benefitAccounts = accounts.filter(a => a.account_type === 'BENEFIT_CARD');
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalBenefitBalance = benefitAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumo Separado: Saldo Bancário Livre vs Saldo em Vales/Benefícios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 block">
              🏦 Saldo em Contas Bancárias ({bankAccounts.length})
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalBankBalance)}</p>
            <span className="text-[11px] text-slate-400">
              Dinheiro livre considerado na projeção de 12 meses e boletos
            </span>
          </div>
          <Building2 className="w-8 h-8 text-emerald-400/60" />
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-amber-300 block">
              🍱 Saldo em Vales & Benefícios ({benefitAccounts.length})
            </span>
            <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(totalBenefitBalance)}</p>
            <span className="text-[11px] text-slate-400">
              Caju, Alelo, Ticket, Flash, VR (consome saldo sem gerar fatura)
            </span>
          </div>
          <Utensils className="w-8 h-8 text-amber-400/60" />
        </div>
      </div>

      {canManage && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {accountType === 'BENEFIT_CARD' ? (
                  <>
                    <Utensils className="w-5 h-5 text-amber-400" />
                    {editingAccount
                      ? 'Editar Cartão de Benefício / Vale'
                      : 'Cadastrar Vale-Alimentação / Refeição (Caju, Alelo, Flash)'}
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    {editingAccount ? 'Editar Conta Bancária' : 'Cadastrar Nova Conta Bancária'}
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {accountType === 'BENEFIT_CARD'
                  ? 'Compras feitas com Vale/Benefício consomem o saldo disponível na hora e não geram fatura de cartão.'
                  : 'Informe os dados bancários e o saldo existente no início do controle.'}
              </p>
            </div>

            {/* Seletor de Tipo: Conta Bancária vs Vale/Benefício */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start">
              <button
                type="button"
                onClick={() => {
                  setAccountType('BANK');
                  if (!editingAccount) setBankName('');
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  accountType === 'BANK'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏦 Conta Bancária
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('BENEFIT_CARD');
                  if (!editingAccount && !bankName) setBankName('Caju');
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  accountType === 'BENEFIT_CARD'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🍱 Vale / Benefício (Caju, VR)
              </button>
            </div>
          </div>

          {accountType === 'BENEFIT_CARD' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Escolher rápido:</span>
              {POPULAR_BENEFIT_PROVIDERS.map(provider => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setBankName(provider)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    bankName.toLowerCase() === provider.toLowerCase()
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
            {accountType === 'BANK' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Banco *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú, Bradesco"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Agência</label>
                  <input
                    type="text"
                    value={agency}
                    onChange={e => setAgency(e.target.value)}
                    placeholder="Número da agência"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Número da conta *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Número da conta e dígito"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Chave Pix</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={e => setPixKey(e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Inicial (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={initialBalance}
                    onChange={e => setInitialBalance(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Cartão de Benefício / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="Ex: Caju, Flash, Alelo, Ticket"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Titular / Identificação
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Ex: VA/VR Jefferson"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modalidade do Vale</label>
                  <select
                    value={benefitCategory}
                    onChange={e => setBenefitCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    {BENEFIT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Saldo Disponível Hoje (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={initialBalance}
                    onChange={e => setInitialBalance(e.target.value)}
                    placeholder="Ex: 850.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Recarga Mensal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthlyRechargeAmount}
                      onChange={e => setMonthlyRechargeAmount(e.target.value)}
                      placeholder="Ex: 1200.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Dia Recarga</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={rechargeDay}
                      onChange={e => setRechargeDay(e.target.value)}
                      placeholder="Dia 1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {editingAccount && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-1.5 disabled:opacity-50 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  accountType === 'BENEFIT_CARD'
                    ? 'bg-amber-400 hover:bg-amber-300'
                    : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                {saving
                  ? 'Salvando...'
                  : editingAccount
                  ? 'Salvar alterações'
                  : accountType === 'BENEFIT_CARD'
                  ? 'Adicionar Vale / Benefício'
                  : 'Adicionar Conta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
          {error}
        </div>
      )}

      {notice && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabela de Contas Bancárias & Cartões de Benefício */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">
            Contas Bancárias & Cartões de Benefícios ({accounts.length})
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-emerald-400 font-bold">
              Bancos: {formatCurrency(totalBankBalance)}
            </span>
            {benefitAccounts.length > 0 && (
              <span className="text-amber-300 font-bold">
                Vales (Caju/VA/VR): {formatCurrency(totalBenefitBalance)}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-4 text-center">Carregando contas e benefícios...</p>
        ) : accounts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhuma conta ou benefício cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Instituição / Identificação</th>
                  <th className="py-2.5 px-3">Tipo / Recarga</th>
                  <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                  <th className="py-2.5 px-3 text-right">Saldo Disponível</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {accounts.map(acc => {
                  const isBenefit = acc.account_type === 'BENEFIT_CARD';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          {isBenefit ? (
                            <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <span>{acc.bank_name || acc.name}</span>
                          {isBenefit && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-300">
                              Vale / Benefício
                            </span>
                          )}
                        </div>
                        <div className="mt-1 pl-6 text-slate-400">
                          {isBenefit
                            ? `Identificação: ${acc.account_number || 'Vale Alimentação/Refeição'}`
                            : `Agência ${acc.agency || '—'} • Conta ${acc.account_number || '—'}`}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isBenefit ? (
                          <div className="space-y-1">
                            <span className="text-slate-300 block">
                              {acc.monthly_recharge_amount && Number(acc.monthly_recharge_amount) > 0
                                ? `Recarga: ${formatCurrency(Number(acc.monthly_recharge_amount))}/mês (Dia ${
                                    acc.recharge_day || 1
                                  })`
                                : 'Saldo Pré-pago (Sem fatura)'}
                            </span>
                            {canManage && (
                              <button
                                type="button"
                                disabled={rechargingId === acc.id}
                                onClick={() => handleRechargeBenefit(acc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-extrabold text-amber-300 cursor-pointer"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${rechargingId === acc.id ? 'animate-spin' : ''}`}
                                />
                                + Creditar Recarga
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">{acc.pix_key ? `PIX: ${acc.pix_key}` : 'Conta Bancária'}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-400">
                        {formatCurrency(acc.initial_balance || 0)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold text-sm ${
                          isBenefit ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        {formatCurrency(acc.balance || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {canManage && (
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(acc)}
                              className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(acc)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
