'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  ClipboardPaste,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import { getCardPurchaseDueDate } from '@/lib/creditCardBilling';
import { formatCurrency } from './dashboardUtils';
import {
  ParsedStatementItem,
  extractTransactionsFromRawText,
  parseCsvContent,
  parseImageFileWithOcr,
  parseOfxContent,
  parsePdfFile,
  suggestCategoryForDescription,
} from '@/lib/statementImporter';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => Promise<void> | void;
  accounts: any[];
  creditCards: any[];
  categories: any[];
  canCreateTransactions: boolean;
  canSettleTransactions: boolean;
  defaultTargetType?: 'ACCOUNT' | 'CARD';
}

export default function SmartImportModal({
  isOpen,
  onClose,
  onImported,
  accounts,
  creditCards,
  categories,
  canCreateTransactions,
  canSettleTransactions,
  defaultTargetType = 'ACCOUNT',
}: SmartImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [targetType, setTargetType] = useState<'ACCOUNT' | 'CARD'>(defaultTargetType);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [settleImmediately, setSettleImmediately] = useState<boolean>(false);

  const [items, setItems] = useState<ParsedStatementItem[]>([]);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsingStatus, setParsingStatus] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [showTextPasteBox, setShowTextPasteBox] = useState<boolean>(false);
  const [pastedRawText, setPastedRawText] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(String(accounts[0].id));
    }
    if (!selectedCardId && creditCards.length > 0) {
      setSelectedCardId(String(creditCards[0].id));
    }
  }, [isOpen, accounts, creditCards, selectedAccountId, selectedCardId]);

  const handleProcessFile = useCallback(
    async (file: File) => {
      setError('');
      setNotice('');
      setParsing(true);
      setParsingStatus(`Analisando arquivo ${file.name}...`);

      try {
        const lowerName = file.name.toLowerCase();
        let parsedItems: ParsedStatementItem[] = [];

        if (lowerName.endsWith('.ofx') || lowerName.endsWith('.qfx')) {
          const text = await file.text();
          parsedItems = parseOfxContent(text, categories, targetType);
        } else if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
          const text = await file.text();
          parsedItems = parseCsvContent(text, categories, targetType);
          if (parsedItems.length === 0) {
            parsedItems = extractTransactionsFromRawText(text, categories, targetType);
          }
        } else if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
          parsedItems = await parsePdfFile(file, categories, targetType, status => setParsingStatus(status));
        } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(lowerName)) {
          const { items: ocrItems, rawText } = await parseImageFileWithOcr(file, categories, targetType, status =>
            setParsingStatus(status)
          );
          parsedItems = ocrItems;
          if (parsedItems.length === 0 && rawText.trim()) {
            setPastedRawText(rawText.trim());
            setShowTextPasteBox(true);
            setError(
              'Extraímos o texto da imagem abaixo, mas não identificamos linhas no formato padrão (Descrição + Valor). Ajuste o texto abaixo ou adicione os itens.'
            );
          }
        } else {
          throw new Error('Formato não suportado. Envie um arquivo .OFX, .CSV, .PDF ou uma Imagem/Print (.PNG, .JPG).');
        }

        if (parsedItems.length > 0) {
          setItems(prev => [...prev, ...parsedItems]);
          setNotice(`${parsedItems.length} lançamento(s) identificado(s) e categorizado(s) automaticamente!`);
        } else if (!showTextPasteBox) {
          setError(
            'Não encontramos lançamentos automáticos neste arquivo. Se for um PDF escaneado como imagem, tire um print da tela e cole aqui (Ctrl + V) ou cole o texto manualmente.'
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível ler o arquivo enviado.');
      } finally {
        setParsing(false);
        setParsingStatus('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [categories, targetType, showTextPasteBox]
  );

  // Suporte a Ctrl + V de imagem (Print de Tela) direto no modal
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) return;
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            event.preventDefault();
            const imageFile = new File([blob], `print-tela-${Date.now()}.png`, { type: blob.type });
            handleProcessFile(imageFile);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, handleProcessFile]);

  if (!isOpen || !canCreateTransactions) return null;

  const handleExtractFromPastedText = () => {
    setError('');
    setNotice('');
    if (!pastedRawText.trim()) {
      setError('Cole o texto do extrato ou fatura antes de processar.');
      return;
    }
    const extracted = extractTransactionsFromRawText(pastedRawText, categories, targetType);
    if (extracted.length === 0) {
      const csvFallback = parseCsvContent(pastedRawText, categories, targetType);
      if (csvFallback.length > 0) {
        setItems(prev => [...prev, ...csvFallback]);
        setNotice(`${csvFallback.length} lançamento(s) extraído(s) do texto!`);
        setShowTextPasteBox(false);
        return;
      }
      setError('Não identificamos linhas com Descrição + Valor (ex.: "15/10 Supermercado 189,90").');
      return;
    }
    setItems(prev => [...prev, ...extracted]);
    setNotice(`${extracted.length} lançamento(s) extraído(s) do texto!`);
    setShowTextPasteBox(false);
  };

  const handleAddManualItem = () => {
    const today = new Date().toISOString().split('T')[0];
    setItems(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}-${prev.length}`,
        selected: true,
        description: '',
        amount: 0,
        type: 'EXPENSE',
        transactionDate: today,
        categoryId: suggestCategoryForDescription('', 'EXPENSE', categories),
      },
    ]);
  };

  const updateItem = (id: string, patch: Partial<ParsedStatementItem>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if (patch.type && patch.type !== item.type) {
          updated.categoryId = suggestCategoryForDescription(updated.description, patch.type, categories);
        }
        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const selectedItems = items.filter(i => i.selected && i.description.trim() && Number(i.amount) > 0);
  const totalSelectedExpense = selectedItems
    .filter(i => (targetType === 'CARD' ? true : i.type === 'EXPENSE'))
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalSelectedIncome = selectedItems
    .filter(i => targetType === 'ACCOUNT' && i.type === 'INCOME')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const handleConfirmImport = async () => {
    setError('');
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos 1 lançamento com descrição e valor maior que zero.');
      return;
    }
    if (targetType === 'ACCOUNT' && !selectedAccountId) {
      setError('Selecione a Conta Bancária de destino.');
      return;
    }
    if (targetType === 'CARD' && !selectedCardId) {
      setError('Selecione o Cartão de Crédito de destino.');
      return;
    }

    const selectedCard = creditCards.find(c => String(c.id) === String(selectedCardId));

    setSaving(true);
    try {
      const payloadItems = selectedItems.map(item => {
        const dueDate =
          targetType === 'CARD' && selectedCard
            ? getCardPurchaseDueDate(
                item.transactionDate,
                Number(selectedCard.closing_day || 10),
                Number(selectedCard.due_day || 17)
              )
            : item.transactionDate;

        return {
          description: item.description.trim(),
          amount: Number(item.amount),
          type: targetType === 'CARD' ? 'EXPENSE' : item.type,
          transaction_date: item.transactionDate,
          due_date: dueDate || item.transactionDate,
          category_id: item.categoryId || null,
          payment_method: targetType === 'CARD' ? 'CARD' : 'PIX',
        };
      });

      const response = await authenticatedFetch(`${API_URL}/api/transactions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          account_id: targetType === 'ACCOUNT' ? selectedAccountId : null,
          credit_card_id: targetType === 'CARD' ? selectedCardId : null,
          settle_immediately: targetType === 'ACCOUNT' ? settleImmediately : false,
          items: payloadItems,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível importar os lançamentos.');
      }

      setItems([]);
      await onImported();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar lançamentos importados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-8 shadow-2xl relative my-auto space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Importador Inteligente 4 em 1 • OFX, CSV, PDF e Print de Tela</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Importar Extrato Bancário ou Fatura de Cartão
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Envie o arquivo do seu banco (<strong>.OFX, .CSV, .PDF</strong>) ou dê <strong>Ctrl + V</strong> em um{' '}
            <strong>Print de Tela</strong> do app do banco. O sistema identifica os valores e sugere as categorias sozinho!
          </p>
        </div>

        {/* 1. Destino dos Lançamentos */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4">
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-400">1. Onde lançar os itens?</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTargetType('ACCOUNT')}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  targetType === 'ACCOUNT'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                Conta Bancária
              </button>
              <button
                type="button"
                onClick={() => setTargetType('CARD')}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  targetType === 'CARD'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Cartão de Crédito
              </button>
            </div>
          </div>

          <div className="md:col-span-7 space-y-2">
            {targetType === 'ACCOUNT' ? (
              <>
                <label className="block text-xs font-bold uppercase text-slate-400">
                  2. Selecione a Conta Bancária
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                  {canSettleTransactions && (
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={settleImmediately}
                        onChange={e => setSettleImmediately(e.target.checked)}
                      />
                      <span>Já entram como Pagos/Recebidos</span>
                    </label>
                  )}
                </div>
              </>
            ) : (
              <>
                <label className="block text-xs font-bold uppercase text-slate-400">
                  2. Selecione o Cartão de Crédito
                </label>
                {creditCards.length === 0 ? (
                  <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5">
                    Você ainda não cadastrou nenhum cartão de crédito. Cadastre um cartão primeiro ou importe para uma Conta Bancária.
                  </p>
                ) : (
                  <select
                    value={selectedCardId}
                    onChange={e => setSelectedCardId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.name} ({card.brand} • Fecha dia {card.closing_day} / Vence dia {card.due_day})
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        </div>

        {/* 2. Área de Upload / Drag & Drop / Print Ctrl+V */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ofx,.qfx,.csv,.txt,.pdf,image/png,image/jpeg,image/webp"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleProcessFile(file);
            }}
            className="hidden"
          />

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleProcessFile(file);
            }}
            onClick={() => !parsing && fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-950/70 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all"
          >
            {parsing ? (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-extrabold text-white">{parsingStatus || 'Processando arquivo...'}</p>
                <p className="text-xs text-slate-400">Isso leva apenas alguns segundos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-extrabold text-white">
                    Clique para escolher um arquivo ou arraste para cá
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Aceita <strong className="text-slate-200">OFX, CSV, PDF de Fatura/Extrato</strong> ou{' '}
                    <strong className="text-emerald-400">Print de Tela (.PNG/.JPG ou aperte Ctrl + V agora)</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowTextPasteBox(prev => !prev)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              {showTextPasteBox ? 'Ocultar caixa de texto manual' : 'Ou clique aqui para colar texto copiado do PDF / App'}
            </button>
            <button
              type="button"
              onClick={handleAddManualItem}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Adicionar Linha Manual
            </button>
          </div>

          {showTextPasteBox && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Cole abaixo as linhas copiadas da sua fatura ou extrato (ex.: <code>15/10 Supermercado 189,90</code>):
              </label>
              <textarea
                rows={4}
                value={pastedRawText}
                onChange={e => setPastedRawText(e.target.value)}
                placeholder={'12/10 Uber Viagem 28,90\n14/10 Supermercado Condor 342,50\n15/10 Netflix 55,90'}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleExtractFromPastedText}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs cursor-pointer"
              >
                Extrair Lançamentos do Texto
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* 3. Tabela de Revisão Interativa */}
        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={items.every(i => i.selected)}
                  onChange={e => {
                    const checked = e.target.checked;
                    setItems(prev => prev.map(i => ({ ...i, selected: checked })));
                  }}
                />
                <span>
                  Selecionados: {selectedItems.length} de {items.length} lançamento(s)
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <span className="text-rose-400">Despesas: {formatCurrency(totalSelectedExpense)}</span>
                {targetType === 'ACCOUNT' && totalSelectedIncome > 0 && (
                  <span className="text-emerald-400">Receitas: {formatCurrency(totalSelectedIncome)}</span>
                )}
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-slate-400 hover:text-rose-400 underline cursor-pointer"
                >
                  Limpar Lista
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-800/80 bg-slate-950/60">
              {items.map(item => {
                const effectiveType = targetType === 'CARD' ? 'EXPENSE' : item.type;
                const availableCategories = categories.filter(c => c.flow_type === effectiveType);

                return (
                  <div
                    key={item.id}
                    className={`p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs ${
                      item.selected ? 'bg-slate-900/60' : 'opacity-50'
                    }`}
                  >
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={e => updateItem(item.id, { selected: e.target.checked })}
                      />
                      <input
                        type="date"
                        value={item.transactionDate}
                        onChange={e => updateItem(item.id, { transactionDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[11px]"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={item.description}
                        placeholder="Descrição do lançamento"
                        onChange={e => updateItem(item.id, { description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5">
                      {targetType === 'ACCOUNT' && (
                        <select
                          value={item.type}
                          onChange={e => updateItem(item.id, { type: e.target.value as 'EXPENSE' | 'INCOME' })}
                          className={`bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 font-bold ${
                            item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <option value="EXPENSE">Saída</option>
                          <option value="INCOME">Entrada</option>
                        </select>
                      )}
                      <select
                        value={item.categoryId}
                        onChange={e => updateItem(item.id, { categoryId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200"
                      >
                        <option value="">Sem categoria</option>
                        {availableCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1.5 text-slate-500 text-[11px]">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount || ''}
                          onChange={e => updateItem(item.id, { amount: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1.5 text-white font-bold text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        title="Remover linha"
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving || selectedItems.length === 0}
                onClick={handleConfirmImport}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(16,185,129,0.3)] cursor-pointer transition-all"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Confirmar Importação ({selectedItems.length} itens)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
