'use client';

import { useEffect, useRef, useState } from 'react';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/site';

const KEY = 'nudge-last-cheer';
const SOUND_KEY = 'nudge-chime';

interface Heart {
  id: number;
  x: number;
  s: number;
  dx: number;
  d: number;
}

const PLANE =
  '<svg viewBox="0 0 40 28" width="40" height="28" aria-hidden="true"><path d="M2 14 L38 2 L28 26 L19 17 Z" fill="#fff" stroke="var(--acc-ink)" stroke-width="2" stroke-linejoin="round"/><path d="M19 17 L38 2" fill="none" stroke="var(--acc-ink)" stroke-width="2" stroke-linecap="round"/><path d="M19 17 L21 25" fill="none" stroke="var(--acc-ink)" stroke-width="2" stroke-linecap="round"/></svg>';

/**
 * Send a cheer. A paper plane flies from the button to a phone on the right, the notification drops in,
 * soft hearts rise, and the count goes up. Sumit's phone shows your name if you gave one.
 * The database enforces the limits: one cheer per visitor per minute, 60 an hour in total.
 */
export function CheerButton({ total, name }: { total: number; name: string }) {
  const [sent, setSent] = useState(0);
  const [who, setWho] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [flying, setFlying] = useState(false);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [thanks, setThanks] = useState(false);
  const [chime, setChime] = useState(true);
  const audio = useRef<AudioContext | null>(null);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  const layer = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const note = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // The chime is on unless the visitor switched it off before.
  useEffect(() => {
    try {
      setChime(localStorage.getItem(SOUND_KEY) !== '0');
    } catch {}
  }, []);

  /** Make (or wake) the audio engine. Browsers only allow this during a tap, so it runs inside click handlers. */
  const wake = () => {
    if (!audio.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audio.current = new Ctx();
    }
    void audio.current.resume();
    return audio.current;
  };

  /** Three soft bell notes that fade out slowly. */
  const ring = () => {
    const ctx = audio.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    [[659.25, 0], [987.77, 0.13], [1318.51, 0.3]].forEach(([f, d], i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.07 - i * 0.015, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.3);
      o.connect(g).connect(ctx.destination);
      o.start(t + d);
      o.stop(t + d + 1.4);
    });
  };

  const toggleChime = () => {
    const on = !chime;
    setChime(on);
    try {
      localStorage.setItem(SOUND_KEY, on ? '1' : '0');
    } catch {}
    if (on && wake()) ring(); // a small preview so they know what it sounds like
  };

  /** A paper plane glides along a soft curve from the button to the notification, dropping a dotted trail. */
  const fly = () =>
    new Promise<void>((resolve) => {
      const L = layer.current;
      const b = btn.current;
      const n = note.current;
      if (!L || !b || !n || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return resolve();
      const lr = L.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const nr = n.getBoundingClientRect();
      const p0 = { x: br.left + br.width / 2 - lr.left, y: br.top + br.height / 2 - lr.top };
      const p2 = { x: nr.left + nr.width / 2 - lr.left, y: nr.top + nr.height / 2 - lr.top };
      const lift = Math.min(190, Math.hypot(p2.x - p0.x, p2.y - p0.y) * 0.5);
      const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - lift };
      const plane = document.createElement('span');
      plane.className = 'plane';
      plane.innerHTML = PLANE;
      plane.style.transform = `translate3d(${p0.x}px,${p0.y}px,0) translate(-50%,-50%)`;
      L.appendChild(plane);
      const dur = 1400;
      const t0 = performance.now();
      let lastDot = -1;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const u = 1 - e;
        const x = u * u * p0.x + 2 * u * e * p1.x + e * e * p2.x;
        const y = u * u * p0.y + 2 * u * e * p1.y + e * e * p2.y;
        const dx = 2 * u * (p1.x - p0.x) + 2 * e * (p2.x - p1.x);
        const dy = 2 * u * (p1.y - p0.y) + 2 * e * (p2.y - p1.y);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        plane.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${angle}deg) scale(${1 - 0.4 * e})`;
        plane.style.opacity = e > 0.92 ? String(Math.max(0, (1 - e) / 0.08)) : '1';
        if (e - lastDot > 0.04 && e < 0.94) {
          lastDot = e;
          const dot = document.createElement('i');
          dot.className = 'trail';
          dot.style.left = `${x}px`;
          dot.style.top = `${y}px`;
          dot.addEventListener('animationend', () => dot.remove());
          L.appendChild(dot);
        }
        if (t < 1) requestAnimationFrame(step);
        else {
          plane.remove();
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

  const bloom = () => {
    const batch = Array.from({ length: 9 }, (_, k) => ({
      id: ++seq.current,
      x: 50 + (k - 4) * 7 + (Math.random() - 0.5) * 6,
      s: 0.7 + Math.random() * 0.6,
      dx: Math.round((Math.random() - 0.5) * 80),
      d: k * 120,
    }));
    setHearts((h) => [...h, ...batch]);
    timers.current.push(window.setTimeout(() => setHearts((h) => h.filter((x) => !batch.some((b) => b.id === x.id))), 5200));
    setThanks(true);
    window.dispatchEvent(new Event('nudge-cheer'));
    timers.current.push(window.setTimeout(() => setThanks(false), 3200));
  };

  const cheer = async () => {
    if (busy || !SUPABASE_URL || !SUPABASE_KEY) return;
    if (chime) wake();
    const last = Number(localStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 60000) {
      setMsg('One cheer a minute, to keep things calm.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/cheers`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(who.trim() ? { name: who.trim().slice(0, 30) } : {}),
      });
      if (res.ok) {
        localStorage.setItem(KEY, String(Date.now()));
        setMsg('');
        setFlying(true);
        await fly();
        setFlying(false);
        setSent((n) => n + 1);
        bloom();
        if (chime) ring();
        try {
          navigator.vibrate?.(14);
        } catch {}
        setMsg(`${name} just got it. Thank you${who.trim() ? `, ${who.trim()}` : ''}.`);
      } else {
        const text = await res.text();
        setMsg(text.includes('too_fast') ? 'One cheer a minute, to keep things calm.' : text.includes('busy') ? 'Lots of cheers right now. Try again soon.' : 'That did not send. Please try again.');
      }
    } catch {
      setMsg('That did not send. Check your connection.');
    } finally {
      setFlying(false);
      setBusy(false);
    }
  };

  const count = total + sent;
  const label = who.trim() || 'Someone';

  return (
    <div className="cheer">
      <div className="cheer-left">
        <h2>Cheer {name} on</h2>
        <p className="sub">A small note that you are rooting for him.</p>
        <label className="field">
          <span>Your name (optional)</span>
          <input value={who} onChange={(e) => setWho(e.target.value)} maxLength={30} placeholder="So he knows who it was" autoComplete="given-name" />
        </label>
        <div className="cheer-act">
          <button ref={btn} className={`cheer-btn${thanks ? ' sent' : ''}`} onClick={cheer} disabled={busy}>
            <span key={thanks ? 'a' : flying ? 'f' : 'b'} className="cb-lab">
              {thanks ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 12.5l4 4 8-9" />
                  </svg>
                  Cheer sent
                </>
              ) : flying ? (
                'On its way…'
              ) : (
                'Send a cheer'
              )}
            </span>
          </button>
        </div>
        <div className="cheer-foot">
          <p className="msg" role="status" aria-live="polite">
            {msg || (
              <>
                <span key={count} className="num">
                  {count.toLocaleString()}
                </span>{' '}
                {count === 1 ? 'cheer' : 'cheers'} so far.
              </>
            )}
          </p>
          <button type="button" className="snd" role="switch" aria-checked={chime} onClick={toggleChime} aria-label="Soft chime when a cheer is sent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4z" />
              {chime ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M16 9l5 6M21 9l-5 6" />}
            </svg>
            Chime {chime ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div className="cheer-right">
        <p className="n-cap">How it shows on {name}&apos;s phone</p>
        <div className="phone-wrap">
          <span className={`glowp${sent ? ' on' : ''}`} key={`g${sent}`} aria-hidden="true" />
          <div key={`p${sent}`} className={`phone${sent ? ' on' : ''}`}>
            <span className="ph-notch" aria-hidden="true" />
            <p className="ph-time">9:41</p>
            <div className="ph-n" ref={note}>
              <span className="n-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12.5l4 4 8-9" />
                </svg>
              </span>
              <span className="n-t">
                <small>Nudge · now</small>
                <b>{label} cheered you on</b>
              </span>
            </div>
            <span className="ph-home" aria-hidden="true" />
          </div>
          <span className="hearts" aria-hidden="true">
            {hearts.map((h) => (
              <i key={h.id} style={{ left: `${h.x}%`, ['--s' as string]: h.s, ['--dx' as string]: `${h.dx}px`, animationDelay: `${h.d}ms` }}>
                ♥
              </i>
            ))}
          </span>
        </div>
      </div>

      <div className="fly-layer" ref={layer} aria-hidden="true" />
    </div>
  );
}
