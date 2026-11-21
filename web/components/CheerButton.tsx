'use client';

import { useState } from 'react';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/site';

const KEY = 'nudge-last-cheer';

/** Sends a cheer with an optional name. The database enforces the limits: one per minute per visitor, 60 per hour in total. */
export function CheerButton({ total, name }: { total: number; name: string }) {
  const [sent, setSent] = useState(0);
  const [who, setWho] = useState('');
  const [msg, setMsg] = useState('Be nice. Send a cheer.');
  const [busy, setBusy] = useState(false);

  const cheer = async () => {
    if (busy || !SUPABASE_URL || !SUPABASE_KEY) return;
    const last = Number(localStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 60000) {
      setMsg('Easy. One cheer a minute.');
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
        setSent((n) => n + 1);
        setMsg(`Thanks${who.trim() ? `, ${who.trim()}` : ''}. ${name} saw that.`);
      } else {
        const text = await res.text();
        setMsg(text.includes('too_fast') ? 'Easy. One cheer a minute.' : text.includes('busy') ? 'Lots of cheers right now. Try again soon.' : 'Could not send. Try again.');
      }
    } catch {
      setMsg('Could not send. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cheer">
      <input
        className="cheer-name"
        value={who}
        onChange={(e) => setWho(e.target.value)}
        maxLength={30}
        placeholder="Your name (optional)"
        aria-label="Your name, optional"
      />
      <button className="btn" onClick={cheer} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />
        </svg>
        Send a cheer
      </button>
      <small>{`${(total + sent).toLocaleString()} ${total + sent === 1 ? 'cheer' : 'cheers'} · ${msg}`}</small>
    </div>
  );
}
