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
  Pencil,
  Trash2
} from 'lucide-react';
import { getCurrentCardBillingPeriod, type CardBillingPeriod } from '@/lib/creditCardBilling';
import { authenticatedFetch } from '@/lib/apiClient';

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
  due_date: string;
  type: string;
  credit_card_id: string;
  account_id?: string | null;
  category_name?: string;
  installment_number?: number;
  total_installments?: number;
}

interface Account {
  id: string;
  name: string;
}

interface CreditCardListProps {
  familyId?: string;
  refreshTrigger?: number;
  onInvoicePaid?: () => void;
  canManageCards?: boolean;
  canSettleTransactions?: boolean;
}

export default function CreditCardList({ 
  familyId: familyIdProp,
  refreshTrigger, 
  onInvoicePaid,
  canManageCards = true,
  canSettleTransactions = true,
}: CreditCardListProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editClosingDay, setEditClosingDay] = useState(1);
  const [editDueDay, setEditDueDay] = useState(10);
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [cardActionError, setCardActionError] = useState('');

  // Modal de Fatura
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePaidAmount, setInvoicePaidAmount] = useState('0');
  const [invoiceIsPaid, setInvoiceIsPaid] = useState(false);
  const [invoicePeriod, setInvoicePeriod] = useState<CardBillingPeriod | null>(null);

  // Formulário de Pagamento da Fatura
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const familyId = familyIdProp || process.env.NEXT_PUBLIC_FAMILY_ID || '1';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finanfamily-api.onrender.com';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, accsRes, transactionsRes] = await Promise.all([
        authenticatedFetch(`${apiUrl}/api/credit-cards?family_id=${familyId}`).then((r) => r.json()),
        authenticatedFetch(`${apiUrl}/api/accounts?family_id=${familyId}`).then((r) => r.json()),
        authenticatedFetch(`${apiUrl}/api/transactions?family_id=${familyId}`).then((r) => r.json())
      ]);

      if (Array.isArray(cardsRes)) setCards(cardsRes);
      if (Array.isArray(transactionsRes)) setTransactions(transactionsRes);
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

  const getPendingTransactionCount = (cardId: string) => transactions.filter((transaction) =>
    String(transaction.credit_card_id) === String(cardId) && transaction.status !== 'PAID'
  ).length;

  const getCurrentInvoiceItems = (
    card: CardItem,
    period = getCurrentCardBillingPeriod(card.closing_day, card.due_day)
  ) => {
    const invoiceMonth = period.dueDate.slice(0, 7);

    return transactions
      .filter((transaction) =>
        String(transaction.credit_card_id) === String(card.id) &&
        transaction.type === 'EXPENSE' &&
        transaction.due_date?.slice(0, 7) === invoiceMonth
      )
      .sort((first, second) => first.due_date.localeCompare(second.due_date));
  };

  const getCurrentInvoiceTotal = (card: CardItem) =>
    getCurrentInvoiceItems(card)
      .filter((transaction) => transaction.status !== 'PAID')
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const getAvailableLimit = (card: CardItem) => {
    const committedAmount = transactions
      .filter((transaction) =>
        String(transaction.credit_card_id) === String(card.id) &&
        transaction.type === 'EXPENSE' &&
        transaction.status !== 'PAID'
      )
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

    return Number(card.total_limit || 0) - committedAmount;
  };

  function handleOpenEditCard(card: CardItem) {
    setEditingCard(card);
    setEditName(card.name);
    setEditBrand(card.brand);
    setEditLimit(Number(card.total_limit).toLocaleString('pt-BR', {
      useGrouping: false,
      minimumFractionDigits: 2
    }));
    setEditClosingDay(Number(card.closing_day));
    setEditDueDay(Number(card.due_day));
    setCardActionError('');
  }

  async function handleUpdateCard(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCard) return;

    const numericLimit = Number(editLimit.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      setCardActionError('Informe um valor de limite válido.');
      return;
    }

    const hasPendingTransactions = getPendingTransactionCount(editingCard.id) > 0;
    const payload = hasPendingTransactions
      ? { total_limit: numericLimit }
      : {
          name: editName.trim(),
          brand: editBrand,
          total_limit: numericLimit,
          closing_day: Number(editClosingDay),
          due_day: Number(editDueDay)
        };

    setSavingCard(true);
    setCardActionError('');
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/credit-cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar o cartão.');

      setEditingCard(null);
      await loadData();
      if (onInvoicePaid) await onInvoicePaid();
    } catch (err: any) {
      setCardActionError(err.message || 'Erro ao atualizar o cartão.');
    } finally {
      setSavingCard(false);
    }
  }

  async function handleDeleteCard(card: CardItem) {
    if (getPendingTransactionCount(card.id) > 0) return;
    if (!confirm(`Deseja realmente excluir o cartão "${card.name}"?`)) return;

    setDeletingCardId(card.id);
    setCardActionError('');
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/credit-cards/${card.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir o cartão.');

      await loadData();
      if (onInvoicePaid) await onInvoicePaid();
    } catch (err: any) {
      setCardActionError(err.message || 'Erro ao excluir o cartão.');
    } finally {
      setDeletingCardId(null);
    }
  }

  function handleOpenInvoice(card: CardItem) {
    const period = getCurrentCardBillingPeriod(card.closing_day, card.due_day);
    const items = getCurrentInvoiceItems(card, period);

    setSelectedCard(card);
    setInvoicePeriod(period);
    setShowPaymentForm(false);
    setInvoiceItems(items);
    setInvoiceTotal(items.reduce((total, item) => total + Number(item.amount || 0), 0));
    setInvoicePaidAmount(String(items.filter(item => item.status !== 'PAID').reduce((total, item) => total + Number(item.amount || 0), 0)));
    setInvoiceIsPaid(items.length > 0 && items.every((item) => item.status === 'PAID'));
    setSelectedAccountId(items.find((item) => item.account_id)?.account_id || accounts[0]?.id || '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentError('');
  }

  async function handlePayInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;

    const pendingItems = invoiceItems.filter((item) => item.status !== 'PAID');
    if (pendingItems.length === 0) return;
    const totalPaidAmount = Number(invoicePaidAmount);
    const pendingAmount = pendingItems.reduce((total, item) => total + Number(item.amount || 0), 0);
    if (!Number.isFinite(totalPaidAmount) || totalPaidAmount < pendingAmount) {
      setPaymentError('O valor total pago deve ser igual ou superior ao total pendente da fatura.');
      return;
    }
    if (!selectedAccountId && pendingItems.some((item) => !item.account_id)) {
      setPaymentError('Selecione uma conta para registrar o pagamento da fatura.');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');
    const paidIds: string[] = [];
    try {
      const additionalFees = totalPaidAmount - pendingAmount;
      for (const [index, item] of pendingItems.entries()) {
        const itemPaidAmount = Number(item.amount) + (index === 0 ? additionalFees : 0);
        const res = await authenticatedFetch(`${apiUrl}/api/transactions/${item.id}/pay`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: selectedAccountId || item.account_id || null,
            paid_amount: itemPaidAmount,
            payment_date: paymentDate
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao baixar um lançamento da fatura.');

        paidIds.push(item.id);
        setInvoiceItems((currentItems) => currentItems.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, status: 'PAID' } : currentItem
        ));
      }

      setInvoiceIsPaid(true);
      setSelectedCard(null);
      await loadData();
      if (onInvoicePaid) await onInvoicePaid();
    } catch (err: any) {
      if (paidIds.length > 0) {
        const remainingAmount = pendingItems
          .filter(item => !paidIds.includes(item.id))
          .reduce((total, item) => total + Number(item.amount || 0), 0);
        setInvoicePaidAmount(String(remainingAmount));
      }
      setPaymentError(paidIds.length > 0
        ? `${paidIds.length} lançamento(s) baixado(s). O restante não foi atualizado: ${err.message}`
        : err.message || 'Falha ao liquidar fatura.');
      if (paidIds.length > 0) {
        await loadData();
        if (onInvoicePaid) await onInvoicePaid();
      }
    } finally {
      setSubmittingPayment(false);
    }
  }

  const pendingItems = invoiceItems.filter((item) => item.status !== 'PAID');
  const pendingTotal = pendingItems.reduce((total, item) => total + Number(item.amount || 0), 0);

  return (
    <div className="space-y-4">

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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Vence dia {card.due_day}
                    </span>
                    {canManageCards && <button
                      type="button"
                      onClick={() => handleOpenEditCard(card)}
                      title="Editar cartão"
                      aria-label={`Editar cartão ${card.name}`}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>}
                    {canManageCards && getPendingTransactionCount(card.id) === 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card)}
                        disabled={deletingCardId === card.id}
                        title="Excluir cartão"
                        aria-label={`Excluir cartão ${card.name}`}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Limite Total:</span>
                    <strong className="text-slate-200">{formatCurrency(card.total_limit)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Limite Disponível:</span>
                    <strong className={getAvailableLimit(card) < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {formatCurrency(getAvailableLimit(card))}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fatura atual:</span>
                    <strong className="text-amber-400">{formatCurrency(getCurrentInvoiceTotal(card))}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fecho da Fatura:</span>
                    <span className="text-slate-300">Dia {card.closing_day}</span>
                  </div>
                  {getPendingTransactionCount(card.id) > 0 && (
                    <p className="mt-2 text-[11px] text-amber-400">
                      Há lançamentos pendentes vinculados. Apenas o limite pode ser alterado; este cartão não pode ser excluído.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleOpenInvoice(card)}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                {canSettleTransactions ? 'Pagar fatura' : 'Ver fatura'}
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
              {invoicePeriod && (
                <>
                  Fechamento: <strong className="text-slate-200">{formatDate(invoicePeriod.periodStart)} a {formatDate(invoicePeriod.closingDate)}</strong>
                  {' | '}Vencimento: <strong className="text-slate-200">{formatDate(invoicePeriod.dueDate)}</strong>
                </>
              )}
            </p>

            {invoiceItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Nenhum lançamento faz parte do fechamento atual deste cartão.</p>
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
                          {formatDate(item.transaction_date)} • Vence {formatDate(item.due_date)} • {item.category_name || 'Geral'}
                        </span>
                        {item.total_installments && item.total_installments > 1 && (
                          <span className="block text-[10px] text-indigo-400 mt-1">
                            Parcela {item.installment_number}/{item.total_installments}
                          </span>
                        )}
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
                {pendingItems.length > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                    <span>Em aberto ({pendingItems.length} lançamento(s))</span>
                    <strong className="text-amber-400">{formatCurrency(pendingTotal)}</strong>
                  </div>
                )}

                {/* Se a fatura já estiver toda quitada */}
                {invoiceIsPaid ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Todas as compras desta fatura já foram liquidadas!</span>
                  </div>
                ) : (
                  <>
                    {canSettleTransactions && !showPaymentForm ? (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Baixar todos os lançamentos pendentes
                      </button>
                    ) : canSettleTransactions ? (
                      <form onSubmit={handlePayInvoice} className="space-y-3 pt-2 border-t border-slate-800">
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">Pagar pela conta</label>
                            <select
                              value={selectedAccountId}
                              onChange={(e) => setSelectedAccountId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                            >
                              <option value="">Selecione uma conta</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <label className="block text-xs font-medium text-slate-400">
                          Valor total pago
                          <input
                            type="number"
                            required
                            min={pendingTotal}
                            step="0.01"
                            value={invoicePaidAmount}
                            onChange={(event) => setInvoicePaidAmount(event.target.value)}
                            className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                          />
                          {Number(invoicePaidAmount) > pendingTotal && (
                            <span className="mt-1 block text-amber-400">
                              Encargos: {formatCurrency(Number(invoicePaidAmount) - pendingTotal)}
                            </span>
                          )}
                        </label>

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
                            disabled={submittingPayment || pendingItems.length === 0 || (!selectedAccountId && pendingItems.some((item) => !item.account_id))}
                            className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            {submittingPayment ? 'Baixando...' : 'Confirmar baixa'}
                          </button>
                        </div>
                        {paymentError && (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{paymentError}</span>
                          </div>
                        )}
                      </form>
                    ) : (
                      <p className="rounded-xl bg-slate-950 p-3 text-center text-xs text-slate-400">
                        Você pode consultar a fatura, mas não tem permissão para baixá-la.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {cardActionError && !editingCard && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cardActionError}</span>
        </div>
      )}

      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateCard}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Editar cartão</h3>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
                aria-label="Fechar edição"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {getPendingTransactionCount(editingCard.id) > 0 && (
              <p className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                Este cartão possui lançamentos pendentes. Somente o limite pode ser alterado.
              </p>
            )}

            <fieldset disabled={getPendingTransactionCount(editingCard.id) > 0} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Identificação do Cartão</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Bandeira</label>
                <select
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                  required
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  placeholder="Ex: 15000,00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dia Fecho</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={editClosingDay}
                  onChange={(e) => setEditClosingDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dia Vencimento</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            </fieldset>

            {cardActionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cardActionError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                disabled={savingCard}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingCard}
                className="px-4 py-2 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl cursor-pointer"
              >
                {savingCard ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}