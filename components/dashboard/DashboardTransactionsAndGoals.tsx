'use client';

import React from 'react';
import {
  PlusCircle,
  Target,
  CheckCircle2,
  FileText,
  Layers,
  Trophy,
  Edit,
  Trash2,
  Calendar,
  Filter,
  Circle,
  CheckCircle,
  AlertCircle,
  Printer,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import {
  FilterPeriod,
  FilterStatus,
  MONTH_FULL_NAMES,
  formatCurrency,
  formatDatePT,
  getTransactionStatus,
} from './dashboardUtils';

interface TransactionFilterBarProps {
  showPayableTotal?: boolean;
  filteredPayableTotal: number;
  filteredPayableCount: number;
  dashboardPeriodOverride: { month: number | 'ALL'; year: number | 'ALL' } | null;
  filterPeriod: FilterPeriod;
  customStartDate: string;
  customEndDate: string;
  filterStatus: FilterStatus;
  customPeriodInvalid: boolean;
  onChangeFilterPeriod: (period: FilterPeriod) => void;
  onChangeCustomStartDate: (date: string) => void;
  onChangeCustomEndDate: (date: string) => void;
  onChangeFilterStatus: (status: FilterStatus) => void;
}

export function TransactionFilterBar({
  showPayableTotal = false,
  filteredPayableTotal,
  filteredPayableCount,
  dashboardPeriodOverride,
  filterPeriod,
  customStartDate,
  customEndDate,
  filterStatus,
  customPeriodInvalid,
  onChangeFilterPeriod,
  onChangeCustomStartDate,
  onChangeCustomEndDate,
  onChangeFilterStatus,
}: TransactionFilterBarProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
      <div className="flex items-center gap-2 text-slate-300 font-bold">
        <Filter className="w-5 h-5 text-emerald-400" /> Filtros
      </div>
      {showPayableTotal && (
        <div
          aria-live="polite"
          className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-center md:text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total das contas exibidas</p>
          <div className="flex items-baseline justify-center gap-2 md:justify-start">
            <p className="text-lg font-extrabold text-emerald-400">{formatCurrency(filteredPayableTotal)}</p>
            <span className="text-xs text-slate-500">{filteredPayableCount} lançamento(s)</span>
          </div>
        </div>
      )}
      <div
        className={`grid grid-cols-1 ${
          filterPeriod === 'CUSTOM' && !dashboardPeriodOverride ? 'sm:grid-cols-2' : ''
        } sm:grid-cols-2 gap-3 w-full md:w-auto`}
      >
        <select
          value={dashboardPeriodOverride ? 'DASHBOARD' : filterPeriod}
          onChange={e => onChangeFilterPeriod(e.target.value as FilterPeriod)}
          aria-label="Período dos lançamentos"
          className="w-full min-w-0 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
        >
          {dashboardPeriodOverride && (
            <option value="DASHBOARD">
              {dashboardPeriodOverride.month === 'ALL'
                ? 'Todos os meses'
                : MONTH_FULL_NAMES[dashboardPeriodOverride.month - 1]}{' '}
              • {dashboardPeriodOverride.year === 'ALL' ? 'Todos os anos' : dashboardPeriodOverride.year}
            </option>
          )}
          <option value="CURRENT_MONTH">Mês atual</option>
          <option value="CURRENT_YEAR">Ano atual</option>
          <option value="LAST_60_DAYS">Últimos 60 dias</option>
          <option value="CUSTOM">Período personalizado</option>
          <option value="ALL">Todos os períodos</option>
        </select>
        {filterPeriod === 'CUSTOM' && (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-400">
              De
              <input
                type="date"
                required
                value={customStartDate}
                onChange={e => onChangeCustomStartDate(e.target.value)}
                aria-label="Data inicial do período personalizado"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-slate-200 outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-400">
              Até
              <input
                type="date"
                required
                value={customEndDate}
                onChange={e => onChangeCustomEndDate(e.target.value)}
                aria-label="Data final do período personalizado"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-slate-200 outline-none"
              />
            </label>
          </>
        )}
        <select
          value={filterStatus}
          onChange={e => onChangeFilterStatus(e.target.value as FilterStatus)}
          className="w-full min-w-0 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="ALL">Todos os Status</option>
          <option value="PENDING">A Pagar / Pendente</option>
          <option value="OVERDUE">Atrasados</option>
          <option value="PAID">Pagos</option>
        </select>
        {customPeriodInvalid && (
          <p role="alert" className="text-xs text-rose-400 sm:col-span-2">
            Informe um intervalo válido: a data inicial deve ser anterior ou igual à data final.
          </p>
        )}
      </div>
    </div>
  );
}

