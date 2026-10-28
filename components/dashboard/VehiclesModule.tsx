'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Car,
  Fuel,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  PhoneCall,
  CalendarClock,
  Gauge,
  CheckCircle2,
  Calculator,
  Sparkles,
  ArrowRight,
  CreditCard,
  Wallet,
  X,
  Loader2,
  FileText,
} from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';
import { formatCurrency, formatDatePT, MONTH_FULL_NAMES } from './dashboardUtils';

export interface FamilyVehicle {
  id: number | string;
  family_id: string;
  nickname: string;
  vehicle_type: 'CAR' | 'MOTORCYCLE' | 'SUV_PICKUP' | 'OTHER';
  brand_model: string;
  manufacture_year: number | null;
  model_year: number | null;
  license_plate: string | null;
  fuel_type: string;
  current_odometer: number;
  fipe_estimated_value: number;
  ipva_estimated_amount: number;
  ipva_due_month: number;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  insurance_renewal_date: string | null;
  insurance_annual_amount: number;
  insurance_assistance_phone: string | null;
  next_revision_km: number | null;
  next_revision_date: string | null;
  status: 'ACTIVE' | 'SOLD' | 'INACTIVE';
  notes: string | null;
}

export interface VehicleRecord {
  id: number | string;
  family_id: string;
  vehicle_id: number | string;
  record_type: 'FUEL' | 'MAINTENANCE' | 'DOCUMENT_TAX' | 'INSURANCE' | 'OTHER';
  title: string;
  service_category: string;
  record_date: string;
  odometer_km: number | null;
  liters: number | null;
  price_per_liter: number | null;
  fuel_efficiency_kml: number | null;
  amount: number;
  provider_name: string | null;
  next_service_km: number | null;
  next_service_date: string | null;
  financial_transaction_id: string | null;
  notes: string | null;
}

interface VehiclesModuleProps {
  activeSubMenu: string;
  setActiveSubMenu: (sub: string) => void;
  accounts: any[];
  cards: any[];
  categories: any[];
  onRefreshFinancialData: () => void;
}

const QUICK_MAINTENANCE_TEMPLATES = [
  {
    title: 'Troca de Óleo + Filtro de Óleo/Ar',
    category: 'Troca de Óleo & Filtros',
    record_type: 'MAINTENANCE' as const,
    addKm: 10000,
    addMonths: 6,
  },
  {
    title: 'Alinhamento + Balanceamento 4 Rodas',
    category: 'Pneus, Alinhamento & Freios',
    record_type: 'MAINTENANCE' as const,
    addKm: 10000,
    addMonths: 6,
  },
  {
    title: 'Pastilhas e Fluido de Freio',
    category: 'Pneus, Alinhamento & Freios',
    record_type: 'MAINTENANCE' as const,
    addKm: 20000,
    addMonths: 12,
  },
  {
    title: 'Revisão Preventiva Completa',
    category: 'Revisão Preventiva',
    record_type: 'MAINTENANCE' as const,
    addKm: 10000,
    addMonths: 12,
  },
  {
    title: 'Troca de Bateria Automotiva',
    category: 'Bateria & Elétrica',
    record_type: 'MAINTENANCE' as const,
    addKm: 30000,
    addMonths: 24,
  },
  {
    title: 'Lavagem Completa / Higienização',
    category: 'Estética, Lavagem & Pedágio',
    record_type: 'OTHER' as const,
    addKm: 0,
    addMonths: 0,
  },
];

function getDaysUntilDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const clean = dateStr.slice(0, 10);
  const target = new Date(`${clean}T12:00:00`);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function VehiclesModule({
  activeSubMenu,
  setActiveSubMenu,
  accounts,
  cards,
  categories,
  onRefreshFinancialData,
}: VehiclesModuleProps) {
  const [vehicles, setVehicles] = useState<FamilyVehicle[]>([]);
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('ALL');

  // Modal de Cadastro / Edição de Veículo
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FamilyVehicle | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    nickname: '',
    vehicle_type: 'CAR',
    brand_model: '',
    manufacture_year: String(new Date().getFullYear() - 1),
    model_year: String(new Date().getFullYear()),
    license_plate: '',
    fuel_type: 'FLEX',
    current_odometer: '',
    fipe_estimated_value: '',
    ipva_estimated_amount: '',
    ipva_due_month: '1',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_renewal_date: '',
    insurance_annual_amount: '',
    insurance_assistance_phone: '',
    next_revision_km: '',
    next_revision_date: '',
    notes: '',
  });

  // Calculadora Etanol vs Gasolina na Bomba
  const [pumpEthanolPrice, setPumpEthanolPrice] = useState('3.89');
  const [pumpGasolinePrice, setPumpGasolinePrice] = useState('5.79');

  // Formulário de Registro (Abastecimento / Manutenção)
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordForm, setRecordForm] = useState({
    vehicle_id: '',
    record_type: 'FUEL' as 'FUEL' | 'MAINTENANCE' | 'DOCUMENT_TAX' | 'INSURANCE' | 'OTHER',
    title: 'Abastecimento Gasolina Comum',
    service_category: 'Gasolina Comum',
    record_date: new Date().toISOString().slice(0, 10),
    odometer_km: '',
    liters: '',
    price_per_liter: '',
    amount: '',
    provider_name: '',
    next_service_km: '',
    next_service_date: '',
    notes: '',
    launch_in_financial: true,
    payment_target: 'CARD' as 'CARD' | 'ACCOUNT',
    account_id: '',
    credit_card_id: '',
    category_id: '',
    financial_status: 'PAID' as 'PAID' | 'PENDING',
  });

  // Modal de Geração de Parcelas Anuais (IPVA / Seguro) no Financeiro
  const [annualLaunchModal, setAnnualLaunchModal] = useState<{
    vehicle: FamilyVehicle;
    kind: 'IPVA' | 'INSURANCE';
  } | null>(null);
  const [annualLaunchForm, setAnnualLaunchForm] = useState({
    total_amount: '',
    installments: '5',
    first_due_date: new Date().toISOString().slice(0, 10),
    payment_target: 'ACCOUNT' as 'ACCOUNT' | 'CARD',
    account_id: '',
    credit_card_id: '',
    category_id: '',
  });
  const [launchingAnnual, setLaunchingAnnual] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/vehicles/overview`);
      const data = await res.json();
      if (res.ok) {
        const loadedVehicles: FamilyVehicle[] = data.vehicles || [];
        setVehicles(loadedVehicles);
        setRecords(data.records || []);
        if (loadedVehicles.length > 0 && !recordForm.vehicle_id) {
          const first = loadedVehicles[0];
          setRecordForm(prev => ({
            ...prev,
            vehicle_id: String(first.id),
            odometer_km: first.current_odometer > 0 ? String(first.current_odometer) : '',
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar módulo de veículos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (cards.length > 0 && !recordForm.credit_card_id) {
      setRecordForm(prev => ({ ...prev, credit_card_id: String(cards[0].id) }));
    }
    if (accounts.length > 0 && !recordForm.account_id) {
      setRecordForm(prev => ({ ...prev, account_id: String(accounts[0].id) }));
    }
  }, [cards, accounts]);

  const expenseCategories = useMemo(
    () => categories.filter(c => c.flow_type === 'EXPENSE'),
    [categories]
  );

  // KPIs Consolidados da Frota
  const fleetStats = useMemo(() => {
    const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE');
    const totalFipe = activeVehicles.reduce((acc, v) => acc + Number(v.fipe_estimated_value || 0), 0);
    const totalAnnualIpva = activeVehicles.reduce((acc, v) => acc + Number(v.ipva_estimated_amount || 0), 0);
    const totalAnnualInsurance = activeVehicles.reduce((acc, v) => acc + Number(v.insurance_annual_amount || 0), 0);

    const now = new Date();
    const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curYear = String(now.getFullYear());

    const fuelThisMonth = records
      .filter(r => r.record_type === 'FUEL' && r.record_date?.startsWith(curYearMonth))
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);

    const maintenanceThisYear = records
      .filter(r => r.record_type !== 'FUEL' && r.record_date?.startsWith(curYear))
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);

    const kmlSamples = records
      .filter(r => r.fuel_efficiency_kml && Number(r.fuel_efficiency_kml) > 0)
      .map(r => Number(r.fuel_efficiency_kml));
    const avgKml =
      kmlSamples.length > 0
        ? Number((kmlSamples.reduce((a, b) => a + b, 0) / kmlSamples.length).toFixed(1))
        : null;

    // Alertas preventivos (revisão próxima por KM ou Data, ou seguro vencendo em <= 30d)
    const alerts: { vehicleId: number | string; nickname: string; message: string; severity: 'warn' | 'danger' }[] = [];
    for (const v of activeVehicles) {
      if (v.next_revision_km && v.current_odometer > 0) {
        const remainingKm = v.next_revision_km - v.current_odometer;
        if (remainingKm <= 0) {
          alerts.push({
            vehicleId: v.id,
            nickname: v.nickname,
            message: `Revisão atrasada por KM (${Math.abs(remainingKm).toLocaleString('pt-BR')} km acima do limite)`,
            severity: 'danger',
          });
        } else if (remainingKm <= 1000) {
          alerts.push({
            vehicleId: v.id,
            nickname: v.nickname,
            message: `Revisão próxima: faltam apenas ${remainingKm.toLocaleString('pt-BR')} km`,
            severity: 'warn',
          });
        }
      }
      const revDays = getDaysUntilDate(v.next_revision_date);
      if (revDays !== null && revDays <= 30) {
        alerts.push({
          vehicleId: v.id,
          nickname: v.nickname,
          message:
            revDays < 0
              ? `Revisão programada venceu há ${Math.abs(revDays)} dias`
              : `Revisão programada em ${revDays} dia(s) (${formatDatePT(v.next_revision_date || '')})`,
          severity: revDays < 0 ? 'danger' : 'warn',
        });
      }
      const insDays = getDaysUntilDate(v.insurance_renewal_date);
      if (insDays !== null && insDays <= 30) {
        alerts.push({
          vehicleId: v.id,
          nickname: v.nickname,
          message:
            insDays < 0
              ? `Apólice de Seguro vencida há ${Math.abs(insDays)} dias!`
              : `Seguro Auto renova em ${insDays} dia(s) (${formatDatePT(v.insurance_renewal_date || '')})`,
          severity: insDays < 0 ? 'danger' : 'warn',
        });
      }
    }

    return {
      activeCount: activeVehicles.length,
      totalFipe,
      totalAnnualIpva,
      totalAnnualInsurance,
      monthlyFixedReserve: (totalAnnualIpva + totalAnnualInsurance) / 12,
      fuelThisMonth,
      maintenanceThisYear,
      avgKml,
      alerts,
    };
  }, [vehicles, records]);

  // Cálculo Etanol vs Gasolina
  const pumpComparison = useMemo(() => {
    const eth = Number(pumpEthanolPrice.replace(',', '.'));
    const gas = Number(pumpGasolinePrice.replace(',', '.'));
    if (!Number.isFinite(eth) || !Number.isFinite(gas) || eth <= 0 || gas <= 0) {
      return null;
    }
    const ratio = (eth / gas) * 100;
    const ethanolWins = ratio <= 70;
    return {
      ratio: ratio.toFixed(1),
      ethanolWins,
      maxEthanolPrice: (gas * 0.7).toFixed(2),
    };
  }, [pumpEthanolPrice, pumpGasolinePrice]);

  const openNewVehicleModal = () => {
    setEditingVehicle(null);
    setVehicleForm({
      nickname: '',
      vehicle_type: 'CAR',
      brand_model: '',
      manufacture_year: String(new Date().getFullYear() - 1),
      model_year: String(new Date().getFullYear()),
      license_plate: '',
      fuel_type: 'FLEX',
      current_odometer: '',
      fipe_estimated_value: '',
      ipva_estimated_amount: '',
      ipva_due_month: '1',
      insurance_provider: '',
      insurance_policy_number: '',
      insurance_renewal_date: '',
      insurance_annual_amount: '',
      insurance_assistance_phone: '',
      next_revision_km: '',
      next_revision_date: '',
      notes: '',
    });
    setVehicleModalOpen(true);
  };

  const openEditVehicleModal = (v: FamilyVehicle) => {
    setEditingVehicle(v);
    setVehicleForm({
      nickname: v.nickname || '',
      vehicle_type: v.vehicle_type || 'CAR',
      brand_model: v.brand_model || '',
      manufacture_year: v.manufacture_year ? String(v.manufacture_year) : '',
      model_year: v.model_year ? String(v.model_year) : '',
      license_plate: v.license_plate || '',
      fuel_type: v.fuel_type || 'FLEX',
      current_odometer: String(v.current_odometer || 0),
      fipe_estimated_value: v.fipe_estimated_value ? String(v.fipe_estimated_value) : '',
      ipva_estimated_amount: v.ipva_estimated_amount ? String(v.ipva_estimated_amount) : '',
      ipva_due_month: String(v.ipva_due_month || 1),
      insurance_provider: v.insurance_provider || '',
      insurance_policy_number: v.insurance_policy_number || '',
      insurance_renewal_date: v.insurance_renewal_date ? v.insurance_renewal_date.slice(0, 10) : '',
      insurance_annual_amount: v.insurance_annual_amount ? String(v.insurance_annual_amount) : '',
      insurance_assistance_phone: v.insurance_assistance_phone || '',
      next_revision_km: v.next_revision_km ? String(v.next_revision_km) : '',
      next_revision_date: v.next_revision_date ? v.next_revision_date.slice(0, 10) : '',
      notes: v.notes || '',
    });
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVehicle(true);
    setFeedback(null);
    try {
      const url = editingVehicle
        ? `${API_URL}/api/vehicles/${editingVehicle.id}`
        : `${API_URL}/api/vehicles`;
      const method = editingVehicle ? 'PUT' : 'POST';
      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleForm,
          current_odometer: Number(vehicleForm.current_odometer || 0),
          fipe_estimated_value: Number(vehicleForm.fipe_estimated_value || 0),
          ipva_estimated_amount: Number(vehicleForm.ipva_estimated_amount || 0),
          ipva_due_month: Number(vehicleForm.ipva_due_month || 1),
          insurance_annual_amount: Number(vehicleForm.insurance_annual_amount || 0),
          next_revision_km: vehicleForm.next_revision_km ? Number(vehicleForm.next_revision_km) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar veículo.');

      setVehicleModalOpen(false);
      setFeedback({
        type: 'success',
        text: editingVehicle ? 'Veículo atualizado com sucesso!' : 'Veículo adicionado à frota da família!',
      });
      await loadOverview();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao salvar veículo.' });
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: FamilyVehicle) => {
    if (!window.confirm(`Deseja realmente remover o veículo "${vehicle.nickname}" e seu histórico?`)) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedback({ type: 'success', text: `Veículo "${vehicle.nickname}" removido.` });
        await loadOverview();
      }
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.vehicle_id) {
      setFeedback({ type: 'error', text: 'Selecione ou cadastre um veículo primeiro.' });
      return;
    }
    setSavingRecord(true);
    setFeedback(null);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/vehicles/${recordForm.vehicle_id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recordForm,
          amount: Number(recordForm.amount || 0),
          odometer_km: recordForm.odometer_km ? Number(recordForm.odometer_km) : null,
          liters: recordForm.liters ? Number(recordForm.liters) : null,
          price_per_liter: recordForm.price_per_liter ? Number(recordForm.price_per_liter) : null,
          next_service_km: recordForm.next_service_km ? Number(recordForm.next_service_km) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar o registro.');

      const kmlMsg = data.calculated_efficiency_kml
        ? ` • Consumo calculado: ${data.calculated_efficiency_kml} km/L`
        : '';
      const finMsg = data.launched_in_financial ? ' • Lançado no Financeiro!' : '';

      setFeedback({
        type: 'success',
        text: `Registro salvo com sucesso${kmlMsg}${finMsg}`,
      });
      setRecordForm(prev => ({
        ...prev,
        amount: '',
        liters: '',
        notes: '',
      }));
      await loadOverview();
      if (data.launched_in_financial) {
        onRefreshFinancialData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao salvar registro.' });
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId: number | string) => {
    if (!window.confirm('Deseja excluir este registro do histórico do veículo?')) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/api/vehicles/records/${recordId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadOverview();
      }
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
    }
  };

  const handleLaunchAnnualExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualLaunchModal) return;
    setLaunchingAnnual(true);
    setFeedback(null);
    try {
      const res = await authenticatedFetch(
        `${API_URL}/api/vehicles/${annualLaunchModal.vehicle.id}/launch-annual-expense`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expense_kind: annualLaunchModal.kind,
            total_amount: Number(annualLaunchForm.total_amount || 0),
            installments: Number(annualLaunchForm.installments || 1),
            first_due_date: annualLaunchForm.first_due_date,
            payment_target: annualLaunchForm.payment_target,
            account_id: annualLaunchForm.account_id,
            credit_card_id: annualLaunchForm.credit_card_id,
            category_id: annualLaunchForm.category_id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar parcelas.');

      setFeedback({ type: 'success', text: data.message });
      setAnnualLaunchModal(null);
      onRefreshFinancialData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao gerar parcelas.' });
    } finally {
      setLaunchingAnnual(false);
    }
  };

  const applyQuickMaintenanceTemplate = (tpl: (typeof QUICK_MAINTENANCE_TEMPLATES)[number]) => {
    const selectedVehicle = vehicles.find(v => String(v.id) === String(recordForm.vehicle_id)) || vehicles[0];
    const baseKm = selectedVehicle ? Number(selectedVehicle.current_odometer || 0) : 0;
    const nextKm = tpl.addKm > 0 && baseKm > 0 ? String(baseKm + tpl.addKm) : '';

    let nextDate = '';
    if (tpl.addMonths > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + tpl.addMonths);
      nextDate = d.toISOString().slice(0, 10);
    }

    setRecordForm(prev => ({
      ...prev,
      vehicle_id: selectedVehicle ? String(selectedVehicle.id) : prev.vehicle_id,
      record_type: tpl.record_type,
      title: tpl.title,
      service_category: tpl.category,
      odometer_km: baseKm > 0 ? String(baseKm) : prev.odometer_km,
      next_service_km: nextKm,
      next_service_date: nextDate,
    }));
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedVehicleFilter !== 'ALL' && String(r.vehicle_id) !== selectedVehicleFilter) {
        return false;
      }
      if (activeSubMenu === 'abastecimento') {
        return r.record_type === 'FUEL';
      }
      if (activeSubMenu === 'manutencao') {
        return r.record_type !== 'FUEL';
      }
      return true;
    });
  }, [records, selectedVehicleFilter, activeSubMenu]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo + Abas Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Car className="w-3.5 h-3.5" />
            <span>Gestão de Veículos da Família</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Frota, Combustível, IPVA, Seguro & Manutenção Preventiva
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controle o consumo em km/L, receba alertas de revisão por quilometragem e envie IPVA, seguro ou
            abastecimentos para o financeiro em 1 clique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubMenu('frota')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeSubMenu === 'frota'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            Frota & IPVA/Seguro
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubMenu('abastecimento');
              setRecordForm(prev => ({
                ...prev,
                record_type: 'FUEL',
                title: 'Abastecimento Gasolina Comum',
                service_category: 'Gasolina Comum',
              }));
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeSubMenu === 'abastecimento'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            <Fuel className="w-4 h-4" />
            Combustível & Bomba
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubMenu('manutencao');
              setRecordForm(prev => ({
                ...prev,
                record_type: 'MAINTENANCE',
                title: 'Troca de Óleo + Filtros',
                service_category: 'Troca de Óleo & Filtros',
              }));
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeSubMenu === 'manutencao'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Manutenção & Revisões
          </button>
          <button
            type="button"
            onClick={openNewVehicleModal}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Veículo
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border p-4 text-xs sm:text-sm font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPIs da Frota */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Patrimônio em Veículos (FIPE)</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{formatCurrency(fleetStats.totalFipe)}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            {fleetStats.activeCount} veículo(s) ativo(s) na garagem
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Combustível no Mês & Consumo</span>
            <Fuel className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-400">{formatCurrency(fleetStats.fuelThisMonth)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Média geral da frota:{' '}
            <strong className="text-white">
              {fleetStats.avgKml ? `${fleetStats.avgKml} km/L` : 'Registre 2 abastecimentos'}
            </strong>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>IPVA + Seguro Anual</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {formatCurrency(fleetStats.totalAnnualIpva + fleetStats.totalAnnualInsurance)}
          </p>
          <p className="text-[11px] text-indigo-300 font-semibold mt-1">
            Reserva ideal: {formatCurrency(fleetStats.monthlyFixedReserve)}/mês
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Manutenção no Ano & Alertas</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400">
            {formatCurrency(fleetStats.maintenanceThisYear)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {fleetStats.alerts.length > 0 ? (
              <span className="text-amber-300 font-bold">{fleetStats.alerts.length} alerta(s) preventivo(s)</span>
            ) : (
              <span className="text-emerald-400 font-semibold">Revisões e seguros em dia</span>
            )}
          </p>
        </div>
      </div>

      {/* Banner de Alertas Preventivos de Revisão / Seguro */}
      {fleetStats.alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Alertas Preventivos da Frota (Revisão & Seguro)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {fleetStats.alerts.map((al, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  al.severity === 'danger'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/80 border-amber-500/30 text-amber-200'
                }`}
              >
                <div>
                  <strong className="text-white">{al.nickname}:</strong> {al.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ABA 1: FROTA, IPVA & SEGURO ================= */}
      {activeSubMenu === 'frota' && (
        <div className="space-y-5">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
              Carregando veículos da família...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Cadastre o primeiro veículo da sua família
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Controle o consumo de combustível (km/L), saiba exatamente quando fazer a próxima troca de óleo ou
                revisão, guarde a apólice e telefone do guincho 24h e parcele o IPVA/Seguro direto no financeiro.
              </p>
              <button
                type="button"
                onClick={openNewVehicleModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Primeiro Veículo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {vehicles.map(v => {
                const vehicleFuelRecords = records.filter(
                  r => String(r.vehicle_id) === String(v.id) && r.fuel_efficiency_kml
                );
                const lastKml = vehicleFuelRecords[0]?.fuel_efficiency_kml || null;
                const kmRemaining =
                  v.next_revision_km && v.current_odometer > 0 ? v.next_revision_km - v.current_odometer : null;
                const insuranceDays = getDaysUntilDate(v.insurance_renewal_date);

                return (
                  <div
                    key={v.id}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-xl transition-all"
                  >
                    <div className="space-y-4">
                      {/* Topo do Card do Veículo */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Car className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base sm:text-lg font-extrabold text-white">{v.nickname}</h3>
                              {v.license_plate && (
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-[11px] font-mono font-extrabold text-sky-300">
                                  {v.license_plate}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {v.brand_model}{' '}
                              {v.manufacture_year || v.model_year
                                ? `• ${v.manufacture_year || ''}/${v.model_year || ''}`
                                : ''}{' '}
                              • {v.fuel_type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditVehicleModal(v)}
                            title="Editar veículo"
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(v)}
                            title="Excluir veículo"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Odômetro, FIPE e Consumo */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Odômetro Atual</span>
                          <p className="text-sm font-extrabold text-white mt-0.5">
                            {Number(v.current_odometer || 0).toLocaleString('pt-BR')} km
                          </p>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor FIPE Est.</span>
                          <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                            {formatCurrency(v.fipe_estimated_value)}
                          </p>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Último Consumo</span>
                          <p className="text-sm font-extrabold text-sky-400 mt-0.5">
                            {lastKml ? `${lastKml} km/L` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Bloco IPVA & Seguro Auto */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-300">IPVA & Licenciamento</span>
                            <span className="text-[11px] font-bold text-amber-300">
                              Vence: {MONTH_FULL_NAMES[(v.ipva_due_month || 1) - 1]}
                            </span>
                          </div>
                          <p className="text-base font-black text-white">{formatCurrency(v.ipva_estimated_amount)}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setAnnualLaunchModal({ vehicle: v, kind: 'IPVA' });
                              setAnnualLaunchForm(prev => ({
                                ...prev,
                                total_amount: String(v.ipva_estimated_amount || ''),
                                installments: '5',
                                account_id: accounts[0]?.id ? String(accounts[0].id) : '',
                                credit_card_id: cards[0]?.id ? String(cards[0].id) : '',
                              }));
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Gerar Parcelas no Financeiro
                          </button>
                        </div>

                        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-300">
                              Seguro: {v.insurance_provider || 'Não informado'}
                            </span>
                            {insuranceDays !== null && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  insuranceDays <= 30
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/15 text-emerald-400'
                                }`}
                              >
                                {insuranceDays < 0 ? 'Vencido' : `${insuranceDays}d restantes`}
                              </span>
                            )}
                          </div>
                          <p className="text-base font-black text-white">{formatCurrency(v.insurance_annual_amount)}</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAnnualLaunchModal({ vehicle: v, kind: 'INSURANCE' });
                                setAnnualLaunchForm(prev => ({
                                  ...prev,
                                  total_amount: String(v.insurance_annual_amount || ''),
                                  installments: '10',
                                  account_id: accounts[0]?.id ? String(accounts[0].id) : '',
                                  credit_card_id: cards[0]?.id ? String(cards[0].id) : '',
                                }));
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-sky-300 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Parcelar
                            </button>
                            {v.insurance_assistance_phone && (
                              <a
                                href={`tel:${v.insurance_assistance_phone.replace(/\D/g, '')}`}
                                className="py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-extrabold text-rose-300 flex items-center gap-1"
                                title="Ligar para Assistência 24h / Guincho"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Guincho 24h
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Próxima Revisão Preventiva */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-amber-400" />
                          Próxima Revisão / Troca de Óleo:
                        </span>
                        <span className="font-bold text-white">
                          {v.next_revision_km
                            ? `${Number(v.next_revision_km).toLocaleString('pt-BR')} km (${
                                kmRemaining !== null
                                  ? kmRemaining > 0
                                    ? `faltam ${kmRemaining.toLocaleString('pt-BR')} km`
                                    : `passou ${Math.abs(kmRemaining).toLocaleString('pt-BR')} km`
                                  : ''
                              })`
                            : 'Não programada'}
                          {v.next_revision_date ? ` • ${formatDatePT(v.next_revision_date)}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação Rápida no Rodapé do Card */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setRecordForm(prev => ({
                            ...prev,
                            vehicle_id: String(v.id),
                            record_type: 'FUEL',
                            title: 'Abastecimento Gasolina Comum',
                            service_category: 'Gasolina Comum',
                            odometer_km: v.current_odometer > 0 ? String(v.current_odometer) : '',
                          }));
                          setActiveSubMenu('abastecimento');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Fuel className="w-4 h-4" />
                        + Registrar Abastecimento
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordForm(prev => ({
                            ...prev,
                            vehicle_id: String(v.id),
                            record_type: 'MAINTENANCE',
                            title: 'Troca de Óleo + Filtros',
                            service_category: 'Troca de Óleo & Filtros',
                            odometer_km: v.current_odometer > 0 ? String(v.current_odometer) : '',
                          }));
                          setActiveSubMenu('manutencao');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wrench className="w-4 h-4 text-amber-400" />
                        + Registrar Manutenção
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ABA 2 & 3: ABASTECIMENTO OU MANUTENÇÃO ================= */}
      {(activeSubMenu === 'abastecimento' || activeSubMenu === 'manutencao') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Calculadora na Bomba (se combustível) ou Atalhos de Oficina (se manutenção) + Formulário */}
          <div className="lg:col-span-5 space-y-5">
            {activeSubMenu === 'abastecimento' && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Calculadora Rápida na Bomba (Etanol vs Gasolina)
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                    Regra 70%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Preço do Etanol (R$/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={pumpEthanolPrice}
                      onChange={e => setPumpEthanolPrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Preço da Gasolina (R$/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={pumpGasolinePrice}
                      onChange={e => setPumpGasolinePrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white"
                    />
                  </div>
                </div>

                {pumpComparison && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold text-emerald-400">
                        {pumpComparison.ethanolWins
                          ? '✅ Compensa abastecer com ETANOL!'
                          : '⛽ Compensa abastecer com GASOLINA!'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Paridade atual: <strong>{pumpComparison.ratio}%</strong> (Etanol compensa até R${' '}
                        {pumpComparison.maxEthanolPrice}/L)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const chosenPrice = pumpComparison.ethanolWins ? pumpEthanolPrice : pumpGasolinePrice;
                        const chosenFuel = pumpComparison.ethanolWins ? 'Etanol Comum' : 'Gasolina Comum';
                        setRecordForm(prev => ({
                          ...prev,
                          record_type: 'FUEL',
                          title: `Abastecimento ${chosenFuel}`,
                          service_category: chosenFuel,
                          price_per_liter: chosenPrice,
                        }));
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer"
                    >
                      Usar Preço
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSubMenu === 'manutencao' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  Atalhos Rápidos de Oficina (1 Toque)
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_MAINTENANCE_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => applyQuickMaintenanceTemplate(tpl)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
                    >
                      + {tpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário Principal de Registro */}
            <form
              onSubmit={handleSaveRecord}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl"
            >
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {activeSubMenu === 'abastecimento' ? (
                  <>
                    <Fuel className="w-5 h-5 text-emerald-400" />
                    Registrar Abastecimento
                  </>
                ) : (
                  <>
                    <Wrench className="w-5 h-5 text-amber-400" />
                    Registrar Manutenção, Revisão ou Taxa
                  </>
                )}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Veículo</label>
                  <select
                    required
                    value={recordForm.vehicle_id}
                    onChange={e => {
                      const v = vehicles.find(veh => String(veh.id) === e.target.value);
                      setRecordForm(prev => ({
                        ...prev,
                        vehicle_id: e.target.value,
                        odometer_km: v && v.current_odometer > 0 ? String(v.current_odometer) : prev.odometer_km,
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  >
                    <option value="">Selecione o veículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.nickname} ({v.brand_model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={recordForm.record_date}
                    onChange={e => setRecordForm(prev => ({ ...prev, record_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={recordForm.title}
                  onChange={e => setRecordForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Abastecimento Gasolina Aditivada ou Troca de Óleo 40.000km"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Odômetro Atual (km)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={recordForm.odometer_km}
                    onChange={e => setRecordForm(prev => ({ ...prev, odometer_km: e.target.value }))}
                    placeholder="Ex: 42500"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </div>

                {activeSubMenu === 'abastecimento' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Litros (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={recordForm.liters}
                      onChange={e => {
                        const l = e.target.value;
                        const ppl = Number(recordForm.price_per_liter);
                        const autoTotal = l && ppl > 0 ? (Number(l) * ppl).toFixed(2) : recordForm.amount;
                        setRecordForm(prev => ({ ...prev, liters: l, amount: autoTotal }));
                      }}
                      placeholder="Ex: 42.5"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                )}

                <div className={activeSubMenu === 'abastecimento' ? '' : 'col-span-1 sm:col-span-2'}>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    inputMode="decimal"
                    value={recordForm.amount}
                    onChange={e => setRecordForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Ex: 250.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-bold text-emerald-400"
                  />
                </div>
              </div>

              {activeSubMenu === 'manutencao' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Próxima Revisão (KM Alerta)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={recordForm.next_service_km}
                      onChange={e => setRecordForm(prev => ({ ...prev, next_service_km: e.target.value }))}
                      placeholder="Ex: 52500"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Próxima Revisão (Data Alerta)
                    </label>
                    <input
                      type="date"
                      value={recordForm.next_service_date}
                      onChange={e => setRecordForm(prev => ({ ...prev, next_service_date: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Posto / Oficina / Local (Opcional)</label>
                <input
                  type="text"
                  value={recordForm.provider_name}
                  onChange={e => setRecordForm(prev => ({ ...prev, provider_name: e.target.value }))}
                  placeholder="Ex: Posto Shell Ipiranga ou Oficina Bosch Service"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Integração 1-Clique com o Financeiro */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordForm.launch_in_financial}
                    onChange={e => setRecordForm(prev => ({ ...prev, launch_in_financial: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="text-xs font-extrabold text-emerald-300">
                    Lançar automaticamente esta despesa no Financeiro da Família
                  </span>
                </label>

                {recordForm.launch_in_financial && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <select
                      value={recordForm.payment_target}
                      onChange={e =>
                        setRecordForm(prev => ({
                          ...prev,
                          payment_target: e.target.value as 'CARD' | 'ACCOUNT',
                        }))
                      }
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="CARD">Pago no Cartão de Crédito</option>
                      <option value="ACCOUNT">Pago em Conta / PIX / Débito</option>
                    </select>

                    {recordForm.payment_target === 'CARD' ? (
                      <select
                        value={recordForm.credit_card_id}
                        onChange={e => setRecordForm(prev => ({ ...prev, credit_card_id: e.target.value }))}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                      >
                        {cards.map(c => (
                          <option key={c.id} value={c.id}>
                            Cartão: {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={recordForm.account_id}
                        onChange={e => setRecordForm(prev => ({ ...prev, account_id: e.target.value }))}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            Conta: {a.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={savingRecord}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
              >
                {savingRecord ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando registro...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar Registro do Veículo
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Histórico de Abastecimentos / Manutenções */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {activeSubMenu === 'abastecimento'
                    ? 'Histórico de Abastecimentos & Consumo (km/L)'
                    : 'Livro de Manutenções, Revisões & Serviços'}
                </h3>
                <p className="text-xs text-slate-400">
                  {filteredRecords.length} registro(s) encontrado(s)
                </p>
              </div>

              <select
                value={selectedVehicleFilter}
                onChange={e => setSelectedVehicleFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="ALL">Todos os veículos</option>
                {vehicles.map(v => (
                  <option key={v.id} value={String(v.id)}>
                    {v.nickname}
                  </option>
                ))}
              </select>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhum registro encontrado para este filtro. Use o formulário ao lado para lançar!
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredRecords.map(rec => {
                  const veh = vehicles.find(v => String(v.id) === String(rec.vehicle_id));
                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-extrabold text-emerald-400">
                            {veh?.nickname || 'Veículo'}
                          </span>
                          <span className="text-sm font-bold text-white">{rec.title}</span>
                          {rec.fuel_efficiency_kml && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-extrabold text-sky-300">
                              ⚡ {rec.fuel_efficiency_kml} km/L
                            </span>
                          )}
                          {rec.financial_transaction_id && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-300">
                              ✓ No Financeiro
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatDatePT(rec.record_date)}
                          {rec.odometer_km ? ` • ${Number(rec.odometer_km).toLocaleString('pt-BR')} km` : ''}
                          {rec.liters ? ` • ${rec.liters} L` : ''}
                          {rec.price_per_liter ? ` (R$ ${Number(rec.price_per_liter).toFixed(2)}/L)` : ''}
                          {rec.provider_name ? ` • ${rec.provider_name}` : ''}
                        </p>
                        {rec.next_service_km && (
                          <p className="text-[11px] text-amber-300 font-semibold">
                            Próxima revisão programada: {Number(rec.next_service_km).toLocaleString('pt-BR')} km
                            {rec.next_service_date ? ` ou ${formatDatePT(rec.next_service_date)}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-sm sm:text-base font-black text-white">
                          {formatCurrency(rec.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 cursor-pointer"
                          title="Excluir registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: CADASTRAR / EDITAR VEÍCULO ================= */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white">
                {editingVehicle ? `Editar ${editingVehicle.nickname}` : 'Novo Veículo da Família'}
              </h3>
              <button
                type="button"
                onClick={() => setVehicleModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Apelido do Veículo *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.nickname}
                    onChange={e => setVehicleForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="Ex: Jeep Compass da Família"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Marca / Modelo / Versão *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.brand_model}
                    onChange={e => setVehicleForm(prev => ({ ...prev, brand_model: e.target.value }))}
                    placeholder="Ex: Compass Longitude 1.3 Turbo"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Placa</label>
                  <input
                    type="text"
                    value={vehicleForm.license_plate}
                    onChange={e => setVehicleForm(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                    placeholder="ABC-1D23"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Combustível</label>
                  <select
                    value={vehicleForm.fuel_type}
                    onChange={e => setVehicleForm(prev => ({ ...prev, fuel_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="FLEX">Flex</option>
                    <option value="GASOLINA">Gasolina</option>
                    <option value="ETANOL">Etanol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HIBRIDO">Híbrido</option>
                    <option value="ELETRICO">Elétrico</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Odômetro Atual (km)</label>
                  <input
                    type="number"
                    value={vehicleForm.current_odometer}
                    onChange={e => setVehicleForm(prev => ({ ...prev, current_odometer: e.target.value }))}
                    placeholder="35000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Valor FIPE (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleForm.fipe_estimated_value}
                    onChange={e => setVehicleForm(prev => ({ ...prev, fipe_estimated_value: e.target.value }))}
                    placeholder="145000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">IPVA + Licenciamento Anual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleForm.ipva_estimated_amount}
                    onChange={e => setVehicleForm(prev => ({ ...prev, ipva_estimated_amount: e.target.value }))}
                    placeholder="Ex: 5200.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">Mês de Vencimento do IPVA</label>
                  <select
                    value={vehicleForm.ipva_due_month}
                    onChange={e => setVehicleForm(prev => ({ ...prev, ipva_due_month: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    {MONTH_FULL_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-sky-300 mb-1">Seguradora</label>
                  <input
                    type="text"
                    value={vehicleForm.insurance_provider}
                    onChange={e => setVehicleForm(prev => ({ ...prev, insurance_provider: e.target.value }))}
                    placeholder="Ex: Porto Seguro"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sky-300 mb-1">Valor Anual Seguro (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleForm.insurance_annual_amount}
                    onChange={e => setVehicleForm(prev => ({ ...prev, insurance_annual_amount: e.target.value }))}
                    placeholder="Ex: 3400.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sky-300 mb-1">Renovação do Seguro</label>
                  <input
                    type="date"
                    value={vehicleForm.insurance_renewal_date}
                    onChange={e => setVehicleForm(prev => ({ ...prev, insurance_renewal_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Telefone Guincho / Assistência 24h
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.insurance_assistance_phone}
                    onChange={e => setVehicleForm(prev => ({ ...prev, insurance_assistance_phone: e.target.value }))}
                    placeholder="Ex: 0800 727 0800"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Próx. Revisão (KM)</label>
                  <input
                    type="number"
                    value={vehicleForm.next_revision_km}
                    onChange={e => setVehicleForm(prev => ({ ...prev, next_revision_km: e.target.value }))}
                    placeholder="Ex: 40000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  {savingVehicle ? 'Salvando...' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GERAR PARCELAS DE IPVA OU SEGURO NO FINANCEIRO ================= */}
      {annualLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Lançar {annualLaunchModal.kind === 'IPVA' ? 'IPVA & Licenciamento' : 'Seguro Auto'} no Financeiro
              </h3>
              <button
                type="button"
                onClick={() => setAnnualLaunchModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchAnnualExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={annualLaunchForm.total_amount}
                  onChange={e => setAnnualLaunchForm(prev => ({ ...prev, total_amount: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nº de Parcelas</label>
                  <select
                    value={annualLaunchForm.installments}
                    onChange={e => setAnnualLaunchForm(prev => ({ ...prev, installments: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">1º Vencimento</label>
                  <input
                    type="date"
                    required
                    value={annualLaunchForm.first_due_date}
                    onChange={e => setAnnualLaunchForm(prev => ({ ...prev, first_due_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Forma de Pagamento</label>
                <select
                  value={annualLaunchForm.payment_target}
                  onChange={e =>
                    setAnnualLaunchForm(prev => ({
                      ...prev,
                      payment_target: e.target.value as 'ACCOUNT' | 'CARD',
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                >
                  <option value="ACCOUNT">Boleto / Débito em Conta Bancária</option>
                  <option value="CARD">Cartão de Crédito</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnualLaunchModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={launchingAnnual}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  {launchingAnnual ? 'Gerando...' : 'Gerar Contas a Pagar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
