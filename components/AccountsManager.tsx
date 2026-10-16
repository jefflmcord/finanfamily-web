'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, Trash2, Building2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

interface Account {
  id: string;
  name: string;
  type: string;
  initial_balance: number;
}

interface AccountsManagerProps {
  onUpdated: () => void;
}

export default function AccountsManager({ onUpdated }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('CHECKING');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const loadAccounts = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/accounts?family_id=${familyId}`);
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    }
  }, [apiUrl, familyId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const balance = Number(String(initialBalance).replace(',', '.')) || 0;
      const res = await authenticatedFetch(`${apiUrl}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name,
          type,
          initial_balance: balance
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao criar conta');
      }

      setName('');
      setInitialBalance('');
      await loadAccounts();
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta conta bancária?')) return;
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAccounts();
        onUpdated();
      }
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Criação */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-emerald-400" />
          Cadastrar Nova Conta Bancária
        </h3>
        <p className="text-xs text-slate-400 mb-4">Adicione contas correntes, poupanças ou carteiras digitais.</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Banco / Conta</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Itaú Corrente, Carteira"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Conta</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="CHECKING">Conta Corrente</option>
              <option value="SAVINGS">Poupança</option>
              <option value="INVESTMENT">Investimento</option>
              <option value="CASH">Dinheiro / Carteira</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Inicial (R$)</label>
            <input
              type="text"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {loading ? 'A registar...' : 'Adicionar Conta'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Contas Registadas */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Contas Existentes ({accounts.length})</h3>

        {accounts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhuma conta bancária registada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Nome</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-medium text-slate-200 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      {acc.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {acc.type === 'CHECKING' ? 'Conta Corrente' : acc.type === 'SAVINGS' ? 'Poupança' : acc.type}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                      {formatCurrency(acc.initial_balance || 0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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