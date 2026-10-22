'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Copy,
  Sparkles,
  Store,
  TrendingUp,
  TrendingDown,
  Tag,
  PieChart as PieChartIcon,
  Search,
  CheckCircle2,
  Loader2,
  X,
  ArrowRight,
  PackagePlus,
  Receipt,
  CreditCard,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import { formatCurrency } from './dashboardUtils';

export const AISLE_CATEGORIES = [
  'Mercearia',
  'Hortifrúti',
  'Açougue & Frios',
  'Laticínios & Padaria',
  'Bebidas',
  'Limpeza',
  'Higiene & Farmácia',
  'Pet & Outros',
] as const;

const AISLE_ICONS: Record<string, string> = {
  Mercearia: '🌾',
  'Hortifrúti': '🥬',
  'Açougue & Frios': '🥩',
  'Laticínios & Padaria': '🥛',
  Bebidas: '🧃',
  Limpeza: '🧼',
  'Higiene & Farmácia': '🧴',
  'Pet & Outros': '🐾',
};

const QUICK_CATALOG: Record<string, { name: string; unit: string; defaultQty: number }[]> = {
  Mercearia: [
    { name: 'Arroz 5kg', unit: 'pct', defaultQty: 1 },
    { name: 'Feijão 1kg', unit: 'pct', defaultQty: 2 },
    { name: 'Café 500g', unit: 'pct', defaultQty: 2 },
    { name: 'Açúcar 5kg', unit: 'pct', defaultQty: 1 },
    { name: 'Óleo de Soja 900ml', unit: 'un', defaultQty: 2 },
    { name: 'Azeite de Oliva 500ml', unit: 'un', defaultQty: 1 },
    { name: 'Macarrão 500g', unit: 'pct', defaultQty: 3 },
    { name: 'Molho de Tomate', unit: 'un', defaultQty: 3 },
    { name: 'Farinha de Trigo 1kg', unit: 'pct', defaultQty: 1 },
    { name: 'Aveia / Granola', unit: 'pct', defaultQty: 1 },
    { name: 'Biscoito / Bolacha', unit: 'pct', defaultQty: 2 },
    { name: 'Milho / Ervilha', unit: 'un', defaultQty: 2 },
  ],
  'Hortifrúti': [
    { name: 'Ovos (Dúzia/Cartela)', unit: 'cx', defaultQty: 1 },
    { name: 'Banana', unit: 'kg', defaultQty: 1.5 },
    { name: 'Maçã', unit: 'kg', defaultQty: 1 },
    { name: 'Tomate', unit: 'kg', defaultQty: 1.5 },
    { name: 'Batata Inglesa', unit: 'kg', defaultQty: 2 },
    { name: 'Cebola', unit: 'kg', defaultQty: 1 },
    { name: 'Alho', unit: 'kg', defaultQty: 0.3 },
    { name: 'Cenoura', unit: 'kg', defaultQty: 1 },
    { name: 'Alface / Folhas', unit: 'un', defaultQty: 2 },
    { name: 'Laranja / Limão', unit: 'kg', defaultQty: 2 },
  ],
  'Açougue & Frios': [
    { name: 'Peito de Frango', unit: 'kg', defaultQty: 2 },
    { name: 'Carne Moída', unit: 'kg', defaultQty: 1.5 },
    { name: 'Carne para Bife/Panela', unit: 'kg', defaultQty: 1.5 },
    { name: 'Linguiça / Calabresa', unit: 'kg', defaultQty: 1 },
    { name: 'Filé de Peixe / Tilápia', unit: 'kg', defaultQty: 1 },
    { name: 'Presunto Fatiado', unit: 'kg', defaultQty: 0.4 },
  ],
  'Laticínios & Padaria': [
    { name: 'Leite Integral 1L', unit: 'un', defaultQty: 6 },
    { name: 'Manteiga / Margarina', unit: 'un', defaultQty: 1 },
    { name: 'Queijo Mussarela', unit: 'kg', defaultQty: 0.5 },
    { name: 'Requeijão / Creme de Leite', unit: 'un', defaultQty: 2 },
    { name: 'Iogurte', unit: 'un', defaultQty: 4 },
    { name: 'Pão de Forma', unit: 'pct', defaultQty: 2 },
  ],
  Limpeza: [
    { name: 'Sabão Líquido / Pó', unit: 'un', defaultQty: 1 },
    { name: 'Amaciante de Roupas', unit: 'un', defaultQty: 1 },
    { name: 'Detergente Lava-louças', unit: 'un', defaultQty: 4 },
    { name: 'Água Sanitária', unit: 'un', defaultQty: 2 },
    { name: 'Desinfetante', unit: 'un', defaultQty: 2 },
    { name: 'Esponja de Louça', unit: 'pct', defaultQty: 1 },
    { name: 'Saco de Lixo', unit: 'pct', defaultQty: 2 },
    { name: 'Papel Toalha', unit: 'pct', defaultQty: 1 },
  ],
  'Higiene & Farmácia': [
    { name: 'Papel Higiênico (Fardo)', unit: 'pct', defaultQty: 1 },
    { name: 'Creme Dental', unit: 'un', defaultQty: 2 },
    { name: 'Sabonete', unit: 'un', defaultQty: 4 },
    { name: 'Shampoo / Condicionador', unit: 'un', defaultQty: 2 },
    { name: 'Desodorante', unit: 'un', defaultQty: 2 },
  ],
  Bebidas: [
    { name: 'Água Mineral', unit: 'un', defaultQty: 4 },
    { name: 'Suco Integral', unit: 'un', defaultQty: 2 },
    { name: 'Refrigerante', unit: 'un', defaultQty: 2 },
    { name: 'Cerveja', unit: 'un', defaultQty: 6 },
  ],
  'Pet & Outros': [
    { name: 'Ração Pet', unit: 'pct', defaultQty: 1 },
    { name: 'Carvão para Churrasco', unit: 'pct', defaultQty: 1 },
    { name: 'Papel Alumínio / Filme PVC', unit: 'un', defaultQty: 1 },
  ],
};

