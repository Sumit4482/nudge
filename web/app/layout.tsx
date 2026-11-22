import type { Metadata, Viewport } from 'next';
import { Figtree, Outfit } from 'next/font/google';
import { TITLE_FONT_VARS } from '@/lib/fonts';
import { SITE } from '@/lib/site';
import './globals.css';

const body = Figtree({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] });
const head = Outfit({ subsets: ['latin'], variable: '--font-head', weight: ['300', '400', '500', '600'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  openGraph: { title: SITE.title, description: SITE.description, type: 'website', siteName: SITE.title },
  twitter: { card: 'summary', title: SITE.title, description: SITE.description },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/** Pick one soft palette at random on every visit. ?theme=lilac forces one (handy for previews). Runs before first paint. */
const THEME_SCRIPT = `(function(){try{var t=['mint','peach','lilac','butter','sky','blossom','mango','matcha','cloud','shore','grape','seafoam'];var m=location.search.match(/theme=(\\w+)/);var c=m&&t.indexOf(m[1])>-1?m[1]:t[Math.floor(Math.random()*t.length)];document.documentElement.setAttribute('data-theme',c)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${head.variable} ${TITLE_FONT_VARS}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
