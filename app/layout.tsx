import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FinanFamily',
  description: 'Gestão Financeira Familiar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede que a tela dê zoom acidental ao tocar nos botões no iPhone
};

export const metadata: Metadata = {
  title: 'FinanFamily | Inteligência Financeira Familiar',
  description: 'Controle despesas, receitas, cartões e metas da sua família em um único lugar.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinanFamily',
  },
  formatDetection: {
    telephone: false,
  },
};
}