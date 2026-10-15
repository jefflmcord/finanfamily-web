'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VerificarEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu e-mail...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Nenhum token de verificação encontrado na URL.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('https://finanfamily-api.onrender.com/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao verificar e-mail.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Erro de conexão com o servidor.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 selection:bg-emerald-500/30">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <h2 className="text-xl font-bold text-white">Validando acesso...</h2>
            <p className="text-slate-400 text-sm">Aguarde um momento.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">E-mail Confirmado!</h2>
            <p className="text-slate-400 text-sm">{message}</p>
            <Link
              href="/login"
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Fazer Login Agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Ops, algo deu errado</h2>
            <p className="text-slate-400 text-sm">{message}</p>
            <Link
              href="/login"
              className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              Voltar para o Início
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}