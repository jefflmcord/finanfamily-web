import { 
  LayoutDashboard, 
  FolderPlus, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  BarChart3,
  PiggyBank,
  Wallet,
  CreditCard,
  Tag,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target
} from 'lucide-react';

export interface SubMenuItem {
  id: string;
  label: string;
  icon: any;
  description?: string;
}

export const MODULES = [
  {
    id: 'dashboard',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    subItems: [
      { id: 'resumo', label: 'Resumo Mensal', icon: LayoutDashboard },
      { id: 'cartoes', label: 'Cartões Ativos', icon: CreditCard },
      { id: 'extrato', label: 'Extrato Consolidado', icon: Receipt },
    ]
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: FolderPlus,
    subItems: [
      { id: 'contas', label: 'Contas Bancárias', icon: Wallet },
      { id: 'cartoes_cad', label: 'Cartões de Crédito', icon: CreditCard },
      { id: 'categorias', label: 'Categorias', icon: Tag },
    ]
  },
  {
    id: 'contas_a_pagar',
    label: 'Contas a Pagar',
    icon: ArrowDownCircle,
    subItems: [
      { id: 'todas_despesas', label: 'Todas as Despesas', icon: Receipt },
      { id: 'a_vencer', label: 'A Vencer', icon: Clock },
      { id: 'vencidas', label: 'Vencidas', icon: AlertTriangle },
      { id: 'pagas', label: 'Pagas', icon: CheckCircle2 },
    ]
  },
  {
    id: 'contas_a_receber',
    label: 'Contas a Receber',
    icon: ArrowUpCircle,
    subItems: [
      { id: 'todas_receitas', label: 'Todas as Receitas', icon: Receipt },
      { id: 'a_receber', label: 'A Receber', icon: Clock },
      { id: 'recebidas', label: 'Recebidas', icon: CheckCircle2 },
    ]
  },
  {
    id: 'investimentos',
    label: 'Investimentos',
    icon: PiggyBank,
    subItems: [
      { id: 'objetivos', label: 'Meus Objetivos', icon: Target },
    ]
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    subItems: [
      { id: 'orcamento', label: 'Orçado vs Realizado', icon: BarChart3 },
      { id: 'gastos_categoria', label: 'Por Categoria', icon: Tag },
    ]
  }
];