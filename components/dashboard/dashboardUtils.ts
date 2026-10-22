import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type InterfaceTheme = 'dark' | 'light';
export type SettingsSection = 'profile' | 'appearance' | 'family';
export type DashboardModule = 'cadastros' | 'pagar' | 'receber' | 'investimentos';
export type FilterPeriod = 'CURRENT_MONTH' | 'CURRENT_YEAR' | 'LAST_60_DAYS' | 'CUSTOM' | 'ALL';
export type FilterStatus = 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE';
export type ChartStatusMode = 'ALL' | 'PAID' | 'PENDING';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
  birth_date: string;
  bio: string;
  has_password?: boolean;
}

export interface FamilySubscriptionInfo {
  familyName: string;
  planType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'COURTESY';
  registeredAt: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  contactPhone: string;
}

export interface FamilyAccess {
  familyId: string;
  role: 'OWNER' | 'MEMBER';
  permissions: Record<string, boolean>;
  broadcast?: {
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING';
  };
  subscription?: FamilySubscriptionInfo;
}

export interface SettlementEntry {
  transaction: any;
  accountId: string;
  paidAmount: string;
}

export const MONTH_SHORT_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MONTH_FULL_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const CATEGORY_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#a855f7', '#f43f5e', '#6366f1'];

export const formatCurrency = (val: any): string => {
  const n = Number(val);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(n) ? 0 : n);
};

