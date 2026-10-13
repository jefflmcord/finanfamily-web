'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Wallet, 
  Banknote,
  FileText,
  DollarSign,
  X,
  TrendingDown
} from 'lucide-react';

interface UpcomingTransaction {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  category_name?: string;
  account_name?: string;
  credit_card_name?: string;
  status: 'PENDING' | 'OVERDUE' | 'PAID';
}

interface Account {
  id: string;
  name: string;
}

interface UpcomingDuesProps {
  month: number;
  year: number;
  onTransactionPaid: () => void;
}

export default function UpcomingDues({ month, year, onTransactionPaid }: UpcomingDuesProps) {
  const [items, setItems] = useState<UpcomingTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Baixa com Juros
  const [payingItem, setPayingItem] = useState<UpcomingTransaction | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch(`${apiUrl}/api/transactions?family_id=${familyId}&month=${month}&year=${year}`).then((r) => r.json()),
        fetch(`${apiUrl}/api/accounts?family_id=${familyId}`).then((r) => r.json())
      ]);

      if (Array.isArray(txRes)) {
        // Filtra apenas despesas a vencer ou vencidas
        const pending = txRes.filter((t: any) => t.type === 'EXPENSE' && t.status !== 'PAID');
        setItems(pending);
      }

      if (Array.isArray(accRes)) {
        setAccounts(accRes);
        if (accRes.length > 0) setSelectedAccountId(accRes[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas a vencer:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId, month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleOpenPayModal(item: UpcomingTransaction) {
    setPayingItem(item);
    setPaidAmount(String(item.amount));
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingItem) return;

    setSubmittingPayment(true);
    try {
      const finalVal = Number(String(paidAmount).replace(',', '.')) || payingItem.amount;

      const res = await fetch(`${apiUrl}/api/transactions/${payingItem.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccountId || null,
          paid_amount: finalVal,
          payment_date: paymentDate
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao dar baixa');
      }

      setPayingItem(null);
      await loadData();
      onTransactionPaid();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  // Cálculo visual de juros no modal
  const interestDiff = payingItem 
    ? Math.max(0, (Number(String(paidAmount).replace(',', '.')) || 0) - Number(payingItem.amount))
    : 0;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Contas a Pagar no Período ({items.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Lançamentos em aberto que necessitam de quitação</p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-4 text-center">A carregar compromissos...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Nenhuma conta pendente para este mês!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Vencimento</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Origem</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Valor Nominal</th>
                <th className="py-2.5 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                    {formatDate(item.due_date)}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-200">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                    {item.credit_card_name ? (
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <CreditCard className="w-3.5 h-3.5" />
                        {item.credit_card_name}
                      </span>
                    ) : item.account_name ? (
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Wallet className="w-3.5 h-3.5" />
                        {item.account_name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <FileText className="w-3.5 h-3.5" />
                        Boleto / Carnê
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    {item.status === 'OVERDUE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Vencido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        A vencer
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right font-bold text-slate-200">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleOpenPayModal(item)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE BAIXA COM VALOR PAGO E JUROS */}
      {payingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <button
              onClick={() => setPayingItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Dar Baixa no Pagamento
            </h3>
            <p className="text-xs text-slate-400 mb-4 truncate">
              {payingItem.description}
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor Original Previsto</label>
                <input
                  type="text"
                  disabled
                  value={formatCurrency(payingItem.amount)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-400 mb-1">
                  Valor Efetivamente Pago (R$)
                </label>
                <input
                  type="text"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Ex: 718,00"
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3.5 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Alerta Visual de Juros Calculados na hora */}
              {interestDiff > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                    Juros / Multa por atraso:
                  </span>
                  <strong className="text-amber-400 font-bold">
                    + {formatCurrency(interestDiff)}
                  </strong>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Data do Pagamento</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Debitar de qual Conta?</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Nenhuma / Em dinheiro</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {submittingPayment ? 'Gravando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}