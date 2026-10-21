'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  PlusCircle,
  CreditCard,
  Target,
  PiggyBank,
  LayoutDashboard,
  LogOut,
  X,
  CheckCircle2,
  FileText,
  DollarSign,
  Layers,
  Menu,
  User,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Loader2,
  Upload,
} from 'lucide-react';
import FamilyMembersManager from '@/components/FamilyMembersManager';
import {
  DashboardModule,
  FamilyAccess,
  InterfaceTheme,
  SettingsSection,
  UserProfile,
} from './dashboardUtils';

interface DashboardHeaderProps {
  activeModule: DashboardModule;
  setActiveModule: (module: DashboardModule) => void;
  setActiveSubMenu: (subMenu: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  familyAccess: FamilyAccess | null;
  canCreateTransactions: boolean;
  onOpenNewTransaction: () => void;
  onOpenSmartImport?: () => void;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  onAvatarError: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  activeModule,
  setActiveModule,
  setActiveSubMenu,
  setMobileMenuOpen,
  familyAccess,
  canCreateTransactions,
  onOpenNewTransaction,
  onOpenSmartImport,
  userName,
  userEmail,
  userAvatarUrl,
  onAvatarError,
  onOpenSettings,
  onLogout,
}: DashboardHeaderProps) {
  const userInitials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
  const userFirstName = userName.trim().split(/\s+/)[0] || 'Usuário';

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu de navegação"
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-300 hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-500/30 items-center justify-center text-emerald-400">
          <Wallet className="w-6 h-6" />
        </div>
        <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
          Finan<span className="text-emerald-400">Family</span>
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setActiveModule('cadastros');
            setActiveSubMenu('geral');
          }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm ${
            activeModule === 'cadastros' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Cadastros
        </button>
        {familyAccess?.permissions.family_read && (
          <>
            <button
              onClick={() => {
                setActiveModule('pagar');
                setActiveSubMenu('contas_pagar');
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm ${
                activeModule === 'pagar' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Contas a Pagar
            </button>
            <button
              onClick={() => {
                setActiveModule('receber');
                setActiveSubMenu('contas_receber');
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm ${
                activeModule === 'receber' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Contas a Receber
            </button>
            <button
              onClick={() => {
                setActiveModule('investimentos');
                setActiveSubMenu('metas');
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm ${
                activeModule === 'investimentos'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Investimentos
            </button>
          </>
        )}
      </nav>
      <div className="flex items-center gap-1 sm:gap-3">
        {canCreateTransactions && onOpenSmartImport && (
          <button
            type="button"
            onClick={onOpenSmartImport}
            title="Importar Extrato, Fatura em PDF ou Print de Tela"
            className="flex bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-extrabold py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Importar Extrato / Print</span>
            <span className="lg:hidden">Importar</span>
          </button>
        )}
        {canCreateTransactions && (
          <button
            onClick={onOpenNewTransaction}
            className="hidden md:flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl shadow-lg items-center gap-2 cursor-pointer transition-all"
          >
            <PlusCircle className="w-5 h-5" /> Novo Lançamento
          </button>
        )}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 sm:pl-3 sm:border-l sm:border-slate-800">
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={`Foto de ${userName}`}
              onError={onAvatarError}
              referrerPolicy="no-referrer"
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full border border-emerald-500/30 object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-extrabold text-emerald-300"
            >
              {userInitials || <User className="h-4 w-4" />}
            </div>
          )}
          <div className="min-w-0 max-w-14 sm:max-w-40">
            <p className="truncate text-xs font-bold text-white sm:hidden" title={userName}>
              {userFirstName}
            </p>
            <p className="hidden truncate text-sm font-bold text-white sm:block" title={userName}>
              {userName}
            </p>
            <p className="hidden truncate text-xs text-slate-400 sm:block" title={userEmail}>
              {userEmail || 'Usuário conectado'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Abrir configurações"
          title="Configurações"
          className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onLogout}
          aria-label="Sair"
          className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-semibold p-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settingsSection: SettingsSection;
  onChangeSection: (section: SettingsSection) => void;
  familyAccess: FamilyAccess | null;
  userEmail: string;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSaveProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  savingProfile: boolean;
  profileError: string;
  profileNotice: string;
  theme: InterfaceTheme;
  onToggleTheme: () => void;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  settingsSection,
  onChangeSection,
  familyAccess,
  userEmail,
  profile,
  setProfile,
  onSaveProfile,
  savingProfile,
  profileError,
  profileNotice,
  theme,
  onToggleTheme,
}: SettingsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Fechar configurações"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-hidden border-l border-slate-800 bg-slate-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-7">
          <div>
            <h2 id="settings-drawer-title" className="text-lg font-extrabold text-white">
              Configurações
            </h2>
            <p className="mt-1 text-xs text-slate-400">Preferências e gestão da família</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Fechar configurações"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          <nav aria-label="Seções das configurações" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ['profile', 'Perfil'],
                ['appearance', 'Aparência'],
                ...(familyAccess?.role === 'OWNER' ? [['family', 'Membros da família']] : []),
              ] as [SettingsSection, string][]
            ).map(([section, label]) => (
              <button
                key={section}
                type="button"
                aria-current={settingsSection === section ? 'page' : undefined}
                onClick={() => onChangeSection(section)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  settingsSection === section
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          {userEmail.toLowerCase() === 'jeffersonluismattosocordeiro@gmail.com' && (
            <Link
              href="/relatorio-interno"
              onClick={onClose}
              className="block rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-center text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              Relatório interno de tenants
            </Link>
          )}

          {settingsSection === 'profile' && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-white">Perfil pessoal</h3>
                <p className="mt-1 text-xs text-slate-400">Atualize as informações exibidas na sua conta.</p>
              </div>
              <form onSubmit={onSaveProfile} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Nome de exibição</span>
                  <input
                    required
                    maxLength={100}
                    value={profile.name}
                    onChange={event => setProfile(current => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">E-mail</span>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-500"
                  />
                  <span className="block text-[11px] text-slate-500">
                    O e-mail usado para entrar não pode ser alterado.
                  </span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300">Telefone</span>
                    <input
                      type="tel"
                      maxLength={30}
                      value={profile.phone}
                      onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300">Data de nascimento</span>
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={profile.birth_date}
                      onChange={event => setProfile(current => ({ ...current, birth_date: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Foto de perfil (URL)</span>
                  <input
                    type="url"
                    maxLength={2048}
                    placeholder="https://..."
                    value={profile.avatar_url}
                    onChange={event => setProfile(current => ({ ...current, avatar_url: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Descrição pessoal</span>
                  <textarea
                    maxLength={280}
                    rows={3}
                    value={profile.bio}
                    onChange={event => setProfile(current => ({ ...current, bio: event.target.value }))}
                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <span className="block text-right text-[11px] text-slate-500">{profile.bio.length}/280</span>
                </label>
                {profileError && (
                  <p role="alert" className="text-sm text-rose-400">
                    {profileError}
                  </p>
                )}
                {profileNotice && (
                  <p role="status" className="text-sm text-emerald-400">
                    {profileNotice}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {savingProfile ? 'Salvando...' : 'Guardar alterações'}
                </button>
              </form>
            </section>
          )}

          {settingsSection === 'appearance' && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aparência</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Escolha entre o modo claro e o modo escuro.</p>
                </div>
              </div>
              <div role="group" aria-label="Tema da interface" className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={theme === 'light'}
                  onClick={() => theme !== 'light' && onToggleTheme()}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                    theme === 'light'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Sun className="h-4 w-4" /> Claro
                </button>
                <button
                  type="button"
                  aria-pressed={theme === 'dark'}
                  onClick={() => theme !== 'dark' && onToggleTheme()}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                    theme === 'dark'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Moon className="h-4 w-4" /> Escuro
                </button>
              </div>
            </section>
          )}

          {settingsSection === 'family' && familyAccess?.role === 'OWNER' && (
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Membros da família</h3>
                <p className="mt-1 text-xs text-slate-400">Convide pessoas e gerencie as permissões de acesso.</p>
              </div>
              <FamilyMembersManager showHeading={false} />
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

interface DashboardSidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeModule: DashboardModule;
  setActiveModule: (module: DashboardModule) => void;
  activeSubMenu: string;
  setActiveSubMenu: (subMenu: string) => void;
  canReadFamily: boolean;
}

export function DashboardSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
  activeModule,
  setActiveModule,
  activeSubMenu,
  setActiveSubMenu,
  canReadFamily,
}: DashboardSidebarProps) {
  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu de navegação"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 w-72 max-w-[85vw] md:w-64 md:max-w-none max-h-[100dvh] overflow-y-auto overscroll-contain bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-2 transition-transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 md:hidden">
          <span className="font-bold text-white">Menu</span>
          <button onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 pb-3 mb-2 border-b border-slate-800 md:hidden">
          <button
            onClick={() => {
              setActiveModule('cadastros');
              setActiveSubMenu('geral');
            }}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
              activeModule === 'cadastros' && activeSubMenu === 'geral'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-950 text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 inline mr-1.5" />
            Visão Geral
          </button>
          <button
            onClick={() => {
              setActiveModule('pagar');
              setActiveSubMenu('contas_pagar');
            }}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
              activeModule === 'pagar' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />A Pagar
          </button>
          <button
            onClick={() => {
              setActiveModule('receber');
              setActiveSubMenu('contas_receber');
            }}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
              activeModule === 'receber' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1.5" />A Receber
          </button>
          <button
            onClick={() => {
              setActiveModule('investimentos');
              setActiveSubMenu('metas');
            }}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
              activeModule === 'investimentos' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1.5" />
            Investimentos
          </button>
        </div>
        <p className="text-xs uppercase font-extrabold text-slate-500 px-3 pb-1">Menus do Módulo</p>
        {activeModule === 'cadastros' && (
          <>
            <button
              onClick={() => {
                setActiveSubMenu('geral');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                activeSubMenu === 'geral'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" /> Visão Geral
            </button>
            {canReadFamily && (
              <>
                <button
                  onClick={() => {
                    setActiveSubMenu('cartoes');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                    activeSubMenu === 'cartoes'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" /> Cartões
                </button>
                <button
                  onClick={() => {
                    setActiveSubMenu('contas');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                    activeSubMenu === 'contas'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-400'
                  }`}
                >
                  <Wallet className="w-5 h-5" /> Contas
                </button>
                <button
                  onClick={() => {
                    setActiveSubMenu('categorias');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                    activeSubMenu === 'categorias'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-400'
                  }`}
                >
                  <Layers className="w-5 h-5" /> Categorias
                </button>
              </>
            )}
          </>
        )}
        {activeModule === 'pagar' && canReadFamily && (
          <button
            onClick={() => {
              setActiveSubMenu('contas_pagar');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
              activeSubMenu === 'contas_pagar'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'text-slate-400'
            }`}
          >
            <FileText className="w-5 h-5" /> Lançamentos a Pagar
          </button>
        )}
        {activeModule === 'receber' && canReadFamily && (
          <button
            onClick={() => {
              setActiveSubMenu('contas_receber');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
              activeSubMenu === 'contas_receber'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'text-slate-400'
            }`}
          >
            <DollarSign className="w-5 h-5" /> Lançamentos a Receber
          </button>
        )}
        {activeModule === 'investimentos' && canReadFamily && (
          <>
            <button
              onClick={() => {
                setActiveSubMenu('metas');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                activeSubMenu === 'metas'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'text-slate-400'
              }`}
            >
              <Target className="w-5 h-5" /> Metas & Objetivos
            </button>
            <button
              onClick={() => {
                setActiveSubMenu('provisoes');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                activeSubMenu === 'provisoes'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'text-slate-400'
              }`}
            >
              <PiggyBank className="w-5 h-5" /> Provisões anuais
            </button>
          </>
        )}
      </aside>
    </>
  );
}
