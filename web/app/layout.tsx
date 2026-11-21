import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Mono, Figtree } from 'next/font/google';
import { SITE } from '@/lib/site';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const body = Figtree({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] });
const mono = DM_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  openGraph: { title: SITE.title, description: SITE.description, type: 'website', siteName: SITE.title },
  twitter: { card: 'summary', title: SITE.title, description: SITE.description },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
