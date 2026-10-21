export interface ParsedStatementItem {
  id: string;
  selected: boolean;
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  transactionDate: string;
  categoryId: string;
}

const MONTH_NAME_MAP: Record<string, string> = {
  jan: '01',
  fev: '02',
  mar: '03',
  abr: '04',
  mai: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  set: '09',
  out: '10',
  nov: '11',
  dez: '12',
};

const IGNORED_LINE_PATTERNS = [
  /saldo\s+(anterior|atual|final|do\s+dia|dispon[ií]vel)/i,
  /total\s+(da\s+fatura|de\s+lan[cç]amentos|a\s+pagar|geral)/i,
  /pagamento\s+m[ií]nimo/i,
  /limite\s+(total|dispon[ií]vel|utilizado)/i,
  /encargos\s+rotativos/i,
  /cet\s+anual/i,
];

const CATEGORY_KEYWORD_RULES: Array<{
  flow: 'EXPENSE' | 'INCOME';
  categoryHints: string[];
  keywords: string[];
}> = [
  {
    flow: 'EXPENSE',
    categoryHints: ['transporte', 'combust', 'auto', 'veíc', 'veic', 'carro', 'mobilidade'],
    keywords: [
      'uber',
      '99app',
      '99*',
      '99 pop',
      'posto',
      'ipiranga',
      'shell',
      'petrobras',
      'combustivel',
      'gasolina',
      'etanol',
      'estacionamento',
      'sem parar',
      'veloe',
      'conectcar',
      'pedagio',
      'oficina',
      'mecanica',
    ],
  },
  {
    flow: 'EXPENSE',
    categoryHints: ['supermercado', 'alimenta', 'mercado', 'feira', 'restaurante', 'comida'],
    keywords: [
      'mercado',
      'supermercado',
      'hipermercado',
      'assai',
      'atacadao',
      'carrefour',
      'condor',
      'muffato',
      'festval',
      'angeloni',
      'pao de acucar',
      'ifood',
      'ifd*',
      'rappi',
      'padaria',
      'panificadora',
      'restaurante',
      'lanchonete',
      'burger',
      'mcdonalds',
      'bk ',
      'pizza',
      'acougue',
      'hortifruti',
      'cafe',
    ],
  },
  {
    flow: 'EXPENSE',
    categoryHints: ['moradia', 'casa', 'conta', 'habit', 'aluguel'],
    keywords: [
      'aluguel',
      'condominio',
      'copel',
      'sanepar',
      'sabesp',
      'enel',
      'cemig',
      'light',
      'celesc',
      'energia',
      'agua',
      'internet',
      'vivo',
      'claro',
      'tim',
      'oi ',
      'gas ',
      'iptu',
    ],
  },
  {
    flow: 'EXPENSE',
    categoryHints: ['saúde', 'saude', 'farmácia', 'farmacia', 'médic', 'medic'],
    keywords: [
      'farmacia',
      'drogaria',
      'droga raia',
      'drogasil',
      'panvel',
      'nissei',
      'pague menos',
      'unimed',
      'hospital',
      'clinica',
      'consulta',
      'exame',
      'laboratorio',
      'dentista',
      'odonto',
      'academia',
      'smartfit',
    ],
  },
  {
    flow: 'EXPENSE',
    categoryHints: ['lazer', 'assinatura', 'streaming', 'diversão', 'diversao', 'compras'],
    keywords: [
      'netflix',
      'spotify',
      'amazon',
      'prime',
      'disney',
      'hbo',
      'max',
      'youtube',
      'apple.com',
      'google',
      'cinema',
      'ingresso',
      'shopping',
      'hotel',
      'airbnb',
      'booking',
      'steam',
      'playstation',
      'xbox',
      'mercadolivre',
      'mercado livre',
      'shopee',
      'shein',
      'magalu',
    ],
  },
  {
    flow: 'EXPENSE',
    categoryHints: ['investimento'],
    keywords: ['cdb', 'tesouro', 'fii', 'investimento', 'aplicacao', 'caixinha', 'reserva', 'corretora', 'xp ', 'btg'],
  },
  {
    flow: 'INCOME',
    categoryHints: ['salário', 'salario', 'pró-labore', 'pro-labore', 'renda', 'receita'],
    keywords: ['salario', 'pagamento', 'pro-labore', 'remuneracao', 'adiantamento', 'folha', 'pix recebido', 'ted recebida'],
  },
];

