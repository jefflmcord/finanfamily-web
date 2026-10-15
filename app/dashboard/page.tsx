'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  PlusCircle, 
  CreditCard, 
  Target 
} from 'lucide-react';

interface CategoryData {
  name: string;
  color: string;
  total: number;
}

interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  categories: CategoryData[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Família');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('@FinanFamily:token');
      const userStr = localStorage.getItem('@FinanFamily:user');
      
      if (!token) {
        router.push('/login');
        return;
      }

      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Família');
      }

      try {
        const res = await fetch('https://finanfamily-api.onrender.com/api/dashboard/summary', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('@FinanFamily:token');
          router.push('/login');
          return;
        }

        const data = await res.json();
        
        if (res.ok) {
          setSummary(data);
        } else {
          setError(data.error || 'Erro ao carregar dados.');
        }
      } catch (err) {
        setError('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Formatar moeda (BRL)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Carregando painel da família...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-10 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho do Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Olá, <span className="text-emerald-400">{userName}</span>!
            </h1>
            <p className="text-slate-400 mt-1">Aqui está o resumo financeiro de vocês neste mês.</p>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Novo Lançamento
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2 relative z-10">
              <span className="font-semibold uppercase tracking-wider">Saldo em Contas</span>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl md:text-4xl font-black text-white relative z-10">
              {formatCurrency(summary?.balance || 0)}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Receitas do Mês</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl md:text-4xl font-black text-emerald-400">
              {formatCurrency(summary?.income || 0)}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Despesas do Mês</span>
              <ArrowDownRight className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-3xl md:text-4xl font-black text-rose-400">
              {formatCurrency(summary?.expense || 0)}
            </p>
          </div>
        </div>

        {/* Seção Inferior: Categorias e Atalhos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfico de Despesas (Lista de Categorias) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              Onde o dinheiro está indo?
            </h3>
            
            {summary?.categories && summary.categories.length > 0 ? (
              <div className="space-y-5">
                {summary.categories.map((cat, index) => {
                  const percentage = summary.expense > 0 
                    ? Math.round((Number(cat.total) / summary.expense) * 100) 
                    : 0;

                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300 font-medium">{cat.name}</span>
                        <div className="text-right">
                          <span className="text-white font-bold">{formatCurrency(cat.total)}</span>
                          <span className="text-slate-500 ml-2 text-xs">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: cat.color || '#10b981' 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                <p className="text-slate-400 text-sm">Nenhuma despesa registrada neste mês ainda.</p>
              </div>
            )}
          </div>

          {/* Atalhos Rápidos */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-emerald-500/30 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-lg mb-1">Cartões de Crédito</h4>
              <p className="text-slate-400 text-sm">Gerencie faturas e limites.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-emerald-500/30 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-lg mb-1">Metas da Família</h4>
              <p className="text-slate-400 text-sm">Acompanhe seus objetivos.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}