'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  Wallet, 
  Banknote, 
  FileText,
  AlertCircle,
  CalendarCheck
} from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  type: string;
  flow_type: 'EXPENSE' | 'INCOME';
}

interface CreditCardItem {
  id: string;
  name: string;
  closing_day: number;
  due_day: number;
}

interface Account {
  id: string;
  name: string;
}

export default function NewTransactionModal({ isOpen, onClose, onSuccess }: NewTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BOLETO' | 'ACCOUNT' | 'CASH'>('BOLETO');
  const [categoryId, setCategoryId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Controle de parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [startInstallment, setStartInstallment] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setTransactionDate(today);
      setDueDate(today);
      setError(null);
      loadAuxiliaryData();
    }
  }, [isOpen]);

  async function loadAuxiliaryData() {
    try {
      const [catRes, cardRes, accRes] = await Promise.all([
        fetch(`${apiUrl}/api/categories?family_id=${familyId}`).then((r) => r.json()),
        fetch(`${apiUrl}/api/credit-cards?family_id=${familyId}`).then((r) => r.json()),
        fetch(`${apiUrl}/api/accounts?family_id=${familyId}`).then((r) => r.json())
      ]);

      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(cardRes)) {
        setCreditCards(cardRes);
        if (cardRes.length > 0) setCreditCardId(cardRes[0].id);
      }
      if (Array.isArray(accRes)) {
        setAccounts(accRes);
        if (accRes.length > 0) setAccountId(accRes[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares:', err);
    }
  }

  const currentCategories = categories.filter(
    (c) => (c.flow_type || 'EXPENSE') === type
  );

  useEffect(() => {
    if (currentCategories.length > 0) {
      if (!currentCategories.some(c => c.id === categoryId)) {
        setCategoryId(currentCategories[0].id);
      }
    } else {
      setCategoryId('');
    }
  }, [type, categories]);

  // Cálculo da previsão de fatura do cartão
  const selectedCardInfo = useMemo(() => {
    if (paymentMethod !== 'CARD' || type !== 'EXPENSE' || !creditCardId) return null;
    const card = creditCards.find(c => c.id === creditCardId);
    if (!card || !transactionDate) return null;

    const [yStr, mStr, dStr] = transactionDate.split('-');
    const txDay = parseInt(dStr, 10);
    const txMonth = parseInt(mStr, 10) - 1;
    const txYear = parseInt(yStr, 10);

    let offset = 0;
    if (txDay >= card.closing_day) offset = 1;
    if (card.due_day < card.closing_day && txDay < card.closing_day) offset = 1;
    else if (card.due_day < card.closing_day && txDay >= card.closing_day) offset = 2;

    const targetDate = new Date(txYear, txMonth + offset, card.due_day);
    const formattedDue = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${targetDate.getFullYear()}`;
    const isClosed = txDay >= card.closing_day;

    return {
      closingDay: card.closing_day,
      dueDay: card.due_day,
      estimatedDue: formattedDue,
      isClosed
    };
  }, [paymentMethod, type, creditCardId, transactionDate, creditCards]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedAmount = Number(String(amount).replace(',', '.')) || 0;
      if (parsedAmount <= 0) {
        throw new Error('Informe um valor válido.');
      }

      const totalInst = isInstallment ? Number(totalInstallments) : 1;
      const startInst = isInstallment ? Number(startInstallment) : 1;

      if (startInst > totalInst) {
        throw new Error('A parcela inicial não pode ser maior que o total de parcelas.');
      }

      const payload = {
        family_id: familyId,
        description,
        amount: parsedAmount,
        installment_amount: parsedAmount,
        transaction_date: transactionDate,
        due_date: dueDate,
        type,
        category_id: categoryId || null,
        payment_method: type === 'INCOME' ? 'ACCOUNT' : paymentMethod,
        credit_card_id: paymentMethod === 'CARD' && type === 'EXPENSE' ? creditCardId : null,
        account_id: paymentMethod === 'ACCOUNT' || type === 'INCOME' ? accountId : null,
        total_installments: totalInst,
        start_installment: startInst
      };

      const res = await fetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar lançamento.');
      }

      setDescription('');
      setAmount('');
      setIsInstallment(false);
      setTotalInstallments(1);
      setStartInstallment(1);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Novo Lançamento Financeiro</h3>
        <p className="text-xs text-slate-400 mb-4">Adicione uma despesa ou receita familiar.</p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alternador de Tipo */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setPaymentMethod('BOLETO');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Despesa (Contas a Pagar)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setPaymentMethod('ACCOUNT');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Receita (Contas a Receber)
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'EXPENSE' ? 'Ex: Financiamento Carro, Supermercado' : 'Ex: Salário Mensal, Freelance'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Valor e Data da Compra/Operação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isInstallment ? 'Valor da Parcela (R$)' : 'Valor Total (R$)'}
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Data da Compra / Operação
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Categoria ({type === 'EXPENSE' ? 'Contas a Pagar' : 'Contas a Receber'})
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {currentCategories.length === 0 ? (
                <option value="">Nenhuma categoria cadastrada</option>
              ) : (
                currentCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Modalidade de Pagamento */}
          {type === 'EXPENSE' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BOLETO')}
                  className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    paymentMethod === 'BOLETO'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'border-slate-800 text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Boleto / Carnê
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'border-slate-800 text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Cartão Crédito
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ACCOUNT')}
                  className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    paymentMethod === 'ACCOUNT'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'border-slate-800 text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Conta Corrente
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'border-slate-800 text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Dinheiro
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Conta Bancária de Destino</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Detalhes para Cartão de Crédito com Prévia de Ciclo */}
          {paymentMethod === 'CARD' && type === 'EXPENSE' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Qual Cartão de Crédito?</label>
                <select
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCardInfo && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <CalendarCheck className="w-4 h-4" />
                    <span>Ciclo da Fatura:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Fecha todo dia <strong>{selectedCardInfo.closingDay}</strong>. 
                    {selectedCardInfo.isClosed 
                      ? ' Como a compra foi feita após o fecho, entrará na fatura seguinte.' 
                      : ' Compra feita antes do fecho; entra na fatura atual.'}
                  </p>
                  <p className="text-slate-200 text-[11px]">
                    Vencimento previsto: <strong className="text-indigo-400">{selectedCardInfo.estimatedDue}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Vencimento manual (apenas quando não for cartão) */}
          {paymentMethod !== 'CARD' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {type === 'EXPENSE' ? 'Data de Vencimento' : 'Data Prevista de Recebimento'}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* Seleção de Conta para Débito direto */}
          {paymentMethod === 'ACCOUNT' && type === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Qual Conta Bancária?</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parcelamento */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              Lançamento Parcelado / Recorrente
            </label>

            {isInstallment && (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Total de Parcelas</label>
                    <input
                      type="number"
                      min={2}
                      max={360}
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(Math.max(2, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1">Começar na Parcela</label>
                    <input
                      type="number"
                      min={1}
                      max={totalInstallments}
                      value={startInstallment}
                      onChange={(e) => setStartInstallment(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500 text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
            >
              {loading ? 'A registar...' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}