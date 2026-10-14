'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import AppLayout from '@/components/AppLayout';
import NewTransactionModal from '@/components/NewTransactionModal';
import DashboardOverview from '@/components/DashboardOverview';
import UpcomingDues from '@/components/UpcomingDues';
import CreditCardList from '@/components/CreditCardList';
import TransactionsList from '@/components/TransactionsList';
import AccountsManager from '@/components/AccountsManager';
import CardsManager from '@/components/CardsManager';
import CategoriesManager from '@/components/CategoriesManager';
import GoalsManager from '@/components/GoalsManager';

interface DashboardData {
  month: number;
  year: number;
  income: {
    received: number;
    projected: number;
  };
  expenses: {
    fixed: number;
    variable: number;
    paidSoFar: number;
    totalProjected: number;
    investments: number;
  };
  interest?: {
    totalPaid: number;
    count: number;
  };
  projectedBalance: number;
  categoriesDistribution: {
    name: string;
    color: string;
    total: number;
  }[];
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [refreshKey, setRefreshKey] = useState(0);
  const [familyId, setFamilyId] = useState<string>(
    process.env.NEXT_PUBLIC_FAMILY_ID || '0663962f-71e2-43e1-a8a5-0c017f68536d'
  );

  // Navegação Modular
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeSubItem, setActiveSubItem] = useState('resumo');

  // Modal de Novo Lançamento
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finanfamily-api.onrender.com';

  // Verificação de Segurança (Login e Troca de Senha no Primeiro Acesso)
  useEffect(() => {
    const token = localStorage.getItem('@FinanFamily:token');
    const storedUser = localStorage.getItem('@FinanFamily:user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.must_change_password) {
        router.push('/primeiro-acesso');
        return;
      }
      if (user.family_id) {
        setFamilyId(user.family_id);
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/dashboard/summary?family_id=${familyId}&month=${month}&year=${year}`
      );
      const result = await response.json();
      setData(result);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Erro ao carregar o resumo financeiro:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, familyId, month, year]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <AppLayout
      activeModuleId={activeModule}
      onSelectModule={setActiveModule}
      activeSubItemId={activeSubItem}
      onSelectSubItem={setActiveSubItem}
      month={month}
      setMonth={setMonth}
      year={year}
      setYear={setYear}
      onOpenNewTransaction={() => setIsTransactionModalOpen(true)}
    >
      {/* ========================================================
          MÓDULO 1: VISÃO GERAL (DASHBOARD ANALÍTICO)
          ======================================================== */}
      {activeModule === 'dashboard' && (
        <div className="space-y-8">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500">
              Carregando indicadores do painel...
            </div>
          ) : data ? (
            <>
              {activeSubItem === 'resumo' && (
                <div className="space-y-8">
                  {/* Visão Geral com Gráficos e Diagnóstico */}
                  <DashboardOverview data={data} />

                  {/* Contas a Vencer no Mês */}
                  <UpcomingDues 
                    month={month} 
                    year={year} 
                    onTransactionPaid={loadDashboard} 
                  />

                  {/* Cartões Ativos com suporte a fatura/quitação */}
                  <CreditCardList 
                    refreshTrigger={refreshKey}
                    month={month}
                    year={year}
                    onInvoicePaid={loadDashboard}
                  />
                </div>
              )}

              {activeSubItem === 'cartoes' && (
                <CreditCardList 
                  refreshTrigger={refreshKey}
                  month={month}
                  year={year}
                  onInvoicePaid={loadDashboard}
                />
              )}

              {activeSubItem === 'extrato' && (
                <TransactionsList 
                  month={month} 
                  year={year} 
                  refreshTrigger={refreshKey} 
                />
              )}
            </>
          ) : (
            <div className="text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Não foi possível carregar os dados financeiros da família.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MÓDULO 2: CADASTROS
          ======================================================== */}
      {activeModule === 'cadastros' && (
        <div className="space-y-6">
          {activeSubItem === 'contas' && (
            <AccountsManager onUpdated={loadDashboard} />
          )}

          {activeSubItem === 'cartoes_cad' && (
            <CardsManager onUpdated={loadDashboard} />
          )}

          {activeSubItem === 'categorias' && (
            <CategoriesManager onUpdated={loadDashboard} />
          )}
        </div>
      )}

      {/* ========================================================
          MÓDULO 3: CONTAS A PAGAR
          ======================================================== */}
      {activeModule === 'contas_a_pagar' && (
        <div className="space-y-6">
          {activeSubItem === 'todas_despesas' && (
            <TransactionsList 
              month={month} 
              year={year} 
              refreshTrigger={refreshKey}
              defaultType="EXPENSE"
              defaultStatus="ALL"
              title={`Todas as Despesas (${String(month).padStart(2, '0')}/${year})`}
            />
          )}

          {activeSubItem === 'a_vencer' && (
            <UpcomingDues 
              month={month} 
              year={year} 
              onTransactionPaid={loadDashboard} 
            />
          )}

          {activeSubItem === 'vencidas' && (
            <TransactionsList 
              month={month} 
              year={year} 
              refreshTrigger={refreshKey}
              defaultType="EXPENSE"
              defaultStatus="OVERDUE"
              title={`Despesas Vencidas (${String(month).padStart(2, '0')}/${year})`}
            />
          )}

          {activeSubItem === 'pagas' && (
            <TransactionsList 
              month={month} 
              year={year} 
              refreshTrigger={refreshKey}
              defaultType="EXPENSE"
              defaultStatus="PAID"
              title={`Despesas Pagas (${String(month).padStart(2, '0')}/${year})`}
            />
          )}
        </div>
      )}

      {/* ========================================================
          MÓDULO 4: CONTAS A RECEBER
          ======================================================== */}
      {activeModule === 'contas_a_receber' && (
        <div className="space-y-6">
          {activeSubItem === 'todas_receitas' && (
            <TransactionsList 
              month={month} 
              year={year} 
              refreshTrigger={refreshKey}
              defaultType="INCOME"
              defaultStatus="ALL"
              title={`Todas as Receitas (${String(month).padStart(2, '0')}/${year})`}
            />
          )}

          {activeSubItem === 'a_receber' && (
            <TransactionsList 
              month={month} 
              year={year} 
              refreshTrigger={refreshKey}
              defaultType="INCOME"
              defaultStatus="PENDING"
              title={`Receitas a Receber (${String(month).padStart(2, '0')}/${year})`}
            />
          )}

          {activeSubItem === 'recebidas' && (
            <TransactionsList 
              month={month} 
              year={year} 
              refreshTrigger={refreshKey}
              defaultType="INCOME"
              defaultStatus="PAID"
              title={`Receitas Recebidas (${String(month).padStart(2, '0')}/${year})`}
            />
          )}
        </div>
      )}

      {/* ========================================================
          MÓDULO 5: INVESTIMENTOS
          ======================================================== */}
      {activeModule === 'investimentos' && (
        <GoalsManager onUpdated={loadDashboard} />
      )}

      {/* ========================================================
          MÓDULO 6: RELATÓRIOS
          ======================================================== */}
      {activeModule === 'relatorios' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Relatórios Financeiros</h2>
          <p className="text-xs text-slate-400">Em desenvolvimento: demonstrativos e balanço orçado vs. realizado.</p>
        </div>
      )}

      {/* Modal de Criação de Lançamento */}
      <NewTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={loadDashboard}
      />
    </AppLayout>
  );
}