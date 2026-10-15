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
  Layers
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Módulos Superiores e Menus da Sidebar
  const [activeModule, setActiveModule] = useState<'resumo' | 'pagar' | 'receber' | 'investimentos' | 'cadastro'>('resumo');
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

  // Modal de Novo Lançamento Avançado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCardId, setTxCardId] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState('boleto');
  const [txInstallments, setTxInstallments] = useState('1');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txDueDate, setTxDueDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('@FinanFamily:token');
    const userStr = localStorage.getItem('@FinanFamily:user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Família');
      } catch (e) {}
    }

    try {
      const [sumRes, dataRes] = await Promise.all([
        fetch('https://finanfamily-api.onrender.com/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://finanfamily-api.onrender.com/api/dashboard/data', {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
        setCardsList(d.cards || []);
        setTransactionsList(d.transactions || []);
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

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    setSavingTx(true);
    const token = localStorage.getItem('@FinanFamily:token');

    try {
      const res = await fetch('https://finanfamily-api.onrender.com/api/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: txDescription,
          amount: parseFloat(txAmount.replace(',', '.')),
          type: txType,
          category_id: txCategoryId ? Number(txCategoryId) : null,
          account_id: txAccountId ? Number(txAccountId) : null,
          credit_card_id: txCardId ? Number(txCardId) : null,
          payment_method: txPaymentMethod,
          installment_total: Number(txInstallments),
          date: txDate,
          due_date: txDueDate,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTxDescription('');
        setTxAmount('');
        await fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar.');
      }
    } catch (err) {
      setError('Erro ao salvar transação.');
    } finally {
      setSavingTx(false);
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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-sans">
      
      {/* SIDEBAR ESQUERDA */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform md:static md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-white">Finan<span className="text-emerald-400">Family</span></span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-4">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer">
            <PlusCircle className="w-5 h-5" /> Novo Lançamento
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          <button onClick={() => setActiveModule('resumo')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeModule === 'resumo' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5" /> Visão Geral
          </button>
          <button onClick={() => setActiveModule('pagar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeModule === 'pagar' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
            <FileText className="w-5 h-5" /> Contas a Pagar
          </button>
          <button onClick={() => setActiveModule('receber')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeModule === 'receber' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
            <DollarSign className="w-5 h-5" /> Contas a Receber
          </button>
          <button onClick={() => setActiveModule('investimentos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeModule === 'investimentos' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
            <TrendingUp className="w-5 h-5" /> Investimentos
          </button>
          <button onClick={() => setActiveModule('cadastro')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${activeModule === 'cadastro' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
            <Layers className="w-5 h-5" /> Cadastros & Cartões
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-rose-400 rounded-xl font-semibold text-sm">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)}><Menu className="w-6 h-6 text-slate-300" /></button>
          <span className="font-extrabold text-lg text-white">Finan<span className="text-emerald-400">Family</span></span>
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-slate-950 p-2 rounded-lg"><PlusCircle className="w-5 h-5" /></button>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto space-y-8">
          
          {/* MÓDULO 1: VISÃO GERAL */}
          {activeModule === 'resumo' && (
            <>
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Olá, {userName}!</h1>
                  <p className="text-slate-400 text-sm mt-1">Resumo consolidado da família.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg">
                  <PlusCircle className="w-5 h-5" /> Novo Lançamento
                </button>
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

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">Despesas por Categoria</h3>
                {summary?.categories?.length > 0 ? (
                  <div className="space-y-4">
                    {summary.categories.map((cat: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{cat.name}</span>
                          <span className="font-bold text-white">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: '40%', backgroundColor: cat.color || '#10b981' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Nenhuma despesa registrada.</p>
                )}
              </div>
            </>
          )}

          {/* MÓDULO 2: CONTAS A PAGAR */}
          {activeModule === 'pagar' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Contas a Pagar & Despesas</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                {transactionsList.filter(t => t.type === 'expense').length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {transactionsList.filter(t => t.type === 'expense').map(t => (
                      <div key={t.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400">Vencimento: {t.due_date || t.date} • Método: {t.payment_method}</p>
                        </div>
                        <span className="text-rose-400 font-bold">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm py-4">Nenhuma conta a pagar cadastrada.</p>
                )}
              </div>
            </div>
          )}

          {/* MÓDULO 3: CONTAS A RECEBER */}
          {activeModule === 'receber' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Contas a Receber & Receitas</h2>
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
                  <p className="text-slate-400 text-sm py-4">Nenhuma conta a receber cadastrada.</p>
                )}
              </div>
            </div>
          )}

          {/* MÓDULO 4: INVESTIMENTOS */}
          {activeModule === 'investimentos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">Módulo de Investimentos</h2>
              <p className="text-slate-400 text-sm">Acompanhe sua carteira de ativos e rendimentos familiares.</p>
            </div>
          )}

          {/* MÓDULO 5: CADASTROS & CARTÕES */}
          {activeModule === 'cadastro' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
              <h2 className="text-2xl font-bold text-white">Cartões de Crédito Cadastrados</h2>
              {cardsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cardsList.map(card => (
                    <div key={card.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-950">
                      <p className="font-bold text-white">{card.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Limite: {formatCurrency(card.limit_amount)} • Fechamento dia {card.closing_day}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Nenhum cartão cadastrado ainda.</p>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MODAL DE NOVO LANÇAMENTO (AVANÇADO: CARTÃO, PARCELAS, BOLETO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-extrabold text-white mb-6">Novo Lançamento / Conta</h3>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button type="button" onClick={() => setTxType('expense')} className={`py-2 rounded-lg font-bold text-sm ${txType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>Despesa / Pagar</button>
                <button type="button" onClick={() => setTxType('income')} className={`py-2 rounded-lg font-bold text-sm ${txType === 'income' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>Receita / Receber</button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição</label>
                <input type="text" required placeholder="Ex: Supermercado, Aluguel..." value={txDescription} onChange={e => setTxDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor Total (R$)</label>
                  <input type="number" step="0.01" required placeholder="0,00" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Forma de Pagamento</label>
                  <select value={txPaymentMethod} onChange={e => setTxPaymentMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                    <option value="boleto">Boleto / Pix / Dinheiro</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              {txPaymentMethod === 'cartao_credito' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cartão</label>
                    <select value={txCardId} onChange={e => setTxCardId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                      <option value="">Selecione o Cartão...</option>
                      {cardsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Qtd Parcelas</label>
                    <input type="number" min="1" max="48" value={txInstallments} onChange={e => setTxInstallments(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data da Compra</label>
                  <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento</label>
                  <input type="date" value={txDueDate} onChange={e => setTxDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoria</label>
                <select value={txCategoryId} onChange={e => setTxCategoryId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                  <option value="">Selecione a Categoria...</option>
                  {categoriesList.filter(c => c.type === txType).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button type="submit" disabled={savingTx} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                {savingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Lançamento</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}