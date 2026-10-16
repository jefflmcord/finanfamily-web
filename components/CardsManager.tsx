'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

interface CardItem {
  id: string;
  name: string;
  brand: string;
  total_limit: number;
  closing_day: number;
  due_day: number;
}

interface CardsManagerProps {
  onUpdated?: () => void;
}

export default function CardsManager({ onUpdated }: CardsManagerProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Mastercard');
  const [totalLimit, setTotalLimit] = useState('');
  const [closingDay, setClosingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [saving, setSaving] = useState(false);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/credit-cards?family_id=${familyId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCards(data);
      }
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Normalização do limite: remove pontos de milhar e converte vírgula para ponto decimal
      const cleanLimit = totalLimit.replace(/\./g, '').replace(',', '.');
      const numericLimit = parseFloat(cleanLimit);

      if (isNaN(numericLimit) || numericLimit <= 0) {
        throw new Error('Informe um valor de limite válido.');
      }

      const res = await authenticatedFetch(`${apiUrl}/api/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name: name.trim(),
          brand,
          total_limit: numericLimit,
          closing_day: Number(closingDay),
          due_day: Number(dueDay)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar cartão de crédito.');
      }

      // Limpar campos
      setName('');
      setTotalLimit('');
      setClosingDay(1);
      setDueDay(10);

      await loadCards();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cartão.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCard(id: string) {
    if (!confirm('Deseja realmente excluir este cartão de crédito?')) return;
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/credit-cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCards();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error('Erro ao excluir cartão:', err);
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Cadastro */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          Cadastrar Novo Cartão de Crédito
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Defina o limite, o dia de fecho e o dia de vencimento da fatura.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateCard} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Identificação do Cartão</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cartão Nubank, Cartão Marcelo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Bandeira</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Mastercard">Mastercard</option>
              <option value="Visa">Visa</option>
              <option value="Elo">Elo</option>
              <option value="American Express">American Express</option>
              <option value="Hipercard">Hipercard</option>
              <option value="Outra">Outra</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Limite Total (R$)</label>
            <input
              type="text"
              required
              value={totalLimit}
              onChange={(e) => setTotalLimit(e.target.value)}
              placeholder="Ex: 15000,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia Fecho</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={closingDay}
              onChange={(e) => setClosingDay(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia Vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-center font-bold"
            />
          </div>

          <div className="sm:col-span-6 flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {saving ? 'A registar...' : 'Adicionar Cartão'}
            </button>
          </div>
        </form>
      </div>

      {/* Listagem de Cartões Registados */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          Cartões Cadastrados ({cards.length})
        </h3>

        {loading ? (
          <p className="text-xs text-slate-500 py-4">A carregar cartões...</p>
        ) : cards.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">Nenhum cartão de crédito cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div 
                key={card.id} 
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3 relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">{card.name}</h4>
                    <span className="text-[11px] text-indigo-400 font-semibold">{card.brand}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    title="Excluir Cartão"
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Limite Total:</span>
                    <strong className="text-slate-200">{formatCurrency(card.total_limit)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fecho da Fatura:</span>
                    <span className="text-slate-300">Dia {card.closing_day}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vencimento:</span>
                    <span className="text-slate-300">Dia {card.due_day}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}