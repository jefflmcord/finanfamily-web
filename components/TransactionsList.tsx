'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  Wallet, 
  Banknote, 
  FileText, 
  Tag, 
  Download, 
  FileSpreadsheet, 
  Printer,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  TrendingDown,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { authenticatedFetch } from '@/lib/apiClient';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  paid_amount?: number;
  interest_amount?: number;
  reversal_reason?: string;
  type: 'EXPENSE' | 'INCOME';
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  transaction_date: string;
  due_date: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  account_id?: string;
  account_name?: string;
  credit_card_name?: string;
  installment_number?: number;
  total_installments?: number;
  parent_transaction_id?: string;
}

interface Account {
  id: string;
  name: string;
}

interface TransactionsListProps {
  month: number;
  year: number;
  refreshTrigger?: number;
  defaultType?: 'EXPENSE' | 'INCOME';
  defaultStatus?: 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE';
  title?: string;
}

export default function TransactionsList({ 
  month, 
  year, 
  refreshTrigger, 
  defaultType, 
  defaultStatus = 'ALL', 
  title 
}: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const searchInputId = useId();
  const statusSelectId = useId();
  const methodSelectId = useId();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>(defaultStatus);
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CARD' | 'ACCOUNT' | 'BOLETO' | 'CASH'>('ALL');

  // Modal de Baixa (Pagar)
  const [payingItem, setPayingItem] = useState<Transaction | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Modal de Estorno
  const [reversingItem, setReversingItem] = useState<Transaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [submittingReversal, setSubmittingReversal] = useState(false);

  // Modal de Edição
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal de Exclusão
  const [deletingItem, setDeletingItem] = useState<Transaction | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  useEffect(() => {
    setStatusFilter(defaultStatus);
  }, [defaultStatus]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        authenticatedFetch(`${apiUrl}/api/transactions?family_id=${familyId}&month=${month}&year=${year}`).then(r => r.json()),
        authenticatedFetch(`${apiUrl}/api/accounts?family_id=${familyId}`).then(r => r.json())
      ]);

      if (Array.isArray(txRes)) setTransactions(txRes);
      if (Array.isArray(accRes)) {
        setAccounts(accRes);
        if (accRes.length > 0) setSelectedAccountId(accRes[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar transações e contas:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId, month, year]);

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

  const getStatusLabel = (status: string) => {
    if (status === 'PAID') return 'Pago';
    if (status === 'OVERDUE') return 'Vencido';
    return 'A vencer';
  };

  const getMethodLabel = (tx: Transaction) => {
    if (tx.credit_card_name) return `Cartão: ${tx.credit_card_name}`;
    if (tx.account_name) return `Conta: ${tx.account_name}`;
    return 'Boleto / Carnê';
  };

  // Funções de Pagamento (Baixa)
  function handleOpenPayModal(tx: Transaction) {
    setPayingItem(tx);
    setPaidAmount(String(tx.amount));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    if (tx.account_id) setSelectedAccountId(tx.account_id);
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingItem) return;

    setSubmittingPayment(true);
    try {
      const finalVal = Number(String(paidAmount).replace(',', '.')) || payingItem.amount;

      const res = await authenticatedFetch(`${apiUrl}/api/transactions/${payingItem.id}/pay`, {
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Funções de Estorno
  function handleOpenReverseModal(tx: Transaction) {
    setReversingItem(tx);
    setReversalReason('');
  }

  async function handleConfirmReverse(e: React.FormEvent) {
    e.preventDefault();
    if (!reversingItem) return;

    if (!reversalReason.trim()) {
      alert('Por favor, informe a justificativa para o estorno.');
      return;
    }

    setSubmittingReversal(true);
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/transactions/${reversingItem.id}/reverse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reversalReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao realizar o estorno.');
      }

      setReversingItem(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao estornar lançamento.');
    } finally {
      setSubmittingReversal(false);
    }
  }

  // Funções de Edição
  function openEditModal(tx: Transaction) {
    setEditingItem(tx);
    setEditDescription(tx.description);
    setEditAmount(String(tx.amount));
    setEditDueDate(tx.due_date.split('T')[0]);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    setSavingEdit(true);
    try {
      const formattedAmount = Number(String(editAmount).replace(',', '.')) || 0;

      const res = await authenticatedFetch(`${apiUrl}/api/transactions/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription,
          amount: formattedAmount,
          due_date: editDueDate,
          category_id: editingItem.category_id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao guardar alteração.');
      }

      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar edição.');
    } finally {
      setSavingEdit(false);
    }
  }

  // Funções de Exclusão
  async function handleConfirmDelete(deleteAll: boolean) {
    if (!deletingItem) return;

    setDeletingAll(true);
    try {
      const url = `${apiUrl}/api/transactions/${deletingItem.id}?delete_all_installments=${deleteAll}`;
      const res = await authenticatedFetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao excluir.');
      }

      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir lançamento.');
    } finally {
      setDeletingAll(false);
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (defaultType && tx.type !== defaultType) {
      return false;
    }

    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.category_name && tx.category_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    const matchesMethod = 
      methodFilter === 'ALL' ||
      (methodFilter === 'CARD' && !!tx.credit_card_name) ||
      (methodFilter === 'ACCOUNT' && !!tx.account_name && !tx.credit_card_name) ||
      (methodFilter === 'BOLETO' && !tx.credit_card_name && !tx.account_name) ||
      (methodFilter === 'CASH' && !tx.credit_card_name && !tx.account_name);

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalReceitas = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.paid_amount || t.amount), 0);

  const totalDespesas = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.paid_amount || t.amount), 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  // Exportar Excel
  const exportToExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('Não existem lançamentos para exportar.');
      return;
    }

    const rows = filteredTransactions.map((tx) => ({
      'Vencimento': formatDate(tx.due_date),
      'Descrição': tx.description,
      'Tipo': tx.type === 'INCOME' ? 'Receita' : 'Despesa',
      'Origem / Destino': getMethodLabel(tx),
      'Categoria': tx.category_name || 'Sem Categoria',
      'Status': getStatusLabel(tx.status),
      'Valor Nominal (R$)': Number(tx.amount) * (tx.type === 'EXPENSE' ? -1 : 1),
      'Valor Pago (R$)': tx.paid_amount ? Number(tx.paid_amount) * (tx.type === 'EXPENSE' ? -1 : 1) : '',
      'Juros/Multa (R$)': tx.interest_amount ? Number(tx.interest_amount) : 0,
      'Justificativa Estorno': tx.reversal_reason || ''
    }));

    rows.push({
      'Vencimento': '',
      'Descrição': '--- TOTAL RECEITAS ---',
      'Tipo': '',
      'Origem / Destino': '',
      'Categoria': '',
      'Status': '',
      'Valor Nominal (R$)': totalReceitas,
      'Valor Pago (R$)': '',
      'Juros/Multa (R$)': 0,
      'Justificativa Estorno': ''
    });
    rows.push({
      'Vencimento': '',
      'Descrição': '--- TOTAL DESPESAS ---',
      'Tipo': '',
      'Origem / Destino': '',
      'Categoria': '',
      'Status': '',
      'Valor Nominal (R$)': -totalDespesas,
      'Valor Pago (R$)': '',
      'Juros/Multa (R$)': 0,
      'Justificativa Estorno': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extrato');

    const fileName = `FinanFamily_Extrato_${String(month).padStart(2, '0')}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Exportar PDF
  const exportToPDF = () => {
    if (filteredTransactions.length === 0) {
      alert('Não existem lançamentos para exportar.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('FinanFamily - Extrato Financeiro Consolidado', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Período: ${String(month).padStart(2, '0')}/${year} | Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);

    const tableData = filteredTransactions.map((tx) => [
      formatDate(tx.due_date),
      tx.description,
      getMethodLabel(tx),
      tx.category_name || 'Geral',
      getStatusLabel(tx.status),
      `${tx.type === 'EXPENSE' ? '-' : '+'} ${formatCurrency(tx.paid_amount || tx.amount)}`
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Vencimento', 'Descrição', 'Origem / Destino', 'Categoria', 'Status', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } }
    });

    const fileName = `FinanFamily_Extrato_${String(month).padStart(2, '0')}_${year}.pdf`;
    doc.save(fileName);
  };

  const interestDiff = payingItem 
    ? Math.max(0, (Number(String(paidAmount).replace(',', '.')) || 0) - Number(payingItem.amount))
    : 0;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-5 print:bg-transparent print:border-none print:p-0 print:space-y-4">
      {/* CABEÇALHO PARA IMPRESSÃO */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black tracking-tight text-black">FinanFamily</h1>
            <p className="text-xs text-slate-600 mt-0.5">Gestão Financeira Consolidada da Família</p>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <p className="font-bold text-slate-900 text-xs">
              Extrato Mensal: {String(month).padStart(2, '0')}/{year}
            </p>
            <p>Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* CABEÇALHO NA TELA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            {title || `Extrato Consolidado (${String(month).padStart(2, '0')}/${year})`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Histórico completo de receitas e despesas</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-xl font-medium mr-1">
            {filteredTransactions.length} registo{filteredTransactions.length === 1 ? '' : 's'}
          </span>

          <button
            onClick={exportToExcel}
            title="Exportar para Excel (.xlsx)"
            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            XLSX
          </button>

          <button
            onClick={exportToPDF}
            title="Baixar em formato PDF"
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>

          <button
            onClick={() => window.print()}
            title="Imprimir Extrato"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">Pesquisar descrição ou categoria</label>
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            id={searchInputId}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar descrição ou categoria..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="relative">
          <label htmlFor={statusSelectId} className="sr-only">Filtrar por estado</label>
          <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <select
            id={statusSelectId}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="PAID">Pago</option>
            <option value="PENDING">A vencer</option>
            <option value="OVERDUE">Vencido</option>
          </select>
        </div>

        <div className="relative">
          <label htmlFor={methodSelectId} className="sr-only">Filtrar por modalidade</label>
          <Wallet className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <select
            id={methodSelectId}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Todas as Modalidades</option>
            <option value="BOLETO">Boleto / Carnê</option>
            <option value="CARD">Cartão de Crédito</option>
            <option value="ACCOUNT">Conta Bancária</option>
            <option value="CASH">Dinheiro em Espécie</option>
          </select>
        </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 print:hidden">
          A carregar extrato de transações...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Nenhum registo encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="w-full overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:w-full print:table-fixed">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider print:border-b-2 print:border-slate-800 print:text-black">
                <th className="py-2.5 px-2 print:w-[13%] print:px-1">Vencimento</th>
                <th className="py-2.5 px-3 print:w-[30%] print:px-2">Descrição</th>
                <th className="py-2.5 px-3 print:w-[18%] print:px-2">Origem / Destino</th>
                <th className="py-2.5 px-3 print:w-[14%] print:px-1">Categoria</th>
                <th className="py-2.5 px-3 text-center print:w-[10%] print:px-1">Estado</th>
                <th className="py-2.5 px-3 text-right print:w-[15%] print:px-1">Valor</th>
                <th className="py-2.5 px-3 text-center print:hidden w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 print:divide-slate-300 print:text-slate-900">
              {filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                const isPaid = tx.status === 'PAID';
                const displayAmount = tx.paid_amount || tx.amount;

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                    <td className="py-2.5 px-2 whitespace-nowrap text-slate-400 print:text-black print:px-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 print:hidden" />
                        <span>{formatDate(tx.due_date)}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-200 print:text-black print:px-2 print:truncate">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.description}</span>
                        {tx.reversal_reason && (
                          <span 
                            title={`Estornado anteriormente. Motivo: ${tx.reversal_reason}`} 
                            className="text-amber-400 inline-flex items-center cursor-help"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap print:px-2 print:truncate">
                      {tx.credit_card_name ? (
                        <span className="flex items-center gap-1.5 text-indigo-400 print:text-black">
                          <CreditCard className="w-3.5 h-3.5 print:hidden" />
                          {tx.credit_card_name}
                        </span>
                      ) : tx.account_name ? (
                        <span className="flex items-center gap-1.5 text-blue-400 print:text-black">
                          <Wallet className="w-3.5 h-3.5 print:hidden" />
                          {tx.account_name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-400 print:text-black">
                          <FileText className="w-3.5 h-3.5 print:hidden" />
                          Boleto / Carnê
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 print:text-slate-800 print:px-1 print:truncate">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-slate-500 print:hidden" />
                        {tx.category_name || 'Sem Categoria'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-center print:px-1">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-none print:text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 print:hidden" />
                          Pago
                        </span>
                      ) : tx.status === 'OVERDUE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 print:border-none print:text-rose-700">
                          <AlertTriangle className="w-3 h-3 print:hidden" />
                          Vencido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 print:border-none print:text-amber-700">
                          <Clock className="w-3 h-3 print:hidden" />
                          A vencer
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-bold print:px-1">
                      <div className="flex flex-col items-end">
                        <span className={isExpense ? 'text-rose-400 print:text-rose-700' : 'text-emerald-400 print:text-emerald-700'}>
                          {isExpense ? '- ' : '+ '}
                          {formatCurrency(displayAmount)}
                        </span>
                        {Boolean(tx.interest_amount && tx.interest_amount > 0) && (
                          <span className="text-[10px] text-amber-400/90 font-normal">
                            (Juros: +{formatCurrency(tx.interest_amount || 0)})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COLUNA DE AÇÕES COM BAIXA E ESTORNO */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {/* Se estiver pendente ou vencido: botão de PAGAR */}
                        {!isPaid ? (
                          <button
                            onClick={() => handleOpenPayModal(tx)}
                            title="Dar Baixa / Pagar"
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Pagar
                          </button>
                        ) : (
                          /* Se estiver pago: botão de ESTORNAR */
                          <button
                            onClick={() => handleOpenReverseModal(tx)}
                            title="Estornar Pagamento"
                            className="p-1.5 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(tx)}
                          title="Editar"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(tx)}
                          title="Excluir"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* BOX DE TOTAIS */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap justify-end gap-6 text-xs text-slate-300 print:border-t-2 print:border-slate-800 print:text-black print:mt-3 print:pt-2">
            <div>
              Total Receitas: <strong className="text-emerald-400 print:text-emerald-800">{formatCurrency(totalReceitas)}</strong>
            </div>
            <div>
              Total Despesas: <strong className="text-rose-400 print:text-rose-800">{formatCurrency(totalDespesas)}</strong>
            </div>
            <div>
              Saldo Líquido: <strong className={saldoLiquido >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}>
                {formatCurrency(saldoLiquido)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BAIXA (PAGAR) */}
      {payingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor Nominal Previsto</label>
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

      {/* MODAL DE ESTORNO DE PAGAMENTO */}
      {reversingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setReversingItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Estornar Pagamento</h3>
                <p className="text-xs text-slate-400">Reverter lançamento para estado pendente</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Você está prestes a estornar a baixa de: <strong className="text-white">"{reversingItem.description}"</strong> no valor de <strong className="text-emerald-400">{formatCurrency(reversingItem.paid_amount || reversingItem.amount)}</strong>.
            </p>

            <form onSubmit={handleConfirmReverse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">
                  Justificativa do Estorno (obrigatório)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Ex: Baixa indevida; agendamento cancelado no banco; valor registrado errado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReversingItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReversal}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {submittingReversal ? 'Estornando...' : 'Confirmar Estorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">Editar Lançamento</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  required
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl transition-colors cursor-pointer"
                >
                  {savingEdit ? 'A guardar...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Excluir Lançamento</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tem a certeza de que deseja excluir <strong className="text-slate-200">"{deletingItem.description}"</strong>?
            </p>

            <div className="flex flex-col gap-2">
              {(deletingItem.total_installments && deletingItem.total_installments > 1) ? (
                <>
                  <button
                    onClick={() => handleConfirmDelete(false)}
                    disabled={deletingAll}
                    className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Excluir apenas esta parcela
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(true)}
                    disabled={deletingAll}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Excluir todas as parcelas ({deletingItem.total_installments}x)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConfirmDelete(false)}
                  disabled={deletingAll}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              )}

              <button
                onClick={() => setDeletingItem(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors mt-1 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}