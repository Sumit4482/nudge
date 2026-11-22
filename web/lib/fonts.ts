import {
  Baloo_2,
  Bricolage_Grotesque,
  Caveat,
  Cormorant_Garamond,
  DM_Serif_Display,
  Fredoka,
  Gloock,
  Instrument_Serif,
  Lexend,
  Playfair_Display,
  Poppins,
  Quicksand,
  Sora,
  Unbounded,
  Young_Serif,
} from 'next/font/google';

/** Extra title fonts. They load only when a visit picks one, so the page stays light. next/font needs literal options. */
const fredoka = Fredoka({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-fredoka', weight: ['500'] });
const young = Young_Serif({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-young', weight: '400' });
const dmserif = DM_Serif_Display({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-dmserif', weight: '400' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-bricolage', weight: ['600'] });
const sora = Sora({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-sora', weight: ['600'] });
const instrument = Instrument_Serif({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-instrument', weight: '400' });
const lexend = Lexend({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-lexend', weight: ['500'] });
const quicksand = Quicksand({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-quicksand', weight: ['600'] });
const baloo = Baloo_2({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-baloo', weight: ['600'] });
const poppins = Poppins({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-poppins', weight: ['500'] });
const playfair = Playfair_Display({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-playfair', weight: ['500'] });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-cormorant', weight: ['500'] });
const gloock = Gloock({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-gloock', weight: '400' });
const unbounded = Unbounded({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-unbounded', weight: ['500'] });
const caveat = Caveat({ subsets: ['latin'], preload: false, display: 'swap', variable: '--font-caveat', weight: ['600'] });

export const TITLE_FONT_VARS = [fredoka, young, dmserif, bricolage, sora, instrument, lexend, quicksand, baloo, poppins, playfair, cormorant, gloock, unbounded, caveat]
  .map((f) => f.variable)
  .join(' ');

/** Keys match the h1[data-font=…] rules in globals.css. "outfit" is the page's normal heading font. */
export const TITLE_FONTS = [
  'outfit', 'fredoka', 'young', 'dmserif', 'bricolage', 'sora', 'instrument', 'lexend',
  'quicksand', 'baloo', 'poppins', 'playfair', 'cormorant', 'gloock', 'unbounded', 'caveat',
] as const;
