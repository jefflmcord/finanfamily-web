'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('https://finanfamily-api.onrender.com/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(data.error || 'Erro ao redefinir a senha.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <p className="text-rose-400">Link de redefinição inválido ou ausente.</p>
        <Link href="/login" className="mt-4 inline-block text-emerald-400">Voltar para o Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      {success ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Senha Atualizada!</h2>
          <p className="text-slate-400 text-sm mb-4">Sua senha foi alterada com sucesso.</p>
          <Link
            href="/login"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all"
          >
            Fazer Login Agora
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-extrabold text-white mb-2">Criar Nova Senha</h2>
          <p className="text-slate-400 text-sm mb-6">
            Digite a sua nova senha de acesso abaixo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Nova Senha'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function RedefinirSenha() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 selection:bg-emerald-500/30">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />}>
        <RedefinirSenhaContent />
      </Suspense>
    </div>
  );
}