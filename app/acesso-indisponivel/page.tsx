'use client';

import { useSyncExternalStore } from 'react';
import { Phone, ShieldAlert } from 'lucide-react';

const subscribeToLocation = (onChange: () => void) => {
  window.addEventListener('finanfamily-blocked-contact-change', onChange);
  return () => window.removeEventListener('finanfamily-blocked-contact-change', onChange);
};

const getBlockedContactPhone = () => sessionStorage.getItem('@FinanFamily:blockedContactPhone') || '';

export default function AccessUnavailablePage() {
  const storedPhone = useSyncExternalStore(subscribeToLocation, getBlockedContactPhone, () => '');
  const contactPhone = storedPhone || '(41) 0000-0000';

  const phoneLink = contactPhone.replace(/[^\d+]/g, '');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-slate-50">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-7 text-center shadow-2xl sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Acesso temporariamente indisponível</p>
        <h1 className="mt-2 text-2xl font-extrabold text-white">Entre em contato conosco</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Seu acesso ao FinanFamily está temporariamente indisponível. Para verificar sua situação e solicitar a liberação,
          entre em contato pelo telefone:
        </p>
        <a
          href={`tel:${phoneLink}`}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-lg font-bold text-emerald-300"
        >
          <Phone className="h-5 w-5" />
          {contactPhone}
        </a>
      </section>
    </main>
  );
}
