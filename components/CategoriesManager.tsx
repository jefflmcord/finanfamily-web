'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  ArrowDownCircle, 
  ArrowUpCircle,
  AlertCircle 
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  flow_type: 'EXPENSE' | 'INCOME';
  color: string;
}

interface CategoriesManagerProps {
  onUpdated?: () => void;
}

export default function CategoriesManager({ onUpdated }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Formulário
  const [name, setName] = useState('');
  const [costType, setCostType] = useState<'FIXED' | 'VARIABLE'>('VARIABLE');
  const [color, setColor] = useState('#10b981');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const familyId = process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/categories?family_id=${familyId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
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

      const res = await fetch(`${apiUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name: name.trim(),
          type: costType,
          flow_type: activeTab,
          color: color || '#10b981'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar categoria.');
      }

      setName('');
      await loadCategories();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCategories();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
    }
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
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-emerald-400" />
          Nova Categoria para {activeTab === 'EXPENSE' ? 'Contas a Pagar (Despesas)' : 'Contas a Receber (Receitas)'}
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

        <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
              onChange={(e) => setCostType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="VARIABLE">Variável (Eventual)</option>
              <option value="FIXED">Fixa (Recorrente todo mês)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {saving ? 'Gravando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid de Categorias Cadastradas */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Categorias Ativas ({filteredCategories.length})
        </h3>

        {loading ? (
          <p className="text-xs text-slate-500 py-4">A carregar categorias...</p>
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
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Excluir Categoria"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}