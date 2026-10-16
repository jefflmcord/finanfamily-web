export interface CardBillingPeriod {
  periodStart: string;
  closingDate: string;
  dueDate: string;
}

function toDateKey(date: Date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getClosingDate(year: number, monthIndex: number, closingDay: number) {
  const month = new Date(year, monthIndex, 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return new Date(month.getFullYear(), month.getMonth(), Math.min(Math.max(1, closingDay), lastDay));
}

function getDueDate(closingDate: Date, closingDay: number, dueDay: number) {
  const dueMonthOffset = dueDay < closingDay ? 1 : 0;
  const dueMonth = new Date(closingDate.getFullYear(), closingDate.getMonth() + dueMonthOffset, 1);
  const lastDay = new Date(dueMonth.getFullYear(), dueMonth.getMonth() + 1, 0).getDate();
  return new Date(dueMonth.getFullYear(), dueMonth.getMonth(), Math.min(Math.max(1, dueDay), lastDay));
}

export function getCardPurchaseDueDate(transactionDate: string, closingDay: number, dueDay: number) {
  const [year, month, day] = transactionDate.slice(0, 10).split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return transactionDate.slice(0, 10);

  const purchaseMonth = new Date(year, month - 1, 1);
  const lastDay = new Date(purchaseMonth.getFullYear(), purchaseMonth.getMonth() + 1, 0).getDate();
  const effectiveClosingDay = Math.min(Math.max(1, closingDay), lastDay);
  const closeMonthOffset = day >= effectiveClosingDay ? 1 : 0;
  const closeDate = getClosingDate(purchaseMonth.getFullYear(), purchaseMonth.getMonth() + closeMonthOffset, closingDay);

  return toDateKey(getDueDate(closeDate, closingDay, dueDay));
}

export function getCurrentCardBillingPeriod(
  closingDay: number,
  dueDay: number,
  referenceDate = new Date()
): CardBillingPeriod {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const currentMonthClosing = getClosingDate(today.getFullYear(), today.getMonth(), closingDay);
  let closingDate = today >= currentMonthClosing
    ? currentMonthClosing
    : getClosingDate(today.getFullYear(), today.getMonth() - 1, closingDay);
  let dueDate = getDueDate(closingDate, closingDay, dueDay);

  if (today > dueDate) {
    closingDate = getClosingDate(closingDate.getFullYear(), closingDate.getMonth() + 1, closingDay);
    dueDate = getDueDate(closingDate, closingDay, dueDay);
  }

  const previousClosing = getClosingDate(closingDate.getFullYear(), closingDate.getMonth() - 1, closingDay);
  const periodStart = new Date(previousClosing.getFullYear(), previousClosing.getMonth(), previousClosing.getDate() + 1);

  return {
    periodStart: toDateKey(periodStart),
    closingDate: toDateKey(closingDate),
    dueDate: toDateKey(dueDate),
  };
}