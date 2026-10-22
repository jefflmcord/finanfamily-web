'use client';

import React, { useState } from 'react';
import {
  Mail,
  ArrowLeft,
  Loader2,
  KeyRound,
  Phone,
  Lock,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/apiClient';

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [supportPhoneFallback, setSupportPhoneFallback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSupportPhoneFallback(null);

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/public/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        if (data.code === 'PHONE_NOT_REGISTERED') {
          setSupportPhoneFallback(data.contact_phone || '(41) 0000-0000');
        }
        setErrorMsg(data.error || 'Não foi possível redefinir a senha.');
      }
    } catch {
      setErrorMsg('Erro de conexão com o servidor. Aguarde alguns segundos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openSupportWhatsApp = () => {
    const rawDigits = (supportPhoneFallback || '').replace(/\D/g, '');
    const isValidPhone = rawDigits.length >= 10 && !rawDigits.endsWith('00000000');
    const normalizedPhone = isValidPhone
      ? rawDigits.startsWith('55') && rawDigits.length >= 12
        ? rawDigits
        : `55${rawDigits}`
      : '';
    const msg = `Olá! Preciso redefinir minha senha no FinanFamily para o e-mail ${email.trim()}.`;
    const url = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500/30 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <Link
            href="/login"
            className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Login
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white mb-1.5">Recuperar Senha</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Confirme seu <strong>e-mail</strong> e o <strong>WhatsApp cadastrado na conta</strong> para criar uma nova senha na hora.
          </p>
        </div>

        {success ? (
          <div className="space-y-5 py-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Senha redefinida com sucesso!</h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Sua nova senha já está ativa. Você já pode acessar o painel da sua família.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg"
            >
              Entrar com a Nova Senha <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-medium space-y-2.5">
                <p>{errorMsg}</p>
                {supportPhoneFallback && (
                  <button
                    type="button"
                    onClick={openSupportWhatsApp}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Solicitar Nova Senha via WhatsApp do Suporte
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                WhatsApp Cadastrado (com DDD)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(formatPhoneInput(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="(41) 99999-9999"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Mínimo 6 dígitos"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Redefinir Minha Senha Agora'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
