'use client';

import React from 'react';
import {
  Loader2,
  X,
  CheckCircle2,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { SettlementEntry, formatCurrency } from './dashboardUtils';

interface SettlementModalProps {
  settlementEntries: SettlementEntry[];
  canSettleTransactions: boolean;
  payingExpenses: boolean;
  accounts: any[];
  settlementError: string;
  onClose: () => void;
  onRemoveEntry: (transactionId: string) => void;
  onUpdateEntry: (transactionId: string, changes: Partial<{ accountId: string; paidAmount: string }>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function SettlementModal({
  settlementEntries,
  canSettleTransactions,
  payingExpenses,
  accounts,
  settlementError,
  onClose,
  onRemoveEntry,
  onUpdateEntry,
  onSubmit,
}: SettlementModalProps) {
  if (settlementEntries.length === 0 || !canSettleTransactions) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-emerald-500/20 bg-slate-900 p-5 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={payingExpenses}
          aria-label="Fechar baixa"
          className="absolute right-5 top-5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-1 flex items-center gap-2 pr-8 text-xl font-extrabold text-white">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          Baixar lançamento{settlementEntries.length > 1 ? 's' : ''}
        </h3>
        <p className="mb-5 text-xs text-slate-400">
          Informe a conta utilizada e o valor efetivamente pago. A diferença será registrada como juros, multa ou
          encargos.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {settlementEntries.map(entry => (
            <section
              key={entry.transaction.id}
              className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{entry.transaction.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Valor do lançamento: {formatCurrency(Number(entry.transaction.amount))}
                  </p>
                </div>
                {settlementEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveEntry(String(entry.transaction.id))}
                    className="shrink-0 text-xs text-slate-500 hover:text-rose-400"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-400">
                  Conta bancária usada
                  <select
                    required
                    value={entry.accountId}
                    onChange={event => onUpdateEntry(String(entry.transaction.id), { accountId: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-400">
                  Valor pago (R$)
                  <input
                    type="number"
                    required
                    min={Number(entry.transaction.amount)}
                    step="0.01"
                    value={entry.paidAmount}
                    onChange={event => onUpdateEntry(String(entry.transaction.id), { paidAmount: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
              {Number(entry.paidAmount) > Number(entry.transaction.amount) && (
                <p className="text-xs font-medium text-amber-400">
                  Encargos: {formatCurrency(Number(entry.paidAmount) - Number(entry.transaction.amount))}
                </p>
              )}
            </section>
          ))}

          {settlementError && (
            <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              {settlementError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              disabled={payingExpenses}
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={payingExpenses || settlementEntries.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {payingExpenses ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {payingExpenses ? 'Processando...' : 'Confirmar baixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteTransactionModalProps {
  isOpen: boolean;
  txToDelete: any;
  canDeleteTransactions: boolean;
  deleteScope: 'single' | 'all';
  setDeleteScope: (scope: 'single' | 'all') => void;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function DeleteTransactionModal({
  isOpen,
  txToDelete,
  canDeleteTransactions,
  deleteScope,
  setDeleteScope,
  onClose,
  onConfirmDelete,
}: DeleteTransactionModalProps) {
  if (!isOpen || !txToDelete || !canDeleteTransactions) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 mb-6 text-rose-400">
          <AlertTriangle className="w-8 h-8" />
          <h3 className="text-xl font-extrabold text-white">Apagar Lançamento</h3>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Tem certeza que deseja apagar <strong>{txToDelete.description}</strong> no valor de{' '}
          {formatCurrency(txToDelete.amount)}?
        </p>
        {txToDelete.total_installments > 1 && (
          <div className="mb-6 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase">Este lançamento faz parte de um parcelamento:</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={deleteScope === 'single'}
                onChange={() => setDeleteScope('single')}
                className="w-4 h-4 text-rose-500 bg-slate-900 border-slate-700"
              />
              <span className="text-sm text-white font-medium">
                Apagar apenas esta parcela ({txToDelete.installment_number}/{txToDelete.total_installments})
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={deleteScope === 'all'}
                onChange={() => setDeleteScope('all')}
                className="w-4 h-4 text-rose-500 bg-slate-900 border-slate-700"
              />
              <span className="text-sm text-white font-medium">Apagar TODAS as parcelas desta série</span>
            </label>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmDelete}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditTransactionModalProps {
  isOpen: boolean;
  editingTx: any;
  canEditTransactions: boolean;
  categories: any[];
  txDescription: string;
  setTxDescription: (val: string) => void;
  txCategoryId: string;
  setTxCategoryId: (val: string) => void;
  txAmount: string;
  setTxAmount: (val: string) => void;
  txDueDate: string;
  setTxDueDate: (val: string) => void;
  transactionEditError: string;
  savingTransactionEdit: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditTransactionModal({
  isOpen,
  editingTx,
  canEditTransactions,
  categories,
  txDescription,
  setTxDescription,
  txCategoryId,
  setTxCategoryId,
  txAmount,
  setTxAmount,
  txDueDate,
  setTxDueDate,
  transactionEditError,
  savingTransactionEdit,
  onClose,
  onSubmit,
}: EditTransactionModalProps) {
  if (!isOpen || !editingTx || !canEditTransactions) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2">
          <Edit className="w-6 h-6 text-emerald-400" /> Editar Lançamento
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={txDescription}
              onChange={e => setTxDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoria</label>
            <select
              required={categories.some(category => category.flow_type === editingTx.type)}
              value={txCategoryId}
              onChange={e => setTxCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Selecione uma categoria...</option>
              {categories
                .filter(category => category.flow_type === editingTx.type)
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label>
              <input
                type="date"
                required
                value={txDueDate}
                onChange={e => setTxDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>
          {transactionEditError && (
            <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              {transactionEditError}
            </p>
          )}
          <button
            type="submit"
            disabled={savingTransactionEdit}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            {savingTransactionEdit ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Guardar Alterações
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

interface NewGoalModalProps {
  isOpen: boolean;
  canManageGoals: boolean;
  goalTitle: string;
  setGoalTitle: (val: string) => void;
  goalTargetAmount: string;
  setGoalTargetAmount: (val: string) => void;
  goalMonths: string;
  setGoalMonths: (val: string) => void;
  goalStartDate: string;
  setGoalStartDate: (val: string) => void;
  savingGoal: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewGoalModal({
  isOpen,
  canManageGoals,
  goalTitle,
  setGoalTitle,
  goalTargetAmount,
  setGoalTargetAmount,
  goalMonths,
  setGoalMonths,
  goalStartDate,
  setGoalStartDate,
  savingGoal,
  onClose,
  onSubmit,
}: NewGoalModalProps) {
  if (!isOpen || !canManageGoals) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-extrabold text-white mb-2">Novo Objetivo / Meta</h3>
        <p className="text-xs text-slate-400 mb-6">
          O valor total será dividido automaticamente nas suas Contas a Pagar na categoria &quot;Investimento&quot;.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Objetivo</label>
            <input
              type="text"
              required
              placeholder="Ex: Carro Novo, Viagem, Reserva..."
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor Total Desejado (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="40000,00"
              value={goalTargetAmount}
              onChange={e => setGoalTargetAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prazo (Meses)</label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={goalMonths}
                onChange={e => setGoalMonths(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data de Início</label>
              <input
                type="date"
                required
                value={goalStartDate}
                onChange={e => setGoalStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>
          {goalTargetAmount && goalMonths && Number(goalMonths) > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-2">
              💡 Valor estimado por mês: {formatCurrency(Number(goalTargetAmount) / Number(goalMonths))} / mês
            </div>
          )}
          <button
            type="submit"
            disabled={savingGoal}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {savingGoal ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Programar Investimento
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

interface CreateTransactionModalProps {
  isOpen: boolean;
  canCreateTransactions: boolean;
  categories: any[];
  creditCards: any[];
  accounts: any[];
  txType: 'EXPENSE' | 'INCOME';
  setTxType: (type: 'EXPENSE' | 'INCOME') => void;
  txDescription: string;
  setTxDescription: (val: string) => void;
  txCategoryId: string;
  setTxCategoryId: (val: string) => void;
  txRepeatMonthly: boolean;
  setTxRepeatMonthly: (val: boolean) => void;
  txRecurrenceMonths: string;
  setTxRecurrenceMonths: (val: string) => void;
  txAmount: string;
  setTxAmount: (val: string) => void;
  txPaymentMethod: string;
  setTxPaymentMethod: (val: string) => void;
  txCardId: string;
  setTxCardId: (val: string) => void;
  txAccountId: string;
  setTxAccountId: (val: string) => void;
  txTotalInstallments: string;
  setTxTotalInstallments: (val: string) => void;
  txStartInstallment: string;
  setTxStartInstallment: (val: string) => void;
  txAmountMode: 'TOTAL' | 'INSTALLMENT';
  setTxAmountMode: (mode: 'TOTAL' | 'INSTALLMENT') => void;
  txTransactionDate: string;
  setTxTransactionDate: (val: string) => void;
  txDueDate: string;
  setTxDueDate: (val: string) => void;
  calculatedCardDueDate: string;
  savingTx: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateTransactionModal({
  isOpen,
  canCreateTransactions,
  categories,
  creditCards,
  accounts,
  txType,
  setTxType,
  txDescription,
  setTxDescription,
  txCategoryId,
  setTxCategoryId,
  txRepeatMonthly,
  setTxRepeatMonthly,
  txRecurrenceMonths,
  setTxRecurrenceMonths,
  txAmount,
  setTxAmount,
  txPaymentMethod,
  setTxPaymentMethod,
  txCardId,
  setTxCardId,
  txAccountId,
  setTxAccountId,
  txTotalInstallments,
  setTxTotalInstallments,
  txStartInstallment,
  setTxStartInstallment,
  txAmountMode,
  setTxAmountMode,
  txTransactionDate,
  setTxTransactionDate,
  txDueDate,
  setTxDueDate,
  calculatedCardDueDate,
  savingTx,
  onClose,
  onSubmit,
}: CreateTransactionModalProps) {
  if (!isOpen || !canCreateTransactions) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-8 shadow-2xl relative my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-extrabold text-white mb-6">Novo Lançamento</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTxType('EXPENSE');
                setTxCategoryId('');
              }}
              className={`py-2 rounded-lg font-bold text-sm cursor-pointer ${
                txType === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-slate-400'
              }`}
            >
              Contas a Pagar
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('INCOME');
                setTxCategoryId('');
              }}
              className={`py-2 rounded-lg font-bold text-sm cursor-pointer ${
                txType === 'INCOME' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Contas a Receber
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Supermercado..."
              value={txDescription}
              onChange={e => setTxDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoria</label>
            <select
              required={categories.some(category => category.flow_type === txType)}
              value={txCategoryId}
              onChange={e => setTxCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Selecione uma categoria...</option>
              {categories
                .filter(category => category.flow_type === txType)
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={txRepeatMonthly}
                onChange={event => {
                  setTxRepeatMonthly(event.target.checked);
                  if (event.target.checked) {
                    setTxTotalInstallments('1');
                    setTxStartInstallment('1');
                    setTxAmountMode('TOTAL');
                  }
                }}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              {txType === 'EXPENSE' ? 'Repetir esta conta mensalmente' : 'Repetir esta entrada mensalmente'}
            </label>
            {txRepeatMonthly && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Quantidade de meses</label>
                <input
                  type="number"
                  min="2"
                  max="120"
                  required
                  value={txRecurrenceMonths}
                  onChange={event => setTxRecurrenceMonths(event.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Serão criados {txRecurrenceMonths || 0} lançamentos mensais de{' '}
                  {txType === 'EXPENSE' ? 'despesa' : 'receita'}, cada um no valor de{' '}
                  {formatCurrency(Number(txAmount) || 0)}.
                </p>
              </div>
            )}
          </section>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                {txRepeatMonthly
                  ? 'Valor de cada mês (R$)'
                  : Number(txTotalInstallments) > 1 && txAmountMode === 'INSTALLMENT'
                    ? 'Valor de Cada Parcela (R$)'
                    : 'Valor Total (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Forma Pagamento</label>
              <select
                value={txPaymentMethod}
                onChange={e => setTxPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="BOLETO">Boleto / Pix / Dinheiro</option>
                <option value="CARD">Cartão de Crédito</option>
              </select>
            </div>
          </div>
          {txPaymentMethod === 'CARD' ? (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cartão de Crédito</label>
              <select
                value={txCardId}
                onChange={e => setTxCardId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="">Escolha o cartão...</option>
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Conta Bancária</label>
              <select
                value={txAccountId}
                onChange={e => setTxAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="">Selecione a conta...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {txType === 'EXPENSE' && !txRepeatMonthly && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Total de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={txTotalInstallments}
                  onChange={e => setTxTotalInstallments(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Iniciar da Parcela</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={txStartInstallment}
                  onChange={e => setTxStartInstallment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>
          )}
          {!txRepeatMonthly && Number(txTotalInstallments) > 1 && (
            <fieldset className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <legend className="px-1 text-xs font-bold uppercase text-slate-400">O valor informado é</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="txAmountMode"
                    checked={txAmountMode === 'TOTAL'}
                    onChange={() => setTxAmountMode('TOTAL')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  O total da compra
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="txAmountMode"
                    checked={txAmountMode === 'INSTALLMENT'}
                    onChange={() => setTxAmountMode('INSTALLMENT')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  O valor de cada parcela
                </label>
              </div>
              {Number(txAmount) > 0 && (
                <p className="mt-2 text-xs text-slate-400">
                  {txAmountMode === 'INSTALLMENT'
                    ? `${Number(txTotalInstallments) - Number(txStartInstallment) + 1} parcelas de ${formatCurrency(
                        Number(txAmount)
                      )}. Total: ${formatCurrency(Number(txAmount) * Number(txTotalInstallments))}.`
                    : `Cada parcela: ${formatCurrency(Number(txAmount) / Number(txTotalInstallments))}.`}
                </p>
              )}
            </fieldset>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data Lançamento</label>
              <input
                type="date"
                value={txTransactionDate}
                onChange={e => setTxTransactionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                {calculatedCardDueDate ? 'Vencimento da fatura' : 'Vencimento'}
              </label>
              <input
                type="date"
                value={calculatedCardDueDate || txDueDate}
                onChange={e => setTxDueDate(e.target.value)}
                readOnly={Boolean(calculatedCardDueDate)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white read-only:opacity-70"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingTx}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {savingTx ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Salvar Lançamento
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

interface CreateCardModalProps {
  isOpen: boolean;
  canManageCards: boolean;
  cardName: string;
  setCardName: (val: string) => void;
  cardBrand: string;
  setCardBrand: (val: string) => void;
  cardLimit: string;
  setCardLimit: (val: string) => void;
  cardClosingDay: string;
  setCardClosingDay: (val: string) => void;
  cardDueDay: string;
  setCardDueDay: (val: string) => void;
  savingCard: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateCardModal({
  isOpen,
  canManageCards,
  cardName,
  setCardName,
  cardBrand,
  setCardBrand,
  cardLimit,
  setCardLimit,
  cardClosingDay,
  setCardClosingDay,
  cardDueDay,
  setCardDueDay,
  savingCard,
  onClose,
  onSubmit,
}: CreateCardModalProps) {
  if (!isOpen || !canManageCards) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-extrabold text-white mb-6">Cadastrar Cartão</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Cartão</label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Bandeira</label>
            <input
              type="text"
              required
              placeholder="Ex: Mastercard"
              value={cardBrand}
              onChange={e => setCardBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Limite Total (R$)</label>
            <input
              type="text"
              required
              placeholder="5000,00"
              value={cardLimit}
              onChange={e => setCardLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={cardClosingDay}
                onChange={e => setCardClosingDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={cardDueDay}
                onChange={e => setCardDueDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingCard}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {savingCard ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Salvar Cartão
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