export function suggestCategoryForDescription(
  description: string,
  type: 'EXPENSE' | 'INCOME',
  categories: Array<{ id: string | number; name: string; flow_type: string }>
): string {
  const normalizedDesc = description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const matchingFlowCategories = categories.filter(c => c.flow_type === type);
  if (matchingFlowCategories.length === 0) return '';

  for (const rule of CATEGORY_KEYWORD_RULES) {
    if (rule.flow !== type) continue;
    const matchedKeyword = rule.keywords.some(kw => normalizedDesc.includes(kw));
    if (matchedKeyword) {
      const matchedCat = matchingFlowCategories.find(c => {
        const catNorm = String(c.name || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return rule.categoryHints.some(hint => catNorm.includes(hint));
      });
      if (matchedCat) return String(matchedCat.id);
    }
  }

  // Fallback para primeira categoria não-Investimento se for despesa
  if (type === 'EXPENSE') {
    const nonInvestment = matchingFlowCategories.find(
      c => String(c.name || '').toLowerCase() !== 'investimento'
    );
    return nonInvestment ? String(nonInvestment.id) : String(matchingFlowCategories[0].id);
  }

  return String(matchingFlowCategories[0].id);
}

export function normalizeDateString(rawDate: string): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const clean = rawDate.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.slice(0, 10);
  }

  // YYYYMMDD (OFX)
  if (/^\d{8}/.test(clean)) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }

  // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const dmyFull = clean.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dmyFull) {
    const day = dmyFull[1].padStart(2, '0');
    const month = dmyFull[2].padStart(2, '0');
    const year = dmyFull[3].length === 2 ? `20${dmyFull[3]}` : dmyFull[3];
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // DD/MM
  const dmShort = clean.match(/^(\d{1,2})[/.-](\d{1,2})$/);
  if (dmShort) {
    const day = dmShort[1].padStart(2, '0');
    const month = dmShort[2].padStart(2, '0');
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${currentYear}-${month}-${day}`;
    }
  }

  // DD MMM (ex: 15 OUT, 03 Nov)
  const dmText = clean.match(/^(\d{1,2})\s+([a-zA-ZçÇ]{3})/);
  if (dmText) {
    const day = dmText[1].padStart(2, '0');
    const monthKey = dmText[2].toLowerCase().slice(0, 3);
    const month = MONTH_NAME_MAP[monthKey];
    if (month) {
      return `${currentYear}-${month}-${day}`;
    }
  }

  return today.toISOString().split('T')[0];
}

export function parseMonetaryValue(raw: string): number | null {
  const cleaned = raw
    .replace(/R\$\s*/gi, '')
    .replace(/\s+/g, '')
    .trim();
  if (!cleaned) return null;

  const isNegative = cleaned.startsWith('-') || (cleaned.startsWith('(') && cleaned.endsWith(')')) || /D$/i.test(cleaned);
  const digitsAndSep = cleaned.replace(/[^0-9.,]/g, '');
  if (!digitsAndSep) return null;

  let normalized = digitsAndSep;
  const lastComma = digitsAndSep.lastIndexOf(',');
  const lastDot = digitsAndSep.lastIndexOf('.');

  if (lastComma > lastDot) {
    normalized = digitsAndSep.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    normalized = digitsAndSep.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    normalized = digitsAndSep.replace(',', '.');
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  return isNegative ? -Math.abs(parsed) : parsed;
}

export function parseOfxContent(
  content: string,
  categories: Array<{ id: string | number; name: string; flow_type: string }>,
  defaultTargetType: 'ACCOUNT' | 'CARD'
): ParsedStatementItem[] {
  const items: ParsedStatementItem[] = [];
  const blocks = content.split(/<STMTTRN>/i).slice(1);

  blocks.forEach((block, index) => {
    const amountMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
    const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);
    const typeMatch = block.match(/<TRNTYPE>([^<\r\n]+)/i);

    const rawAmount = amountMatch ? parseMonetaryValue(amountMatch[1]) : null;
    if (rawAmount === null) return;

    const description = (memoMatch?.[1] || nameMatch?.[1] || 'Lançamento OFX').trim();
    if (/pagamento\s+recebido|fatura\s+paga/i.test(description) && defaultTargetType === 'CARD') {
      return;
    }

    const trnType = (typeMatch?.[1] || '').trim().toUpperCase();
    const isIncome =
      defaultTargetType === 'ACCOUNT' &&
      (rawAmount > 0 && trnType !== 'DEBIT' && trnType !== 'PAYMENT');
    const flowType: 'EXPENSE' | 'INCOME' = isIncome ? 'INCOME' : 'EXPENSE';
    const txDate = dateMatch ? normalizeDateString(dateMatch[1]) : new Date().toISOString().split('T')[0];

    items.push({
      id: `ofx-${index}-${Date.now()}`,
      selected: true,
      description,
      amount: Math.abs(rawAmount),
      type: flowType,
      transactionDate: txDate,
      categoryId: suggestCategoryForDescription(description, flowType, categories),
    });
  });

  return items;
}

export function parseCsvContent(
  content: string,
  categories: Array<{ id: string | number; name: string; flow_type: string }>,
  defaultTargetType: 'ACCOUNT' | 'CARD'
): ParsedStatementItem[] {
  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const sampleLine = lines[0];
  const delimiter = sampleLine.includes(';') ? ';' : sampleLine.includes('\t') ? '\t' : ',';

  const splitCsvLine = (line: string): string[] => {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        cols.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim().replace(/^"|"$/g, ''));
    return cols;
  };

  const rows = lines.map(splitCsvLine);
  const header = rows[0].map(h =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  );

  let dateIdx = header.findIndex(h => /data|date|vencimento|lancamento/.test(h));
  let descIdx = header.findIndex(h => /descri|historico|titulo|title|estabelecimento|memo|nome|lancamento/.test(h));
  let amountIdx = header.findIndex(h => /valor|amount|quantia|total|preco/.test(h));

  const hasHeader = dateIdx !== -1 || descIdx !== -1 || amountIdx !== -1;
  const startRow = hasHeader ? 1 : 0;

  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = rows[0].length >= 3 ? 1 : 0;
  if (amountIdx === -1) amountIdx = rows[0].length - 1;

  const items: ParsedStatementItem[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx] || cols[0] || '';
    const rawAmountStr = cols[amountIdx] ?? cols[cols.length - 1] ?? '';
    let description = cols[descIdx] || '';

    if (descIdx === dateIdx || !description) {
      description = cols
        .filter((_, idx) => idx !== dateIdx && idx !== amountIdx)
        .join(' • ')
        .trim();
    }

    const parsedAmount = parseMonetaryValue(rawAmountStr);
    if (parsedAmount === null || !description) continue;
    if (IGNORED_LINE_PATTERNS.some(pattern => pattern.test(description))) continue;

    const flowType: 'EXPENSE' | 'INCOME' =
      defaultTargetType === 'CARD'
        ? 'EXPENSE'
        : parsedAmount < 0
          ? 'EXPENSE'
          : /pix\s+enviado|pagamento|compra|debito|tarifa|boleto/i.test(description)
            ? 'EXPENSE'
            : 'INCOME';

    items.push({
      id: `csv-${i}-${Date.now()}`,
      selected: true,
      description: description.slice(0, 140),
      amount: Math.abs(parsedAmount),
      type: flowType,
      transactionDate: normalizeDateString(rawDate),
      categoryId: suggestCategoryForDescription(description, flowType, categories),
    });
  }

  return items;
}

export function extractTransactionsFromRawText(
  rawText: string,
  categories: Array<{ id: string | number; name: string; flow_type: string }>,
  defaultTargetType: 'ACCOUNT' | 'CARD'
): ParsedStatementItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length >= 6);

  const items: ParsedStatementItem[] = [];
  const lineRegex =
    /^(?:(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[a-zA-ZçÇ]{3})\s+)?(.+?)\s+(-?\s*(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\s*(?:R\$\s*)?\d+\.\d{2})\s*([CD])?$/i;

  let lastSeenDate = new Date().toISOString().split('T')[0];

  lines.forEach((line, idx) => {
    const standaloneDate = line.match(/^(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?|\d{1,2}\s+[a-zA-ZçÇ]{3})$/);
    if (standaloneDate) {
      lastSeenDate = normalizeDateString(standaloneDate[1]);
      return;
    }

    const match = line.match(lineRegex);
    if (!match) return;

    const [, dateToken, rawDesc, amountToken, creditDebitFlag] = match;
    const description = rawDesc
      .replace(/^[-•*|\s]+|[-•*|\s]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (description.length < 2 || /^\d+$/.test(description)) return;
    if (IGNORED_LINE_PATTERNS.some(pattern => pattern.test(description))) return;

    const parsedAmount = parseMonetaryValue(amountToken);
    if (parsedAmount === null || Math.abs(parsedAmount) > 5_000_000) return;

    const txDate = dateToken ? normalizeDateString(dateToken) : lastSeenDate;
    if (dateToken) {
      lastSeenDate = txDate;
    }

    const isNegativeOrDebit =
      parsedAmount < 0 ||
      String(creditDebitFlag || '').toUpperCase() === 'D' ||
      /pix\s+enviado|compra|pagamento\s+de|debito/i.test(description);

    const flowType: 'EXPENSE' | 'INCOME' =
      defaultTargetType === 'CARD'
        ? 'EXPENSE'
        : isNegativeOrDebit
          ? 'EXPENSE'
          : /pix\s+recebido|salario|ted\s+recebida|deposito|credito\s+em\s+conta/i.test(description)
            ? 'INCOME'
            : 'EXPENSE';

    items.push({
      id: `txt-${idx}-${Date.now()}`,
      selected: true,
      description: description.slice(0, 140),
      amount: Math.abs(parsedAmount),
      type: flowType,
      transactionDate: txDate,
      categoryId: suggestCategoryForDescription(description, flowType, categories),
    });
  });

  return items;
}

function loadExternalScript(src: string, globalKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Ambiente de navegador indisponível.'));
      return;
    }
    if ((window as any)[globalKey]) {
      resolve((window as any)[globalKey]);
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any)[globalKey]));
      existing.addEventListener('error', () => reject(new Error(`Falha ao carregar biblioteca: ${src}`)));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve((window as any)[globalKey]);
    script.onerror = () => reject(new Error(`Falha ao carregar biblioteca: ${src}`));
    document.head.appendChild(script);
  });
}

export async function parsePdfFile(
  file: File,
  categories: Array<{ id: string | number; name: string; flow_type: string }>,
  defaultTargetType: 'ACCOUNT' | 'CARD',
  onProgress?: (status: string) => void
): Promise<ParsedStatementItem[]> {
  onProgress?.('Carregando leitor de PDF...');
  const pdfjsLib = await loadExternalScript(
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'pdfjsLib'
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const extractedLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Lendo página ${pageNum} de ${pdf.numPages} do PDF...`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const rowsByY = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of textContent.items) {
      const str = String(item.str || '').trim();
      if (!str) continue;
      const y = Math.round(Number(item.transform?.[5] || 0) / 4) * 4;
      const x = Number(item.transform?.[4] || 0);
      const bucket = rowsByY.get(y) || [];
      bucket.push({ x, str });
      rowsByY.set(y, bucket);
    }

    const sortedYs = Array.from(rowsByY.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const rowItems = (rowsByY.get(y) || []).sort((a, b) => a.x - b.x);
      const lineStr = rowItems.map(r => r.str).join(' ');
      extractedLines.push(lineStr);
    }
  }

  return extractTransactionsFromRawText(extractedLines.join('\n'), categories, defaultTargetType);
}

export async function parseImageFileWithOcr(
  file: File,
  categories: Array<{ id: string | number; name: string; flow_type: string }>,
  defaultTargetType: 'ACCOUNT' | 'CARD',
  onProgress?: (status: string) => void
): Promise<{ items: ParsedStatementItem[]; rawText: string }> {
  onProgress?.('Iniciando leitor óptico (OCR) para o print de tela...');
  const Tesseract = await loadExternalScript(
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
    'Tesseract'
  );

  const result = await Tesseract.recognize(file, 'por', {
    logger: (m: any) => {
      if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(`Lendo print da tela: ${Math.round(m.progress * 100)}%...`);
      }
    },
  });

  const rawText = String(result?.data?.text || '');
  const items = extractTransactionsFromRawText(rawText, categories, defaultTargetType);
  return { items, rawText };
}
