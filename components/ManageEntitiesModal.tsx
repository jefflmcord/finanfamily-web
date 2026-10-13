'use client';

import { useState } from 'react';
import { X, Wallet, Tag, CreditCard } from 'lucide-react';

interface ManageEntitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManageEntitiesModal({ isOpen, onClose, onSuccess }: ManageEntitiesModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'category' | 'card'>('account');

  // Conta
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  
  // Categoria
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('EXPENSE_VARIABLE');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  // Cartão de Crédito
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('Mastercard');
  const [cardLimit, setCardLimit] = useState('');
  const [closingDay, setClosingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  // Submissão de Conta Bancária
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const formattedBalance = Number(String(initialBalance).replace(',', '.')) || 0;

      const res = await fetch(`${apiUrl}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name: accountName,
          initial_balance: formattedBalance
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar conta.');
      }

      setMessage('Conta criada com sucesso!');
      setAccountName('');
      setInitialBalance('');
      onSuccess();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Submissão de Categoria
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const formattedBudget = Number(String(monthlyBudget).replace(',', '.')) || 0;

      const res = await fetch(`${apiUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name: categoryName,
          type: categoryType,
          monthly_budget: formattedBudget
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar categoria.');
      }

      setMessage('Categoria criada com sucesso!');
      setCategoryName('');
      setMonthlyBudget('');
      onSuccess();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Submissão de Cartão de Crédito
  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // Trata vírgula para número válido (ex: "3600,00" -> 3600.00)
      const formattedLimit = Number(String(cardLimit).replace(',', '.')) || 0;

      const res = await fetch(`${apiUrl}/api/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name: cardName,
          brand: cardBrand,
          total_limit: formattedLimit,
          closing_day: Number(closingDay),
          due_day: Number(dueDay)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar cartão.');
      }

      setMessage('Cartão de crédito criado com sucesso!');
      setCardName('');
      setCardLimit('');
      onSuccess();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-4">Gestão do Sistema</h2>

        {/* Abas */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setActiveTab('account'); setMessage(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'account'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Conta
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('category'); setMessage(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'category'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Categoria
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('card'); setMessage(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'card'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Cartão
          </button>
        </div>

        {message && (
          <div className="bg-slate-800 border border-slate-700 text-slate-200 text-xs p-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        {/* Formulário: Conta */}
        {activeTab === 'account' && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Conta / Banco</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ex: Nubank, Itaú, Carteira"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Inicial (R$)</label>
              <input
                type="text"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl transition-colors"
            >
              {loading ? 'A guardar...' : 'Criar Conta'}
            </button>
          </form>
        )}

        {/* Formulário: Categoria */}
        {activeTab === 'category' && (
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Categoria</label>
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ex: Supermercado, Combustível, Assinaturas"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Despesa</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="EXPENSE_VARIABLE">Despesa Variável</option>
                <option value="EXPENSE_FIXED">Despesa Fixa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Teto / Orçamento Mensal (R$)</label>
              <input
                type="text"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="Ex: 1200,00 (0 para sem limite)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl transition-colors"
            >
              {loading ? 'A guardar...' : 'Criar Categoria'}
            </button>
          </form>
        )}

        {/* Formulário: Cartão de Crédito */}
        {activeTab === 'card' && (
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Cartão</label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Ex: Riachuelo Marta, Nubank, Itaú"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bandeira</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Mastercard">Mastercard</option>
                  <option value="Visa">Visa</option>
                  <option value="Elo">Elo</option>
                  <option value="American Express">American Express</option>
                  <option value="Hipercard">Hipercard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Limite Total (R$)</label>
                <input
                  type="text"
                  required
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  placeholder="3600,00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dia Fechamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={closingDay}
                  onChange={(e) => setClosingDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dia Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              {loading ? 'A guardar...' : 'Criar Cartão'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}