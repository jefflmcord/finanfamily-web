'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  PlusCircle,
  CreditCard,
  Target,
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  LogOut,
  X,
  CheckCircle2,
  Menu,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  FolderKanban
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Módulos Principais (Header Superior)
  const [activeModule, setActiveModule] = useState<'cadastros' | 'pagar' | 'receber' | 'investimentos'>('cadastros');
  // Submenus da Sidebar Esquerda
  const [activeSubMenu, setActiveSubMenu] = useState<'geral' | 'cartoes' | 'contas' | 'categorias' | 'metas'>('geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de Dados
  const [summary, setSummary] = useState<any>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [cardsList, setCardsList] = useState<any[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Família');
  const [familyId, setFamilyId] = useState<number | null>(null);

  // Modal de Novo Cartão de Crédito
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('10');
  const [cardDueDay, setCardDueDay] = useState('17');
  const [savingCard, setSavingCard] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('@FinanFamily:token');
    const userStr = localStorage.getItem('@FinanFamily:user');

    if (!token) {
      router.push('/login');
      return;
    }

    let currentFamilyId = 1;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Família');
        currentFamilyId = user.family_id || 1;
        setFamilyId(currentFamilyId);
      } catch (e) {}
    }

    try {
      const [sumRes, dataRes, cardsRes] = await Promise.all([
        fetch('https://finanfamily-api.onrender.com/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://finanfamily-api.onrender.com/api/dashboard/data', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`https://finanfamily-api.onrender.com/api/credit-cards?family_id=${currentFamilyId}`),
      ]);

      if (sumRes.status === 401 || sumRes.status === 403) {
        localStorage.removeItem('@FinanFamily:token');
        router.push('/login');
        return;
      }

      if (sumRes.ok) setSummary(await sumRes.json());
      if (dataRes.ok) {
        const d = await dataRes.json();
        setCategoriesList(d.categories || []);
        setAccountsList(d.accounts || []);
        setTransactionsList(d.transactions || []);
      }
      if (cardsRes.ok) {
        setCardsList(await cardsRes.json());
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (val: any) => {
    const n = Number(val);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(n) ? 0 : n);
  };

  // Cadastrar Cartão de Crédito usando a rota original
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardBrand || !cardLimit) return;

    setSavingCard(true);
    try {
      const res = await fetch('https://finanfamily-api.onrender.com/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId || 1,
          name: cardName,
          brand: cardBrand,
          total_limit: cardLimit,
          closing_day: Number(cardClosingDay),
          due_day: Number(cardDueDay),
        }),
      });

      if (res.ok) {
        setIsCardModalOpen(false);
        setCardName('');
        setCardBrand('');
        setCardLimit('');
        await fetchData();
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao cadastrar cartão.');
      }
    } catch (e) {
      setError('Erro ao salvar cartão.');
    } finally {
      setSavingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
      
      {/* ================= HEADER SUPERIOR (MÓDULOS PRINCIPAIS) ================= */}
      <header className="bg-slate-900 border-b border-slate-800 h-20 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">
            Finan<span className="text-emerald-400">Family</span>
          </span>
        </div>

        {/* Módulos como Header */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setActiveModule('cadastros'); setActiveSubMenu('geral'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'cadastros' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cadastros
          </button>
          <button
            onClick={() => { setActiveModule('pagar'); setActiveSubMenu('contas'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'pagar' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contas a Pagar
          </button>
          <button
            onClick={() => { setActiveModule('receber'); setActiveSubMenu('contas'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'receber' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => { setActiveModule('investimentos'); setActiveSubMenu('geral'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeModule === 'investimentos' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Investimentos
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-semibold p-2 cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </header>

      {/* ================= CORPO PRINCIPAL COM SIDEBAR ESQUERDA ================= */}
      <div className="flex flex-1 min-h-[calc(100vh-5rem)]">
        
        {/* SIDEBAR ESQUERDA (MENUS DOS MÓDULOS) */}
        <aside className={`fixed md:static inset-y-0 left-0 z-20 w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col p-4 space-y-2 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 md:hidden">
            <span className="font-bold text-white">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <p className="text-xs uppercase font-extrabold text-slate-500 px-3 pb-1">Menus do Módulo</p>

          {activeModule === 'cadastros' && (
            <>
              <button onClick={() => setActiveSubMenu('geral')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'geral' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <LayoutDashboard className="w-5 h-5" /> Visão Geral
              </button>
              <button onClick={() => setActiveSubMenu('cartoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'cartoes' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <CreditCard className="w-5 h-5" /> Cartões de Crédito
              </button>
              <button onClick={() => setActiveSubMenu('categorias')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'categorias' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <Layers className="w-5 h-5" /> Categorias & Contas
              </button>
            </>
          )}

          {activeModule === 'pagar' && (
            <>
              <button onClick={() => setActiveSubMenu('contas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'contas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <FileText className="w-5 h-5" /> Contas a Pagar
              </button>
            </>
          )}

          {activeModule === 'receber' && (
            <>
              <button onClick={() => setActiveSubMenu('contas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'contas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <DollarSign className="w-5 h-5" /> Contas a Receber
              </button>
            </>
          )}

          {activeModule === 'investimentos' && (
            <>
              <button onClick={() => setActiveSubMenu('geral')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${activeSubMenu === 'geral' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}>
                <TrendingUp className="w-5 h-5" /> Carteira de Ativos
              </button>
            </>
          )}
        </aside>

        {/* CONTEÚDO DINÂMICO DOS MÓDULOS */}
        <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-8">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* MÓDULO: CADASTROS -> CARTÕES */}
          {activeModule === 'cadastros' && activeSubMenu === 'cartoes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Cartões de Crédito</h2>
                  <p className="text-slate-400 text-sm">Gerencie limites, dias de fechamento e faturas.</p>
                </div>
                <button
                  onClick={() => setIsCardModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <PlusCircle className="w-5 h-5" /> Novo Cartão
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cardsList.map((card) => (
                  <div key={card.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-bold text-white">{card.name}</p>
                        <span className="text-xs uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md font-semibold">
                          {card.brand}
                        </span>
                      </div>
                      <CreditCard className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="border-t border-slate-800 pt-4 flex justify-between text-sm">
                      <div>
                        <p className="text-slate-400 text-xs uppercase">Limite Total</p>
                        <p className="font-extrabold text-white text-base">{formatCurrency(card.total_limit)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs uppercase">Fechamento / Venc.</p>
                        <p className="font-bold text-slate-300">Dia {card.closing_day} / {card.due_day}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÓDULO: CADASTROS -> GERAL / DASHBOARD */}
          {activeModule === 'cadastros' && activeSubMenu === 'geral' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Olá, {userName}!</h1>
                <p className="text-slate-400 text-sm mt-1">Painel principal e indicadores gerais.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Saldo em Contas</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(summary?.balance)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Receitas do Mês</p>
                  <p className="text-3xl font-black text-emerald-400">{formatCurrency(summary?.income)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Despesas do Mês</p>
                  <p className="text-3xl font-black text-rose-400">{formatCurrency(summary?.expense)}</p>
                </div>
              </div>
            </div>
          )}

          {/* MÓDULO: CONTAS A PAGAR */}
          {activeModule === 'pagar' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Contas a Pagar</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactionsList.filter(t => t.type === 'expense').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactionsList.filter(t => t.type === 'expense').map(t => (
                      <div key={t.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400">Vencimento: {t.due_date || t.date}</p>
                        </div>
                        <span className="text-rose-400 font-bold">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm py-4">Nenhuma conta a pagar registrada.</p>
                )}
              </div>
            </div>
          )}

          {/* MÓDULO: CONTAS A RECEBER */}
          {activeModule === 'receber' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-white">Contas a Receber</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactionsList.filter(t => t.type === 'income').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactionsList.filter(t => t.type === 'income').map(t => (
                      <div key={t.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400">Data: {t.date}</p>
                        </div>
                        <span className="text-emerald-400 font-bold">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm py-4">Nenhuma conta a receber registrada.</p>
                )}
              </div>
            </div>
          )}

          {/* MÓDULO: INVESTIMENTOS */}
          {activeModule === 'investimentos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">Módulo de Investimentos</h2>
              <p className="text-slate-400 text-sm">Controle sua carteira de ativos e rentabilidade familiar.</p>
            </div>
          )}

        </main>
      </div>

      {/* MODAL DE NOVO CARTÃO DE CRÉDITO */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setIsCardModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-6">Cadastrar Cartão</h3>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Cartão</label>
                <input type="text" required placeholder="Ex: Nubank Ultravioleta" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Bandeira</label>
                <input type="text" required placeholder="Ex: Mastercard, Visa" value={cardBrand} onChange={e => setCardBrand(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Limite Total (R$)</label>
                <input type="text" required placeholder="5000,00" value={cardLimit} onChange={e => setCardLimit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Dia Fechamento</label>
                  <input type="number" min="1" max="31" value={cardClosingDay} onChange={e => setCardClosingDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Dia Vencimento</label>
                  <input type="number" min="1" max="31" value={cardDueDay} onChange={e => setCardDueDay(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>

              <button type="submit" disabled={savingCard} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                {savingCard ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Cartão</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}