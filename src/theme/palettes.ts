import type { Phase } from '../planner/phase';
import type { Tag } from '../types';

export type { Phase, Tag };

export interface Palette {
  /** Three-stop sky gradient, top to bottom. */
  sky: [string, string, string];
  ink: string;
  mute: string;
  hero: string;
  heroMute: string;
  card: string;
  line: string;
  accent: string;
  onAccent: string;
  statusBar: 'dark' | 'light';
}

/** The four looks of the day. Values come from the project brief. */
export const PALETTES: Record<Phase, Palette> = {
  dawn: {
    sky: ['#FDF0E4', '#F9D7C4', '#F1BDB3'],
    ink: '#3A2A3A',
    mute: '#7A6670',
    hero: '#3A2A3A',
    heroMute: '#7A5A5F',
    card: 'rgba(255,255,255,0.66)',
    line: 'rgba(58,42,58,0.12)',
    accent: '#CB6747',
    onAccent: '#FFFFFF',
    statusBar: 'dark',
  },
  day: {
    sky: ['#EDF6FC', '#D5E8F5', '#BEDAEE'],
    ink: '#1F3A57',
    mute: '#5E7890',
    hero: '#1F3A57',
    heroMute: '#56718C',
    card: 'rgba(255,255,255,0.70)',
    line: 'rgba(31,58,87,0.12)',
    accent: '#3B76AC',
    onAccent: '#FFFFFF',
    statusBar: 'dark',
  },
  dusk: {
    sky: ['#F8DFCF', '#EBBBB8', '#9BA7C6'],
    ink: '#43303F',
    mute: '#8A6C74',
    hero: '#43303F',
    heroMute: '#85606B',
    card: 'rgba(255,250,246,0.72)',
    line: 'rgba(67,48,63,0.13)',
    accent: '#BE5A74',
    onAccent: '#FFFFFF',
    statusBar: 'dark',
  },
  night: {
    sky: ['#26356A', '#1B2850', '#121B38'],
    ink: '#F2EEE8',
    mute: '#A3AECB',
    hero: '#F2EEE8',
    heroMute: '#AEB8D2',
    card: 'rgba(255,255,255,0.09)',
    line: 'rgba(255,255,255,0.15)',
    accent: '#F0C878',
    onAccent: '#1B2340',
    statusBar: 'light',
  },
};

export const TAG_COLORS: Record<Tag, string> = {
  fit: '#D9734F',
  study: '#4C86B8',
  life: '#4E9F82',
};

/** Slow, no overshoot. Use everywhere: Easing.bezier(...EASE). */
export const EASE = [0.22, 0.8, 0.3, 1] as const;

export const DURATION = {
  sky: 2200,
  orb: 2600,
  color: 1800,
  rows: 900,
  sheet: 800,
} as const;
