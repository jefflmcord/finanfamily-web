'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Wallet, Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finanfamily-api.onrender.com';
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Callback quando o usuário escolhe a conta Google
  const handleGoogleResponse = async (response: any) => {
    if (!response?.credential) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao autenticar com o Google.');
      }

      localStorage.setItem('@FinanFamily:token', data.token);
      localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação com o Google.');
      setIsLoading(false);
    }
  };

  // Inicializa o botão do Google quando o script carrega
  const initializeGoogleButton = () => {
    if (typeof window !== 'undefined' && window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });

      const btnContainer = document.getElementById('google-signin-btn');
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'filled_black',
          size: 'large',
          width: 350,
          text: mode === 'login' ? 'continue_with' : 'signup_with',
          shape: 'pill',
          locale: 'pt-BR',
        });
      }
    }
  };

  useEffect(() => {
    initializeGoogleButton();
  }, [mode, googleClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const payload =
        mode === 'login'
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar sua solicitação.');
      }

      if (!data.token || !data.user) {
        throw new Error('Resposta inválida do servidor.');
      }

      localStorage.setItem('@FinanFamily:token', data.token);
      localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));

      if (data.user.must_change_password) {
        window.location.href = '/primeiro-acesso';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao conectar com o servidor.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 selection:bg-emerald-500/30">
      {/* Script Oficial do Google Identity Services */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleButton}
      />

      <div className="absolute top-8 left-8">
        <Link
          href="/"
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          &larr; Voltar para o início
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-5 shadow-xl">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Bem-vindo(a) de volta' : 'Crie a conta da sua família'}
          </h1>
          <p className="text-slate-400 text-center text-sm">
            {mode === 'login'
              ? 'Digite seus dados ou entre com o Google para acessar o painel.'
              : 'Seu ambiente financeiro será criado e configurado automaticamente.'}
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
          {/* Seletor Entrar / Criar Conta */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar conta grátis
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Botão Oficial do Google (Exibido se NEXT_PUBLIC_GOOGLE_CLIENT_ID estiver configurado) */}
          {googleClientId && (
            <>
              <div className="flex justify-center mb-5">
                <div id="google-signin-btn" className=" flex justify-center w-full" />
              </div>

              <div className="relative flex py-2 items-center mb-5">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-wider">
                  ou com seu e-mail
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Seu Nome</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder={mode === 'register' ? 'Mínimo de 6 caracteres' : '••••••••'}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_4px_rgba(16,185,129,0.1)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'Entrando...' : 'Criando seu ambiente...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta e Acessar'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}