interface ShoppingItem {
  id: string | number;
  list_id: string | number;
  name: string;
  aisle_category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  last_paid_price: number | null;
  is_checked: boolean;
  notes?: string | null;
}

interface ShoppingList {
  id: string | number;
  name: string;
  store_name: string | null;
  budget_limit: number;
  status: 'OPEN' | 'COMPLETED';
  completed_at: string | null;
  total_spent: number;
  linked_transaction_id: string | null;
  created_at: string;
  total_items: number;
  checked_items: number;
  estimated_total: number;
  cart_total: number;
  items: ShoppingItem[];
}

interface PriceHistoryRow {
  id: string | number;
  normalized_name: string;
  display_name: string;
  aisle_category: string;
  unit: string;
  last_price: number;
  previous_price: number | null;
  min_price: number;
  max_price: number;
  last_store: string | null;
  purchase_count: number;
  updated_at: string;
}

interface SupermarketModuleProps {
  activeSubMenu: string;
  setActiveSubMenu: (sub: string) => void;
  accounts: any[];
  creditCards: any[];
  categories: any[];
  onRefreshFinancialData: () => void;
}

export default function SupermarketModule({
  activeSubMenu,
  setActiveSubMenu,
  accounts,
  creditCards,
  categories,
  onRefreshFinancialData,
}: SupermarketModuleProps) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRow[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Nova Lista
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListStore, setNewListStore] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [newListTemplate, setNewListTemplate] = useState<string>('');
  const [creatingList, setCreatingList] = useState(false);

  // Adição de Item Rápido
  const [itemName, setItemName] = useState('');
  const [itemAisle, setItemAisle] = useState<string>('Mercearia');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('un');
  const [itemPrice, setItemPrice] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Catálogo Rápido
  const [showQuickCatalog, setShowQuickCatalog] = useState(false);
  const [catalogAisle, setCatalogAisle] = useState<string>('Mercearia');

  // Filtro de visualização da Lista
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'CART'>('ALL');
  const [searchItem, setSearchItem] = useState('');

  // Modal Checkout (Finalizar Compra & Lançar no Financeiro)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStore, setCheckoutStore] = useState('');
  const [checkoutTotalOverride, setCheckoutTotalOverride] = useState('');
  const [checkoutCreateTx, setCheckoutCreateTx] = useState(true);
  const [checkoutTarget, setCheckoutTarget] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');
  const [checkoutAccountId, setCheckoutAccountId] = useState('');
  const [checkoutCardId, setCheckoutCardId] = useState('');
  const [checkoutCategoryId, setCheckoutCategoryId] = useState('');
  const [checkoutSettleNow, setCheckoutSettleNow] = useState(true);
  const [checkoutDate, setCheckoutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Busca no Histórico de Preços
  const [historySearch, setHistorySearch] = useState('');
  const [historyAisleFilter, setHistoryAisleFilter] = useState('ALL');

  const fetchShoppingOverview = useCallback(async (preferredListId?: string) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/shopping/overview`);
      if (!response.ok) throw new Error('Não foi possível carregar os dados do mercado.');
      const data = await response.json();
      const loadedLists: ShoppingList[] = Array.isArray(data.lists) ? data.lists : [];
      setLists(loadedLists);
      setPriceHistory(Array.isArray(data.priceHistory) ? data.priceHistory : []);

      if (preferredListId) {
        setSelectedListId(preferredListId);
      } else {
        setSelectedListId(current => {
          if (current && loadedLists.some(l => String(l.id) === current)) return current;
          const firstOpen = loadedLists.find(l => l.status === 'OPEN');
          return firstOpen ? String(firstOpen.id) : loadedLists[0] ? String(loadedLists[0].id) : '';
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao carregar listas de compras.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShoppingOverview();
  }, [fetchShoppingOverview]);

  const selectedList = useMemo(
    () => lists.find(l => String(l.id) === String(selectedListId)) || null,
    [lists, selectedListId]
  );

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreatingList(true);
    setFeedback(null);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/shopping/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName.trim(),
          store_name: newListStore.trim() || null,
          budget_limit: Number(newListBudget) || 0,
          template: newListTemplate || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao criar lista.');

      setIsNewListModalOpen(false);
      setNewListName('');
      setNewListStore('');
      setNewListBudget('');
      setNewListTemplate('');
      await fetchShoppingOverview(result.listId);
      setFeedback({ type: 'success', text: 'Lista de compras criada com sucesso!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao criar lista.' });
    } finally {
      setCreatingList(false);
    }
  };

  const handleDuplicateList = async (listId: string | number, listName: string) => {
    setFeedback(null);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/shopping/lists/${listId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${listName} (Nova)` }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao duplicar lista.');
      await fetchShoppingOverview(result.listId);
      setFeedback({
        type: 'success',
        text: 'Lista reaproveitada com todos os itens e últimos preços pagos!',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao duplicar lista.' });
    }
  };

  const handleDeleteList = async (listId: string | number) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/shopping/lists/${listId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Não foi possível excluir a lista.');
      await fetchShoppingOverview();
      setFeedback({ type: 'success', text: 'Lista removida.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao excluir lista.' });
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList || !itemName.trim()) return;
    setAddingItem(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/shopping/lists/${selectedList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName.trim(),
          aisle_category: itemAisle,
          quantity: Number(itemQty) || 1,
          unit: itemUnit,
          unit_price: Number(itemPrice) || 0,
        }),
      });
      if (!response.ok) throw new Error('Erro ao adicionar item.');
      setItemName('');
      setItemQty('1');
      setItemPrice('');
      await fetchShoppingOverview(String(selectedList.id));
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao adicionar item.' });
    } finally {
      setAddingItem(false);
    }
  };

  const handleQuickAddFromCatalog = async (catalogItem: { name: string; unit: string; defaultQty: number }) => {
    if (!selectedList) return;
    try {
      await authenticatedFetch(`${API_URL}/api/shopping/lists/${selectedList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catalogItem.name,
          aisle_category: catalogAisle,
          quantity: catalogItem.defaultQty,
          unit: catalogItem.unit,
        }),
      });
      await fetchShoppingOverview(String(selectedList.id));
    } catch {
      // ignore
    }
  };

  const handleUpdateItem = async (item: ShoppingItem, changes: Partial<ShoppingItem>) => {
    // Atualização otimista imediata para fluidez no corredor do mercado
    setLists(current =>
      current.map(list => {
        if (String(list.id) !== String(item.list_id)) return list;
        const nextItems = list.items.map(it =>
          String(it.id) === String(item.id) ? { ...it, ...changes } : it
        );
        const estimatedTotal = nextItems.reduce(
          (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
          0
        );
        const cartTotal = nextItems
          .filter(it => it.is_checked)
          .reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);

        return {
          ...list,
          items: nextItems,
          checked_items: nextItems.filter(it => it.is_checked).length,
          estimated_total: Math.round(estimatedTotal * 100) / 100,
          cart_total: Math.round(cartTotal * 100) / 100,
        };
      })
    );

    try {
      await authenticatedFetch(`${API_URL}/api/shopping/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    } catch {
      fetchShoppingOverview(String(item.list_id));
    }
  };

  const handleDeleteItem = async (itemId: string | number) => {
    if (!selectedList) return;
    setLists(current =>
      current.map(l =>
        String(l.id) === String(selectedList.id)
          ? { ...l, items: l.items.filter(it => String(it.id) !== String(itemId)) }
          : l
      )
    );
    try {
      await authenticatedFetch(`${API_URL}/api/shopping/items/${itemId}`, { method: 'DELETE' });
      await fetchShoppingOverview(String(selectedList.id));
    } catch {
      fetchShoppingOverview(String(selectedList.id));
    }
  };

  const openCheckoutModal = () => {
    if (!selectedList) return;
    setCheckoutStore(selectedList.store_name || '');
    const defaultTotal =
      selectedList.cart_total > 0 ? selectedList.cart_total : selectedList.estimated_total;
    setCheckoutTotalOverride(defaultTotal > 0 ? String(defaultTotal.toFixed(2)) : '');
    setCheckoutAccountId(accounts[0]?.id ? String(accounts[0].id) : '');
    setCheckoutCardId(creditCards[0]?.id ? String(creditCards[0].id) : '');
    const marketCat = categories.find(
      c =>
        c.flow_type === 'EXPENSE' &&
        (String(c.name).toLowerCase().includes('mercado') ||
          String(c.name).toLowerCase().includes('alimenta'))
    );
    setCheckoutCategoryId(marketCat ? String(marketCat.id) : '');
    setIsCheckoutOpen(true);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;
    setSubmittingCheckout(true);
    setFeedback(null);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/shopping/lists/${selectedList.id}/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_name: checkoutStore.trim() || null,
            total_spent_override: Number(checkoutTotalOverride) || 0,
            create_transaction: checkoutCreateTx,
            payment_target: checkoutTarget,
            account_id: checkoutTarget === 'ACCOUNT' ? checkoutAccountId : null,
            credit_card_id: checkoutTarget === 'CARD' ? checkoutCardId : null,
            category_id: checkoutCategoryId || null,
            settle_immediately: checkoutSettleNow,
            purchase_date: checkoutDate,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao finalizar compra.');

      setIsCheckoutOpen(false);
      await fetchShoppingOverview(String(selectedList.id));
      if (checkoutCreateTx) {
        onRefreshFinancialData();
      }
      setFeedback({ type: 'success', text: result.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao finalizar compra.',
      });
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Agrupamento de itens da lista selecionada por Corredor
  const groupedItems = useMemo(() => {
    if (!selectedList) return [];
    const filtered = selectedList.items.filter(it => {
      if (filterMode === 'PENDING' && it.is_checked) return false;
      if (filterMode === 'CART' && !it.is_checked) return false;
      if (searchItem.trim()) {
        return it.name.toLowerCase().includes(searchItem.trim().toLowerCase());
      }
      return true;
    });

    const groups = new Map<string, ShoppingItem[]>();
    for (const item of filtered) {
      const aisle = item.aisle_category || 'Mercearia';
      const arr = groups.get(aisle) || [];
      arr.push(item);
      groups.set(aisle, arr);
    }
    return Array.from(groups.entries());
  }, [selectedList, filterMode, searchItem]);

  // Análise de Gastos por Corredor (Raio-X do Supermercado)
  const aisleAnalytics = useMemo(() => {
    const totalsByAisle = new Map<string, { amount: number; itemsCount: number }>();
    let grandTotal = 0;

    for (const list of lists) {
      for (const item of list.items) {
        const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
        if (lineTotal <= 0) continue;
        const aisle = item.aisle_category || 'Mercearia';
        const prev = totalsByAisle.get(aisle) || { amount: 0, itemsCount: 0 };
        prev.amount += lineTotal;
        prev.itemsCount += 1;
        totalsByAisle.set(aisle, prev);
        grandTotal += lineTotal;
      }
    }

    return Array.from(totalsByAisle.entries())
      .map(([aisle, info]) => ({
        aisle,
        icon: AISLE_ICONS[aisle] || '🛒',
        amount: Math.round(info.amount * 100) / 100,
        itemsCount: info.itemsCount,
        percentage: grandTotal > 0 ? Math.round((info.amount / grandTotal) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [lists]);

  const filteredPriceHistory = useMemo(() => {
    return priceHistory.filter(row => {
      if (historyAisleFilter !== 'ALL' && row.aisle_category !== historyAisleFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.trim().toLowerCase();
        return (
          row.display_name.toLowerCase().includes(q) ||
          (row.last_store || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [priceHistory, historyAisleFilter, historySearch]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        Carregando Gestão de Supermercado & Compras...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO DE MERCADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Mercado & Compras da Casa
              </h1>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Integrado ao Orçamento
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Monte listas por corredor, controle o valor do carrinho em tempo real, compare preços e lance no financeiro com 1 clique.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewListModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nova Lista de Compras
        </button>
      </div>

      {/* NAVEGAÇÃO RÁPIDA ENTRE AS 3 VISÕES DO MÓDULO */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-1.5 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubMenu('listas')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubMenu !== 'historico_precos' && activeSubMenu !== 'analise_mercado'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Lista & Modo Carrinho ({lists.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubMenu('historico_precos')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubMenu === 'historico_precos'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Comparador & Inflação ({priceHistory.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubMenu('analise_mercado')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubMenu === 'analise_mercado'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <PieChartIcon className="h-4 w-4" />
          <span>Raio-X por Corredor</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ==================== ABA 1: LISTA & MODO CARRINHO ==================== */}
      {activeSubMenu !== 'historico_precos' && activeSubMenu !== 'analise_mercado' && (
        <>
          {lists.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h2 className="text-xl font-extrabold text-white">
                  Sua família ainda não tem nenhuma lista de mercado
                </h2>
                <p className="text-sm text-slate-400">
                  Comece em segundos usando um dos modelos prontos abaixo ou crie uma lista personalizada.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {[
                  { id: 'COMPRA_MES', label: '🛒 Compra do Mês (25 itens)' },
                  { id: 'FEIRA', label: '🥬 Feira & Hortifrúti (12 itens)' },
                  { id: 'LIMPEZA', label: '🧼 Limpeza & Higiene (12 itens)' },
                  { id: 'CHURRASCO', label: '🥩 Churrasco em Família (10 itens)' },
                ].map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setNewListName(tpl.label.replace(/^[^\s]+\s/, '').replace(/\s\(.+\)$/, ''));
                      setNewListTemplate(tpl.id);
                      setIsNewListModalOpen(true);
                    }}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-xs font-extrabold text-emerald-300 transition-all cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SELETOR DE LISTAS */}
              <div className="flex flex-wrap items-center gap-2">
                {lists.map(list => {
                  const isSelected = String(list.id) === String(selectedList?.id);
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => setSelectedListId(String(list.id))}
                      className={`group flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-md'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-extrabold">{list.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              list.status === 'COMPLETED'
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {list.status === 'COMPLETED' ? 'Concluída' : `${list.checked_items}/${list.total_items}`}
                          </span>
                        </div>
                        {list.store_name && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Store className="h-3 w-3 text-emerald-400" /> {list.store_name}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedList && (
                <>
                  {/* PAINEL DO CARRINHO EM TEMPO REAL ("NO CORREDOR DO MERCADO") */}
                  <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-5 sm:p-6 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg sm:text-xl font-black text-white">
                            {selectedList.name}
                          </h2>
                          {selectedList.store_name && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                              <Store className="h-3.5 w-3.5 text-emerald-400" />
                              {selectedList.store_name}
                            </span>
                          )}
                          {selectedList.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Compra Finalizada ({formatCurrency(selectedList.total_spent)})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Marque os itens conforme coloca no carrinho e informe o preço da prateleira para acompanhar o total antes de chegar no caixa.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {selectedList.status === 'OPEN' && selectedList.total_items > 0 && (
                          <button
                            type="button"
                            onClick={openCheckoutModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-lg transition-all cursor-pointer"
                          >
                            <Receipt className="h-4 w-4" />
                            Finalizar Compra & Lançar no Financeiro
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDuplicateList(selectedList.id, selectedList.name)}
                          title="Criar uma nova lista reaproveitando estes itens e últimos preços"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-400" />
                          Reaproveitar Lista
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteList(selectedList.id)}
                          title="Excluir lista"
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2.5 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* INDICADORES DO CARRINHO */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/90 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                          Total no Carrinho (Itens Marcados)
                        </span>
                        <p className="mt-1 text-2xl font-black text-white">
                          {formatCurrency(selectedList.cart_total)}
                        </p>
                        <span className="text-xs text-slate-400">
                          {selectedList.checked_items} de {selectedList.total_items} itens no carrinho
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                          Estimativa da Lista Completa
                        </span>
                        <p className="mt-1 text-2xl font-black text-white">
                          {formatCurrency(selectedList.estimated_total)}
                        </p>
                        <span className="text-xs text-slate-400">
                          Soma de todos os {selectedList.total_items} itens planejados
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                            Meta / Limite da Compra
                          </span>
                          {selectedList.budget_limit > 0 && (
                            <span
                              className={`text-xs font-extrabold ${
                                selectedList.cart_total > selectedList.budget_limit
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {Math.round((selectedList.cart_total / selectedList.budget_limit) * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-2xl font-black text-white">
                          {selectedList.budget_limit > 0
                            ? formatCurrency(selectedList.budget_limit)
                            : 'Sem teto definido'}
                        </p>
                        {selectedList.budget_limit > 0 ? (
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full transition-all ${
                                selectedList.cart_total > selectedList.budget_limit
                                  ? 'bg-rose-500'
                                  : selectedList.cart_total >= selectedList.budget_limit * 0.85
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((selectedList.cart_total / selectedList.budget_limit) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Defina uma meta ao criar a lista para evitar passar do orçamento.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FORMULÁRIO DE ADIÇÃO RÁPIDA + BOTÃO CATÁLOGO DE 1 TOQUE */}
                  {selectedList.status === 'OPEN' && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <PackagePlus className="h-4 w-4 text-emerald-400" />
                          Adicionar Item à Lista
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowQuickCatalog(prev => !prev)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-extrabold text-emerald-300 transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {showQuickCatalog
                            ? 'Ocultar Catálogo Rápido'
                            : 'Abrir Catálogo Rápido (+50 Itens de Despensa)'}
                        </button>
                      </div>

                      <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <input
                          type="text"
                          required
                          value={itemName}
                          onChange={e => setItemName(e.target.value)}
                          placeholder="Ex.: Arroz 5kg, Leite Integral, Sabão Líquido..."
                          className="sm:col-span-4 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        />
                        <select
                          value={itemAisle}
                          onChange={e => setItemAisle(e.target.value)}
                          className="sm:col-span-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
                        >
                          {AISLE_CATEGORIES.map(aisle => (
                            <option key={aisle} value={aisle}>
                              {AISLE_ICONS[aisle]} {aisle}
                            </option>
                          ))}
                        </select>
                        <div className="sm:col-span-2 flex gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={itemQty}
                            onChange={e => setItemQty(e.target.value)}
                            placeholder="Qtd"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                          />
                          <select
                            value={itemUnit}
                            onChange={e => setItemUnit(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                          >
                            <option value="un">un</option>
                            <option value="kg">kg</option>
                            <option value="pct">pct</option>
                            <option value="cx">cx</option>
                            <option value="L">L</option>
                          </select>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemPrice}
                          onChange={e => setItemPrice(e.target.value)}
                          placeholder="Preço R$ (opcional)"
                          className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={addingItem}
                          className="sm:col-span-1 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2.5 text-sm font-extrabold text-slate-950 transition-colors cursor-pointer"
                        >
                          {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                        </button>
                      </form>

                      {/* CATÁLOGO RÁPIDO DE 1 CLIQUE */}
                      {showQuickCatalog && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                              Toque nos itens que acabaram em casa para adicionar à lista:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {AISLE_CATEGORIES.map(aisle => (
                              <button
                                key={aisle}
                                type="button"
                                onClick={() => setCatalogAisle(aisle)}
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                  catalogAisle === aisle
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                                }`}
                              >
                                {AISLE_ICONS[aisle]} {aisle}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(QUICK_CATALOG[catalogAisle] || []).map(catItem => {
                              const alreadyInList = selectedList.items.some(
                                it => it.name.toLowerCase() === catItem.name.toLowerCase()
                              );
                              return (
                                <button
                                  key={catItem.name}
                                  type="button"
                                  disabled={alreadyInList}
                                  onClick={() => handleQuickAddFromCatalog(catItem)}
                                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                    alreadyInList
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60 cursor-default'
                                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-emerald-500/40 hover:text-white cursor-pointer'
                                  }`}
                                >
                                  {alreadyInList ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-emerald-400" />}
                                  {catItem.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BARRA DE FILTRO DA LISTA (TODOS / FALTA PEGAR / NO CARRINHO) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          ['ALL', `Todos (${selectedList.total_items})`],
                          ['PENDING', `Falta Pegar (${selectedList.total_items - selectedList.checked_items})`],
                          ['CART', `No Carrinho (${selectedList.checked_items})`],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFilterMode(mode)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                            filterMode === mode
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchItem}
                        onChange={e => setSearchItem(e.target.value)}
                        placeholder="Filtrar item na lista..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* LISTA AGRUPADA POR CORREDOR DO SUPERMERCADO */}
                  <div className="space-y-4">
                    {groupedItems.map(([aisle, items]) => {
                      const aisleTotal = items.reduce(
                        (s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0),
                        0
                      );
                      return (
                        <section
                          key={aisle}
                          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{AISLE_ICONS[aisle] || '🛒'}</span>
                              <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                                {aisle}
                              </h4>
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                                {items.length}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-400">
                              Subtotal: {formatCurrency(aisleTotal)}
                            </span>
                          </div>

                          <div className="divide-y divide-slate-800/70">
                            {items.map(item => {
                              const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
                              const priceDiff =
                                item.last_paid_price && item.unit_price > 0
                                  ? item.unit_price - item.last_paid_price
                                  : null;

                              return (
                                <div
                                  key={item.id}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 transition-colors ${
                                    item.is_checked ? 'bg-emerald-950/15' : 'hover:bg-slate-800/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateItem(item, { is_checked: !item.is_checked })
                                      }
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                                        item.is_checked
                                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                                          : 'border-slate-600 bg-slate-950 text-transparent hover:border-emerald-400'
                                      }`}
                                      aria-label={`Marcar ${item.name} no carrinho`}
                                    >
                                      <Check className="h-4 w-4" strokeWidth={3} />
                                    </button>

                                    <div className="min-w-0">
                                      <p
                                        className={`text-sm font-bold truncate ${
                                          item.is_checked
                                            ? 'line-through text-slate-400'
                                            : 'text-white'
                                        }`}
                                      >
                                        {item.name}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        {item.last_paid_price !== null && item.last_paid_price > 0 && (
                                          <span className="text-[11px] text-slate-400">
                                            Último pago: <strong>{formatCurrency(item.last_paid_price)}</strong>/{item.unit}
                                          </span>
                                        )}
                                        {priceDiff !== null && Math.abs(priceDiff) >= 0.05 && (
                                          <span
                                            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                                              priceDiff > 0
                                                ? 'bg-rose-500/15 text-rose-300'
                                                : 'bg-emerald-500/15 text-emerald-300'
                                            }`}
                                          >
                                            {priceDiff > 0 ? (
                                              <>
                                                <TrendingUp className="h-3 w-3" /> +{formatCurrency(priceDiff)}
                                              </>
                                            ) : (
                                              <>
                                                <TrendingDown className="h-3 w-3" /> {formatCurrency(priceDiff)}
                                              </>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pl-9 sm:pl-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] text-slate-400">Qtd ({item.unit}):</span>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={item.quantity}
                                        onChange={e =>
                                          handleUpdateItem(item, {
                                            quantity: Math.max(0.01, Number(e.target.value) || 1),
                                          })
                                        }
                                        className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-bold text-white text-center outline-none focus:border-emerald-500"
                                      />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] text-slate-400">Preço R$:</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.unit_price || ''}
                                        placeholder="0,00"
                                        onChange={e =>
                                          handleUpdateItem(item, {
                                            unit_price: Math.max(0, Number(e.target.value) || 0),
                                          })
                                        }
                                        className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-bold text-emerald-300 text-right outline-none focus:border-emerald-500"
                                      />
                                    </div>

                                    <div className="min-w-[85px] text-right">
                                      <span className="text-xs font-extrabold text-white">
                                        {formatCurrency(lineTotal)}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Remover item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ==================== ABA 2: COMPARADOR & INFLAÇÃO DA CASA ==================== */}
      {activeSubMenu === 'historico_precos' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-400" />
              Memória de Preços & Inflação da Casa
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Toda vez que você finaliza uma compra no mercado, o FinanFamily grava automaticamente o preço pago em cada item para você nunca mais cair em falsas promoções.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Buscar produto ou mercado (ex.: Arroz, Café, Atacadão)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <select
                value={historyAisleFilter}
                onChange={e => setHistoryAisleFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os corredores</option>
                {AISLE_CATEGORIES.map(a => (
                  <option key={a} value={a}>
                    {AISLE_ICONS[a]} {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPriceHistory.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
              Assim que você concluir sua primeira lista de compras com preços informados, o histórico de preços da sua família aparecerá aqui automaticamente.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3.5">Produto</th>
                      <th className="px-4 py-3.5">Corredor</th>
                      <th className="px-4 py-3.5">Último Preço</th>
                      <th className="px-4 py-3.5">Variação</th>
                      <th className="px-4 py-3.5">Menor / Maior Pago</th>
                      <th className="px-4 py-3.5">Último Mercado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPriceHistory.map(row => {
                      const diff =
                        row.previous_price !== null ? row.last_price - row.previous_price : null;
                      return (
                        <tr key={row.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-bold text-white">
                            {row.display_name}{' '}
                            <span className="text-xs font-normal text-slate-400">({row.unit})</span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {AISLE_ICONS[row.aisle_category] || '🛒'} {row.aisle_category}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-emerald-400">
                            {formatCurrency(row.last_price)}
                          </td>
                          <td className="px-4 py-3">
                            {diff === null || Math.abs(diff) < 0.01 ? (
                              <span className="text-slate-500">Estável</span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                                <TrendingUp className="h-3.5 w-3.5" /> +{formatCurrency(diff)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                <TrendingDown className="h-3.5 w-3.5" /> {formatCurrency(diff)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <span className="text-emerald-300 font-semibold">
                              {formatCurrency(row.min_price)}
                            </span>{' '}
                            /{' '}
                            <span className="text-rose-300 font-semibold">
                              {formatCurrency(row.max_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {row.last_store || 'Não informado'} ({row.purchase_count}x)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ==================== ABA 3: RAIO-X POR CORREDOR ==================== */}
      {activeSubMenu === 'analise_mercado' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-400" />
              Para onde vai o dinheiro do Supermercado?
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Veja quais setores do mercado mais pesam no orçamento da sua família (Açougue, Mercearia, Limpeza, Hortifrúti, Bebidas).
            </p>
          </div>

          {aisleAnalytics.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
              Preencha os preços nos itens da sua lista para visualizar a distribuição de gastos por corredor do supermercado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aisleAnalytics.map(row => (
                <div
                  key={row.aisle}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{row.icon}</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{row.aisle}</h3>
                        <p className="text-xs text-slate-400">{row.itemsCount} item(ns) registrados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-white">{formatCurrency(row.amount)}</p>
                      <span className="text-xs font-extrabold text-emerald-400">
                        {row.percentage}% do carrinho
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, row.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== MODAL: NOVA LISTA DE COMPRAS ==================== */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">Nova Lista de Compras</h3>
              <button
                type="button"
                onClick={() => setIsNewListModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-300">Nome da Lista</span>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Ex.: Compra do Mês - Outubro, Feira da Semana..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Supermercado / Atacarejo (opcional)
                  </span>
                  <input
                    type="text"
                    value={newListStore}
                    onChange={e => setNewListStore(e.target.value)}
                    placeholder="Ex.: Atacadão, Assaí, Condor..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Meta / Teto de Gasto R$ (opcional)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newListBudget}
                    onChange={e => setNewListBudget(e.target.value)}
                    placeholder="Ex.: 650.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  Começar com Modelo Pronto (opcional)
                </span>
                <select
                  value={newListTemplate}
                  onChange={e => setNewListTemplate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Lista em branco (adicionar itens manualmente)</option>
                  <option value="COMPRA_MES">🛒 Compra Base do Mês (25 itens essenciais)</option>
                  <option value="FEIRA">🥬 Feira & Hortifrúti (12 itens)</option>
                  <option value="LIMPEZA">🧼 Limpeza & Higiene (12 itens)</option>
                  <option value="CHURRASCO">🥩 Churrasco em Família (10 itens)</option>
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewListModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingList}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  {creatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FINALIZAR COMPRA & LANÇAR NO FINANCEIRO ==================== */}
      {isCheckoutOpen && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Finalizar Compra no Caixa</h3>
                  <p className="text-xs text-slate-400">
                    Salve os preços no histórico e lance automaticamente no orçamento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Supermercado</span>
                  <input
                    type="text"
                    value={checkoutStore}
                    onChange={e => setCheckoutStore(e.target.value)}
                    placeholder="Ex.: Atacadão, Condor..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Valor Total da Nota (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={checkoutTotalOverride}
                    onChange={e => setCheckoutTotalOverride(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-3.5 py-2.5 text-sm font-extrabold text-emerald-300 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkoutCreateTx}
                  onChange={e => setCheckoutCreateTx(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                <span className="text-xs sm:text-sm font-bold text-white">
                  Gerar lançamento automaticamente no Financeiro da Família
                </span>
              </label>

              {checkoutCreateTx && (
                <div className="space-y-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutTarget('ACCOUNT')}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                        checkoutTarget === 'ACCOUNT'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Wallet className="h-4 w-4" /> Conta / PIX / Débito
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutTarget('CARD')}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                        checkoutTarget === 'CARD'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" /> Cartão de Crédito
                    </button>
                  </div>

                  {checkoutTarget === 'ACCOUNT' ? (
                    <div className="space-y-3">
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-slate-300">Conta Bancária</span>
                        <select
                          value={checkoutAccountId}
                          onChange={e => setCheckoutAccountId(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-white"
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkoutSettleNow}
                          onChange={e => setCheckoutSettleNow(e.target.checked)}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        Já descontar do saldo da conta bancária (marcar como Pago)
                      </label>
                    </div>
                  ) : (
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-slate-300">Cartão de Crédito</span>
                      <select
                        value={checkoutCardId}
                        onChange={e => setCheckoutCardId(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-white"
                      >
                        {creditCards.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  {submittingCheckout ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Concluir Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