export const formatCompactCurrency = (val: number): string => {
  const absVal = Math.abs(val);
  if (absVal >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (absVal >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
  return `R$ ${val.toFixed(0)}`;
};

export const formatDatePT = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

export const getTransactionStatus = (t: any): 'PAID' | 'OVERDUE' | 'PENDING' => {
  if (t.status === 'PAID') return 'PAID';
  const today = new Date().toISOString().split('T')[0];
  const dueDate = t.due_date ? t.due_date.split('T')[0] : '';
  if (dueDate && dueDate < today) return 'OVERDUE';
  return 'PENDING';
};

export const getTxYearMonth = (t: any): { year: number; month: number } | null => {
  const raw = t.due_date || t.transaction_date;
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.split('T')[0];
  const parts = clean.split('-');
  if (parts.length < 2) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return null;
  return { year: y, month: m };
};

export interface PayableReportRow {
  dueDate: string;
  description: string;
  category: string;
  paymentMethod: string;
  status: string;
  amount: number;
}

export function generateMonthlySummaryPdf(params: {
  userName: string;
  monthlySummaryLabel: string;
  monthlySummaryPeriod: { year: number; month: number };
  monthlySummaryIncome: number;
  monthlySummaryReceived: number;
  monthlySummaryPendingIncome: number;
  monthlySummaryExpenses: number;
  monthlySummaryPaidExpenses: number;
  monthlySummaryPendingExpenses: number;
  monthlySummaryNetProjected: number;
  monthlySummaryNetRealized: number;
  monthlySummaryOverdueCount: number;
  monthlySummaryOverdue: number;
  monthlySummaryTopCategories: [string, number][];
}) {
  const {
    userName,
    monthlySummaryLabel,
    monthlySummaryPeriod,
    monthlySummaryIncome,
    monthlySummaryReceived,
    monthlySummaryPendingIncome,
    monthlySummaryExpenses,
    monthlySummaryPaidExpenses,
    monthlySummaryPendingExpenses,
    monthlySummaryNetProjected,
    monthlySummaryNetRealized,
    monthlySummaryOverdueCount,
    monthlySummaryOverdue,
    monthlySummaryTopCategories,
  } = params;

  const document = new jsPDF();
  document.setFontSize(18);
  document.setTextColor(15, 23, 42);
  document.text('Resumo mensal da família', 14, 18);
  document.setFontSize(10);
  document.setTextColor(71, 85, 105);
  document.text(`FinanFamily • ${userName} • ${monthlySummaryLabel}`, 14, 26);
  document.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 32);

  autoTable(document, {
    startY: 39,
    head: [['Indicador', 'Valor']],
    body: [
      ['Receitas previstas', formatCurrency(monthlySummaryIncome)],
      ['Receitas recebidas', formatCurrency(monthlySummaryReceived)],
      ['A receber', formatCurrency(monthlySummaryPendingIncome)],
      ['Despesas previstas', formatCurrency(monthlySummaryExpenses)],
      ['Despesas pagas', formatCurrency(monthlySummaryPaidExpenses)],
      ['Despesas em aberto', formatCurrency(monthlySummaryPendingExpenses)],
      ['Resultado previsto', formatCurrency(monthlySummaryNetProjected)],
      ['Resultado realizado', formatCurrency(monthlySummaryNetRealized)],
      [`Em atraso (${monthlySummaryOverdueCount} lançamento(s))`, formatCurrency(monthlySummaryOverdue)],
    ],
    styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right', cellWidth: 55 } },
  });

  autoTable(document, {
    startY: 145,
    head: [['Principais categorias de despesas', 'Total']],
    body:
      monthlySummaryTopCategories.length > 0
        ? monthlySummaryTopCategories.map(([category, amount]) => [category, formatCurrency(amount)])
        : [['Nenhuma despesa registrada no período', '—']],
    styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right', cellWidth: 55 } },
  });

  document.save(`resumo-familia-${monthlySummaryPeriod.year}-${String(monthlySummaryPeriod.month).padStart(2, '0')}.pdf`);
}

export function generatePayableExpensesExcel(rows: PayableReportRow[], userName: string, filtersLabel: string) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['FinanFamily — Contas a Pagar'],
    [`Família: ${userName}`],
    [`Filtros: ${filtersLabel}`],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [],
    ['Vencimento', 'Descrição', 'Categoria', 'Conta / Cartão', 'Status', 'Valor'],
    ...rows.map(row => [
      row.dueDate,
      row.description,
      row.category,
      row.paymentMethod,
      row.status,
      row.amount,
    ]),
    [],
    ['', '', '', '', 'Total', total],
  ]);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 36 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
  ];
  const dataRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:F1');
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 5, c: 0 }, e: { r: Math.max(5, 5 + rows.length), c: 5 } }),
  };
  for (let row = 6; row <= dataRange.e.r; row += 1) {
    const amountCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })];
    if (amountCell && typeof amountCell.v === 'number') amountCell.z = '"R$" #,##0.00';
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contas a Pagar');
  XLSX.writeFile(workbook, `contas-a-pagar-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function generatePayableExpensesPdf(rows: PayableReportRow[], userName: string, filtersLabel: string) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  document.setFontSize(18);
  document.setTextColor(15, 23, 42);
  document.text('Contas a Pagar', 14, 18);
  document.setFontSize(9);
  document.setTextColor(71, 85, 105);
  document.text(`FinanFamily • ${userName}`, 14, 25);
  document.text(`Filtros: ${filtersLabel}`, 14, 31);
  document.text(`Gerado em ${new Date().toLocaleString('pt-BR')} • ${rows.length} lançamento(s)`, 14, 37);

  autoTable(document, {
    startY: 43,
    head: [['Vencimento', 'Descrição', 'Categoria', 'Conta / Cartão', 'Status', 'Valor']],
    body: rows.map(row => [
      row.dueDate,
      row.description,
      row.category,
      row.paymentMethod,
      row.status,
      formatCurrency(row.amount),
    ]),
    foot: [['', '', '', '', 'Total', formatCurrency(total)]],
    showFoot: 'lastPage',
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { cellWidth: 68 }, 2: { cellWidth: 42 }, 3: { cellWidth: 42 }, 5: { halign: 'right' } },
    didDrawPage: () => {
      document.setFontSize(8);
      document.setTextColor(100, 116, 139);
      document.text(
        `Página ${document.getNumberOfPages()}`,
        document.internal.pageSize.getWidth() - 14,
        document.internal.pageSize.getHeight() - 7,
        { align: 'right' }
      );
    },
  });

  document.save(`contas-a-pagar-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function openPayableExpensesPrintWindow(
  rows: PayableReportRow[],
  userName: string,
  filtersLabel: string,
  onError: (msg: string) => void
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    onError('Permita pop-ups para imprimir a listagem de contas a pagar.');
    return;
  }
  printWindow.opener = null;

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, character =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[character] || character)
    );
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const tableRows = rows
    .map(
      row => `
      <tr>
        <td>${escapeHtml(row.dueDate)}</td>
        <td>${escapeHtml(row.description)}</td>
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.paymentMethod)}</td>
        <td>${escapeHtml(row.status)}</td>
        <td class="amount">${escapeHtml(formatCurrency(row.amount))}</td>
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Contas a Pagar - FinanFamily</title>
          <style>
            @page { size: A4 landscape; margin: 14mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #172033; font: 12px Arial, sans-serif; }
            header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #10b981; }
            h1 { margin: 0 0 5px; font-size: 22px; }
            p { margin: 3px 0; color: #64748b; }
            .brand { font-weight: 700; color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th { background: #f1f5f9; text-align: left; color: #334155; }
            th, td { padding: 8px 9px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .amount { text-align: right; white-space: nowrap; }
            tfoot td { font-weight: 700; border-top: 2px solid #94a3b8; }
            @media print { thead { display: table-header-group; } tr { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>Contas a Pagar</h1>
              <p>${escapeHtml(filtersLabel)}</p>
              <p>${rows.length} lançamento(s) • Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>
            </div>
            <div class="brand">FinanFamily<br>${escapeHtml(userName)}</div>
          </header>
          <table>
            <thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th>Conta / Cartão</th><th>Status</th><th class="amount">Valor</th></tr></thead>
            <tbody>${tableRows || '<tr><td colspan="6">Nenhum lançamento encontrado para estes filtros.</td></tr>'}</tbody>
            <tfoot><tr><td colspan="5" class="amount">Total</td><td class="amount">${escapeHtml(formatCurrency(total))}</td></tr></tfoot>
          </table>
        </body>
      </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
