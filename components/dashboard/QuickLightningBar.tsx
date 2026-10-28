'use client';

import React, { useMemo, useState } from 'react';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Wallet,
  Tag,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import {
  formatCurrency,
  getCardPurchaseDueDate,
  getLocalTodayKey,
} from './dashboardUtils';

interface QuickLightningBarProps {
  accounts: any[];
  creditCards: any[];
  categories: any[];
  canCreateTransactions: boolean;
  onTransactionCreated: () => Promise<void> | void;
}

function normalizeStr(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CATEGORY_KEYWORD_GROUPS: Array<{
  keywords: string[];
  categoryMatchers: string[];
}> = [
  {
    keywords: [
      'padaria',
      'pao',
      'mercado',
      'supermercado',
      'atacadao',
      'assai',
      'carrefour',
      'pao de acucar',
      'acougue',
      'hortifruti',
      'feira',
      'sacolao',
      'ifood',
      'restaurante',
      'lanche',
      'hamburguer',
      'pizza',
      'almoco',
      'jantar',
      'cafe',
      'sorvete',
      ' marmita',
    ],
    categoryMatchers: ['aliment', 'mercado', 'supermercado', 'refei', 'restaurante', 'comida', 'feira'],
  },
  {
    keywords: [
      'uber',
      '99pop',
      '99',
      'taxi',
      'gasolina',
      'etanol',
      'alcool',
      'diesel',
      'combustivel',
      'abastecimento',
      'posto',
      'ipiranga',
      'shell',
      'petrobras',
      'estacionamento',
      'pedagio',
      'sem parar',
      'veloe',
      'oficina',
      'mecanico',
      'pneu',
      'oleo',
      'revisao',
      'lavagem',
      'ipva',
    ],
    categoryMatchers: ['transporte', 'veiculo', 'carro', 'combust', 'auto', 'mobilidade'],
  },
  {
    keywords: [
      'farmacia',
      'drogaria',
      'droga raia',
      'drogasil',
      'pague menos',
      'remedio',
      'medicamento',
      'medico',
      'consulta',
      'exame',
      'dentista',
      'hospital',
      'psicologo',
      'terapia',
      'plano de saude',
      'unimed',
    ],
    categoryMatchers: ['saude', 'farmacia', 'medic', 'bem-estar', 'vida'],
  },
  {
    keywords: [
      'escola',
      'colegio',
      'faculdade',
      'mensalidade',
      'curso',
      'ingles',
      'livro',
      'papelaria',
      'material escolar',
      'uniforme',
      'creche',
    ],
    categoryMatchers: ['educa', 'escola', 'estudo', 'filho', 'curso'],
  },
  {
    keywords: [
      'luz',
      'energia',
      'enel',
      'cpfl',
      'cemig',
      'agua',
      'sabesp',
      'gas',
      'condominio',
      'aluguel',
      'iptu',
      'internet',
      'fibra',
      'claro',
      'vivo',
      'tim',
      'faxina',
      'diarista',
      'manutencao casa',
    ],
    categoryMatchers: ['moradia', 'casa', 'habitac', 'utilidade', 'conta', 'residenc'],
  },
  {
    keywords: [
      'cinema',
      'passeio',
      'viagem',
      'hotel',
      'ingresso',
      'netflix',
      'spotify',
      'disney',
      'prime',
      'youtube',
      'jogos',
      'brinquedo',
      'parque',
      'festa',
    ],
    categoryMatchers: ['lazer', 'diversao', 'assinatura', 'entretenimento', 'viagem'],
  },
  {
    keywords: [
      'tenis',
      'sapato',
      'roupa',
      'camisa',
      'vestido',
      'calca',
      'shopping',
      'renner',
      'cea',
      'riachuelo',
      'zara',
      'shein',
      'mercado livre',
      'amazon',
      'shopee',
      'presente',
      'salao',
      'cabelo',
      'barbearia',
      'perfume',
    ],
    categoryMatchers: ['compras', 'vestuario', 'roupa', 'pessoal', 'cuidados', 'geral', 'outros'],
  },
];

export default function QuickLightningBar({
  accounts,
  creditCards,
  categories,
  canCreateTransactions,
  onTransactionCreated,
}: QuickLightningBarProps) {
  const [rawInput, setRawInput] = useState('');
  const [overrideTargetKey, setOverrideTargetKey] = useState<string | null>(null);
  const [overrideCategoryId, setOverrideCategoryId] = useState<string | null>(null);
  const [overrideSettleNow, setOverrideSettleNow] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const benefitAccounts = useMemo(
    () => accounts.filter(acc => acc.account_type === 'BENEFIT_CARD'),
    [accounts]
  );
  const bankAccounts = useMemo(
    () => accounts.filter(acc => acc.account_type !== 'BENEFIT_CARD'),
    [accounts]
  );

  // Interpretação inteligente em tempo real da frase digitada
  const parsed = useMemo(() => {
    const text = rawInput.trim();
    if (!text) return null;

    const norm = normalizeStr(text);

    // 1. Detectar parcelas (ex: "em 3x", "3x", "10x")
    let installments = 1;
    let workingText = text;
    const instMatch = workingText.match(/\b(?:em\s+)?(\d{1,2})\s*x\b/i);
    if (instMatch) {
      const parsedInst = Number(instMatch[1]);
      if (parsedInst >= 1 && parsedInst <= 48) {
        installments = parsedInst;
      }
      workingText = workingText.replace(instMatch[0], ' ');
    }

    // 2. Detectar valor monetário (ex: "R$ 1.250,50", "28,50", "300", "89.90")
    const amountRegex = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+,\d{1,2}|\d+,\d{1,2}|\d+\.\d{1,2}|\d+)/i;
    const amountMatch = workingText.match(amountRegex);
    let amount = 0;
    if (amountMatch) {
      const rawNum = amountMatch[1];
      const normalizedNum =
        rawNum.includes(',') && rawNum.includes('.')
          ? rawNum.replace(/\./g, '').replace(',', '.')
          : rawNum.includes(',')
            ? rawNum.replace(',', '.')
            : rawNum;
      const num = Number(normalizedNum);
      if (Number.isFinite(num) && num > 0) {
        amount = Math.round(num * 100) / 100;
      }
      workingText = workingText.replace(amountMatch[0], ' ');
    }

    // 3. Detectar tipo (Receita vs Despesa)
    const isIncome = /\b(recebi|recebido|salario|freela|reembolso|venda|renda|dividendo|entrada)\b/i.test(norm);
    const flowType: 'EXPENSE' | 'INCOME' = isIncome ? 'INCOME' : 'EXPENSE';

    // 4. Detectar meio de pagamento / conta / cartão / vale
    let detectedTargetKey = '';
    let matchedEntityName = '';

    // 4a. Primeiro procurar correspondência pelo nome exato do Vale, Cartão ou Conta
    for (const benefit of benefitAccounts) {
      const bNorm = normalizeStr(benefit.name || '');
      if (bNorm && bNorm.length >= 2 && norm.includes(bNorm)) {
        detectedTargetKey = `BENEFIT:${benefit.id}`;
        matchedEntityName = benefit.name;
        break;
      }
    }

    if (!detectedTargetKey && flowType === 'EXPENSE') {
      for (const card of creditCards) {
        const cNorm = normalizeStr(card.name || '');
        if (cNorm && cNorm.length >= 2 && norm.includes(cNorm)) {
          // Se o usuário falou explicitamente "pix <banco>" ou "débito <banco>", preferir a conta bancária de mesmo nome se existir
          const mentionsPixOrDebit = /\b(pix|debito|conta|boleto|transferencia)\b/i.test(norm);
          const matchingBank = bankAccounts.find(acc => normalizeStr(acc.name || '').includes(cNorm));
          if (mentionsPixOrDebit && matchingBank && installments === 1) {
            detectedTargetKey = `ACCOUNT:${matchingBank.id}`;
            matchedEntityName = matchingBank.name;
          } else {
            detectedTargetKey = `CARD:${card.id}`;
            matchedEntityName = card.name;
          }
          break;
        }
      }
    }

    if (!detectedTargetKey) {
      for (const acc of bankAccounts) {
        const aNorm = normalizeStr(acc.name || '');
        if (aNorm && aNorm.length >= 2 && norm.includes(aNorm)) {
          detectedTargetKey = `ACCOUNT:${acc.id}`;
          matchedEntityName = acc.name;
          break;
        }
      }
    }

    // 4b. Se não achou pelo nome, procurar palavras-chave ("caju", "vale", "vr", "va", "cartão", "crédito", "pix")
    if (!detectedTargetKey) {
      if (/\b(caju|vale|vr|va|alelo|flash|ticket|pluxee|sodexo|beneficio)\b/i.test(norm) && benefitAccounts[0]) {
        detectedTargetKey = `BENEFIT:${benefitAccounts[0].id}`;
        matchedEntityName = benefitAccounts[0].name;
      } else if (
        flowType === 'EXPENSE' &&
        (installments > 1 || /\b(cartao|credito|fatura)\b/i.test(norm)) &&
        creditCards[0]
      ) {
        detectedTargetKey = `CARD:${creditCards[0].id}`;
        matchedEntityName = creditCards[0].name;
      } else if (bankAccounts[0]) {
        detectedTargetKey = `ACCOUNT:${bankAccounts[0].id}`;
        matchedEntityName = bankAccounts[0].name;
      } else if (creditCards[0] && flowType === 'EXPENSE') {
        detectedTargetKey = `CARD:${creditCards[0].id}`;
        matchedEntityName = creditCards[0].name;
      } else if (benefitAccounts[0]) {
        detectedTargetKey = `BENEFIT:${benefitAccounts[0].id}`;
        matchedEntityName = benefitAccounts[0].name;
      }
    }

    // 5. Limpar a descrição removendo conectores e o nome do cartão/conta/vale
    if (matchedEntityName) {
      const escapedName = matchedEntityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      workingText = workingText.replace(new RegExp(`\\b${escapedName}\\b`, 'gi'), ' ');
    }
    workingText = workingText
      .replace(
        /\b(no|na|em|pelo|pela|via|usando|com|pix|debito|credito|cartao|vale|caju|vr|va|pago|recebido|reais)\b/gi,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();

    const cleanDescription = workingText
      ? workingText.charAt(0).toUpperCase() + workingText.slice(1)
      : flowType === 'INCOME'
        ? 'Receita rápida'
        : 'Despesa rápida';

    // 6. Auto-selecionar categoria
    const availableCategories = categories.filter(c => c.flow_type === flowType);
    let detectedCategoryId = availableCategories[0]?.id ? String(availableCategories[0].id) : '';

    // Primeiro tentar match direto com o nome de alguma categoria cadastrada
    for (const cat of availableCategories) {
      const catNorm = normalizeStr(cat.name || '');
      if (catNorm && catNorm.length >= 3 && norm.includes(catNorm)) {
        detectedCategoryId = String(cat.id);
        break;
      }
    }

    // Depois tentar grupos de palavras-chave do dia a dia
    if (flowType === 'EXPENSE') {
      for (const group of CATEGORY_KEYWORD_GROUPS) {
        const hitKeyword = group.keywords.some(kw => norm.includes(kw));
        if (hitKeyword) {
          const matchedCat = availableCategories.find(cat => {
            const catNorm = normalizeStr(cat.name || '');
            return group.categoryMatchers.some(m => catNorm.includes(m));
          });
          if (matchedCat) {
            detectedCategoryId = String(matchedCat.id);
            break;
          }
        }
      }
    }

    const finalTargetKey = overrideTargetKey || detectedTargetKey;
    const finalCategoryId = overrideCategoryId || detectedCategoryId;

    const isBenefitTarget = finalTargetKey.startsWith('BENEFIT:');
    const isCardTarget = finalTargetKey.startsWith('CARD:');
    const autoSettle =
      isBenefitTarget ||
      (!isCardTarget && /\b(pix|debito|pago|avista|dinheiro|recebi|recebido)\b/i.test(norm));
    const finalSettleNow = isBenefitTarget
      ? true
      : isCardTarget
        ? false
        : overrideSettleNow !== null
          ? overrideSettleNow
          : true; // Lançamento relâmpago em conta bancária já marca pago por padrão (1 clique)

    return {
      description: cleanDescription,
      amount,
      installments: isCardTarget ? installments : 1,
      flowType,
      targetKey: finalTargetKey,
      categoryId: finalCategoryId,
      settleNow: finalSettleNow,
      autoSettle,
      availableCategories,
    };
  }, [
    rawInput,
    benefitAccounts,
    creditCards,
    bankAccounts,
    categories,
    overrideTargetKey,
    overrideCategoryId,
    overrideSettleNow,
  ]);

  if (!canCreateTransactions) return null;

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed || parsed.amount <= 0) {
      setFeedback({
        type: 'error',
        message: 'Digite uma descrição e o valor na frase (ex: "Padaria 28,50 no Caju").',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const todayKey = getLocalTodayKey();
      const [targetPrefix, targetId] = parsed.targetKey.split(':');

      let paymentMethod = 'PIX';
      let accountId: string | null = null;
      let creditCardId: string | null = null;
      let dueDate = todayKey;

      if (targetPrefix === 'BENEFIT') {
        paymentMethod = 'BENEFIT_CARD';
        accountId = targetId || null;
      } else if (targetPrefix === 'CARD') {
        paymentMethod = 'CARD';
        creditCardId = targetId || null;
        const selectedCard = creditCards.find(c => String(c.id) === String(targetId));
        if (selectedCard) {
          dueDate =
            getCardPurchaseDueDate(
              todayKey,
              Number(selectedCard.closing_day),
              Number(selectedCard.due_day)
            ) || todayKey;
        }
      } else if (targetPrefix === 'ACCOUNT') {
        paymentMethod = 'PIX';
        accountId = targetId || null;
      }

      const res = await authenticatedFetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: parsed.description,
          amount: parsed.amount,
          type: parsed.flowType,
          transaction_date: todayKey,
          due_date: dueDate,
          category_id: parsed.categoryId || null,
          account_id: accountId,
          credit_card_id: creditCardId,
          payment_method: paymentMethod,
          total_installments: parsed.installments,
          start_installment: 1,
          recurrence_months: 1,
          settle_immediately: parsed.settleNow,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível registrar o lançamento relâmpago.');
      }

      const formattedVal = formatCurrency(parsed.amount);
      setRawInput('');
      setOverrideTargetKey(null);
      setOverrideCategoryId(null);
      setOverrideSettleNow(null);
      setFeedback({
        type: 'success',
        message: `Lançado: "${parsed.description}" (${formattedVal}) com sucesso!`,
      });
      await onTransactionCreated();
      setTimeout(() => {
        setFeedback(current => (current?.type === 'success' ? null : current));
      }, 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao salvar lançamento.',
      });
    } finally {
      setSaving(false);
    }
  };

  const quickExamples = [
    benefitAccounts[0]
      ? `Padaria 28,50 no ${benefitAccounts[0].name}`
      : 'Padaria 28,50 no Caju',
    creditCards[0]
      ? `Uber 24,90 no ${creditCards[0].name}`
      : 'Uber 24,90 no cartão',
    bankAccounts[0]
      ? `Farmácia 89,90 pix ${bankAccounts[0].name}`
      : 'Farmácia 89,90 no pix',
    creditCards[0]
      ? `Tênis filho 300 em 3x no ${creditCards[0].name}`
      : 'Tênis filho 300 em 3x no cartão',
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-xl">
      <form onSubmit={handleQuickSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Lançamento Relâmpago em 1 Linha
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> 3 segundos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Digite como se estivesse mandando um WhatsApp — nós reconhecemos valor, categoria, parcelas e se é Caju, Pix ou Cartão.
              </p>
            </div>
          </div>

          {/* Chips de exemplo clicáveis */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {quickExamples.slice(0, 3).map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRawInput(example);
                  setOverrideTargetKey(null);
                  setOverrideCategoryId(null);
                  setOverrideSettleNow(null);
                }}
                className="shrink-0 text-[11px] font-semibold text-slate-300 hover:text-emerald-300 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl px-2.5 py-1 transition-colors cursor-pointer"
              >
                &ldquo;{example}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Input Principal */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={rawInput}
              onChange={e => {
                setRawInput(e.target.value);
                if (!e.target.value.trim()) {
                  setOverrideTargetKey(null);
                  setOverrideCategoryId(null);
                  setOverrideSettleNow(null);
                }
              }}
              placeholder='Ex: "Padaria 28,50 no Caju", "Uber 24,90 no Nubank" ou "Tênis 300 em 3x"...'
              className="w-full bg-slate-950 border border-slate-700/90 focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm sm:text-base text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !parsed || parsed.amount <= 0}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-extrabold text-sm px-5 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Lançando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Lançar Agora
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Barra de Revisão Instantânea (aparece assim que o usuário começa a digitar) */}
        {parsed && (
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider text-[10px] border ${
                  parsed.flowType === 'INCOME'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {parsed.flowType === 'INCOME' ? 'Receita' : 'Despesa'}
              </span>

              <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                📝 {parsed.description}
              </div>

              <div
                className={`px-2.5 py-1 rounded-lg font-extrabold border ${
                  parsed.amount > 0
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {parsed.amount > 0 ? (
                  parsed.installments > 1 ? (
                    <>
                      {parsed.installments}x de {formatCurrency(parsed.amount / parsed.installments)}{' '}
                      <span className="text-[10px] font-normal opacity-80">
                        (Total {formatCurrency(parsed.amount)})
                      </span>
                    </>
                  ) : (
                    formatCurrency(parsed.amount)
                  )
                ) : (
                  'Digite o valor (ex: 28,50)'
                )}
              </div>
            </div>

            {/* Seletores editáveis de Destino, Categoria e Baixa Imediata */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Destino: Vale, Cartão ou Conta */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                {parsed.targetKey.startsWith('BENEFIT:') ? (
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                ) : parsed.targetKey.startsWith('CARD:') ? (
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <select
                  aria-label="Meio de pagamento do lançamento rápido"
                  value={parsed.targetKey}
                  onChange={e => setOverrideTargetKey(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {benefitAccounts.length > 0 && (
                    <optgroup label="🥗 Vales & Benefícios (Desconta Saldo)" className="bg-slate-900 text-amber-300">
                      {benefitAccounts.map(acc => (
                        <option key={`BENEFIT:${acc.id}`} value={`BENEFIT:${acc.id}`} className="bg-slate-900 text-white">
                          Vale: {acc.name} ({formatCurrency(Number(acc.balance || 0))})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {parsed.flowType === 'EXPENSE' && creditCards.length > 0 && (
                    <optgroup label="💳 Cartões de Crédito (Vai p/ Fatura)" className="bg-slate-900 text-indigo-300">
                      {creditCards.map(card => (
                        <option key={`CARD:${card.id}`} value={`CARD:${card.id}`} className="bg-slate-900 text-white">
                          Cartão: {card.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {bankAccounts.length > 0 && (
                    <optgroup label="🏦 Contas Bancárias (Pix / Débito)" className="bg-slate-900 text-emerald-300">
                      {bankAccounts.map(acc => (
                        <option key={`ACCOUNT:${acc.id}`} value={`ACCOUNT:${acc.id}`} className="bg-slate-900 text-white">
                          Conta: {acc.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Categoria */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-slate-400">Cat:</span>
                <select
                  aria-label="Categoria do lançamento rápido"
                  value={parsed.categoryId}
                  onChange={e => setOverrideCategoryId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {parsed.availableCategories.map(cat => (
                    <option key={cat.id} value={String(cat.id)} className="bg-slate-900 text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status: Já pago vs Pendente (para Contas Bancárias) */}
              {parsed.targetKey.startsWith('ACCOUNT:') && (
                <button
                  type="button"
                  onClick={() => setOverrideSettleNow(!parsed.settleNow)}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[11px] border flex items-center gap-1 cursor-pointer transition-colors ${
                    parsed.settleNow
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {parsed.settleNow ? 'Já pago (desconta saldo)' : 'Agendar pendente'}
                </button>
              )}
              {parsed.targetKey.startsWith('BENEFIT:') && (
                <span className="px-2.5 py-1 rounded-xl font-bold text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Abate direto do Vale
                </span>
              )}
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
