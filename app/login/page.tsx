'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Wallet, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finanfamily-api.onrender.com';

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao autenticar com o Google.');

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
      text: 'signin_with',
      shape: 'rectangular',
      locale: 'pt-BR',
    });
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    initializeGoogleButton();
  }, [initializeGoogleButton]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://finanfamily-api.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('@FinanFamily:token', data.token);
        localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'E-mail ou palavra-passe incorretos.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor. O servidor pode estar a iniciar, aguarde um instante e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initializeGoogleButton}
        />
      )}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Finan<span className="text-emerald-400">Family</span>
          </h1>
          <p className="text-xs text-slate-400">A inteligência financeira da sua família.</p>
        </div>

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
              <span>ou entre com seu e-mail</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>
          </div>
        )}

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
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Palavra-passe</label>
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

        <div className="text-center pt-2 border-t border-slate-800">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}