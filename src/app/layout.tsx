import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'GeoRoute – Smarter Route Planning',
  description: 'Smarter route planning for teams that don’t slow down.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script
          id="adsense-script"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1904838490296389"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-50">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 via-teal-500 to-teal-400 text-slate-950 font-bold">
                  GR
                </div>
                <span className="text-lg font-semibold tracking-tight">GeoRoute</span>
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link href="/" className="hover:text-teal-300 transition-colors">
                  Home
                </Link>
                <Link href="/pricing" className="hover:text-teal-300 transition-colors">
                  Pricing
                </Link>
                <Link href="/login" className="hover:text-teal-300 transition-colors">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-4 py-1.5 text-sm font-medium text-slate-950 shadow-lg shadow-teal-500/30 hover:brightness-110 transition"
                >
                  Get started
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-800 bg-slate-950/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-400">
              <span>© {new Date().getFullYear()} GeoRoute. All rights reserved.</span>
              <span>Smarter route planning for teams that don’t slow down.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
