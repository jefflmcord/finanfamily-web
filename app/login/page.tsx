'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Wallet, Loader2, ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regFamilyName, setRegFamilyName] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finanfamily-api.onrender.com';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register') {
      setAuthMode('register');
    }
    router.prefetch('/dashboard');
    fetch(`${apiUrl}/?warmup=1`, { method: 'GET', keepalive: true }).catch(() => {});
  }, [apiUrl, router]);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          invitation_token: new URLSearchParams(window.location.search).get('invite'),
        }),
      });
      const data = await res.json();

      if (data.code === 'TENANT_BLOCKED') {
        sessionStorage.setItem('@FinanFamily:blockedContactPhone', data.contact_phone || '(41) 0000-0000');
        router.replace('/acesso-indisponivel');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Erro ao autenticar com o Google.');

      sessionStorage.removeItem('@FinanFamily:blockedContactPhone');
      localStorage.setItem('@FinanFamily:token', data.token);
      localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação com o Google.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  const initializeGoogleButton = useCallback(() => {
    const google = (window as any).google;
    const container = document.getElementById('google-signin-btn');
    if (!google?.accounts?.id || !googleClientId || !container) return;

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential?: string }) => {
        if (response.credential) handleGoogleCredential(response.credential);
      },
    });
    container.replaceChildren();
    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: Math.min(container.clientWidth || 320, 400),
      text: authMode === 'register' ? 'continue_with' : 'signin_with',
      shape: 'rectangular',
      locale: 'pt-BR',
    });
  }, [googleClientId, handleGoogleCredential, authMode]);

  useEffect(() => {
    initializeGoogleButton();
  }, [initializeGoogleButton]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.removeItem('@FinanFamily:blockedContactPhone');
        localStorage.setItem('@FinanFamily:token', data.token);
        localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else if (data.code === 'TENANT_BLOCKED') {
        sessionStorage.setItem('@FinanFamily:blockedContactPhone', data.contact_phone || '(41) 0000-0000');
        router.replace('/acesso-indisponivel');
      } else {
        setError(data.error || 'E-mail ou senha incorretos.');
      }
    } catch {
      setError('Erro de conexão com o servidor. O servidor pode estar iniciando, aguarde um instante e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanWhatsapp = regWhatsapp.trim();
    const digits = cleanWhatsapp.replace(/\D/g, '');

    if (cleanName.length < 2) {
      setError('Informe seu nome completo.');
      return;
    }
    if (digits.length < 10) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Crie uma senha com pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/public/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          family_name: regFamilyName.trim() || undefined,
          whatsapp: cleanWhatsapp,
          email: cleanEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível criar sua conta agora.');
        return;
      }

      sessionStorage.removeItem('@FinanFamily:blockedContactPhone');
      localStorage.setItem('@FinanFamily:token', data.token);
      localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Erro de conexão com o servidor. Aguarde alguns segundos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initializeGoogleButton}
        />
      )}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Finan<span className="text-emerald-400">Family</span>
          </h1>
          <p className="text-xs text-slate-400">A inteligência financeira da sua família.</p>
        </div>

        {/* Seletor Entrar / Criar Conta Grátis */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Testar 10 Dias Grátis
          </button>
        </div>

        {authMode === 'register' && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>10 dias grátis</strong> com acesso completo. Sem pedir cartão de crédito agora.
            </span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-medium text-center">
            {error}
          </div>
        )}

        {googleClientId && (
          <div className="space-y-4">
            <div id="google-signin-btn" className="flex justify-center w-full min-h-10" />
            <div className="flex items-center gap-3 text-[10px] uppercase text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              <span>{authMode === 'register' ? 'ou cadastre com seu e-mail' : 'ou entre com seu e-mail'}</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>
          </div>
        )}

        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-400">Senha</label>
                <Link
                  href="/esqueci-a-senha"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar na Plataforma <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Seu Nome *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Carlos Silva"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome da Família</label>
                <input
                  type="text"
                  placeholder="Ex.: Família Silva"
                  value={regFamilyName}
                  onChange={e => setRegFamilyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Seu WhatsApp com DDD *</label>
              <input
                type="tel"
                required
                placeholder="(41) 99999-9999"
                value={regWhatsapp}
                onChange={e => setRegWhatsapp(formatPhoneInput(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Seu melhor E-mail *</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Crie uma Senha *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo de 6 caracteres"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.25)] mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Criar Conta e Liberar 10 Dias Grátis <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Após os 10 dias, escolha entre R$ 29,90/mês ou 12x R$ 24,90 no plano anual.
            </p>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-800">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
