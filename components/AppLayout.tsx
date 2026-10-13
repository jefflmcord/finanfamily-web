'use client';

import React, { useState } from 'react';
import { 
  MODULES, 
  SubMenuItem 
} from '@/config/navigation';
import { 
  Menu, 
  X, 
  Calendar, 
  Plus, 
  Layers,
  Settings,
  Users
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  activeSubItemId: string;
  onSelectSubItem: (id: string) => void;
  month: number;
  setMonth: (m: number) => void;
  year: number;
  setYear: (y: number) => void;
  onOpenNewTransaction: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
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
  onOpenNewTransaction
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeModule = MODULES.find((m) => m.id === activeModuleId) || MODULES[0];
  const subItems: SubMenuItem[] = activeModule.subItems || [];

  const handleSelectModule = (id: string) => {
    onSelectModule(id);
    const targetModule = MODULES.find((m) => m.id === id);
    if (targetModule && targetModule.subItems.length > 0) {
      onSelectSubItem(targetModule.subItems[0].id);
    }
  };

  const handleSelectSubItem = (id: string) => {
    onSelectSubItem(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 1. HEADER GLOBAL */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 transition-all print:hidden">
        <div className="w-full flex items-center justify-between gap-3">
          
          {/* Logo e Botão Hambúrguer Mobile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-sm shadow-emerald-500/20 shrink-0">
                F
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                  FinanFamily
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              </div>
            </div>
          </div>

          {/* Navegação de Módulos Central */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto no-scrollbar shrink">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelectModule(mod.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controles da Direita */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Seletor Mês / Ano */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 gap-1 text-xs text-slate-300 shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx + 1} className="bg-slate-900 text-slate-200">
                    {name}
                  </option>
                ))}
              </select>
              <span className="text-slate-600">/</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-slate-200">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Novo Lançamento */}
            <button
              onClick={onOpenNewTransaction}
              className="hidden md:flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="whitespace-nowrap">Novo Lançamento</span>
            </button>

            {/* Ícone de Configurações */}
            <button
              onClick={() => setSettingsOpen(true)}
              title="Configurações e Preferências"
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
              aria-label="Abrir Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Módulos (Mobile) */}
        <div className="md:hidden mt-2 pt-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModuleId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleSelectModule(mod.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. CORPO PRINCIPAL COM SIDEBAR ESQUERDA */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex px-3 sm:px-6 lg:px-8 py-6 gap-6 relative">
        
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          />
        )}

        {/* Sidebar Esquerda */}
        <aside
          className={`
            fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-0
            w-64 bg-slate-900/95 lg:bg-transparent p-5 lg:p-0
            border-r lg:border-r-0 border-slate-800
            transform transition-transform duration-300 ease-in-out
            lg:transform-none lg:block
            ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
            shrink-0 print:hidden
          `}
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 lg:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Navegação
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="sticky top-24 space-y-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
              {activeModule.label}
            </div>

            <nav className="space-y-1">
              {subItems.map((item) => {
                const Icon = item.icon;
                const isSubActive = activeSubItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSubItem(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isSubActive
                        ? 'bg-slate-800/90 text-white font-bold border border-slate-700/80 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 w-full min-w-0 pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* 3. BOTÃO FLUTUANTE (FAB) MOBILE */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 print:hidden">
        <button
          onClick={onOpenNewTransaction}
          aria-label="Adicionar Novo Lançamento"
          className="w-14 h-14 rounded-full bg-emerald-500 active:bg-emerald-600 active:scale-95 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 border border-emerald-400/40 transition-transform cursor-pointer"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* 4. MODAL LATERAL DIREITO (CONFIGURAÇÕES / MEMBROS) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div 
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          />

          <div className="relative w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Preferências</h3>
                    <p className="text-[11px] text-slate-400">Configurações da conta e sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Membros da Família */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Membros da Família
                </label>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Criar e Gerenciar Usuários</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Cadastro de novos membros com permissões personalizadas.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert('A funcionalidade de cadastro de novos usuários estará disponível na próxima atualização!');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Gerenciar Usuários</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md ml-auto">
                      Em breve
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
              <span>FinanFamily v1.2</span>
              <span className="text-emerald-500 font-medium">Ambiente Seguro</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}