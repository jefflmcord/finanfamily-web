import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede zoom acidental ao tocar nos campos no iPhone/Android
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased selection:bg-emerald-500/30`}>
        {children}
      </body>
    </html>
  );
}