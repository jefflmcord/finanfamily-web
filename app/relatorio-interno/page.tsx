'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ban, Loader2, Phone, Save, ShieldAlert, Unlock } from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';

interface TenantReportRow {
  id: string | number;
  name: string;
  registered_at: string | null;
  blocked_at: string | null;
  owner_name: string | null;
  owner_email: string | null;
}

export default function InternalTenantReportPage() {
  const [tenants, setTenants] = useState<TenantReportRow[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPhone, setSavingPhone] = useState(false);
  const [updatingTenant, setUpdatingTenant] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}/api/internal/tenants`);
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 403) setForbidden(true);
          throw new Error(result.error || 'Não foi possível carregar o relatório.');
        }
        if (!cancelled) {
          setTenants(result.tenants);
          setContactPhone(result.contactPhone);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o relatório.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReport();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveContactPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPhone(true);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/internal/contact-phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_phone: contactPhone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar o telefone.');
      setContactPhone(result.contactPhone);
      setActionMessage('Telefone de contato atualizado.');
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o telefone.');
    } finally {
      setSavingPhone(false);
    }
  };

  const setTenantBlocked = async (tenant: TenantReportRow) => {
    const familyId = String(tenant.id);
    const blocked = !tenant.blocked_at;
    if (blocked && !window.confirm(`Bloquear ${tenant.name}? Todos os membros perderão o acesso.`)) return;
    setUpdatingTenant(familyId);
    setActionMessage('');
    setActionError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/internal/tenants/${encodeURIComponent(familyId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível alterar o acesso do tenant.');
      setTenants(current => current.map(item =>
        String(item.id) === familyId ? { ...item, blocked_at: result.blocked_at } : item
      ));
      setActionMessage(blocked ? 'Tenant bloqueado.' : 'Acesso do tenant liberado.');
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Não foi possível alterar o acesso do tenant.');
    } finally {
      setUpdatingTenant(null);
    }
  };

  const formatRegistrationDate = (value: string | null) => {
    if (!value) return 'Data não registrada';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Data inválida'
      : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Acesso interno</p>
              <h1 className="text-2xl font-extrabold text-white">Relatório de tenants</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Acompanhe os cadastros e controle o acesso dos tenants. O bloqueio vale para todos os membros da família.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" /> Carregando relatório...
          </div>
        ) : error ? (
          <div
            role="alert"
            className={`rounded-2xl border p-5 text-sm ${
              forbidden
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
            }`}
          >
            {forbidden ? 'Esta conta não tem autorização para acessar o relatório.' : error}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Telefone exibido para tenants bloqueados</h2>
                  <p className="mt-1 text-xs text-slate-400">Alterar este número atualiza a mensagem de todos os tenants bloqueados.</p>
                </div>
              </div>
              <form onSubmit={saveContactPhone} className="flex flex-col gap-3 sm:flex-row">
                <input
                  required
                  type="tel"
                  maxLength={30}
                  value={contactPhone}
                  onChange={event => setContactPhone(event.target.value)}
                  aria-label="Telefone de contato"
                  placeholder="(41) 0000-0000"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingPhone ? 'Salvando...' : 'Salvar telefone'}
                </button>
              </form>
              {actionMessage && <p role="status" className="mt-3 text-sm text-emerald-400">{actionMessage}</p>}
              {actionError && <p role="alert" className="mt-3 text-sm text-rose-400">{actionError}</p>}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-5 py-4">
                <p className="text-sm font-semibold text-white">
                  {tenants.length} {tenants.length === 1 ? 'tenant cadastrado' : 'tenants cadastrados'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-bold">Família</th>
                      <th scope="col" className="px-5 py-3 font-bold">Usuário principal</th>
                      <th scope="col" className="px-5 py-3 font-bold">E-mail</th>
                      <th scope="col" className="px-5 py-3 font-bold">Data de cadastro</th>
                      <th scope="col" className="px-5 py-3 font-bold">Status</th>
                      <th scope="col" className="px-5 py-3 font-bold">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tenants.map(tenant => {
                      const familyId = String(tenant.id);
                      const isBlocked = Boolean(tenant.blocked_at);
                      const isAdminTenant = tenant.owner_email?.toLowerCase() === 'jeffersonluismattosocordeiro@gmail.com';
                      const isUpdating = updatingTenant === familyId;
                      return (
                        <tr key={tenant.id} className="text-slate-200">
                          <td className="px-5 py-4 font-semibold text-white">{tenant.name}</td>
                          <td className="px-5 py-4">{tenant.owner_name || 'Não identificado'}</td>
                          <td className="px-5 py-4 text-slate-400">{tenant.owner_email || '—'}</td>
                          <td className="px-5 py-4 whitespace-nowrap">{formatRegistrationDate(tenant.registered_at)}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              isBlocked ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
                            }`}>
                              {isBlocked ? 'Bloqueado' : 'Ativo'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={isUpdating || isAdminTenant}
                              onClick={() => setTenantBlocked(tenant)}
                              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                                isBlocked
                                  ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                                  : 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isBlocked ? (
                                <Unlock className="h-3.5 w-3.5" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                              {isAdminTenant ? 'Conta administrativa' : isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {tenants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                          Nenhum tenant encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
