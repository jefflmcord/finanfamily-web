'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Wallet, 
  X, 
  Receipt,
  Calendar,
  AlertCircle,
  TrendingDown
} from 'lucide-react';

interface CardItem {
  id: string;
  name: string;
  brand: string;
  total_limit: number;
  closing_day: number;
  due_day: number;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  status: string;
  transaction_date: string;
  category_name?: string;
}

interface Account {
  id: string;
  name: string;
}

interface CreditCardListProps {
  refreshTrigger?: number;
  month?: number;
  year?: number;
  onInvoicePaid?: () => void;
}

export default function CreditCardList({ 
  refreshTrigger, 
  month = 10, 
  year = 2026,
  onInvoicePaid 
}: CreditCardListProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Fatura
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoiceIsPaid, setInvoiceIsPaid] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Formulário de Pagamento da Fatura
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, accsRes] = await Promise.all([
        fetch(`${apiUrl}/api/credit-cards?family_id=${familyId}`).then((r) => r.json()),
        fetch(`${apiUrl}/api/accounts?family_id=${familyId}`).then((r) => r.json())
      ]);

      if (Array.isArray(cardsRes)) setCards(cardsRes);
      if (Array.isArray(accsRes)) {
        setAccounts(accsRes);
        if (accsRes.length > 0) setSelectedAccountId(accsRes[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados dos cartões:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  async function handleOpenInvoice(card: CardItem) {
    setSelectedCard(card);
    setLoadingInvoice(true);
    setShowPaymentForm(false);
    try {
      const res = await fetch(`${apiUrl}/api/credit-cards/${card.id}/invoice?month=${month}&year=${year}`);
      const data = await res.json();
      setInvoiceItems(data.items || []);
      setInvoiceTotal(Number(data.total || 0));
      setInvoiceIsPaid(Boolean(data.isPaid));
      setPaidAmount(String(data.total || 0));
      setPaymentDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Erro ao consultar fatura:', err);
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function handlePayInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;

    setSubmittingPayment(true);
    try {
      const finalPaid = Number(String(paidAmount).replace(',', '.')) || invoiceTotal;

      const res = await fetch(`${apiUrl}/api/credit-cards/${selectedCard.id}/pay-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          account_id: selectedAccountId || null,
          paid_amount: finalPaid,
          payment_date: paymentDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao liquidar fatura.');
      }

      setSelectedCard(null);
      await loadData();
      if (onInvoicePaid) onInvoicePaid();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  }

  const interestDiff = Math.max(
    0,
    (Number(String(paidAmount).replace(',', '.')) || 0) - invoiceTotal
  );

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Cartões de Crédito ({cards.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhamento de limites e liquidação de faturas de {String(month).padStart(2, '0')}/{year}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-4 text-center">A carregar cartões...</p>
      ) : cards.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">Nenhum cartão cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between transition-colors shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">{card.name}</h3>
                    <span className="text-[11px] text-indigo-400 font-semibold">{card.brand}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Vence dia {card.due_day}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Limite Total:</span>
                    <strong className="text-slate-200">{formatCurrency(card.total_limit)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fecho da Fatura:</span>
                    <span className="text-slate-300">Dia {card.closing_day}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenInvoice(card)}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                Ver Fatura / Pagar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CONSULTA E QUITAÇÃO DA FATURA */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Fatura: {selectedCard.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Competência: <strong className="text-slate-200">{String(month).padStart(2, '0')}/{year}</strong> | Vencimento: dia {selectedCard.due_day}
            </p>

            {loadingInvoice ? (
              <p className="text-xs text-slate-500 py-8 text-center">A carregar itens da fatura...</p>
            ) : invoiceItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Nenhuma compra registada neste cartão para o mês selecionado.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Lista de Compras */}
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 text-xs">
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center hover:bg-slate-800/30">
                      <div>
                        <p className="font-medium text-slate-200">{item.description}</p>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(item.transaction_date)} • {item.category_name || 'Geral'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-200">{formatCurrency(item.amount)}</span>
                        <div>
                          {item.status === 'PAID' ? (
                            <span className="text-[10px] text-emerald-400 font-semibold">Liquidado</span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-semibold">Pendente</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bloco de Totais */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400">Total da Fatura</span>
                  <span className="text-base font-black text-rose-400">{formatCurrency(invoiceTotal)}</span>
                </div>

                {/* Se a fatura já estiver toda quitada */}
                {invoiceIsPaid ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Todas as compras desta fatura já foram liquidadas!</span>
                  </div>
                ) : (
                  <>
                    {!showPaymentForm ? (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Pagar Fatura Completa
                      </button>
                    ) : (
                      /* Formulário de Quitação Consolidada */
                      <form onSubmit={handlePayInvoice} className="space-y-3 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-xs font-medium text-emerald-400 mb-1">
                            Valor Efetivamente Pago (R$)
                          </label>
                          <input
                            type="text"
                            required
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none"
                          />
                        </div>

                        {interestDiff > 0 && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-amber-300 flex items-center gap-1.5">
                              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                              Encargos / Juros:
                            </span>
                            <strong className="text-amber-400 font-bold">
                              + {formatCurrency(interestDiff)}
                            </strong>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Data de Pagamento</label>
                            <input
                              type="date"
                              required
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Debitar da Conta</label>
                            <select
                              value={selectedAccountId}
                              onChange={(e) => setSelectedAccountId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                            >
                              <option value="">Nenhuma / Dinheiro</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowPaymentForm(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                          >
                            Voltar
                          </button>
                          <button
                            type="submit"
                            disabled={submittingPayment}
                            className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            {submittingPayment ? 'A liquidar...' : 'Confirmar Pagamento'}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}