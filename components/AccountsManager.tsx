'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, Trash2, Building2, Pencil } from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

interface Account {
  id: string;
  name: string;
  bank_name: string;
  agency: string | null;
  account_number: string;
  pix_key: string | null;
  initial_balance: number;
  balance: number;
}

interface AccountsManagerProps {
  familyId: string;
  apiUrl: string;
  onUpdated: () => void;
  canManage: boolean;
}

export default function AccountsManager({ familyId, apiUrl, onUpdated, canManage }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }

  function handleEdit(account: Account) {
    setEditingAccount(account);
    setBankName(account.bank_name || account.name);
    setAgency(account.agency || '');
    setAccountNumber(account.account_number || '');
    setPixKey(account.pix_key || '');
    setInitialBalance(String(account.initial_balance ?? 0));
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const balance = Number(initialBalance);
      if (!Number.isFinite(balance)) throw new Error('Informe um saldo inicial válido.');
      const res = await authenticatedFetch(
        `${apiUrl}/api/accounts${editingAccount ? `/${editingAccount.id}` : ''}`,
        {
          method: editingAccount ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bank_name: bankName.trim(),
            agency: agency.trim(),
            account_number: accountNumber.trim(),
            pix_key: pixKey.trim(),
            initial_balance: balance
          })
        }
      );

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Não foi possível salvar a conta.');
      }

      resetForm();
      await loadAccounts();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a conta bancária.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: Account) {
    if (!confirm(`Deseja realmente excluir a conta ${account.name}?`)) return;
    setError('');
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  return (
    <div className="space-y-6">
      {canManage && <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-emerald-400" />
          {editingAccount ? 'Editar Conta Bancária' : 'Cadastrar Nova Conta Bancária'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">Informe os dados bancários e o saldo existente no início do controle.</p>

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Banco</label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ex: Nubank, Itaú"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Agência</label>
            <input
              type="text"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="Número da agência"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Número da conta</label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Número da conta e dígito"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Chave Pix</label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Inicial (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
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
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {saving ? 'Salvando...' : editingAccount ? 'Salvar alterações' : 'Adicionar Conta'}
            </button>
          </div>
        </form>
      </div>}

      {error && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabela de Contas Registadas */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">Contas Existentes ({accounts.length})</h3>
          <strong className="text-sm text-emerald-400">
            Saldo total: {formatCurrency(accounts.reduce((total, account) => total + Number(account.balance || 0), 0))}
          </strong>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-4 text-center">Carregando contas...</p>
        ) : accounts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhuma conta bancária registada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Banco / Agência / Conta</th>
                  <th className="py-2.5 px-3">Chave Pix</th>
                  <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                  <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        {acc.bank_name || acc.name}
                      </div>
                      <div className="mt-1 pl-6 text-slate-500">
                        Agência {acc.agency || '—'} • Conta {acc.account_number || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{acc.pix_key || '—'}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                      {formatCurrency(acc.initial_balance || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-200">
                      {formatCurrency(acc.balance || 0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {canManage && (
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(acc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                            title="Editar conta"
                            aria-label={`Editar conta ${acc.name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(acc)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Excluir conta"
                            aria-label={`Excluir conta ${acc.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}