interface ModernTransactionRowProps {
  transaction: any;
  isIncome: boolean;
  compact?: boolean;
  kanban?: boolean;
  selectedExpenseIds: string[];
  canSettleTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  payingExpenses: boolean;
  onToggleStatus: (tx: any) => void;
  onExpenseSelection: (expenseId: string, selected: boolean) => void;
  onPayExpenses: (expenses: any[]) => void;
  onEditModal: (tx: any) => void;
  onDeleteModal: (tx: any) => void;
}

export function ModernTransactionRow({
  transaction: t,
  isIncome,
  compact = false,
  kanban = false,
  selectedExpenseIds,
  canSettleTransactions,
  canEditTransactions,
  canDeleteTransactions,
  payingExpenses,
  onToggleStatus,
  onExpenseSelection,
  onPayExpenses,
  onEditModal,
  onDeleteModal,
}: ModernTransactionRowProps) {
  const status = getTransactionStatus(t);
  const isPaid = status === 'PAID';
  const isOverdue = status === 'OVERDUE';
  const isSelected = selectedExpenseIds.includes(String(t.id));
  const small = compact || kanban;

  return (
    <div
      className={`${
        kanban
          ? 'p-3 rounded-xl gap-2.5'
          : compact
            ? 'p-2.5 sm:px-3.5 rounded-xl items-center gap-3'
            : 'p-4 sm:p-5 rounded-2xl sm:flex-row sm:justify-between sm:items-center gap-4'
      } border transition-all flex ${compact ? 'flex-row' : 'flex-col'} group ${
        isPaid
          ? 'bg-slate-900/40 border-slate-800/50 opacity-60 hover:opacity-100'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div
        className={`flex min-w-0 ${
          compact ? 'flex-1 items-center gap-2 sm:gap-3' : kanban ? 'items-start gap-2.5' : 'items-center gap-4'
        }`}
      >
        {isIncome ? (
          canSettleTransactions ? (
            <button
              onClick={() => onToggleStatus(t)}
              title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
              aria-label={isPaid ? `Marcar ${t.description} como pendente` : `Marcar ${t.description} como pago`}
              className={`flex-shrink-0 ${small ? 'p-0' : 'p-2 -ml-2'} transition-colors ${
                isPaid
                  ? 'text-emerald-500'
                  : isOverdue
                    ? 'text-rose-500 hover:text-rose-400'
                    : 'text-slate-500 hover:text-emerald-400'
              }`}
            >
              {isPaid ? (
                <CheckCircle className={`${small ? 'w-5 h-5' : 'w-7 h-7'}`} />
              ) : isOverdue ? (
                <AlertCircle className={`${small ? 'w-5 h-5' : 'w-7 h-7'}`} />
              ) : (
                <Circle className={`${small ? 'w-5 h-5' : 'w-7 h-7'}`} />
              )}
            </button>
          ) : isPaid ? (
            <CheckCircle className="w-7 h-7 flex-shrink-0 text-emerald-500" aria-label="Lançamento recebido" />
          ) : (
            <Circle className="w-7 h-7 flex-shrink-0 text-slate-600" aria-label="Lançamento pendente" />
          )
        ) : isPaid ? (
          <CheckCircle
            className={`${small ? 'w-5 h-5' : 'w-7 h-7'} flex-shrink-0 text-emerald-500`}
            aria-label="Lançamento pago"
          />
        ) : canSettleTransactions ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={payingExpenses}
            onClick={() => onExpenseSelection(String(t.id), !isSelected)}
            title={isSelected ? 'Desmarcar lançamento' : 'Selecionar para baixa'}
            aria-label={`${isSelected ? 'Desmarcar' : 'Selecionar'} ${t.description} para baixa`}
            className={`flex-shrink-0 ${small ? 'p-0' : 'p-2 -ml-2'} transition-colors disabled:opacity-40 ${
              isSelected
                ? 'text-emerald-400'
                : isOverdue
                  ? 'text-rose-500 hover:text-rose-400'
                  : 'text-slate-500 hover:text-emerald-400'
            }`}
          >
            {isSelected ? (
              <CheckCircle className={`${small ? 'w-5 h-5' : 'w-7 h-7'}`} />
            ) : isOverdue ? (
              <AlertCircle className={`${small ? 'w-5 h-5' : 'w-7 h-7'}`} />
            ) : (
              <Circle className={`${small ? 'w-5 h-5' : 'w-7 h-7'}`} />
            )}
          </button>
        ) : (
          <Circle
            className={`${small ? 'w-5 h-5' : 'w-7 h-7'} flex-shrink-0 text-slate-600`}
            aria-label="Lançamento pendente"
          />
        )}

        <div className="min-w-0">
          <p
            className={`font-bold ${small ? 'text-sm line-clamp-2' : 'text-base break-words'} ${
              isPaid ? 'text-slate-400 line-through' : 'text-white'
            }`}
          >
            {t.description}
          </p>
          <div className={`flex flex-wrap items-center gap-2 ${small ? 'mt-1.5' : 'mt-1'} text-xs font-medium`}>
            <span
              className={`px-2 py-0.5 rounded-md ${
                isPaid
                  ? 'bg-slate-800 text-slate-400'
                  : isOverdue
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" />
              {formatDatePT(t.due_date)}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{t.category_name || 'Categoria Geral'}</span>
            {t.total_installments > 1 && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Parcela {t.installment_number}/{t.total_installments}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center ${
          compact
            ? 'justify-end shrink-0 gap-2 sm:gap-4'
            : kanban
              ? 'justify-between w-full border-t border-slate-800/70 pt-2'
              : 'justify-between sm:justify-end gap-3 w-full sm:w-auto'
        }`}
      >
        <span
          className={`${small ? 'text-sm sm:text-base whitespace-nowrap' : 'text-lg'} font-black ${
            isPaid ? 'text-slate-500' : isIncome ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatCurrency(t.amount)}
        </span>
        <div className="flex items-center gap-2">
          {!isIncome && !isPaid && canSettleTransactions && (
            <button
              onClick={() => onPayExpenses([t])}
              disabled={payingExpenses}
              className={`flex items-center gap-1.5 ${
                small ? 'px-2 py-1.5 sm:px-2.5' : 'px-3 py-2'
              } rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold disabled:opacity-50`}
            >
              <CheckCircle2 className="w-4 h-4" /> Baixar
            </button>
          )}
          {(canEditTransactions || canDeleteTransactions) && (
            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {canEditTransactions && (
                <button
                  onClick={() => onEditModal(t)}
                  aria-label={`Editar ${t.description}`}
                  className={`${
                    small ? 'p-1.5' : 'p-2'
                  } bg-slate-800 text-slate-300 rounded-lg hover:text-emerald-400 hover:bg-slate-700 transition-colors shadow-sm`}
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {canDeleteTransactions && (
                <button
                  onClick={() => onDeleteModal(t)}
                  aria-label={`Excluir ${t.description}`}
                  className={`${
                    small ? 'p-1.5' : 'p-2'
                  } bg-slate-800 text-slate-300 rounded-lg hover:text-rose-400 hover:bg-slate-700 transition-colors shadow-sm`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PayablesSectionProps {
  filteredPayableTransactions: any[];
  filteredPayableTotal: number;
  payableExpenses: any[];
  selectedPayableExpenses: any[];
  allPayableExpensesSelected: boolean;
  payableView: 'LIST' | 'KANBAN';
  setPayableView: (view: 'LIST' | 'KANBAN') => void;
  selectedExpenseIds: string[];
  payingExpenses: boolean;
  canCreateTransactions: boolean;
  canSettleTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  onPrintPayableExpenses: () => void;
  onExportPayablePdf: () => void;
  onExportPayableExcel: () => void;
  onOpenNewExpenseModal: () => void;
  onSelectAllPayableExpenses: (selected: boolean) => void;
  onPaySelectedExpenses: () => void;
  onToggleStatus: (tx: any) => void;
  onExpenseSelection: (expenseId: string, selected: boolean) => void;
  onPayExpenses: (expenses: any[]) => void;
  onEditModal: (tx: any) => void;
  onDeleteModal: (tx: any) => void;
  filterBarProps: Omit<TransactionFilterBarProps, 'showPayableTotal' | 'filteredPayableTotal' | 'filteredPayableCount'>;
}

export function PayablesSection({
  filteredPayableTransactions,
  filteredPayableTotal,
  payableExpenses,
  selectedPayableExpenses,
  allPayableExpensesSelected,
  payableView,
  setPayableView,
  selectedExpenseIds,
  payingExpenses,
  canCreateTransactions,
  canSettleTransactions,
  canEditTransactions,
  canDeleteTransactions,
  onPrintPayableExpenses,
  onExportPayablePdf,
  onExportPayableExcel,
  onOpenNewExpenseModal,
  onSelectAllPayableExpenses,
  onPaySelectedExpenses,
  onToggleStatus,
  onExpenseSelection,
  onPayExpenses,
  onEditModal,
  onDeleteModal,
  filterBarProps,
}: PayablesSectionProps) {
  const payableKanbanColumns = [
    {
      key: 'OVERDUE',
      title: 'Atrasado',
      transactions: filteredPayableTransactions.filter(t => getTransactionStatus(t) === 'OVERDUE'),
      color: 'rose',
    },
    {
      key: 'PENDING',
      title: 'A pagar',
      transactions: filteredPayableTransactions.filter(t => getTransactionStatus(t) === 'PENDING'),
      color: 'amber',
    },
    {
      key: 'PAID',
      title: 'Pago',
      transactions: filteredPayableTransactions.filter(t => getTransactionStatus(t) === 'PAID'),
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Contas a Pagar</h2>
          <p className="text-slate-400 text-sm mt-1">Controle e organize as suas despesas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrintPayableExpenses}
            aria-label="Imprimir contas a pagar"
            title="Imprimir"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            type="button"
            onClick={onExportPayablePdf}
            aria-label="Exportar contas a pagar para PDF"
            title="Exportar PDF"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          <button
            type="button"
            onClick={onExportPayableExcel}
            aria-label="Exportar contas a pagar para planilha Excel"
            title="Exportar XLSX"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar XLSX</span>
          </button>
          {canCreateTransactions && (
            <button
              type="button"
              onClick={onOpenNewExpenseModal}
              className="hidden md:flex bg-emerald-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar
            </button>
          )}
        </div>
      </div>

      <TransactionFilterBar
        showPayableTotal
        filteredPayableTotal={filteredPayableTotal}
        filteredPayableCount={filteredPayableTransactions.length}
        {...filterBarProps}
      />

      <div className="flex justify-end">
        <div
          role="group"
          aria-label="Visualização das contas a pagar"
          className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1"
        >
          <button
            type="button"
            aria-pressed={payableView === 'LIST'}
            onClick={() => setPayableView('LIST')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              payableView === 'LIST' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" /> Lista
          </button>
          <button
            type="button"
            aria-pressed={payableView === 'KANBAN'}
            onClick={() => setPayableView('KANBAN')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              payableView === 'KANBAN' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" /> Kanban
          </button>
        </div>
      </div>

      {canSettleTransactions && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allPayableExpensesSelected}
              disabled={payableExpenses.length === 0 || payingExpenses}
              onChange={e => onSelectAllPayableExpenses(e.target.checked)}
              aria-label="Selecionar todos os lançamentos pendentes visíveis"
              className="h-4 w-4 accent-emerald-500 disabled:opacity-40"
            />
            Selecionar lançamentos pendentes
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {selectedPayableExpenses.length > 0 && (
              <span className="text-xs text-slate-400">{selectedPayableExpenses.length} selecionado(s)</span>
            )}
            <button
              onClick={onPaySelectedExpenses}
              disabled={selectedPayableExpenses.length === 0 || payingExpenses}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {payingExpenses ? 'Processando...' : 'Baixar selecionados'}
            </button>
          </div>
        </div>
      )}

      {payableView === 'LIST' ? (
        <div className="w-full space-y-2">
          {filteredPayableTransactions.length > 0 ? (
            filteredPayableTransactions.map(t => (
              <ModernTransactionRow
                key={t.id}
                transaction={t}
                isIncome={false}
                compact
                selectedExpenseIds={selectedExpenseIds}
                canSettleTransactions={canSettleTransactions}
                canEditTransactions={canEditTransactions}
                canDeleteTransactions={canDeleteTransactions}
                payingExpenses={payingExpenses}
                onToggleStatus={onToggleStatus}
                onExpenseSelection={onExpenseSelection}
                onPayExpenses={onPayExpenses}
                onEditModal={onEditModal}
                onDeleteModal={onDeleteModal}
              />
            ))
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-white font-bold text-lg">Tudo limpo por aqui!</p>
              <p className="text-slate-400 text-sm">Nenhuma conta encontrada para estes filtros.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {payableKanbanColumns.map(column => {
            const accentClasses =
              column.key === 'OVERDUE'
                ? 'border-rose-500/25 text-rose-400 bg-rose-500/10'
                : column.key === 'PENDING'
                  ? 'border-amber-500/25 text-amber-400 bg-amber-500/10'
                  : 'border-emerald-500/25 text-emerald-400 bg-emerald-500/10';
            const columnTotal = column.transactions.reduce(
              (total, transaction) => total + Number(transaction.amount || 0),
              0
            );

            return (
              <section
                key={column.key}
                aria-label={`${column.title}: ${column.transactions.length} lançamento(s)`}
                className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/50"
              >
                <header className="flex items-center justify-between gap-2 border-b border-slate-800 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-white">{column.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${accentClasses}`}>
                      {column.transactions.length}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-400">{formatCurrency(columnTotal)}</span>
                </header>
                <div className="space-y-2 p-2">
                  {column.transactions.length > 0 ? (
                    column.transactions.map(transaction => (
                      <ModernTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        isIncome={false}
                        kanban
                        selectedExpenseIds={selectedExpenseIds}
                        canSettleTransactions={canSettleTransactions}
                        canEditTransactions={canEditTransactions}
                        canDeleteTransactions={canDeleteTransactions}
                        payingExpenses={payingExpenses}
                        onToggleStatus={onToggleStatus}
                        onExpenseSelection={onExpenseSelection}
                        onPayExpenses={onPayExpenses}
                        onEditModal={onEditModal}
                        onDeleteModal={onDeleteModal}
                      />
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-500">
                      Nenhum lançamento
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ReceivablesSectionProps {
  filteredReceivableTransactions: any[];
  selectedExpenseIds: string[];
  payingExpenses: boolean;
  canCreateTransactions: boolean;
  canSettleTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  onOpenNewIncomeModal: () => void;
  onToggleStatus: (tx: any) => void;
  onExpenseSelection: (expenseId: string, selected: boolean) => void;
  onPayExpenses: (expenses: any[]) => void;
  onEditModal: (tx: any) => void;
  onDeleteModal: (tx: any) => void;
  filterBarProps: Omit<TransactionFilterBarProps, 'showPayableTotal' | 'filteredPayableTotal' | 'filteredPayableCount'>;
}

export function ReceivablesSection({
  filteredReceivableTransactions,
  selectedExpenseIds,
  payingExpenses,
  canCreateTransactions,
  canSettleTransactions,
  canEditTransactions,
  canDeleteTransactions,
  onOpenNewIncomeModal,
  onToggleStatus,
  onExpenseSelection,
  onPayExpenses,
  onEditModal,
  onDeleteModal,
  filterBarProps,
}: ReceivablesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Contas a Receber</h2>
          <p className="text-slate-400 text-sm mt-1">Monitorize as suas entradas e receitas previstas.</p>
        </div>
        {canCreateTransactions && (
          <button
            onClick={onOpenNewIncomeModal}
            className="hidden md:flex bg-emerald-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Adicionar
          </button>
        )}
      </div>

      <TransactionFilterBar
        filteredPayableTotal={0}
        filteredPayableCount={0}
        {...filterBarProps}
      />

      <div className="space-y-3">
        {filteredReceivableTransactions.length > 0 ? (
          filteredReceivableTransactions.map(t => (
            <ModernTransactionRow
              key={t.id}
              transaction={t}
              isIncome
              selectedExpenseIds={selectedExpenseIds}
              canSettleTransactions={canSettleTransactions}
              canEditTransactions={canEditTransactions}
              canDeleteTransactions={canDeleteTransactions}
              payingExpenses={payingExpenses}
              onToggleStatus={onToggleStatus}
              onExpenseSelection={onExpenseSelection}
              onPayExpenses={onPayExpenses}
              onEditModal={onEditModal}
              onDeleteModal={onDeleteModal}
            />
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-white font-bold text-lg">Sem previsões de entrada.</p>
            <p className="text-slate-400 text-sm">Nenhuma receita encontrada para estes filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface InvestmentGoalsSectionProps {
  transactions: any[];
  canManageGoals: boolean;
  canDeleteTransactions: boolean;
  onOpenNewGoalModal: () => void;
  onDeleteGoal: (firstInstallment: any) => void;
}

export function InvestmentGoalsSection({
  transactions,
  canManageGoals,
  canDeleteTransactions,
  onOpenNewGoalModal,
  onDeleteGoal,
}: InvestmentGoalsSectionProps) {
  const investmentGoals = Array.from<any[]>(
    transactions
      .filter(
        (transaction: any) =>
          typeof transaction.description === 'string' && transaction.description.startsWith('Objetivo:')
      )
      .reduce((groups, transaction: any) => {
        const goalId = transaction.parent_transaction_id || transaction.id;
        const installments = groups.get(goalId) || [];
        installments.push(transaction);
        groups.set(goalId, installments);
        return groups;
      }, new Map<string, any[]>())
      .values()
  ).map((installments: any[]) => {
    const firstInstallment =
      installments.find(transaction => Number(transaction.installment_number) === 1) || installments[0];
    const targetAmount = installments.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const paidInstallments = installments.filter(transaction => transaction.status === 'PAID');
    const paidAmount = paidInstallments.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    const totalInstallments = Math.max(...installments.map(transaction => Number(transaction.total_installments) || 1));
    const title = String(firstInstallment.description)
      .replace(/^Objetivo:\s*/, '')
      .replace(/\s+\(\d+\s*\/\s*\d+\)$/, '');

    return {
      id: firstInstallment.parent_transaction_id || firstInstallment.id,
      firstInstallment,
      title,
      targetAmount,
      paidAmount,
      paidInstallmentCount: paidInstallments.length,
      totalInstallments,
      progress: targetAmount > 0 ? Math.min(100, (paidAmount / targetAmount) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Metas & Objetivos de Investimento</h2>
          <p className="text-slate-400 text-sm">
            Defina objetivos e distribua o valor automaticamente nas contas a pagar na categoria &quot;Investimento&quot;.
          </p>
        </div>
        {canManageGoals && (
          <button
            onClick={onOpenNewGoalModal}
            className="self-start bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <PlusCircle className="w-5 h-5" /> Novo Objetivo
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {investmentGoals.length > 0 ? (
          investmentGoals.map(goal => (
            <div
              key={goal.id}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold text-white">{goal.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Objetivo de investimento</p>
                </div>
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between items-end gap-4">
                <div>
                  <p className="text-slate-400 text-xs uppercase">Valor acumulado</p>
                  <p className="font-black text-white text-lg">{formatCurrency(goal.paidAmount)}</p>
                  <p className="text-xs text-slate-500">de {formatCurrency(goal.targetAmount)}</p>
                </div>
                <span className="text-lg font-black text-emerald-400">{Math.round(goal.progress)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`Progresso do objetivo ${goal.title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(goal.progress)}
                className="h-2 rounded-full bg-slate-800 overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>
                  {goal.paidInstallmentCount} de {goal.totalInstallments} parcelas baixadas
                </span>
                {canDeleteTransactions && (
                  <button
                    onClick={() => onDeleteGoal(goal.firstInstallment)}
                    title="Excluir objetivo"
                    aria-label={`Excluir objetivo ${goal.title}`}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <Target className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-white font-bold text-lg">Nenhum objetivo cadastrado.</p>
            <p className="text-slate-400 text-sm">
              Clique em &quot;+ Novo Objetivo&quot; para começar a planear suas conquistas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
