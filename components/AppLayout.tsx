'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  FolderKanban,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  BarChart3,
  Plus,
  LogOut,
  User,
  Calendar,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  activeSubItemId: string;
  onSelectSubItem: (subItemId: string) => void;
  month: number;
  setMonth: (month: number) => void;
  year: number;
  setYear: (year: number) => void;
  onOpenNewTransaction: () => void;
}

interface ModuleConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  defaultSubItem: string;
  subItems: { id: string; label: string }[];
}

const MODULES: ModuleConfig[] = [
  {
    id: 'dashboard',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    defaultSubItem: 'resumo',
    subItems: [
      { id: 'resumo', label: 'Resumo do Mês' },
      { id: 'cartoes', label: 'Faturas de Cartões' },
      { id: 'extrato', label: 'Extrato Completo' },
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: FolderKanban,
    defaultSubItem: 'contas',
    subItems: [
      { id: 'contas', label: 'Contas Bancárias' },
      { id: 'cartoes_cad', label: 'Cartões de Crédito' },
      { id: 'categorias', label: 'Categorias' },
    ],
  },
  {
    id: 'contas_a_pagar',
    label: 'Contas a Pagar',
    icon: ArrowDownCircle,
    defaultSubItem: 'todas_despesas',
    subItems: [
      { id: 'todas_despesas', label: 'Todas as Despesas' },
      { id: 'a_vencer', label: 'A Vencer' },
      { id: 'vencidas', label: 'Vencidas' },
      { id: 'pagas', label: 'Pagas' },
    ],
  },
  {
    id: 'contas_a_receber',
    label: 'Contas a Receber',
    icon: ArrowUpCircle,
    defaultSubItem: 'todas_receitas',
    subItems: [
      { id: 'todas_receitas', label: 'Todas as Receitas' },
      { id: 'a_receber', label: 'A Receber' },
      { id: 'recebidas', label: 'Recebidas' },
    ],
  },
  {
    id: 'investimentos',
    label: 'Metas e Investimentos',
    icon: TrendingUp,
    defaultSubItem: 'metas',
    subItems: [
      { id: 'metas', label: 'Minhas Metas' },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    defaultSubItem: 'geral',
    subItems: [
      { id: 'geral', label: 'Balanço Mensal' },
    ],
  },
];

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function AppLayout({
  children,
  activeModuleId,
  onSelectModule,
  activeSubItemId,
  onSelectSubItem,
  month,
  setMonth,
  year,
  setYear,
  onOpenNewTransaction,
}: AppLayoutProps) {
  const [userName, setUserName] = useState('Administrador');
  const [userEmail, setUserEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('@FinanFamily:user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.email) setUserEmail(parsed.email);
      } catch {
        // Ignora erro de parse
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('@FinanFamily:token');
    localStorage.removeItem('@FinanFamily:user');
    window.location.href = '/login';
  };

  const handleModuleClick = (mod: ModuleConfig) => {
    onSelectModule(mod.id);
    onSelectSubItem(mod.defaultSubItem);
    setMobileMenuOpen(false);
  };

  const currentModule = MODULES.find((m) => m.id === activeModuleId) || MODULES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30">
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logotipo */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Finan<span className="text-emerald-400">Family</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Botão de Novo Lançamento em Destaque */}
          <div className="p-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNewTransaction();
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_2px_rgba(16,185,129,0.15)]"
            >
              <Plus className="w-5 h-5" />
              Novo Lançamento
            </button>
          </div>

          {/* Menu de Módulos */}
          <nav className="px-3 py-2 space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Menu Principal
            </p>
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{mod.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Usuário Logado + Botão Sair */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* ================= ÁREA DE CONTEÚDO PRINCIPAL ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Cabeçalho Superior (Filtro de Período e Sub-abas) */}
        <header className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Título do Módulo Ativo + Botão Mobile */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{currentModule.label}</h1>
                <p className="text-xs text-slate-400">
                  Gestão financeira familiar inteligente
                </p>
              </div>
            </div>

            {/* Seletores de Mês e Ano */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-emerald-400 ml-2" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer pr-2"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>

              <span className="text-slate-700">|</span>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer pr-2"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-navegação (Abas do Módulo) */}
          {currentModule.subItems.length > 1 && (
            <div className="px-6 flex items-center gap-2 overflow-x-auto border-t border-slate-800/50 pt-2 pb-2">
              {currentModule.subItems.map((sub) => {
                const isSubActive = activeSubItemId === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSelectSubItem(sub.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSubActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* Conteúdo Dinâmico da Página */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}