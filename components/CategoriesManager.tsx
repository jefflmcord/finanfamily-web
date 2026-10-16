'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Pencil,
  X,
  ArrowDownCircle, 
  ArrowUpCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

interface CategoryItem {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  flow_type: 'EXPENSE' | 'INCOME';
  color: string;
  transaction_count: number;
  budget_amount: number | null;
}

interface CategoriesManagerProps {
  familyId: string;
  apiUrl?: string;
  onUpdated?: () => void;
  canManage?: boolean;
}

export default function CategoriesManager({ familyId, apiUrl = 'https://finanfamily-api.onrender.com', onUpdated, canManage = true }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Formulário
  const [name, setName] = useState('');
  const [costType, setCostType] = useState<'FIXED' | 'VARIABLE'>('VARIABLE');
  const [color, setColor] = useState('#10b981');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [flowType, setFlowType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/categories?family_id=${familyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar categorias.');
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) {
        throw new Error('Informe o nome da categoria.');
      }

      const res = await authenticatedFetch(editingCategory
        ? `${apiUrl}/api/categories/${editingCategory.id}`
        : `${apiUrl}/api/categories`, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory
          ? {
              name: name.trim(),
              type: costType,
              flow_type: flowType,
              color: color || '#10b981',
              budget_amount: budgetAmount || null
            }
          : {
              family_id: familyId,
              name: name.trim(),
              type: costType,
              flow_type: activeTab,
              color: color || '#10b981',
              budget_amount: activeTab === 'EXPENSE' ? budgetAmount || null : null
            })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar categoria.');
      }

      setName('');
      setEditingCategory(null);
      await loadCategories();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    const category = categories.find(item => item.id === id);
    if (!category || isInvestmentCategory(category) || Number(category.transaction_count) > 0) return;
    if (!confirm(`Deseja realmente excluir a categoria "${category.name}"?`)) return;
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir categoria.');
      setError(null);
      await loadCategories();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria.');
    }
  }

  function isInvestmentCategory(category: CategoryItem) {
    return category.name.trim().toLocaleLowerCase('pt-BR') === 'investimento';
  }

  function handleEditCategory(category: CategoryItem) {
    if (isInvestmentCategory(category)) return;
    setEditingCategory(category);
    setName(category.name);
    setCostType(category.type || 'VARIABLE');
    setColor(category.color || '#10b981');
    setBudgetAmount(category.budget_amount == null ? '' : String(category.budget_amount));
    setFlowType(category.flow_type || 'EXPENSE');
    setActiveTab(category.flow_type || 'EXPENSE');
    setError(null);
  }

  function resetForm() {
    setEditingCategory(null);
    setName('');
    setCostType('VARIABLE');
    setColor('#10b981');
    setBudgetAmount('');
    setFlowType(activeTab);
    setError(null);
  }

  const filteredCategories = categories.filter(
    (c) => (c.flow_type || 'EXPENSE') === activeTab
  );

  return (
    <div className="space-y-6">
      {/* Abas: Contas a Pagar vs Contas a Receber */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'EXPENSE'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Categorias de Contas a Pagar ({categories.filter(c => (c.flow_type || 'EXPENSE') === 'EXPENSE').length})
        </button>

        <button
          onClick={() => setActiveTab('INCOME')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'INCOME'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Categorias de Contas a Receber ({categories.filter(c => c.flow_type === 'INCOME').length})
        </button>
      </div>

      {/* Formulário de Cadastro */}
      {canManage && <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-emerald-400" />
          {editingCategory ? `Editar Categoria: ${editingCategory.name}` : `Nova Categoria para ${activeTab === 'EXPENSE' ? 'Contas a Pagar (Despesas)' : 'Contas a Receber (Receitas)'}`}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {activeTab === 'EXPENSE' 
            ? 'Cadastre despesas como Moradia, Alimentação, Educação, Transporte, etc.' 
            : 'Cadastre origens de receita como Salário, Comissões, Aluguel Recebido, etc.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateCategory} className="grid grid-cols-1 gap-3 items-end sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Categoria</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={activeTab === 'EXPENSE' ? 'Ex: Farmácia, Luz, Supermercado' : 'Ex: Salário, Bonificação, Dividendos'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Natureza</label>
            <select
              value={costType}
              onChange={(e) => setCostType(e.target.value as 'FIXED' | 'VARIABLE')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="VARIABLE">Variável (Eventual)</option>
              <option value="FIXED">Fixa (Recorrente todo mês)</option>
            </select>
          </div>

          {editingCategory && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de categoria</label>
              <select
                value={flowType}
                disabled={Number(editingCategory.transaction_count) > 0}
                onChange={(e) => setFlowType(e.target.value as 'EXPENSE' | 'INCOME')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
              >
                <option value="EXPENSE">Contas a Pagar</option>
                <option value="INCOME">Contas a Receber</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-[34px] bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
            />
          </div>

          {(editingCategory ? flowType : activeTab) === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Orçamento mensal (opcional)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={budgetAmount}
                onChange={(event) => setBudgetAmount(event.target.value)}
                placeholder="Ex.: 800,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">Este limite será aplicado em todos os meses.</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              {editingCategory ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
              {saving ? 'Gravando...' : editingCategory ? 'Salvar alterações' : 'Adicionar'}
            </button>
          </div>
          {editingCategory && (
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                <X className="w-4 h-4" /> Cancelar edição
              </button>
            </div>
          )}
        </form>
      </div>}

      {/* Grid de Categorias Cadastradas */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Categorias Ativas ({filteredCategories.length})
        </h3>

        {loading ? (
          <p className="text-xs text-slate-500 py-4">A carregar categorias...</p>
        ) : error && categories.length === 0 ? (
          <p className="text-xs text-rose-400 py-4">{error}</p>
        ) : filteredCategories.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">Nenhuma categoria cadastrada nesta aba.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCategories.map((cat) => (
              <div 
                key={cat.id} 
                className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex justify-between items-center group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3.5 h-3.5 rounded-full" 
                    style={{ backgroundColor: cat.color || '#10b981' }} 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{cat.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {cat.type === 'FIXED' ? 'Fixa' : 'Variável'}
                    </span>
                    {cat.flow_type === 'EXPENSE' && cat.budget_amount != null && (
                      <span className="block text-[10px] font-semibold text-amber-300">
                        Limite mensal: R$ {Number(cat.budget_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {isInvestmentCategory(cat) ? (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <ShieldCheck className="w-3 h-3" /> Protegida
                      </span>
                    ) : Number(cat.transaction_count) > 0 ? (
                      <span className="text-[10px] text-slate-500">
                        {cat.transaction_count} lançamento(s)
                      </span>
                    ) : null}
                  </div>
                </div>

                {canManage && <div className="flex items-center">
                  {!isInvestmentCategory(cat) && (
                    <>
                      <button
                        onClick={() => handleEditCategory(cat)}
                        title="Editar categoria"
                        aria-label={`Editar categoria ${cat.name}`}
                        className="p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={Number(cat.transaction_count) > 0}
                        title={Number(cat.transaction_count) > 0 ? 'Não é possível excluir: há lançamentos vinculados' : 'Excluir categoria'}
                        aria-label={`Excluir categoria ${cat.name}`}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}