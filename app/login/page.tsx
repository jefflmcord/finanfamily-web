'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inicializa o botão do Google
  useEffect(() => {
    const initGoogleAuth = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn') as HTMLElement,
          { theme: 'filled_black', size: 'large', shape: 'pill', width: '100%' }
        );
      }
    };

    const timeout = setTimeout(initGoogleAuth, 500);
    return () => clearTimeout(timeout);
  }, [mode]);

  const handleGoogleSuccess = async (response: any) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('https://finanfamily-api.onrender.com/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('@FinanFamily:token', data.token);
        localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setErrorMsg(data.error || 'Erro ao autenticar com Google.');
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const payload = mode === 'login' 
        ? { email, password } 
        : { name, email, password };

      const res = await fetch(`https://finanfamily-api.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          localStorage.setItem('@FinanFamily:token', data.token);
          localStorage.setItem('@FinanFamily:user', JSON.stringify(data.user));
          router.push('/dashboard');
        } else {
          // Sucesso no registo
          setSuccessMsg(data.message || 'Conta criada! Verifique o seu e-mail para ativar o acesso.');
          setMode('login');
          setPassword('');
        }
      } else {
        setErrorMsg(data.error || 'Ocorreu um erro.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 font-sans selection:bg-emerald-500/30">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      
      <div className="w-full max-w-md">
        {/* Cabeçalho do Logotipo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Finan<span className="text-emerald-400">Family</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-center">
            A inteligência financeira da sua família.
          </p>
        </div>

        {/* Caixa Principal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Alternador de Separadores */}
          <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Já tenho conta
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar conta grátis
            </button>
          </div>

          {/* Mensagens de Erro e Sucesso */}
          {errorMsg && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nome da Família ou Casal</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: Família Silva"
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-300">Palavra-passe</label>
                {mode === 'login' && (
                  <Link href="/esqueci-a-senha" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                    Esqueceu sua senha?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                <>Entrar na Plataforma <ArrowRight className="w-4 h-4" /></>
              ) : (
                'Criar Conta Grátis'
              )}
            </button>
          </form>

          {/* Divisória */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ou continue com</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* Botão Oficial do Google */}
          <div className="flex justify-center w-full">
            <div id="google-signin-btn" className="w-full overflow-hidden rounded-xl"></div>
          </div>

        </div>

        {/* Rodapé da Página */}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}