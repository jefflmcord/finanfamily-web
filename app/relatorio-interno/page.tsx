'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';

interface TenantReportRow {
  id: string | number;
  name: string;
  registered_at: string | null;
  owner_name: string | null;
  owner_email: string | null;
}

export default function InternalTenantReportPage() {
  const [tenants, setTenants] = useState<TenantReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        if (!cancelled) setTenants(result);
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
            Data de cadastro das famílias e identificação do usuário principal.
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
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-5 py-4">
              <p className="text-sm font-semibold text-white">
                {tenants.length} {tenants.length === 1 ? 'tenant cadastrado' : 'tenants cadastrados'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-bold">Família</th>
                    <th scope="col" className="px-5 py-3 font-bold">Usuário principal</th>
                    <th scope="col" className="px-5 py-3 font-bold">E-mail</th>
                    <th scope="col" className="px-5 py-3 font-bold">Data de cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tenants.map(tenant => (
                    <tr key={tenant.id} className="text-slate-200">
                      <td className="px-5 py-4 font-semibold text-white">{tenant.name}</td>
                      <td className="px-5 py-4">{tenant.owner_name || 'Não identificado'}</td>
                      <td className="px-5 py-4 text-slate-400">{tenant.owner_email || '—'}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{formatRegistrationDate(tenant.registered_at)}</td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        Nenhum tenant encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
