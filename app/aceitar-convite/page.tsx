'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Users, Wallet } from 'lucide-react';
import { API_URL } from '@/lib/apiClient';

interface InvitationPreview {
  email: string;
  family_name: string;
  expires_at: string;
  has_account: boolean;
  has_password: boolean;
}

export default function AcceptFamilyInvitationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-emerald-400" /></div>}>
      <AcceptFamilyInvitationContent />
    </Suspense>
  );
}

function AcceptFamilyInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(() => Boolean(token));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(() => token ? '' : 'O link do convite está incompleto.');

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/family-invitations/preview?token=${encodeURIComponent(token)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível validar o convite.');
        setInvitation(data);
      })
      .catch(previewError => {
        setError(previewError instanceof Error ? previewError.message : 'Não foi possível validar o convite.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function acceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation?.has_account && password !== passwordConfirmation) {
      setError('As senhas informadas não coincidem.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/family-invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível aceitar o convite.');
      localStorage.setItem('@FinanFamily:token', data.token);
      localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
      router.replace('/dashboard');
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Erro ao aceitar o convite.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-50">
      <section className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">Finan<span className="text-emerald-400">Family</span></h1>
          <p className="mt-2 text-sm text-slate-400">Convite para acessar uma família</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-7 w-7 animate-spin text-emerald-400" /></div>
        ) : invitation ? (
          <>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="flex items-center gap-2 font-bold text-white"><Users className="h-5 w-5 text-emerald-400" />{invitation.family_name}</p>
              <p className="mt-2 break-all text-sm text-slate-300">Convite enviado para <strong>{invitation.email}</strong></p>
              <p className="mt-1 text-xs text-slate-400">Válido até {new Date(invitation.expires_at).toLocaleString('pt-BR')}</p>
            </div>

            {invitation.has_account && !invitation.has_password ? (
              <p className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-sm text-sky-200">
                Esta conta usa o acesso do Google. Continue pelo botão abaixo com o mesmo e-mail do convite.
              </p>
            ) : (
              <form onSubmit={acceptInvitation} className="space-y-4">
                {!invitation.has_account && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Seu nome</span>
                    <input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" />
                  </label>
                )}
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-slate-400">
                    {invitation.has_account ? 'Sua senha atual' : 'Crie uma senha (mínimo 8 caracteres)'}
                  </span>
                  <input required minLength={invitation.has_account ? undefined : 8} type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={invitation.has_account ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" />
                </label>
                {!invitation.has_account && (
                  <>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Confirme a senha</span>
                      <input required minLength={8} type="password" value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} autoComplete="new-password" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" />
                    </label>
                  </>
                )}
                <button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-extrabold text-slate-950 disabled:opacity-60">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {invitation.has_account ? 'Aceitar convite com minha conta' : 'Aceitar convite e criar acesso'}
                </button>
              </form>
            )}

            <p className="text-center text-xs text-slate-400">
              Prefere entrar com Google?{' '}
              <Link href={`/login?invite=${encodeURIComponent(token)}`} className="font-bold text-emerald-400 hover:text-emerald-300">
                Continuar com Google
              </Link>
            </p>
          </>
        ) : (
          <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">{error}</p>
        )}

        {error && invitation && (
          <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>
        )}
      </section>
    </main>
  );
}
